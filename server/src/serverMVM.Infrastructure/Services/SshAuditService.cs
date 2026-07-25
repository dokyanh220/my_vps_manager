using System.Text.RegularExpressions;
using Renci.SshNet;
using serverMVM.Application.DTOs;
using serverMVM.Application.DTOs.Logs;
using serverMVM.Application.Interfaces;

namespace serverMVM.Infrastructure.Services;

public class SshAuditService : ISshAuditService
{
    private SshClient CreateClient(SshConnectionRequestDto request)
    {
        var port = request.Port > 0 ? request.Port : 22;
        AuthenticationMethod authMethod;

        if (request.AuthType == Domain.Enums.SshAuthType.PrivateKey && !string.IsNullOrWhiteSpace(request.PrivateKey))
        {
            using var stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(request.PrivateKey));
            var keyFile = string.IsNullOrEmpty(request.Passphrase)
                ? new PrivateKeyFile(stream)
                : new PrivateKeyFile(stream, request.Passphrase);

            authMethod = new PrivateKeyAuthenticationMethod(request.Username, keyFile);
        }
        else
        {
            authMethod = new PasswordAuthenticationMethod(request.Username, request.Password ?? string.Empty);
        }

        var connectionInfo = new ConnectionInfo(request.Host, port, request.Username, authMethod)
        {
            Timeout = TimeSpan.FromSeconds(10)
        };

        return new SshClient(connectionInfo);
    }

    public async Task<SshAuditLogDto> GetSshAuditLogsAsync(SshConnectionRequestDto connection, int lines = 500)
    {
        using var client = CreateClient(connection);
        await Task.Run(() => client.Connect());

        // Read auth.log or secure log
        var command = $"tail -n {lines} /var/log/auth.log 2>/dev/null || tail -n {lines} /var/log/secure 2>/dev/null";
        using var cmd = client.CreateCommand(command);
        var rawOutput = await Task.Run(() => cmd.Execute());

        client.Disconnect();

        var events = new List<SshLoginEventDto>();
        var suspiciousIpCounts = new Dictionary<string, (int Count, string LastSeen)>();

        var rawLines = rawOutput.Split('\n', StringSplitOptions.RemoveEmptyEntries);

        foreach (var line in rawLines)
        {
            // Successful SSH login: Accepted password for root from 192.168.1.50 port 54321 ssh2
            var successMatch = Regex.Match(line, @"^([A-Z][a-z]{2}\s+\d+\s+\d{2}:\d{2}:\d{2}).*Accepted\s+(password|publickey)\s+for\s+(\S+)\s+from\s+([\d\.]+)\s+port\s+(\d+)");
            if (successMatch.Success)
            {
                events.Add(new SshLoginEventDto
                {
                    Timestamp = successMatch.Groups[1].Value,
                    IsSuccess = true,
                    AuthMethod = successMatch.Groups[2].Value,
                    Username = successMatch.Groups[3].Value,
                    IpAddress = successMatch.Groups[4].Value,
                    Port = int.TryParse(successMatch.Groups[5].Value, out var p) ? p : 22
                });
                continue;
            }

            // Failed SSH login: Failed password for invalid user admin from 192.168.1.50 port 54322 ssh2
            var failMatch = Regex.Match(line, @"^([A-Z][a-z]{2}\s+\d+\s+\d{2}:\d{2}:\d{2}).*Failed\s+password\s+for\s+(?:invalid user\s+)?(\S+)\s+from\s+([\d\.]+)\s+port\s+(\d+)");
            if (failMatch.Success)
            {
                var timestamp = failMatch.Groups[1].Value;
                var user = failMatch.Groups[2].Value;
                var ip = failMatch.Groups[3].Value;
                var port = int.TryParse(failMatch.Groups[4].Value, out var p) ? p : 22;

                events.Add(new SshLoginEventDto
                {
                    Timestamp = timestamp,
                    IsSuccess = false,
                    AuthMethod = "password",
                    Username = user,
                    IpAddress = ip,
                    Port = port
                });

                if (suspiciousIpCounts.TryGetValue(ip, out var existing))
                {
                    suspiciousIpCounts[ip] = (existing.Count + 1, timestamp);
                }
                else
                {
                    suspiciousIpCounts[ip] = (1, timestamp);
                }
            }
        }

        var suspiciousList = suspiciousIpCounts
            .OrderByDescending(kv => kv.Value.Count)
            .Select(kv => new BruteForceIpSummaryDto
            {
                IpAddress = kv.Key,
                FailedAttempts = kv.Value.Count,
                LastAttemptTimestamp = kv.Value.LastSeen
            })
            .ToList();

        return new SshAuditLogDto
        {
            LoginEvents = events.OrderByDescending(e => e.Timestamp).ToList(),
            SuspiciousIps = suspiciousList
        };
    }
}
