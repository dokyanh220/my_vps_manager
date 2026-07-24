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
        var diskSection = rawCommandOutput.Contains("===DISK===")
            ? rawCommandOutput.Substring(rawCommandOutput.IndexOf("===DISK===") + 10).Trim()
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
