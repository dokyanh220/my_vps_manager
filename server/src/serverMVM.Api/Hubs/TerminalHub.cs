using Microsoft.AspNetCore.SignalR;
using serverMVM.Application.DTOs;
using serverMVM.Application.Interfaces;

namespace serverMVM.Api.Hubs;

public class TerminalHub : Hub
{
    private readonly ISshTerminalManager _terminalManager;
    private readonly IHubContext<TerminalHub> _hubContext;

    public TerminalHub(ISshTerminalManager terminalManager, IHubContext<TerminalHub> hubContext)
    {
        _terminalManager = terminalManager;
        _hubContext = hubContext;
    }

    /// <summary>
    /// Mở phiên kết nối Terminal SSH thời gian thực cho WebSocket client này
    /// </summary>
    public async Task ConnectTerminal(SshConnectionRequestDto request)
    {
        var connectionId = Context.ConnectionId;

        var isConnected = await _terminalManager.CreateSessionAsync(connectionId, request, async (outputData) =>
        {
            await _hubContext.Clients.Client(connectionId).SendAsync("ReceiveOutput", outputData);
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

    /// <summary>
    /// Gửi ký tự / phím gõ / câu lệnh từ client tới phiên SSH shell
    /// </summary>
    public async Task SendInput(string data)
    {
        await _terminalManager.SendInputAsync(Context.ConnectionId, data);
    }

    /// <summary>
    /// Ngắt kết nối Terminal SSH chủ động
    /// </summary>
    public async Task DisconnectTerminal()
    {
        await _terminalManager.CloseSessionAsync(Context.ConnectionId);
        await Clients.Caller.SendAsync("TerminalStatus", new { success = false, message = "Đã ngắt kết nối Terminal SSH." });
    }

    /// <summary>
    /// Tự động đóng phiên SSH khi SignalR Client bị ngắt kết nối WebSocket
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await _terminalManager.CloseSessionAsync(Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }
}
