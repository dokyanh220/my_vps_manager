namespace serverMVM.Application.DTOs.Docker
{
    public class DockerOverviewDto
    {
        public int TotalContainers { get; set; }
        public int RunningContainers { get; set; }
        public int StoppedContainers { get; set; }
        public int TotalComposeProjects { get; set; }
        public int DanglingVolumesCount { get; set; }
        public string DiskUsageSummary { get; set; } = string.Empty;
    }
    public class DockerContainerActionRequestDto
    {
        public SshConnectionRequestDto Connection { get; set; } = new();
        public string ContainerId { get; set; } = string.Empty;
        public string Action { get; set; } = "restart"; // start, stop, restart, remove
    }
    public class DockerComposeActionRequestDto
    {
        public SshConnectionRequestDto Connection { get; set; } = new();
        public string WorkingDir { get; set; } = string.Empty;
        public string Action { get; set; } = "up"; // up, down, restart, stop, pull
    }
    public class DockerComposeFileRequestDto
    {
        public SshConnectionRequestDto Connection { get; set; } = new();
        public string FilePath { get; set; } = string.Empty;
        public string? Content { get; set; }
    }
}