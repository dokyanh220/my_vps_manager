import React from 'react';
import {
  RefreshCw,
  Zap,
  Moon,
  Sun,
  Terminal,
  Trash2,
  ServerOff,
  RotateCw,
} from 'lucide-react';
import type { VpsProfile } from '../../types/vps';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface HeaderProps {
  activeProfile?: VpsProfile;
  connectionStatus: 'online' | 'offline' | 'testing' | 'unreachable';
  onTestConnection: () => void;
  onRefreshMetrics: () => void;
  isLoading: boolean;
  autoRefreshInterval: number; // 0 = Off, 5, 10, 30, 60
  setAutoRefreshInterval: (sec: number) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onOpenQuickTerminal: () => void;
  onDeleteProfile?: (id: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeProfile,
  connectionStatus,
  onTestConnection,
  onRefreshMetrics,
  isLoading,
  autoRefreshInterval,
  setAutoRefreshInterval,
  darkMode,
  setDarkMode,
  onOpenQuickTerminal,
  onDeleteProfile,
}) => {
  const isAutoRefreshDisabled =
    !activeProfile || !activeProfile.host || connectionStatus !== 'online' || isLoading;

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 flex items-center justify-between shrink-0 z-20 shadow-2xs">
      {/* Active Server Info */}
      <div className="flex items-center gap-4">
        {activeProfile ? (
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono-code tracking-tight">
                {activeProfile.name}
              </h2>
              <Badge variant={connectionStatus}>
                {connectionStatus === 'online'
                  ? 'ONLINE'
                  : connectionStatus === 'testing'
                  ? 'TESTING'
                  : 'OFFLINE'}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono-code">
              <span>
                <strong className="text-slate-700 dark:text-slate-300">Host:</strong>{' '}
                {activeProfile.username}@{activeProfile.host || 'Chưa nhập IP'}:{activeProfile.port}
              </span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span>
                <strong className="text-slate-700 dark:text-slate-300">Auth:</strong>{' '}
                {activeProfile.authType === 0 ? 'Password' : 'SSH Key'}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-500 text-xs font-mono-code">
            <ServerOff className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Không có máy chủ</span>
          </div>
        )}
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center gap-2.5">
        {activeProfile && (
          <>
            {/* Auto Refresh Select Menu */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2 py-1 border text-xs transition-colors ${
                isAutoRefreshDisabled
                  ? 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 opacity-60'
                  : autoRefreshInterval > 0
                  ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}
            >
              <RotateCw
                className={`w-3.5 h-3.5 ${
                  autoRefreshInterval > 0 && !isAutoRefreshDisabled
                    ? 'animate-spin text-blue-600 dark:text-blue-400'
                    : 'text-slate-400'
                }`}
                style={{
                  animationDuration: autoRefreshInterval > 0 ? `${autoRefreshInterval}s` : undefined,
                }}
              />
              <span className="text-slate-600 dark:text-slate-400 text-[11px] font-semibold whitespace-nowrap">
                Tự làm mới:
              </span>
              <select
                value={autoRefreshInterval}
                onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
                disabled={isAutoRefreshDisabled}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs px-2 py-0.5 font-mono-code focus:outline-none focus:border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                title={
                  connectionStatus !== 'online'
                    ? 'Tự làm mới bị vô hiệu hóa khi VPS chưa kết nối Online'
                    : 'Chọn chu kỳ tự động làm mới'
                }
              >
                <option value={0}>Tắt (Thủ công)</option>
                <option value={5}>5 giây</option>
                <option value={10}>10 giây</option>
                <option value={30}>30 giây</option>
                <option value={60}>60 giây</option>
              </select>
            </div>

            {/* Manual Refresh button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onRefreshMetrics}
              disabled={isLoading || !activeProfile.host}
              title="Làm mới dữ liệu hệ thống ngay lập tức"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
              <span className="hidden md:inline">Làm mới</span>
            </Button>

            {/* Test Connection Button */}
            <Button
              variant="blue-solid"
              size="sm"
              onClick={onTestConnection}
              disabled={isLoading || !activeProfile.host}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Kiểm tra SSH</span>
            </Button>

            {/* Quick Command Terminal Trigger */}
            <Button variant="secondary" size="sm" onClick={onOpenQuickTerminal}>
              <Terminal className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden lg:inline">Terminal</span>
            </Button>

            {/* Delete Profile Action */}
            {onDeleteProfile && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDeleteProfile(activeProfile.id)}
                title="Xóa máy chủ này"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Xóa máy chủ</span>
              </Button>
            )}
          </>
        )}

        {/* Dark Mode Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDarkMode(!darkMode)}
          title={darkMode ? 'Chuyển Chế độ Sáng' : 'Chuyển Chế độ Tối'}
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </Button>
      </div>
    </header>
  );
};
