using Microsoft.AspNetCore.Mvc;
using serverMVM.Application.DTOs;
using serverMVM.Application.DTOs.Logs;
using serverMVM.Application.Interfaces;

namespace serverMVM.Api.Controllers;

[ApiController]
[Route("api/logs")]
[Route("api/[controller]")]
public class SystemLogController : ControllerBase
{
    private readonly ISystemLogService _systemLogService;
    private readonly ISshAuditService _sshAuditService;

    public SystemLogController(ISystemLogService systemLogService, ISshAuditService sshAuditService)
    {
        _systemLogService = systemLogService;
        _sshAuditService = sshAuditService;
    }

    /// <summary>
    /// Liệt kê tất cả nguồn log (/var/log files & systemd services) trên VPS
    /// </summary>
    [HttpPost("sources")]
    public async Task<IActionResult> GetLogSources([FromBody] SshConnectionRequestDto connection)
    {
        try
        {
            var sources = await _systemLogService.GetLogSourcesAsync(connection);
            return Ok(new { success = true, data = sources });
        }
        catch (Exception ex)
        {
            return Ok(new { success = false, message = $"Lỗi lấy nguồn log: {ex.Message}" });
        }
    }

    /// <summary>
    /// Đọc log từ systemd journalctl hoặc file log /var/log với bộ lọc nâng cao
    /// </summary>
    [HttpPost("read")]
    public async Task<IActionResult> ReadLogs([FromBody] SystemLogRequestDto request)
    {
        try
        {
            var result = await _systemLogService.ReadLogsAsync(request);
            return Ok(new { success = true, data = result });
        }
        catch (Exception ex)
        {
            return Ok(new { success = false, message = $"Lỗi đọc log: {ex.Message}" });
        }
    }

    /// <summary>
    /// Bóc tách lịch sử đăng nhập SSH (Thành công / Thất bại) và phát hiện IP nghi vấn tấn công
    /// </summary>
    [HttpPost("ssh-audit")]
    public async Task<IActionResult> GetSshAudit([FromBody] SshConnectionRequestDto connection, [FromQuery] int lines = 500)
    {
        try
        {
            var audit = await _sshAuditService.GetSshAuditLogsAsync(connection, lines);
            return Ok(new { success = true, data = audit });
        }
        catch (Exception ex)
        {
            return Ok(new { success = false, message = $"Lỗi kiểm tra SSH audit: {ex.Message}" });
        }
    }
}
