import React, { useState, useRef, useEffect } from 'react';
import * as signalR from '@microsoft/signalr';
import { Terminal as TerminalXterm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import {
  Terminal as TerminalIcon,
  Trash2,
  Zap,
  Radio,
  RefreshCw,
  Power,
  ShieldCheck,
  CornerDownLeft,
} from 'lucide-react';
import type { VpsProfile } from '../../types/vps';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface TerminalTabProps {
  activeProfile: VpsProfile;
}

export const TerminalTab: React.FC<TerminalTabProps> = ({ activeProfile }) => {
  const [terminalStatus, setTerminalStatus] = useState<
    'disconnected' | 'connecting' | 'connected' | 'error'
  >('disconnected');
  const [statusMessage, setStatusMessage] = useState<string>('Chưa kết nối phiên SSH');
  const [inputCmd, setInputCmd] = useState<string>('');

  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<TerminalXterm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  const HUB_URL = import.meta.env.VITE_HUB_URL || 'http://localhost:5141/hubs/terminal';

  // Quick Preset Linux Commands
  const presetCmds = [
    { label: 'Kiểm tra Đĩa (df -h)', cmd: 'df -h /' },
    { label: 'Bộ nhớ (free -m)', cmd: 'free -m' },
    { label: 'Thông số CPU (lscpu)', cmd: 'lscpu | head -n 12' },
    { label: 'Uptime máy chủ', cmd: 'uptime' },
    { label: 'Trạng thái SSHD', cmd: 'systemctl status ssh' },
    { label: 'Docker Container', cmd: 'docker ps' },
    { label: 'Cổng Mạng (netstat)', cmd: 'netstat -tulpn' },
  ];

  // Initialize SignalR Hub Connection and xterm instance
  useEffect(() => {
    if (!activeProfile || !activeProfile.host) {
      setTimeout(() => {
        setTerminalStatus('error');
        setStatusMessage('Chưa nhập Host IP cho máy chủ VPS này.');
      }, 0);
      return;
    }

    let isMounted = true;

    // 1. Initialize xterm.js instance
    const term = new TerminalXterm({
      cursorBlink: true,
      theme: {
        background: '#090d16',
        foreground: '#e2e8f0',
        cursor: '#38bdf8',
        selectionBackground: '#1e3a8a',
        black: '#0f172a',
        red: '#ef4444',
        green: '#10b981',
        yellow: '#f59e0b',
        blue: '#3b82f6',
        magenta: '#ec4899',
        cyan: '#06b6d4',
        white: '#f8fafc',
      },
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 13,
      rows: 24,
      cols: 80,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    if (terminalContainerRef.current) {
      terminalContainerRef.current.innerHTML = '';
      term.open(terminalContainerRef.current);
      fitAddon.fit();
    }

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    term.writeln('\x1b[36m=== Khởi tạo phiên kết nối SignalR Real-Time Terminal ===\x1b[0m');
    term.writeln(`Đang kết nối tới Hub SignalR: \x1b[33m${HUB_URL}\x1b[0m`);
    term.writeln(`VPS Target: \x1b[32m${activeProfile.username}@${activeProfile.host}:${activeProfile.port}\x1b[0m\r\n`);

    // 2. Build SignalR Connection
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL)
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;
    setTimeout(() => {
      setTerminalStatus('connecting');
      setStatusMessage('Đang khởi tạo SignalR connection...');
    }, 0);

    // 3. Register SignalR Events
    connection.on('ReceiveOutput', (outputData: string) => {
      if (xtermRef.current) {
        xtermRef.current.write(outputData);
      }
    });

    connection.on('TerminalStatus', (res: { success: boolean; message: string }) => {
      if (!isMounted) return;
      if (res.success) {
        setTerminalStatus('connected');
        setStatusMessage(res.message);
        if (xtermRef.current) {
          xtermRef.current.writeln(`\r\n\x1b[32m[SignalR Hub] ${res.message}\x1b[0m\r\n`);
        }
      } else {
        setTerminalStatus('error');
        setStatusMessage(res.message);
        if (xtermRef.current) {
          xtermRef.current.writeln(`\r\n\x1b[31m[Lỗi Terminal] ${res.message}\x1b[0m\r\n`);
        }
      }
    });

    connection.onreconnecting((err) => {
      if (!isMounted) return;
      setTerminalStatus('connecting');
      setStatusMessage(`Đang kết nối lại SignalR... (${err?.message || ''})`);
      if (xtermRef.current) {
        xtermRef.current.writeln('\r\n\x1b[33m[SignalR] Đang thử kết nối lại...\x1b[0m\r\n');
      }
    });

    connection.onreconnected(() => {
      if (!isMounted) return;
      setTerminalStatus('connected');
      setStatusMessage('Đã kết nối lại SignalR thành công.');
    });

    connection.onclose(() => {
      if (!isMounted) return;
      setTerminalStatus('disconnected');
      setStatusMessage('Đã đóng phiên kết nối SignalR.');
    });

    // 4. Send Keystrokes on User Key Input
    term.onData((data) => {
      if (connectionRef.current && connectionRef.current.state === signalR.HubConnectionState.Connected) {
        connectionRef.current.invoke('SendInput', data).catch((err) => {
          console.error('Lỗi gửi phím bấm SignalR:', err);
        });
      }
    });

    // 5. Start SignalR Connection & Call ConnectTerminal
    connection
      .start()
      .then(async () => {
        if (!isMounted) return;
        setStatusMessage('SignalR Hub Connected. Đang đăng nhập SSH...');

        const payload = {
          host: activeProfile.host,
          port: Number(activeProfile.port) || 22,
          username: activeProfile.username,
          authType: Number(activeProfile.authType),
          password: activeProfile.password || '',
          privateKey: activeProfile.privateKey || '',
          passphrase: activeProfile.passphrase || '',
        };

        await connection.invoke('ConnectTerminal', payload);
      })
      .catch((err) => {
        if (!isMounted) return;
        setTerminalStatus('error');
        const errStr = err instanceof Error ? err.message : String(err);
        setStatusMessage(`Lỗi kết nối SignalR Hub: ${errStr}`);
        if (xtermRef.current) {
          xtermRef.current.writeln(`\r\n\x1b[31m[Lỗi SignalR Hub] ${errStr}\x1b[0m\r\n`);
          xtermRef.current.writeln('\x1b[33mHãy đảm bảo Backend API Server đang chạy tại http://localhost:5141\x1b[0m\r\n');
        }
      });

    // Handle Window Resize
    const handleResize = () => {
      fitAddonRef.current?.fit();
    };
    window.addEventListener('resize', handleResize);

    // Cleanup on unmount or profile change
    return () => {
      isMounted = false;
      window.removeEventListener('resize', handleResize);

      if (connectionRef.current) {
        if (connectionRef.current.state === signalR.HubConnectionState.Connected) {
          connectionRef.current.invoke('DisconnectTerminal').catch(() => {});
        }
        connectionRef.current.stop().catch(() => {});
      }
      term.dispose();
    };
  }, [activeProfile, HUB_URL]);

  // Handlers
  const sendCommandInput = (cmdText: string) => {
    if (!cmdText) return;
    if (connectionRef.current && connectionRef.current.state === signalR.HubConnectionState.Connected) {
      connectionRef.current.invoke('SendInput', cmdText.endsWith('\r') || cmdText.endsWith('\n') ? cmdText : `${cmdText}\r`).catch((err) => {
        console.error('Lỗi gửi câu lệnh:', err);
      });
      setInputCmd('');
    } else {
      if (xtermRef.current) {
        xtermRef.current.writeln('\r\n\x1b[31m[Chưa kết nối] Vui lòng kết nối SignalR SSH trước khi gửi lệnh.\x1b[0m\r\n');
      }
    }
  };

  const handleClearScreen = () => {
    if (xtermRef.current) {
      xtermRef.current.clear();
    }
  };

  const handleReconnect = () => {
    if (connectionRef.current) {
      connectionRef.current.stop().then(() => {
        setTerminalStatus('connecting');
      });
    }
  };

  const handleDisconnect = () => {
    if (connectionRef.current && connectionRef.current.state === signalR.HubConnectionState.Connected) {
      connectionRef.current.invoke('DisconnectTerminal').catch(() => {});
      connectionRef.current.stop();
      setTerminalStatus('disconnected');
      setStatusMessage('Đã ngắt kết nối SSH Terminal');
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Command Shortcuts Toolbar */}
      <Card>
        <CardHeader className="py-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Lệnh Nhanh VPS (Preset Commands)
          </CardTitle>
          <div className="flex items-center gap-2 text-xs font-mono-code">
            <Radio className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
            <span className="text-slate-500">SignalR Real-Time Stream</span>
          </div>
        </CardHeader>
        <CardContent className="py-3 flex flex-wrap gap-2">
          {presetCmds.map((item, idx) => (
            <Button
              key={idx}
              variant="outline"
              size="sm"
              className="text-xs font-mono-code"
              onClick={() => sendCommandInput(item.cmd)}
              disabled={terminalStatus !== 'connected'}
            >
              {item.label}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Real-time Interactive SignalR Terminal Console */}
      <Card className="border-slate-800 bg-slate-950 text-slate-100 font-mono-code overflow-hidden shadow-md">
        {/* Terminal Header */}
        <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex gap-1.5 mr-1">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <TerminalIcon className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-slate-200">
              SignalR SSH Shell — {activeProfile.username}@{activeProfile.host || 'IP'}:{activeProfile.port}
            </span>
            <Badge
              variant={
                terminalStatus === 'connected'
                  ? 'online'
                  : terminalStatus === 'connecting'
                  ? 'testing'
                  : 'offline'
              }
            >
              {terminalStatus === 'connected'
                ? 'CONNECTED'
                : terminalStatus === 'connecting'
                ? 'CONNECTING'
                : 'DISCONNECTED'}
            </Badge>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white hover:bg-slate-800 h-7 text-xs cursor-pointer"
              onClick={handleClearScreen}
              title="Xoá màn hình terminal"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Xoá màn hình
            </Button>

            {terminalStatus === 'connected' ? (
              <Button
                variant="destructive"
                size="sm"
                className="h-7 text-xs cursor-pointer"
                onClick={handleDisconnect}
                title="Ngắt kết nối phiên SSH"
              >
                <Power className="w-3.5 h-3.5 mr-1" /> Ngắt kết nối
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs cursor-pointer text-blue-400 hover:text-blue-300 border-slate-700"
                onClick={handleReconnect}
                title="Kết nối lại SSH SignalR"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Kết nối lại
              </Button>
            )}
          </div>
        </div>

        {/* Status Bar */}
        <div className="px-4 py-1.5 bg-slate-900/60 border-b border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between font-mono-code">
          <span className="flex items-center gap-1.5 truncate">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Trạng thái: {statusMessage}</span>
          </span>
          <span className="text-slate-500 hidden sm:inline shrink-0">Hub: {HUB_URL}</span>
        </div>

        {/* Real-time VT100 xterm.js Terminal Container */}
        <div className="p-3 bg-[#090d16] min-h-[380px]">
          <div ref={terminalContainerRef} className="w-full h-[380px]" />
        </div>

        {/* Optional Command Input Line */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendCommandInput(inputCmd);
          }}
          className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
        >
          <span className="text-emerald-400 font-bold text-xs shrink-0">
            {activeProfile.username}@{activeProfile.host || 'vps'}:~$
          </span>
          <input
            type="text"
            value={inputCmd}
            onChange={(e) => setInputCmd(e.target.value)}
            placeholder="Gõ lệnh Linux tại đây hoặc tương tác trực tiếp lên con trỏ màn hình trên..."
            className="flex-1 bg-transparent text-white text-xs font-mono-code focus:outline-none placeholder:text-slate-600"
            disabled={terminalStatus !== 'connected'}
          />
          <Button
            type="submit"
            variant="blue-solid"
            size="sm"
            disabled={terminalStatus !== 'connected' || !inputCmd.trim()}
          >
            <CornerDownLeft className="w-3.5 h-3.5" /> Gửi
          </Button>
        </form>
      </Card>
    </div>
  );
};
