import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Clipboard,
  Copy,
  Info,
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

  // Function to establish or re-establish SignalR Terminal Session
  const connectSession = useCallback(async () => {
    if (!activeProfile || !activeProfile.host) {
      setTerminalStatus('error');
      setStatusMessage('Chưa nhập Host IP cho máy chủ VPS này.');
      return;
    }

    // Close existing connection if active
    if (connectionRef.current) {
      try {
        if (connectionRef.current.state === signalR.HubConnectionState.Connected) {
          await connectionRef.current.invoke('DisconnectTerminal').catch(() => {});
        }
        await connectionRef.current.stop().catch(() => {});
      } catch {
        // ignore
      }
      connectionRef.current = null;
    }

    setTerminalStatus('connecting');
    setStatusMessage('Đang kết nối tới Hub SignalR...');

    if (xtermRef.current) {
      xtermRef.current.writeln('\r\n\x1b[36m=== Khởi tạo kết nối SignalR SSH Terminal ===\x1b[0m');
      xtermRef.current.writeln(`SignalR Hub: \x1b[33m${HUB_URL}\x1b[0m`);
      xtermRef.current.writeln(`VPS Target: \x1b[32m${activeProfile.username}@${activeProfile.host}:${activeProfile.port}\x1b[0m\r\n`);
    }

    // Build SignalR Hub Connection
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL)
      .configureLogging(signalR.LogLevel.Warning)
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;

    // SignalR Event Handlers
    connection.on('ReceiveOutput', (outputData: string) => {
      if (xtermRef.current) {
        xtermRef.current.write(outputData);
      }
    });

    connection.on('TerminalStatus', (res: { success: boolean; message: string }) => {
      if (res.success) {
        setTerminalStatus('connected');
        setStatusMessage(res.message);
        if (xtermRef.current) {
          xtermRef.current.writeln(`\r\n\x1b[32m[SignalR Hub] ${res.message}\x1b[0m\r\n`);
          xtermRef.current.focus();
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
      setTerminalStatus('connecting');
      setStatusMessage(`Đang kết nối lại SignalR... (${err?.message || ''})`);
      if (xtermRef.current) {
        xtermRef.current.writeln('\r\n\x1b[33m[SignalR] Đang tự động kết nối lại...\x1b[0m\r\n');
      }
    });

    connection.onreconnected(() => {
      setTerminalStatus('connected');
      setStatusMessage('Đã kết nối lại SignalR thành công.');
      xtermRef.current?.focus();
    });

    connection.onclose(() => {
      setTerminalStatus('disconnected');
      setStatusMessage('Đã ngắt phiên kết nối SignalR.');
    });

    // Start Connection and Invoke ConnectTerminal
    try {
      await connection.start();
      setStatusMessage('Đã kết nối SignalR. Đang khởi tạo SSH Shell...');

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
    } catch (err) {
      setTerminalStatus('error');
      const errStr = err instanceof Error ? err.message : String(err);
      setStatusMessage(`Lỗi kết nối SignalR Hub: ${errStr}`);
      if (xtermRef.current) {
        xtermRef.current.writeln(`\r\n\x1b[31m[Lỗi kết nối] ${errStr}\x1b[0m\r\n`);
        xtermRef.current.writeln('\x1b[33mVui lòng kiểm tra lại Backend API Server (http://localhost:5141)\x1b[0m\r\n');
      }
    }
  }, [activeProfile, HUB_URL]);

  // Mount Effect for xterm.js instance and Initial Connection
  useEffect(() => {
    if (!activeProfile || !activeProfile.host) {
      setTimeout(() => {
        setTerminalStatus('error');
        setStatusMessage('Chưa nhập Host IP cho máy chủ VPS này.');
      }, 0);
      return;
    }

    // 1. Create xterm.js instance (Native Shell Configuration)
    const term = new TerminalXterm({
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 5000,
      rightClickSelectsWord: true,
      theme: {
        background: '#0a0e17',
        foreground: '#e2e8f0',
        cursor: '#38bdf8',
        cursorAccent: '#0a0e17',
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
      fontFamily: 'Consolas, Monaco, "Courier New", monospace',
      fontSize: 13.5,
      lineHeight: 1.2,
      letterSpacing: 0,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    if (terminalContainerRef.current) {
      terminalContainerRef.current.innerHTML = '';
      term.open(terminalContainerRef.current);
      fitAddon.fit();
      term.focus();
    }

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // 2. Attach Custom Key Handler for smart Copy without browser shortcut conflicts
    term.attachCustomKeyEventHandler((e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && e.type === 'keydown') {
        const selection = term.getSelection();
        if (selection) {
          // Copy selected text to clipboard
          navigator.clipboard.writeText(selection);
          return false; // Prevent sending SIGINT \x03 when copying
        }
        // Send SIGINT \x03 interrupt signal to Linux shell when no selection
        return true;
      }

      return true;
    });

    // 3. Forward ALL Keystrokes (including Tab autocompletion \t, Arrows, Enter, Backspace) directly to SignalR
    term.onData((data) => {
      if (connectionRef.current && connectionRef.current.state === signalR.HubConnectionState.Connected) {
        connectionRef.current.invoke('SendInput', data).catch((err) => {
          console.error('Lỗi gửi phím bấm SignalR:', err);
        });
      }
    });

    // 3. Trigger Initial Connection
    const initTimer = setTimeout(() => {
      connectSession();
    }, 0);

    // Resize Handler
    const handleResize = () => {
      fitAddonRef.current?.fit();
    };
    window.addEventListener('resize', handleResize);

    // Cleanup on unmount or profile change
    return () => {
      clearTimeout(initTimer);
      window.removeEventListener('resize', handleResize);

      if (connectionRef.current) {
        if (connectionRef.current.state === signalR.HubConnectionState.Connected) {
          connectionRef.current.invoke('DisconnectTerminal').catch(() => {});
        }
        connectionRef.current.stop().catch(() => {});
        connectionRef.current = null;
      }
      term.dispose();
    };
  }, [activeProfile, connectSession]);

  // Focus terminal when clicking anywhere inside terminal canvas
  const handleFocusTerminal = () => {
    xtermRef.current?.focus();
  };

  // Handle Right-click Context Menu for Native Copy / Auto-Paste
  const handleContextMenu = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!xtermRef.current) return;

    const selection = xtermRef.current.getSelection();
    if (selection) {
      // If user highlighted text, copy it to clipboard
      try {
        await navigator.clipboard.writeText(selection);
        xtermRef.current.clearSelection();
      } catch (err) {
        console.error('Lỗi sao chép văn bản:', err);
      }
    } else {
      // Otherwise, paste text from clipboard directly to SSH Terminal
      try {
        const text = await navigator.clipboard.readText();
        if (text && connectionRef.current && connectionRef.current.state === signalR.HubConnectionState.Connected) {
          connectionRef.current.invoke('SendInput', text);
        }
      } catch (err) {
        console.error('Lỗi dán từ clipboard:', err);
      }
    }
  };

  // Manual Paste Button Handler
  const handlePasteFromClipboard = async () => {
    if (!connectionRef.current || connectionRef.current.state !== signalR.HubConnectionState.Connected) return;
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        connectionRef.current.invoke('SendInput', text);
        xtermRef.current?.focus();
      }
    } catch (err) {
      console.error('Lỗi dán từ bộ nhớ tạm:', err);
    }
  };

  // Copy Selected Text Button Handler
  const handleCopySelection = async () => {
    if (!xtermRef.current) return;
    const selection = xtermRef.current.getSelection();
    if (selection) {
      try {
        await navigator.clipboard.writeText(selection);
      } catch {
        // ignore
      }
    }
  };

  // Handlers
  const sendPresetCommand = (cmdText: string) => {
    if (!cmdText) return;
    if (connectionRef.current && connectionRef.current.state === signalR.HubConnectionState.Connected) {
      const fullCmd = cmdText.endsWith('\r') || cmdText.endsWith('\n') ? cmdText : `${cmdText}\r`;
      connectionRef.current.invoke('SendInput', fullCmd).catch((err) => {
        console.error('Lỗi gửi lệnh preset:', err);
      });
      xtermRef.current?.focus();
    } else {
      if (xtermRef.current) {
        xtermRef.current.writeln('\r\n\x1b[31m[Chưa kết nối] Bấm "Kết nối lại" để khởi chạy phiên SSH.\x1b[0m\r\n');
      }
    }
  };

  const handleClearScreen = () => {
    if (xtermRef.current) {
      xtermRef.current.clear();
      xtermRef.current.focus();
    }
  };

  const handleReconnect = () => {
    connectSession();
  };

  const handleDisconnect = async () => {
    if (connectionRef.current) {
      try {
        if (connectionRef.current.state === signalR.HubConnectionState.Connected) {
          await connectionRef.current.invoke('DisconnectTerminal').catch(() => {});
        }
        await connectionRef.current.stop();
      } catch {
        // ignore
      }
      connectionRef.current = null;
      setTerminalStatus('disconnected');
      setStatusMessage('Đã ngắt kết nối phiên SSH Terminal.');
      if (xtermRef.current) {
        xtermRef.current.writeln('\r\n\x1b[33m[Hệ thống] Đã ngắt kết nối SSH Terminal.\x1b[0m\r\n');
      }
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
            <span className="text-slate-500">SignalR Real-Time PTY</span>
          </div>
        </CardHeader>
        <CardContent className="py-3 flex flex-wrap gap-2">
          {presetCmds.map((item, idx) => (
            <Button
              key={idx}
              variant="outline"
              size="sm"
              className="text-xs font-mono-code"
              onClick={() => sendPresetCommand(item.cmd)}
              disabled={terminalStatus !== 'connected'}
            >
              {item.label}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Full-Screen Native-style Terminal Window */}
      <Card className="border-slate-800 bg-[#0a0e17] text-slate-100 font-mono-code overflow-hidden shadow-2xl">
        {/* Terminal Titlebar (Window Chrome) */}
        <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            {/* macOS Window Controls */}
            <div className="flex gap-1.5 mr-1">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block hover:opacity-100 transition-opacity cursor-pointer" onClick={handleDisconnect} title="Đóng phiên SSH" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block hover:opacity-100 transition-opacity cursor-pointer" onClick={handleClearScreen} title="Clear terminal" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block hover:opacity-100 transition-opacity cursor-pointer" onClick={handleFocusTerminal} title="Focus terminal" />
            </div>
            <TerminalIcon className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-slate-200 tracking-wide">
              {activeProfile.username}@{activeProfile.host || 'IP'}:{activeProfile.port} — Native SSH Shell
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
                ? 'ONLINE'
                : terminalStatus === 'connecting'
                ? 'CONNECTING'
                : 'OFFLINE'}
            </Badge>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-slate-300 hover:text-white bg-slate-800 border-slate-700 h-7 text-xs cursor-pointer font-medium"
              onClick={handleCopySelection}
              title="Sao chép phần văn bản đang bôi đen"
            >
              <Copy className="w-3.5 h-3.5 mr-1 text-slate-400" /> Sao chép
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="text-slate-300 hover:text-white bg-slate-800 border-slate-700 h-7 text-xs cursor-pointer font-medium"
              onClick={handlePasteFromClipboard}
              disabled={terminalStatus !== 'connected'}
              title="Dán dữ liệu từ bộ nhớ tạm (Clipboard) vào Terminal"
            >
              <Clipboard className="w-3.5 h-3.5 mr-1 text-blue-400" /> Dán
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white hover:bg-slate-800 h-7 text-xs cursor-pointer"
              onClick={handleClearScreen}
              title="Xoá màn hình terminal (Ctrl+L)"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear
            </Button>

            {terminalStatus === 'connected' ? (
              <Button
                variant="destructive"
                size="sm"
                className="h-7 text-xs cursor-pointer font-medium"
                onClick={handleDisconnect}
                title="Ngắt kết nối phiên SSH"
              >
                <Power className="w-3.5 h-3.5 mr-1" /> Ngắt kết nối
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs cursor-pointer text-blue-400 hover:text-blue-300 border-slate-700 font-medium"
                onClick={handleReconnect}
                disabled={terminalStatus === 'connecting'}
                title="Tái kết nối SignalR SSH PTY"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1 ${terminalStatus === 'connecting' ? 'animate-spin' : ''}`} />
                {terminalStatus === 'connecting' ? 'Đang kết nối...' : 'Kết nối lại'}
              </Button>
            )}
          </div>
        </div>

        {/* Status Bar Header */}
        <div className="px-4 py-1.5 bg-slate-950/80 border-b border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between font-mono-code">
          <span className="flex items-center gap-1.5 truncate">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Trạng thái: {statusMessage}</span>
          </span>
          <span className="text-slate-400 hidden lg:flex items-center gap-1 shrink-0">
            <Info className="w-3 h-3 text-blue-400" />
            <span>Sao chép: Quét chọn & Ctrl+C / Cmd+C | Dán: Ctrl+V / Cmd+V hoặc Chuột phải</span>
          </span>
        </div>

        {/* Pure Native Interactive Terminal Screen (xterm.js Canvas Container) */}
        <div
          onClick={handleFocusTerminal}
          onContextMenu={handleContextMenu}
          className="p-4 bg-[#0a0e17] cursor-text min-h-[480px] flex flex-col justify-between"
          title="Bấm hoặc Click Chuột phải để Sao Chép / Dán vào Terminal"
        >
          <div ref={terminalContainerRef} className="w-full flex-1 h-[480px]" />
        </div>
      </Card>
    </div>
  );
};
