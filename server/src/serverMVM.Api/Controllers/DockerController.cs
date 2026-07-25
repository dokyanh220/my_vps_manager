using Microsoft.AspNetCore.Mvc;
using serverMVM.Application.DTOs;
using serverMVM.Application.DTOs.Docker;
using serverMVM.Application.Interfaces;

namespace serverMVM.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DockerController : ControllerBase
{
    private readonly IDockerService _dockerService;
    private readonly IDockerComposeDiscoveryService _discoveryService;

    public DockerController(IDockerService dockerService, IDockerComposeDiscoveryService discoveryService)
    {
        _dockerService = dockerService;
        _discoveryService = discoveryService;
    }

    [HttpPost("overview")]
    public async Task<IActionResult> GetOverview([FromBody] SshConnectionRequestDto connection)
    {
        try
        {
            var overview = await _dockerService.GetOverviewAsync(connection);
            return Ok(new { success = true, data = overview });
        }
        catch (Exception ex)
        {
            return Ok(new { success = false, message = $"Lỗi lấy thông tin Docker: {ex.Message}" });
        }
    }

    [HttpPost("containers")]
    public async Task<IActionResult> GetContainers([FromBody] SshConnectionRequestDto connection)
    {
        try
        {
            var result = await _dockerService.GetContainersAsync(connection);
            return Ok(new { success = true, data = result });
        }
        catch (Exception ex)
        {
            return Ok(new { success = false, message = $"Lỗi lấy danh sách Containers: {ex.Message}" });
        }
    }

    [HttpPost("containers/action")]
    public async Task<IActionResult> ContainerAction([FromBody] DockerContainerActionRequestDto req)
    {
        var result = await _dockerService.ContainerActionAsync(req);
        return Ok(new { success = result.Success, message = result.Output });
    }

    [HttpPost("containers/logs")]
    public async Task<IActionResult> GetLogs([FromBody] SshConnectionRequestDto connection, [FromQuery] string containerId, [FromQuery] int tail = 200)
    {
        var logs = await _dockerService.GetContainerLogsAsync(connection, containerId, tail);
        return Ok(new { success = true, logs });
    }

    [HttpPost("compose/discover")]
    public async Task<IActionResult> DiscoverComposeProjects([FromBody] SshConnectionRequestDto connection)
    {
        var projects = await _discoveryService.DiscoverProjectsAsync(connection);
        return Ok(new { success = true, data = projects });
    }

    [HttpPost("compose/action")]
    public async Task<IActionResult> ComposeAction([FromBody] DockerComposeActionRequestDto request)
    {
        var result = await _discoveryService.ComposeActionAsync(request);
        return Ok(new { success = result.Success, message = result.Output });
    }

    [HttpPost("compose/file")]
    public async Task<IActionResult> GetComposeFile([FromBody] DockerComposeFileRequestDto request)
    {
        var content = await _discoveryService.GetComposeFileContentAsync(request.Connection, request.FilePath);
        return Ok(new { success = true, content });
    }

    [HttpPost("compose/file/save")]
    public async Task<IActionResult> SaveComposeFile([FromBody] DockerComposeFileRequestDto request)
    {
        var result = await _discoveryService.SaveComposeFileContentAsync(request.Connection, request.FilePath, request.Content ?? "");
        return Ok(new { success = result.Success, message = result.Output });
    }

    [HttpPost("prune/volumes")]
    public async Task<IActionResult> PruneVolumes([FromBody] SshConnectionRequestDto connection)
    {
        var result = await _dockerService.PruneVolumesAsync(connection);
        return Ok(new { success = result.Success, message = result.Output });
    }
    
    [HttpPost("prune/system")]
    public async Task<IActionResult> PruneSystem([FromBody] SshConnectionRequestDto connection)
    {
        var result = await _dockerService.PruneSystemAsync(connection);
        return Ok(new { success = result.Success, message = result.Output });
    }
}