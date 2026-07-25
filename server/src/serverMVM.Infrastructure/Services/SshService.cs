using System.Text;
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
echo '===NETWORK===' && cat /proc/net/dev
echo '===IP===' && ip -4 -o addr show
";

        using var cmd = client.CreateCommand(commandText);
        var rawOutput = cmd.Execute();
        client.Disconnect();

        return _parser.Parse(rawOutput);
    }
}
