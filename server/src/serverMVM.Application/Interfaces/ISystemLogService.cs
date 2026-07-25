using serverMVM.Application.DTOs;
using serverMVM.Application.DTOs.Logs;

namespace serverMVM.Application.Interfaces;

public interface ISystemLogService
{
    Task<LogSourceDto> GetLogSourcesAsync(SshConnectionRequestDto connection);
    Task<SystemLogResponseDto> ReadLogsAsync(SystemLogRequestDto request);
}
