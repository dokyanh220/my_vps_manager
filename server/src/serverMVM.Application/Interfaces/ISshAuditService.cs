using serverMVM.Application.DTOs;
using serverMVM.Application.DTOs.Logs;

namespace serverMVM.Application.Interfaces;

public interface ISshAuditService
{
    Task<SshAuditLogDto> GetSshAuditLogsAsync(SshConnectionRequestDto connection, int lines = 500);
}
