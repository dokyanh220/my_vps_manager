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
    }
}
