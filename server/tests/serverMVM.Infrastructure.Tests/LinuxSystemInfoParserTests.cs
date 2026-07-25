using serverMVM.Infrastructure.Parsers;
using Xunit;

namespace serverMVM.Infrastructure.Tests;

public class LinuxSystemInfoParserTests
{
    [Fact]
    public void Parse_ValidOutput_ReturnsCorrectSystemInfo()
    {
        // Arrange
        var parser = new LinuxSystemInfoParser();
        var rawOutput = @"
===HOSTNAME===
my-vps-server
===OS===
NAME=""Ubuntu""
VERSION=""22.04.3 LTS (Jammy Jellyfish)""
PRETTY_NAME=""Ubuntu 22.04.3 LTS""
===KERNEL===
5.15.0-88-generic
===UPTIME===
up 3 days, 12 hours
===CPU===
Architecture:            x86_64
CPU(s):                  4
Model name:              AMD EPYC 7763 64-Core Processor
===RAM===
               total        used        free      shared  buff/cache   available
Mem:      8355606528  2147483648  6208122880           0           0           0
===DISK===
Filesystem     1B-blocks        Used   Available Use% Mounted on
/dev/sda1   105689407488 32212254720 73477152768  31% /
===NETWORK===
Inter-|   Receive                                                |  Transmit
 face |bytes    packets errs drop fifo frame compressed multicast|bytes    packets errs drop fifo colls carrier compressed
  lo: 12345678      100    0    0    0     0          0         0 12345678     100    0    0    0     0       0          0
eth0: 1558293847   5000    0    0    0     0          0         0 542891029    3000    0    0    0     0       0          0
===IP===
1: lo    inet 127.0.0.1/8 scope host lo
2: eth0    inet 192.168.1.100/24 brd 192.168.1.255 scope global eth0
";

        // Act
        var result = parser.Parse(rawOutput);

        // Assert
        Assert.Equal("my-vps-server", result.Os.Hostname);
        Assert.Equal("Ubuntu 22.04.3 LTS", result.Os.Distribution);
        Assert.Equal("5.15.0-88-generic", result.Os.KernelVersion);
        Assert.Equal("up 3 days, 12 hours", result.Os.Uptime);

        Assert.Equal("AMD EPYC 7763 64-Core Processor", result.Cpu.ModelName);
        Assert.Equal(4, result.Cpu.Cores);

        Assert.Equal(8355606528, result.Memory.TotalBytes);
        Assert.Equal(2147483648, result.Memory.UsedBytes);
        Assert.Equal(6208122880, result.Memory.FreeBytes);
        Assert.Equal(25.7, result.Memory.UsagePercentage);

        Assert.Equal(105689407488, result.Disk.TotalBytes);
        Assert.Equal(32212254720, result.Disk.UsedBytes);
        Assert.Equal(73477152768, result.Disk.AvailableBytes);
        Assert.Equal(30.48, result.Disk.UsagePercentage);

        Assert.Single(result.Networks);
        var eth0 = result.Networks[0];
        Assert.Equal("eth0", eth0.InterfaceName);
        Assert.Equal("192.168.1.100", eth0.IpAddress);
        Assert.Equal(1558293847, eth0.RxBytesTotal);
        Assert.Equal(542891029, eth0.TxBytesTotal);
        Assert.Equal("1.45 GB", eth0.FormattedRxTotal);
        Assert.Equal("517.74 MB", eth0.FormattedTxTotal);
    }
}
