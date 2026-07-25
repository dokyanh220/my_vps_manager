namespace serverMVM.Application.DTOs;

public class VpsSystemInfoResponseDto
{
    public OsInfoDto Os { get; set; } = new();
    public CpuInfoDto Cpu { get; set; } = new();
    public MemoryInfoDto Memory { get; set; } = new();
    public DiskInfoDto Disk { get; set; } = new();
    public List<NetworkInterfaceDto> Networks { get; set; } = new();
}

public class OsInfoDto
{
    public string Hostname { get; set; } = string.Empty;
    public string Distribution { get; set; } = string.Empty;
    public string KernelVersion { get; set; } = string.Empty;
    public string Uptime { get; set; } = string.Empty;
}

public class CpuInfoDto
{
    public string ModelName { get; set; } = string.Empty;
    public int Cores { get; set; }
}

public class MemoryInfoDto
{
    public long TotalBytes { get; set; }
    public long UsedBytes { get; set; }
    public long FreeBytes { get; set; }
    public double UsagePercentage => TotalBytes > 0 ? Math.Round((double)UsedBytes / TotalBytes * 100, 2) : 0;
}

public class DiskInfoDto
{
    public string MountPoint { get; set; } = "/";
    public long TotalBytes { get; set; }
    public long UsedBytes { get; set; }
    public long AvailableBytes { get; set; }
    public double UsagePercentage => TotalBytes > 0 ? Math.Round((double)UsedBytes / TotalBytes * 100, 2) : 0;
}

public class NetworkInterfaceDto
{
    public string InterfaceName { get; set; } = string.Empty;
    public string IpAddress { get; set; } = string.Empty;
    public long RxBytesTotal { get; set; }
    public long TxBytesTotal { get; set; }
    public string FormattedRxTotal => FormatBytes(RxBytesTotal);
    public string FormattedTxTotal => FormatBytes(TxBytesTotal);

    private static string FormatBytes(long bytes)
    {
        if (bytes <= 0) return "0 B";
        string[] suffix = { "B", "KB", "MB", "GB", "TB" };
        int i = 0;
        double dblSByte = bytes;
        while (dblSByte >= 1024 && i < suffix.Length - 1)
        {
            dblSByte /= 1024.0;
            i++;
        }
        return $"{dblSByte:0.##} {suffix[i]}";
    }
}
