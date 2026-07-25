using System.Text.RegularExpressions;
using Renci.SshNet;
using serverMVM.Application.DTOs;
using serverMVM.Application.DTOs.Logs;
using serverMVM.Application.Interfaces;

namespace serverMVM.Infrastructure.Services;

public class SystemLogService : ISystemLogService
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

    public async Task<LogSourceDto> GetLogSourcesAsync(SshConnectionRequestDto connection)
    {
        using var client = CreateClient(connection);
        await Task.Run(() => client.Connect());

        // 1. Get log files in /var/log
        var findLogFilesCmd = "find /var/log -maxdepth 2 -type f \\( -name \"*.log\" -o -name \"syslog\" -o -name \"messages\" -o -name \"secure\" -o -name \"auth.log\" \\) -exec ls -lh {} + 2>/dev/null";
        using var cmd1 = client.CreateCommand(findLogFilesCmd);
        var filesOutput = await Task.Run(() => cmd1.Execute());

        // 2. Get active systemd services
        var listServicesCmd = "systemctl list-units --type=service --state=running --no-legend --no-pager | awk '{print $1}'";
        using var cmd2 = client.CreateCommand(listServicesCmd);
        var servicesOutput = await Task.Run(() => cmd2.Execute());

        client.Disconnect();

        var logFiles = ParseLogFiles(filesOutput);
        var services = servicesOutput.Split('\n', StringSplitOptions.RemoveEmptyEntries)
                                      .Select(s => s.Trim())
                                      .Where(s => !string.IsNullOrEmpty(s))
                                      .ToList();

        return new LogSourceDto
        {
            LogFiles = logFiles,
            SystemdServices = services
        };
    }

    private List<LogFileInfoDto> ParseLogFiles(string output)
    {
        var list = new List<LogFileInfoDto>();
        if (string.IsNullOrWhiteSpace(output)) return list;

        var lines = output.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        foreach (var line in lines)
        {
            var parts = Regex.Split(line.Trim(), @"\s+");
            if (parts.Length >= 9)
            {
                var filePath = parts[8];
                list.Add(new LogFileInfoDto
                {
                    FilePath = filePath,
                    FileName = Path.GetFileName(filePath),
                    SizeBytes = ParseHumanSize(parts[4]),
                    LastModified = $"{parts[5]} {parts[6]} {parts[7]}"
                });
            }
        }
        return list;
    }

    private long ParseHumanSize(string sizeStr)
    {
        if (long.TryParse(sizeStr, out var b)) return b;
        return 0;
    }

    public async Task<SystemLogResponseDto> ReadLogsAsync(SystemLogRequestDto request)
    {
        using var client = CreateClient(request.Connection);
        await Task.Run(() => client.Connect());

        string command;
        var lines = request.Lines > 0 ? request.Lines : 200;

        if (request.SourceType.Equals("Journald", StringComparison.OrdinalIgnoreCase))
        {
            var sb = new System.Text.StringBuilder("journalctl --no-pager");
            if (!string.IsNullOrWhiteSpace(request.Target))
            {
                sb.Append($" -u {request.Target}");
            }
            if (!string.IsNullOrWhiteSpace(request.Severity))
            {
                sb.Append($" -p {request.Severity}");
            }
            if (!string.IsNullOrWhiteSpace(request.Since))
            {
                sb.Append($" --since \"{request.Since}\"");
            }
            if (!string.IsNullOrWhiteSpace(request.Until))
            {
                sb.Append($" --until \"{request.Until}\"");
            }
            if (!string.IsNullOrWhiteSpace(request.Keyword))
            {
                sb.Append($" -g \"{request.Keyword}\"");
            }
            sb.Append($" -n {lines}");
            command = sb.ToString();
        }
        else
        {
            var filePath = request.Target;
            if (string.IsNullOrWhiteSpace(filePath)) filePath = "/var/log/syslog";

            if (!string.IsNullOrWhiteSpace(request.Keyword))
            {
                command = $"grep -i \"{request.Keyword}\" \"{filePath}\" | tail -n {lines}";
            }
            else
            {
                command = $"tail -n {lines} \"{filePath}\"";
            }
        }

        using var cmd = client.CreateCommand(command);
        var rawOutput = await Task.Run(() => cmd.Execute());
        client.Disconnect();

        var entries = ParseLogEntries(rawOutput);

        return new SystemLogResponseDto
        {
            Target = request.Target,
            SourceType = request.SourceType,
            TotalLines = entries.Count,
            Entries = entries,
            RawOutput = rawOutput
        };
    }

    private List<LogEntryDto> ParseLogEntries(string rawOutput)
    {
        var list = new List<LogEntryDto>();
        if (string.IsNullOrWhiteSpace(rawOutput)) return list;

        var lines = rawOutput.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        foreach (var line in lines)
        {
            var match = Regex.Match(line, @"^([A-Z][a-z]{2}\s+\d+\s+\d{2}:\d{2}:\d{2})\s+(\S+)\s+(\S+?)(?:\[\d+\])?:?\s+(.*)$");
            if (match.Success)
            {
                list.Add(new LogEntryDto
                {
                    Timestamp = match.Groups[1].Value,
                    Service = match.Groups[3].Value,
                    Message = match.Groups[4].Value,
                    Level = DetermineLevel(match.Groups[4].Value)
                });
            }
            else
            {
                list.Add(new LogEntryDto
                {
                    Message = line,
                    Level = DetermineLevel(line)
                });
            }
        }
        return list;
    }

    private string DetermineLevel(string msg)
    {
        var lower = msg.ToLower();
        if (lower.Contains("error") || lower.Contains("failed") || lower.Contains("fatal")) return "Error";
        if (lower.Contains("warn") || lower.Contains("warning")) return "Warning";
        if (lower.Contains("debug")) return "Debug";
        return "Info";
    }
}
