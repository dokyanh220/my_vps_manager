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

    [HttpPost("test-connection")]
    public IActionResult TestConnection([FromBody] SshConnectionRequestDto request)
    {
        var result = _sshService.TestConnection(request);
        return Ok(new { success = result.IsSuccess, message = result.Message });
    }

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
            return Ok(new { success = false, message = $"Lỗi truy vấn VPS qua SSH: {ex.Message}" });
        }
    }
}
