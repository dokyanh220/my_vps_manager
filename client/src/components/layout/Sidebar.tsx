import React from 'react';
import {
  LayoutDashboard,
  KeyRound,
  Activity,
  Terminal,
  Server,
  FileText,
  ChevronRight,
  ShieldCheck,
  Plus,
  Radio,
  type LucideIcon,
} from 'lucide-react';
import type { VpsProfile } from '../../types/vps';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';

export type ActiveTab = 'overview' | 'ssh-config' | 'metrics' | 'terminal' | 'services' | 'logs';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  vpsProfiles: VpsProfile[];
  activeProfileId: string;
  onSelectProfile: (id: string) => void;
  onAddNewVps: () => void;
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
  connectionStatus: 'online' | 'offline' | 'testing' | 'unreachable';
}

interface MenuItem {
  id: ActiveTab;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  vpsProfiles,
  activeProfileId,
  onSelectProfile,
  onAddNewVps,
  collapsed,
  setCollapsed,
  connectionStatus,
}) => {
  const menuItems: MenuItem[] = [
    { id: 'overview', label: 'Tổng quan Hệ thống', icon: LayoutDashboard, badge: 'Main' },
    { id: 'ssh-config', label: 'Cấu hình SSH & Key', icon: KeyRound },
    { id: 'metrics', label: 'Đo đạc Tài nguyên', icon: Activity, badge: 'Live' },
    { id: 'terminal', label: 'SSH Terminal Console', icon: Terminal },
    { id: 'services', label: 'Quản lý Dịch vụ', icon: Server },
    { id: 'logs', label: 'Nhật ký System Logs', icon: FileText },
  ];

  return (
    <aside
      className={cn(
        'bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col transition-all duration-300 z-30 select-none shrink-0',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Brand & Logo Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800 bg-slate-950/80">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-700 text-white flex items-center justify-center font-bold text-lg border border-blue-500 shadow-xs">
              <Server className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-white tracking-wide leading-none flex items-center gap-1.5">
                VPS MANAGER
                <span className="text-[10px] bg-blue-900 text-blue-300 border border-blue-700 px-1 py-0.2 uppercase">v1.0</span>
              </h1>
              <p className="text-[11px] text-slate-400 mt-0.5">Control Panel & Metrics</p>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="w-8 h-8 bg-blue-700 text-white flex items-center justify-center font-bold text-base border border-blue-500 mx-auto">
            <Server className="w-4 h-4" />
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700 cursor-pointer"
          title={collapsed ? 'Mở rộng Menu' : 'Thu gọn Menu'}
        >
          <ChevronRight className={cn('w-4 h-4 transition-transform duration-200', !collapsed && 'rotate-180')} />
        </button>
      </div>

      {/* VPS Server Selector Presets */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/40">
        {!collapsed ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
              <span>Máy chủ VPS ({vpsProfiles.length})</span>
              <button
                onClick={onAddNewVps}
                className="text-blue-400 hover:text-blue-300 flex items-center gap-0.5 text-[11px] hover:underline cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Thêm
              </button>
            </div>
            <select
              value={activeProfileId}
              onChange={(e) => onSelectProfile(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-mono-code cursor-pointer"
            >
              {vpsProfiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.host})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <button
            onClick={onAddNewVps}
            className="w-9 h-9 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-blue-400 flex items-center justify-center mx-auto cursor-pointer"
            title="Thêm Máy chủ"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Navigation Items */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {!collapsed && (
          <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Phân hệ Quản trị
          </div>
        )}

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 text-xs font-medium border transition-all text-left group cursor-pointer',
                isActive
                  ? 'bg-blue-900/60 text-white border-blue-600 border-l-4 border-l-blue-400 shadow-xs'
                  : 'text-slate-300 border-transparent hover:bg-slate-800/80 hover:text-white hover:border-slate-700'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200')} />
              {!collapsed && (
                <div className="flex items-center justify-between flex-1">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-1 py-0.2 font-mono-code">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Status Card */}
      {!collapsed ? (
        <div className="p-3 border-t border-slate-800 bg-slate-950/90 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
              <Radio className="w-3 h-3 text-blue-400" /> Trạng thái SSH
            </span>
            <Badge variant={connectionStatus}>
              {connectionStatus === 'online' ? 'Đã kết nối' : connectionStatus === 'testing' ? 'Đang thử' : 'Ngoại tuyến'}
            </Badge>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-2 space-y-1 font-mono-code text-[11px] text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">Bảo mật:</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> SSH Ed25519
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Engine:</span>
              <span className="text-blue-300">SSH.NET C#</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-2 border-t border-slate-800 bg-slate-950 flex justify-center">
          <div className={cn('w-2.5 h-2.5 rounded-full', connectionStatus === 'online' ? 'bg-emerald-500' : 'bg-red-500')} />
        </div>
      )}
    </aside>
  );
};
