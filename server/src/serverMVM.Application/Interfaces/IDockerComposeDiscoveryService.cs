using serverMVM.Application.DTOs;
using serverMVM.Application.DTOs.Docker;

namespace serverMVM.Application.Interfaces;

public interface IDockerComposeDiscoveryService
{
    Task<List<DockerComposeProjectDto>> DiscoverProjectsAsync(SshConnectionRequestDto connection);
    Task<(bool Success, string Output)> ComposeActionAsync(DockerComposeActionRequestDto request);
    Task<string> GetComposeFileContentAsync(SshConnectionRequestDto connection, string filePath);
    Task<(bool Success, string Output)> SaveComposeFileContentAsync(SshConnectionRequestDto connection, string filePath, string content);
}