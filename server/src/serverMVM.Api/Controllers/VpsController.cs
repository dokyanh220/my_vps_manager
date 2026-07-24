using Microsoft.AspNetCore.Mvc;
using serverMVM.Application.DTOs;
using serverMVM.Application.Interfaces;

namespace serverMVM.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VpsController : ControllerBase
{
    private readonly ISshService _sshService;

    public VpsController(ISshService sshService)
    {
        _sshService = sshService;
    }

    /// <summary>
    /// Kiểm tra kết nối SSH tới VPS Linux bằng Password hoặc SSH Key
    /// </summary>
    [HttpPost("test-connection")]
    public IActionResult TestConnection([FromBody] SshConnectionRequestDto request)
    {
        var result = _sshService.TestConnection(request);
        if (result.IsSuccess)
        {
            return Ok(new { success = true, message = result.Message });
        }
        return BadRequest(new { success = false, message = result.Message });
    }

    /// <summary>
    /// Đăng nhập SSH và lấy thông tin cấu hình hệ thống (CPU, RAM, Disk, OS)
    /// </summary>
    [HttpPost("system-info")]
    public IActionResult GetSystemInfo([FromBody] SshConnectionRequestDto request)
    {
        try
        {
            var data = _sshService.GetSystemInfo(request);
            return Ok(new { success = true, data });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }
}
