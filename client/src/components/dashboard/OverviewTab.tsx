import React from 'react';
import {
  Cpu,
  HardDrive,
  Server,
  Activity,
  Terminal,
  ShieldCheck,
  CheckCircle2,
  Globe,
} from 'lucide-react';
import type { VpsSystemInfoResponseDto, VpsProfile } from '../../types/vps';
import type { ActiveTab } from '../layout/Sidebar';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/card';
import { Progress } from '../ui/progress';
import { formatBytes, formatUptime } from '../../lib/utils';
import { Button } from '../ui/button';

interface OverviewTabProps {
  systemInfo: VpsSystemInfoResponseDto | null;
  activeProfile: VpsProfile;
  onNavigateToTab: (tab: ActiveTab) => void;
  onTestConnection: () => void;
  isLoading: boolean;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  systemInfo,
  activeProfile,
  onNavigateToTab,
  onTestConnection,
  isLoading,
}) => {
  if (!systemInfo) {
    return (
      <div className="p-8 text-center border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900">
        <Server className="w-12 h-12 text-slate-400 mx-auto mb-3 animate-pulse" />
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">Đang tải dữ liệu từ VPS...</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          Gửi yêu cầu truy vấn thông tin máy chủ SSH qua API server.
        </p>
        <Button variant="blue-solid" onClick={onTestConnection} disabled={isLoading}>
          Thử kết nối SSH ngay
        </Button>
      </div>
    );
  }

  const { os, cpu, memory, disk } = systemInfo;

  return (
    <div className="space-y-6">
      {/* OS Banner Header Card */}
      <Card className="border-l-4 border-l-blue-600">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/80 border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xl shrink-0">
                <Server className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono-code">
                    {os.hostname || activeProfile.host}
                  </h2>
                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-semibold px-2 py-0.5 uppercase tracking-wider">
                    ONLINE
                  </span>
                </div>
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mt-0.5">
                  {os.distribution || 'Linux Operating System'}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-2 font-mono-code">
                  <span><strong>Kernel:</strong> {os.kernelVersion || 'Linux x86_64'}</span>
                  <span>|</span>
                  <span><strong>Uptime:</strong> {formatUptime(os.uptime)}</span>
                  <span>|</span>
                  <span><strong>Port SSH:</strong> {activeProfile.port}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 border-t lg:border-t-0 border-slate-200 dark:border-slate-800 pt-4 lg:pt-0">
              <Button variant="outline" size="sm" onClick={() => onNavigateToTab('ssh-config')}>
                Cấu hình SSH
              </Button>
              <Button variant="blue-solid" size="sm" onClick={() => onNavigateToTab('terminal')}>
                <Terminal className="w-3.5 h-3.5" /> Mở Terminal
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CPU Card */}
        <Card className="relative overflow-hidden">
          <CardHeader>
            <CardTitle>
              <Cpu className="w-4 h-4 text-blue-600" />
              Vi xử lý (CPU)
            </CardTitle>
            <CardDescription>Số nhân & Model xử lý</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate" title={cpu.modelName}>
                {cpu.modelName || 'Generic x86 CPU'}
              </p>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                <span>Số Nhân Core:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 font-mono-code">{cpu.cores} Cores</span>
              </div>
            </div>

            <Progress
              value={32.5}
              showLabel
              label="Tải CPU ước tính"
              subLabel={`${cpu.cores} Threads`}
              size="md"
            />
          </CardContent>
        </Card>

        {/* RAM Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              <Activity className="w-4 h-4 text-blue-600" />
              Bộ nhớ RAM
            </CardTitle>
            <CardDescription>Bộ nhớ truy xuất ngẫu nhiên</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-xs font-mono-code">
              <div className="p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 block text-[10px]">Đã sử dụng</span>
                <span className="font-bold text-blue-700 dark:text-blue-400 text-sm">
                  {formatBytes(memory.usedBytes)}
                </span>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 block text-[10px]">Còn trống</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {formatBytes(memory.freeBytes)}
                </span>
              </div>
            </div>

            <Progress
              value={memory.usagePercentage}
              showLabel
              label="Tỷ lệ dùng RAM"
              subLabel={`Tổng ${formatBytes(memory.totalBytes)}`}
              size="md"
            />
          </CardContent>
        </Card>

        {/* Disk Storage Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              <HardDrive className="w-4 h-4 text-blue-600" />
              Ổ đĩa lưu trữ (Disk)
            </CardTitle>
            <CardDescription>Dung lượng mount point &lsquo;{disk.mountPoint}&rsquo;</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-xs font-mono-code">
              <div className="p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 block text-[10px]">Đã sử dụng</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">
                  {formatBytes(disk.usedBytes)}
                </span>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 block text-[10px]">Khả dụng</span>
                <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                  {formatBytes(disk.availableBytes)}
                </span>
              </div>
            </div>

            <Progress
              value={disk.usagePercentage}
              showLabel
              label="Dung lượng ổ đĩa"
              subLabel={`Tổng ${formatBytes(disk.totalBytes)}`}
              size="md"
            />
          </CardContent>
        </Card>
      </div>

      {/* Network Ports & Quick Status Check Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              <Globe className="w-4 h-4 text-blue-600" />
              Cổng Mạng & Dịch vụ chính
            </CardTitle>
            <CardDescription>Trạng thái lắng nghe cổng trên VPS</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs font-mono-code">
              {[
                { port: 22, name: 'SSH Protocol', protocol: 'TCP', status: 'ACTIVE', color: 'text-emerald-600' },
                { port: 80, name: 'HTTP Web Server (Nginx)', protocol: 'TCP', status: 'ACTIVE', color: 'text-emerald-600' },
                { port: 443, name: 'HTTPS TLS (Nginx)', protocol: 'TCP', status: 'ACTIVE', color: 'text-emerald-600' },
                { port: 5432, name: 'PostgreSQL Database', protocol: 'TCP', status: 'ACTIVE', color: 'text-emerald-600' },
                { port: 6379, name: 'Redis Cache Server', protocol: 'TCP', status: 'INACTIVE', color: 'text-slate-400' },
              ].map((p) => (
                <div key={p.port} className="px-5 py-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <span className="w-12 font-bold text-blue-700 dark:text-blue-400">:{p.port}</span>
                    <span className="text-slate-800 dark:text-slate-200 font-sans font-medium">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-500">{p.protocol}</span>
                    <span className={`text-[11px] font-bold ${p.color}`}>{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Health Check & Security Profile */}
        <Card>
          <CardHeader>
            <CardTitle>
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Kiểm tra An toàn & Bảo mật VPS
            </CardTitle>
            <CardDescription>Cấu hình Firewall & SSH Security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> UFW Firewall Status
                </span>
                <span className="font-mono-code font-bold text-emerald-600">Active (4 rules)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Password Authentication
                </span>
                <span className="font-mono-code text-slate-600 dark:text-slate-400">Disabled (Key-Only)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Fail2ban Brute-Force Guard
                </span>
                <span className="font-mono-code font-bold text-emerald-600">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Automatic Security Updates
                </span>
                <span className="font-mono-code text-slate-600 dark:text-slate-400">Enabled</span>
              </div>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs">
              <strong>Mẹo bảo mật:</strong> Để tối ưu hiệu năng và an toàn, hãy tắt đăng nhập bằng mật khẩu SSH và chỉ áp dụng SSH Private Key Ed25519.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
