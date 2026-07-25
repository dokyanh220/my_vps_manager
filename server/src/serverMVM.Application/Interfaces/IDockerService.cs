using serverMVM.Application.DTOs;
using serverMVM.Application.DTOs.Docker;

namespace serverMVM.Application.Interfaces;

public interface IDockerService
{
    Task<DockerOverviewDto> GetOverviewAsync(SshConnectionRequestDto connection);
    Task<List<DockerContainerDto>> GetContainersAsync(SshConnectionRequestDto connection);
    Task<(bool Success, string Output)> ContainerActionAsync(DockerContainerActionRequestDto request);
    Task<string> GetContainerLogsAsync(SshConnectionRequestDto connection, string containerId, int tail = 200);
    Task<(bool Success, string Output)> PruneVolumesAsync(SshConnectionRequestDto connection);
    Task<(bool Success, string Output)> PruneSystemAsync(SshConnectionRequestDto connection);
}