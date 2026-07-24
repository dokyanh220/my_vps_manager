using System.Collections.Concurrent;
using System.Text;
using Renci.SshNet;
using serverMVM.Application.DTOs;
using serverMVM.Application.Interfaces;
using serverMVM.Domain.Enums;

namespace serverMVM.Infrastructure.Services;

public class SshTerminalManager : ISshTerminalManager
{
    private readonly ConcurrentDictionary<string, TerminalSession> _sessions = new();

    private class TerminalSession : IAsyncDisposable
    {
        public required SshClient Client { get; init; }
        public required ShellStream Stream { get; init; }
        public required CancellationTokenSource Cts { get; init; }
        public Task? ReadTask { get; set; }

        public async ValueTask DisposeAsync()
        {
            try
            {
                Cts.Cancel();
                if (ReadTask != null)
                {
                    await Task.WhenAny(ReadTask, Task.Delay(500));
                }
                Stream.Dispose();
                if (Client.IsConnected)
                {
                    Client.Disconnect();
                }
                Client.Dispose();
            }
            catch
            {
                // Ignore disposal errors
            }
            finally
            {
                Cts.Dispose();
            }
        }
    }

    public async Task<bool> CreateSessionAsync(string connectionId, SshConnectionRequestDto request, Func<string, Task> onDataReceived)
    {
        // Close existing session for this connection if any
        await CloseSessionAsync(connectionId);

        var port = request.Port > 0 ? request.Port : 22;
        AuthenticationMethod authMethod;

        if (request.AuthType == SshAuthType.PrivateKey && !string.IsNullOrWhiteSpace(request.PrivateKey))
        {
            using var keyStream = new MemoryStream(Encoding.UTF8.GetBytes(request.PrivateKey));
            var keyFile = string.IsNullOrEmpty(request.Passphrase)
                ? new PrivateKeyFile(keyStream)
                : new PrivateKeyFile(keyStream, request.Passphrase);

            authMethod = new PrivateKeyAuthenticationMethod(request.Username, keyFile);
        }
        else
        {
            authMethod = new PasswordAuthenticationMethod(request.Username, request.Password ?? string.Empty);
        }

        var connectionInfo = new ConnectionInfo(request.Host, port, request.Username, authMethod)
        {
            Timeout = TimeSpan.FromSeconds(10)
        };

        var client = new SshClient(connectionInfo);

        try
        {
            await Task.Run(() => client.Connect());

            if (!client.IsConnected)
            {
                client.Dispose();
                return false;
            }

            var shellStream = client.CreateShellStream("xterm", 80, 24, 800, 600, 1024);
            var cts = new CancellationTokenSource();

            var session = new TerminalSession
            {
                Client = client,
                Stream = shellStream,
                Cts = cts
            };

            session.ReadTask = Task.Run(() => StartReadingStreamAsync(shellStream, onDataReceived, cts.Token));

            _sessions[connectionId] = session;
            return true;
        }
        catch
        {
            client.Dispose();
            return false;
        }
    }

    private async Task StartReadingStreamAsync(ShellStream stream, Func<string, Task> onDataReceived, CancellationToken cancellationToken)
    {
        var buffer = new byte[4096];

        try
        {
            while (!cancellationToken.IsCancellationRequested && stream.CanRead)
            {
                if (stream.DataAvailable)
                {
                    var bytesRead = await stream.ReadAsync(buffer, 0, buffer.Length, cancellationToken);
                    if (bytesRead > 0)
                    {
                        var text = Encoding.UTF8.GetString(buffer, 0, bytesRead);
                        await onDataReceived(text);
                    }
                }
                else
                {
                    await Task.Delay(20, cancellationToken);
                }
            }
        }
        catch (OperationCanceledException)
        {
            // Normal loop cancellation
        }
        catch
        {
            // Stream read end or error
        }
    }

    public async Task SendInputAsync(string connectionId, string data)
    {
        if (_sessions.TryGetValue(connectionId, out var session))
        {
            var bytes = Encoding.UTF8.GetBytes(data);
            await session.Stream.WriteAsync(bytes, 0, bytes.Length);
            await session.Stream.FlushAsync();
        }
    }

    public async Task CloseSessionAsync(string connectionId)
    {
        if (_sessions.TryRemove(connectionId, out var session))
        {
            await session.DisposeAsync();
        }
    }
}
