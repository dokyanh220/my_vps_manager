using Microsoft.AspNetCore.SignalR;
using serverMVM.Application.DTOs;
using serverMVM.Application.Interfaces;

namespace serverMVM.Api.Hubs;

public class TerminalHub : Hub
{
    private readonly ISshTerminalManager _terminalManager;

    public TerminalHub(ISshTerminalManager terminalManager)
    {
        _terminalManager = terminalManager;
    }

    public async Task ConnectTerminal(SshConnectionRequestDto request)
    {
        var connectionId = Context.ConnectionId;

        var isConnected = await _terminalManager.CreateSessionAsync(connectionId, request, async (outputData) =>
        {
            await Clients.Client(connectionId).SendAsync("ReceiveOutput", outputData);
        });

        if (isConnected)
        {
            await Clients.Caller.SendAsync("TerminalStatus", new { success = true, message = "Kết nối Terminal SSH thành công!" });
        }
        else
        {
            await Clients.Caller.SendAsync("TerminalStatus", new { success = false, message = "Không thể kết nối SSH tới VPS." });
        }
    }

    public async Task SendInput(string data)
    {
        await _terminalManager.SendInputAsync(Context.ConnectionId, data);
    }

    public async Task DisconnectTerminal()
    {
        await _terminalManager.CloseSessionAsync(Context.ConnectionId);
        await Clients.Caller.SendAsync("TerminalStatus", new { success = false, message = "Đã ngắt kết nối Terminal SSH." });
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await _terminalManager.CloseSessionAsync(Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }
}
