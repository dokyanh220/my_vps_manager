using System.Text.RegularExpressions;
using serverMVM.Application.DTOs;
using serverMVM.Application.Interfaces;

namespace serverMVM.Infrastructure.Parsers;

public class LinuxSystemInfoParser : ILinuxSystemInfoParser
{
    public VpsSystemInfoResponseDto Parse(string rawCommandOutput)
    {
        var response = new VpsSystemInfoResponseDto();

        if (string.IsNullOrWhiteSpace(rawCommandOutput))
        {
            return response;
        }

        string GetSection(string marker, string? nextMarker = null)
        {
            var pattern = nextMarker != null
                ? $@"==={marker}===\s*\n(.*?)==={nextMarker}"
                : $@"==={marker}===\s*\n(.*)";
            var match = Regex.Match(rawCommandOutput, pattern, RegexOptions.Singleline);
            return match.Success ? match.Groups[1].Value.Trim() : string.Empty;
        }

        // 1. OS Info
        response.Os.Hostname = GetSection("HOSTNAME", "OS");
        var osRelease = GetSection("OS", "KERNEL");
        var osPrettyName = Regex.Match(osRelease, @"PRETTY_NAME=""(.*?)""");
        response.Os.Distribution = osPrettyName.Success ? osPrettyName.Groups[1].Value : "Linux";
        response.Os.KernelVersion = GetSection("KERNEL", "UPTIME");
        response.Os.Uptime = GetSection("UPTIME", "CPU");

        // 2. CPU Info
        var cpuSection = GetSection("CPU", "RAM");
        var modelMatch = Regex.Match(cpuSection, @"Model name:\s*(.+)");
        if (modelMatch.Success)
        {
            response.Cpu.ModelName = modelMatch.Groups[1].Value.Trim();
        }

        var coresMatch = Regex.Match(cpuSection, @"CPU\(s\):\s*(\d+)");
        if (coresMatch.Success && int.TryParse(coresMatch.Groups[1].Value, out var cores))
        {
            response.Cpu.Cores = cores;
        }

        // 3. RAM (free -b)
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

        // 4. Disk (df -B1 /)
        var diskSection = GetSection("DISK", "NETWORK");
        if (string.IsNullOrEmpty(diskSection) && rawCommandOutput.Contains("===DISK==="))
        {
            var diskIdx = rawCommandOutput.IndexOf("===DISK===") + 10;
            var netIdx = rawCommandOutput.IndexOf("===NETWORK===");
            diskSection = netIdx > diskIdx 
                ? rawCommandOutput.Substring(diskIdx, netIdx - diskIdx).Trim() 
                : rawCommandOutput.Substring(diskIdx).Trim();
        }

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

        // 5. Network (/proc/net/dev & ip -4 -o addr show)
        var netSection = GetSection("NETWORK", "IP");
        var ipSection = rawCommandOutput.Contains("===IP===")
            ? rawCommandOutput.Substring(rawCommandOutput.IndexOf("===IP===") + 8).Trim()
            : string.Empty;

        var ipMap = ParseIpAddresses(ipSection);
        var networks = ParseNetworkInterfaces(netSection, ipMap);
        response.Networks = networks;

        return response;
    }

    private Dictionary<string, string> ParseIpAddresses(string ipSection)
    {
        var dict = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        if (string.IsNullOrWhiteSpace(ipSection)) return dict;

        var lines = ipSection.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        foreach (var line in lines)
        {
            // Format example: 2: eth0    inet 192.168.1.100/24 brd 192.168.1.255 scope global eth0
            var match = Regex.Match(line, @"\d+:\s+(\S+)\s+inet\s+([\d\.]+)");
            if (match.Success)
            {
                var ifName = match.Groups[1].Value.Trim();
                var ip = match.Groups[2].Value.Trim();
                dict[ifName] = ip;
            }
        }
        return dict;
    }

    private List<NetworkInterfaceDto> ParseNetworkInterfaces(string netSection, Dictionary<string, string> ipMap)
    {
        var list = new List<NetworkInterfaceDto>();
        if (string.IsNullOrWhiteSpace(netSection)) return list;

        var lines = netSection.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        foreach (var line in lines)
        {
            if (line.Contains("|") || !line.Contains(":")) continue;

            var parts = line.Split(':');
            if (parts.Length != 2) continue;

            var ifName = parts[0].Trim();
            if (ifName.Equals("lo", StringComparison.OrdinalIgnoreCase)) continue; // Skip loopback

            var stats = Regex.Split(parts[1].Trim(), @"\s+");
            if (stats.Length >= 9)
            {
                long.TryParse(stats[0], out var rxBytes);
                long.TryParse(stats[8], out var txBytes);

                ipMap.TryGetValue(ifName, out var ipAddress);

                list.Add(new NetworkInterfaceDto
                {
                    InterfaceName = ifName,
                    IpAddress = ipAddress ?? string.Empty,
                    RxBytesTotal = rxBytes,
                    TxBytesTotal = txBytes
                });
            }
        }
        return list;
    }
}
