using serverMVM.Domain.Enums;

namespace serverMVM.Application.DTOs.Docker
{
    public class DockerComposeProjectDto
    {
        public string Name { get; set; } = string.Empty;
        public string WorkingDir { get; set; } = string.Empty;
        public List<string> ConfigFiles { get; set; } = new();
        public DockerProjectStatus Status { get; set; }
        public List<DockerContainerDto> Containers { get; set; } = new();
    }
}