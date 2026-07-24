using serverMVM.Application.DTOs;

namespace serverMVM.Application.Interfaces;

public interface ISshTerminalManager
{
    Task<bool> CreateSessionAsync(string connectionId, SshConnectionRequestDto request, Func<string, Task> onDataReceived);
    Task SendInputAsync(string connectionId, string data);
    Task CloseSessionAsync(string connectionId);
}
