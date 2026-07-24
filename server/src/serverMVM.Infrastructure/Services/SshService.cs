using System.Text;
using System.Text.RegularExpressions;
using Renci.SshNet;
using serverMVM.Application.DTOs;
using serverMVM.Application.Interfaces;
using serverMVM.Domain.Enums;

namespace serverMVM.Infrastructure.Services;

public class SshService : ISshService
{
    private readonly ILinuxSystemInfoParser _parser;

    public SshService(ILinuxSystemInfoParser parser)
    {
        _parser = parser;
    }

    private SshClient CreateClient(SshConnectionRequestDto request)
    {
        var port = request.Port > 0 ? request.Port : 22;
        AuthenticationMethod authMethod;

        if (request.AuthType == SshAuthType.PrivateKey && !string.IsNullOrWhiteSpace(request.PrivateKey))
        {
            using var stream = new MemoryStream(Encoding.UTF8.GetBytes(request.PrivateKey));
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

    public (bool IsSuccess, string Message) TestConnection(SshConnectionRequestDto request)
    {
        try
        {
            using var client = CreateClient(request);
            client.Connect();
            var connected = client.IsConnected;
            client.Disconnect();

            return (connected, connected ? "Kết nối SSH thành công!" : "Không thể kết nối SSH.");
        }
        catch (Exception ex)
        {
            return (false, $"Lỗi kết nối SSH: {ex.Message}");
        }
    }

    public VpsSystemInfoResponseDto GetSystemInfo(SshConnectionRequestDto request)
    {
        using var client = CreateClient(request);
        client.Connect();

        var commandText = @"
            echo '===HOSTNAME===' && hostname
            echo '===OS===' && cat /etc/os-release
            echo '===KERNEL===' && uname -r
            echo '===UPTIME===' && uptime -p
            echo '===CPU===' && lscpu
            echo '===RAM===' && free -b
            echo '===DISK===' && df -B1 /
        ";

        using var cmd = client.CreateCommand(commandText);
        var rawOutput = cmd.Execute();
        client.Disconnect();

        return _parser.Parse(rawOutput);
    }

    public VpsSystemInfoResponseDto ParseSystemOutput(string rawOutput)
    {
        var response = new VpsSystemInfoResponseDto();

        // Tách section dự trên tag marker
        string GetSection(string marker, string nextMarker = "===")
        {
            var match = Regex.Match(rawOutput, $@"==={marker}===\s*\n(.*?)({(nextMarker != null ? $@"==={nextMarker}" : "$")})", RegexOptions.Singleline);
            return match.Success ? match.Groups[1].Value.Trim() : string.Empty;
        }

        // Os
        response.Os.Hostname = GetSection("HOSTNAME", "OS");
        var osRelease = GetSection("OS", "KERNEL");
        var osPrettyName = Regex.Match(osRelease, @"PRETTY_NAME=""(.*?)""");
        response.Os.Distribution = osPrettyName.Success ? osPrettyName.Groups[1].Value : "Linux";
        response.Os.KernelVersion = GetSection("KERNEL", "UPTIME");
        response.Os.Uptime = GetSection("UPTIME", "CPU");

        // Cpu
        var cpuSection = GetSection("CPU", "RAM");
        var modelMatch = Regex.Match(cpuSection, @"Model name:\s*(.+)");
        if (modelMatch.Success) response.Cpu.ModelName = modelMatch.Groups[1].Value.Trim();
        var coresMatch = Regex.Match(cpuSection, @"CPU\(s\):\s*(\d+)");
        if (coresMatch.Success && int.TryParse(coresMatch.Groups[1].Value, out var cores))
        {
            response.Cpu.Cores = cores;
        }

        // Ram
        var ramSection = GetSection("RAM", "DISK");
        var ramLines = ramSection.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        if (ramLines.Length >= 2)
        {
            var parts = Regex.Split(ramLines[1].Trim(), @"\s+");
            if (parts.Length >= 3)
            {
                long.TryParse(parts[1], out var totalRam);
                long.TryParse(parts[2], out var usedRam);
                response.Memory.TotalBytes = totalRam;
                response.Memory.UsedBytes = usedRam;
                response.Memory.FreeBytes = totalRam - usedRam;
            }
        }

        // Swap

        // Disk
        var diskSection = rawOutput.Contains("===DISK===") 
            ? rawOutput.Substring(rawOutput.IndexOf("===DISK===") + 10).Trim() 
            : string.Empty;
        var diskLines = diskSection.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        if (diskLines.Length >= 2)
        {
            var parts = Regex.Split(diskLines[1].Trim(), @"\s+");
            if (parts.Length >= 4)
            {
                long.TryParse(parts[1], out var totalDisk);
                long.TryParse(parts[2], out var usedDisk);
                long.TryParse(parts[3], out var availDisk);
                response.Disk.TotalBytes = totalDisk;
                response.Disk.UsedBytes = usedDisk;
                response.Disk.AvailableBytes = availDisk;
            }
        }
        return response;
    }
}
