using System.Text.Json;
using Renci.SshNet;
using serverMVM.Application.DTOs;
using serverMVM.Application.DTOs.Docker;
using serverMVM.Application.Interfaces;
using serverMVM.Domain.Enums;

namespace serverMVM.Infrastructure.Services
{
    public class DockerService : IDockerService
    {
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

        public async Task<DockerOverviewDto> GetOverviewAsync(SshConnectionRequestDto connection)
        {
            var containers = await GetContainersAsync(connection);

            using var client = CreateClient(connection);
            await Task.Run(() => client.Connect());

            var volumeCmd = client.CreateCommand("docker volume ls -q -f dangling=true | wc -l");
            var volumeOutput = await Task.Run(() => volumeCmd.Execute());
            int.TryParse(volumeOutput.Trim(), out var danglingVolumes);

            var dfCmd = client.CreateCommand("docker system df");
            var dfOutput = await Task.Run(() => dfCmd.Execute());

            client.Disconnect();

            var composeProjectsCount = containers
                .Where(c => c.IsCompose && !string.IsNullOrEmpty(c.ComposeProject))
                .Select(c => c.ComposeProject)
                .Distinct()
                .Count();

            return new DockerOverviewDto
            {
                TotalContainers = containers.Count,
                RunningContainers = containers.Count(c => c.State.Equals("running", StringComparison.OrdinalIgnoreCase)),
                StoppedContainers = containers.Count(c => !c.State.Equals("running", StringComparison.OrdinalIgnoreCase)),
                TotalComposeProjects = composeProjectsCount,
                DanglingVolumesCount = danglingVolumes,
                DiskUsageSummary = dfOutput.Trim()
            };
        }

        public async Task<List<DockerContainerDto>> GetContainersAsync(SshConnectionRequestDto connection)
        {
            using var client = CreateClient(connection);
            await Task.Run(() => client.Connect());

            var cmdText = "docker ps -a --format '{\"id\":\"{{.ID}}\",\"name\":\"{{.Names}}\",\"image\":\"{{.Image}}\",\"state\":\"{{.State}}\",\"status\":\"{{.Status}}\",\"ports\":\"{{.Ports}}\",\"createdAt\":\"{{.CreatedAt}}\",\"labels\":\"{{.Labels}}\"}'";

            using var cmd = client.CreateCommand(cmdText);
            var rawOutput = await Task.Run(() => cmd.Execute());
            client.Disconnect();

            var result = new List<DockerContainerDto>();
            var lines = rawOutput.Split('\n', StringSplitOptions.RemoveEmptyEntries);

            foreach (var line in lines)
            {
                try
                {
                    using var doc = JsonDocument.Parse(line);
                    var root = doc.RootElement;

                    var labelsStr = root.GetProperty("labels").GetString() ?? "";
                    var labels = ParseLabels(labelsStr);

                    labels.TryGetValue("com.docker.compose.project", out var composeProject);
                    labels.TryGetValue("com.docker.compose.service", out var composeService);
                    labels.TryGetValue("com.docker.compose.project.working_dir", out var workingDir);
                    labels.TryGetValue("com.docker.compose.project.config_files", out var configFiles);
                    result.Add(new DockerContainerDto
                    {
                        Id = root.GetProperty("id").GetString() ?? "",
                        Name = root.GetProperty("name").GetString() ?? "",
                        Image = root.GetProperty("image").GetString() ?? "",
                        State = root.GetProperty("state").GetString() ?? "",
                        Status = root.GetProperty("status").GetString() ?? "",
                        Ports = root.GetProperty("ports").GetString() ?? "",
                        CreatedAt = root.GetProperty("createdAt").GetString() ?? "",
                        IsCompose = !string.IsNullOrEmpty(composeProject),
                        ComposeProject = composeProject,
                        ComposeService = composeService,
                        WorkingDir = workingDir,
                        ConfigFiles = configFiles
                    });
                }
                catch (System.Exception)
                {
                    // skip
                }
            }
            
            return result;
        }

        private Dictionary<string, string> ParseLabels(string labelsStr)
        {
            var dict = new Dictionary<string, string>();
            if (string.IsNullOrWhiteSpace(labelsStr)) return dict;
            var parts = labelsStr.Split(',');
            foreach (var part in parts)
            {
                var kv = part.Split('=');
                if (kv.Length == 2)
                {
                    dict[kv[0].Trim()] = kv[1].Trim();
                }
            }
            return dict;
        }

        public async Task<(bool Success, string Output)> ContainerActionAsync(DockerContainerActionRequestDto req)
        {
            using var client = CreateClient(req.Connection);
            await Task.Run(() => client.Connect());

            var validActions = new[] { "start", "stop", "restart", "remove" };
            var action = req.Action.ToLower();
            if (!validActions.Contains(action)) action = "restart";

            var cmdStr = action == "remove"
                ? $"docker rm -f {req.ContainerId}"
                : $"docker {action} {req.ContainerId}";
            using var cmd = client.CreateCommand(cmdStr);
            var output = await Task.Run(() => cmd.Execute());
            client.Disconnect();

            return (cmd.ExitStatus == 0, string.IsNullOrWhiteSpace(cmd.Error)
                ? output.Trim() : cmd.Error.Trim());
        }

        public async Task<string> GetContainerLogsAsync(SshConnectionRequestDto connection, string containerId, int tail = 200)
        {
            using var client = CreateClient(connection);
            await Task.Run(() => client.Connect());

            using var cmd = client.CreateCommand($"docker logs --tail {tail} {containerId}");
            var output = await Task.Run(() => cmd.Execute());
            client.Disconnect();

            return string.IsNullOrWhiteSpace(output) ? cmd.Error : output;
        }

        public async Task<(bool Success, string Output)> PruneVolumesAsync(SshConnectionRequestDto connection)
        {
            using var client = CreateClient(connection);
            await Task.Run(() => client.Connect());

            using var cmd = client.CreateCommand("docker volume prune -f");
            var output = await Task.Run(() => cmd.Execute());
            client.Disconnect();

            return (cmd.ExitStatus == 0, output.Trim());
        }
        
        public async Task<(bool Success, string Output)> PruneSystemAsync(SshConnectionRequestDto connection)
        {
            using var client = CreateClient(connection);
            await Task.Run(() => client.Connect());

            using var cmd = client.CreateCommand("docker system prune -af");
            var output = await Task.Run(() => cmd.Execute());
            client.Disconnect();

            return (cmd.ExitStatus == 0, output.Trim());
        }
    }
}