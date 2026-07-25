using Renci.SshNet;
using serverMVM.Application.DTOs;
using serverMVM.Application.DTOs.Docker;
using serverMVM.Application.Interfaces;
using serverMVM.Domain.Enums;

namespace serverMVM.Infrastructure.Services
{
    public class DockerComposeDiscoveryService :IDockerComposeDiscoveryService
    {
        private readonly IDockerService _dockerService;

        public DockerComposeDiscoveryService(IDockerService dockerService)
        {
            _dockerService = dockerService;
        }

        private SshClient CreateClient(SshConnectionRequestDto req)
        {
            var port = req.Port > 0 ? req.Port : 22;
            AuthenticationMethod authMethod;
            if (req.AuthType == SshAuthType.PrivateKey && !string.IsNullOrWhiteSpace(req.PrivateKey))
            {
                using var stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(req.PrivateKey));
                var keyFile = string.IsNullOrEmpty(req.Passphrase)
                    ? new PrivateKeyFile(stream)
                    : new PrivateKeyFile(stream, req.Passphrase);
                authMethod = new PrivateKeyAuthenticationMethod(req.Username, keyFile);
            }
            else
            {
                authMethod = new PasswordAuthenticationMethod(req.Username, req.Password ?? string.Empty);
            }
            var connectionInfo = new ConnectionInfo(req.Host, port, req.Username, authMethod)
            {
                Timeout = TimeSpan.FromSeconds(10)
            };
            return new SshClient(connectionInfo);
        }

        public async Task<List<DockerComposeProjectDto>> DiscoverProjectsAsync(SshConnectionRequestDto connection)
        {
            var allContainers = await _dockerService.GetContainersAsync(connection);
            var composeContainers = allContainers.Where(c => c.IsCompose && !string.IsNullOrEmpty(c.ComposeProject)).ToList();

            var projectMap = new Dictionary<string, DockerComposeProjectDto>(StringComparer.OrdinalIgnoreCase);

            // Active discovery từ container label
            foreach (var container in composeContainers)
            {
                var projectName = container.ComposeProject;
                if (!projectMap.TryGetValue(projectName, out var proj))
                {
                    proj =  new DockerComposeProjectDto
                    {
                        Name = projectName,
                        WorkingDir = container.WorkingDir ?? "",
                        ConfigFiles = string.IsNullOrEmpty(container.ConfigFiles)
                            ? new List<string>() : container.ConfigFiles.Split(',').ToList(),
                        Containers = new List<DockerContainerDto>()
                    };
                    projectMap[projectName] = proj;
                }
            }

            // Targeted path scan các file YML trên đĩa
            using var client = CreateClient(connection);
            await Task.Run(() => client.Connect());

            var findCmdStr = "find /home /root /var/www /opt /srv /apps -maxdepth 5 \\( -name \"docker-compose.yml\" -o -name \"docker-compose.yaml\" -o -name \"compose.yml\" -o -name \"compose.yaml\" \\) -not -path \"*/node_modules/*\" -not -path \"*/.git/*\" -not -path \"*/vendor/*\" 2>/dev/null";
            using var findCmd = client.CreateCommand(findCmdStr);
            var findOutput = await Task.Run(() => findCmd.Execute());
            client.Disconnect();

            var discoveredFiles = findOutput.Split('\n', StringSplitOptions.RemoveEmptyEntries);

            foreach (var file in discoveredFiles)
            {
                var cleanFilePath = file.Trim();
                var dirPath = Path.GetDirectoryName(cleanFilePath)?.Replace('\\', '/') ?? " ";
                var dirName = Path.GetFileName(dirPath);

                // Kiểm tra project đã có trong map từ container chưa
                var existingProject = projectMap.Values.FirstOrDefault(p => p.WorkingDir.Equals(dirPath, StringComparison.OrdinalIgnoreCase) || p.Name.Equals(dirName, StringComparison.OrdinalIgnoreCase));

                if (existingProject == null)
                {
                    projectMap[dirName] = new DockerComposeProjectDto
                    {
                        Name = dirName,
                        WorkingDir = dirPath,
                        ConfigFiles = new List<string> { cleanFilePath },
                        Status = DockerProjectStatus.OrphanedFiles,
                        Containers = new List<DockerContainerDto>()
                    };
                }

                // Tính toán trạng thái chính xác
                foreach (var proj in projectMap.Values)
                {
                    if (proj.Containers.Count > 0)
                    {
                        var runningCount = proj.Containers.Count(c => c.State.Equals("running", StringComparison.OrdinalIgnoreCase));
                        if (runningCount == proj.Containers.Count)
                        {
                            proj.Status = DockerProjectStatus.Running;
                        }
                        else if (runningCount > 0)
                        {
                            proj.Status = DockerProjectStatus.Partial;
                        }
                        else
                        {
                            proj.Status = DockerProjectStatus.Stopped;
                        }
                    }
                }
            }

            return projectMap.Values.ToList();
        }

        public async Task<(bool Success, string Output)> ComposeActionAsync(DockerComposeActionRequestDto req)
        {
            using var client = CreateClient(req.Connection);
            await Task.Run(() => client.Connect());

            var action = req.Action.ToLower();
            string composeCmd = action switch
            {
                "up"  => "docker compose up -d",
                "down" => "docker compose down",
                "stop" => "docker compose stop",
                "restart" => "docker compose restart",
                "pull" => "docker compose pull",
                _ => "docker compose restart"
            };

            var fullCmd = $"cd \"{req.WorkingDir}\" && {composeCmd}";
            using var cmd = client.CreateCommand(fullCmd);
            var output = await Task.Run(() => cmd.Execute());
            client.Disconnect();

            return (cmd.ExitStatus == 0, string.IsNullOrWhiteSpace(cmd.Error) ? output.Trim() : cmd.Error.Trim());
        }

        public async Task<string> GetComposeFileContentAsync(SshConnectionRequestDto connection, string filePath)
        {
            using var client = CreateClient(connection);
            await Task.Run(() => client.Connect());
            using var cmd = client.CreateCommand($"cat \"{filePath}\"");
            var output = await Task.Run(() => cmd.Execute());
            client.Disconnect();
            return output;
        }

        public async Task<(bool Success, string Output)> SaveComposeFileContentAsync(SshConnectionRequestDto connection, string filePath, string content)
        {
            using var client = CreateClient(connection);
            await Task.Run(() => client.Connect());
            // Escape nội dung file để ghi an toàn qua SSH bash
            var base64Content = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(content));
            var fullCmd = $"echo \"{base64Content}\" | base64 -d > \"{filePath}\"";
            using var cmd = client.CreateCommand(fullCmd);
            var output = await Task.Run(() => cmd.Execute());
            client.Disconnect();
            return (cmd.ExitStatus == 0, cmd.ExitStatus == 0 ? "Lưu file Compose thành công!" : cmd.Error.Trim());
        }
    }
}