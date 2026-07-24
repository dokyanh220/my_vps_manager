import React from 'react';
import {
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { VpsSystemInfoResponseDto, MetricHistoryPoint } from '../../types/vps';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { formatBytes } from '../../lib/utils';

interface MetricsTabProps {
  systemInfo: VpsSystemInfoResponseDto | null;
  history: MetricHistoryPoint[];
}

export const MetricsTab: React.FC<MetricsTabProps> = ({ systemInfo, history }) => {
  return (
    <div className="space-y-6">
      {/* Top Realtime Summary Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-600">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Tải CPU Hiện tại</span>
              <div className="text-2xl font-bold font-mono-code text-slate-900 dark:text-slate-100 mt-1">
                {history.length > 0 ? `${history[history.length - 1].cpuUsage.toFixed(1)}%` : '0%'}
              </div>
            </div>
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center border border-blue-200 dark:border-blue-800">
              <Cpu className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">RAM Đã Dùng</span>
              <div className="text-2xl font-bold font-mono-code text-slate-900 dark:text-slate-100 mt-1">
                {systemInfo ? `${systemInfo.memory.usagePercentage}%` : '0%'}
              </div>
              <span className="text-[11px] text-slate-500 font-mono-code">
                {systemInfo ? formatBytes(systemInfo.memory.usedBytes) : '0 GB'}
              </span>
            </div>
            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
              <Activity className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-600">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Dung lượng Disk</span>
              <div className="text-2xl font-bold font-mono-code text-slate-900 dark:text-slate-100 mt-1">
                {systemInfo ? `${systemInfo.disk.usagePercentage}%` : '0%'}
              </div>
              <span className="text-[11px] text-slate-500 font-mono-code">
                {systemInfo ? formatBytes(systemInfo.disk.usedBytes) : '0 GB'}
              </span>
            </div>
            <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center border border-amber-200 dark:border-amber-800">
              <HardDrive className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-600">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Băng thông Network</span>
              <div className="text-xl font-bold font-mono-code text-slate-900 dark:text-slate-100 mt-1 flex items-center gap-1.5">
                <span className="text-emerald-600 flex items-center text-xs">
                  <ArrowDownLeft className="w-3.5 h-3.5" /> 1.2 MB/s
                </span>
                <span className="text-blue-600 flex items-center text-xs">
                  <ArrowUpRight className="w-3.5 h-3.5" /> 450 KB/s
                </span>
              </div>
            </div>
            <div className="w-10 h-10 bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center border border-purple-200 dark:border-purple-800">
              <Wifi className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU Chart */}
        <Card>
          <CardHeader>
            <CardTitle>
              <Cpu className="w-4 h-4 text-blue-600" />
              Biến động Tải CPU (%)
            </CardTitle>
            <CardDescription>Theo dõi chu kỳ tải theo thời gian thực</CardDescription>
          </CardHeader>
          <CardContent className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    color: '#f8fafc',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                />
                <Area type="monotone" dataKey="cpuUsage" name="CPU Usage %" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#cpuGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* RAM Chart */}
        <Card>
          <CardHeader>
            <CardTitle>
              <Activity className="w-4 h-4 text-emerald-600" />
              Sử dụng Bộ nhớ RAM (%)
            </CardTitle>
            <CardDescription>Phân bổ dung lượng RAM hệ thống</CardDescription>
          </CardHeader>
          <CardContent className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="ramGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    color: '#f8fafc',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                />
                <Area type="monotone" dataKey="ramUsage" name="RAM Usage %" stroke="#059669" strokeWidth={2} fillOpacity={1} fill="url(#ramGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Resource Alerts & System Limits Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Nhật ký Ngưỡng Giới hạn Tài nguyên (Threshold Alerts)
          </CardTitle>
          <CardDescription>Lịch sử các sự kiện tài nguyên chạm ngưỡng 80%</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs font-mono-code">
            {[
              { time: '08:05:12', type: 'CPU Peak', detail: 'Tiến trình mysqld tăng đột biến 84% trong 12 giây', level: 'WARNING' },
              { time: '07:42:00', type: 'Disk IO', detail: 'Thao tác backup đĩa ghi 140MB/s thành công', level: 'INFO' },
              { time: '06:15:33', type: 'RAM Notice', detail: 'Hệ thống tự dọn bộ nhớ Cache Buffer', level: 'NORMAL' },
            ].map((alert, i) => (
              <div key={i} className="px-5 py-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">{alert.time}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-sans">{alert.type}:</span>
                  <span className="text-slate-600 dark:text-slate-400 font-sans">{alert.detail}</span>
                </div>
                <Badge variant={alert.level === 'WARNING' ? 'warning' : 'blue'}>{alert.level}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
