namespace serverMVM.Application.DTOs.Docker
{
    public class DockerContainerDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Image { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;      // running, exited, created, paused
        public string Status { get; set; } = string.Empty;     // Up 2 hours, Exited (0) 5 minutes ago
        public string Ports { get; set; } = string.Empty;
        public string CreatedAt { get; set; } = string.Empty;
        public bool IsCompose { get; set; }
        public string? ComposeProject { get; set; }
        public string? ComposeService { get; set; }
        public string? WorkingDir { get; set; }
        public string? ConfigFiles { get; set; }
    }
}