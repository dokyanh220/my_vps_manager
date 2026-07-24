using serverMVM.Domain.Enums;

namespace serverMVM.Application.DTOs;

public class SshConnectionRequestDto
{
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 22;
    public string Username { get; set; } = "root";
    public SshAuthType AuthType { get; set; } = SshAuthType.Password;
    public string? Password { get; set; }
    public string? PrivateKey { get; set; }
    public string? Passphrase { get; set; }
}
