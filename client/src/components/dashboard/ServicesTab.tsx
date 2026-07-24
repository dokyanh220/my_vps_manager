import React, { useState } from 'react';
import {
  Server,
  Play,
  Square,
} from 'lucide-react';
import type { ServiceItem } from '../../types/vps';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';

export const ServicesTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [services, setServices] = useState<ServiceItem[]>([
    {
      name: 'nginx.service',
      status: 'running',
      port: 80,
      memoryUsage: '42 MB',
      cpuUsage: '0.4%',
      description: 'Nginx High Performance HTTP Web Server and Reverse Proxy',
    },
    {
      name: 'ssh.service',
      status: 'running',
      port: 22,
      memoryUsage: '14 MB',
      cpuUsage: '0.1%',
      description: 'OpenBSD Secure Shell server daemon',
    },
    {
      name: 'docker.service',
      status: 'running',
      memoryUsage: '210 MB',
      cpuUsage: '1.2%',
      description: 'Docker Application Container Engine',
    },
    {
      name: 'postgresql.service',
      status: 'running',
      port: 5432,
      memoryUsage: '380 MB',
      cpuUsage: '0.8%',
      description: 'PostgreSQL Relational Database Management System',
    },
    {
      name: 'redis-server.service',
      status: 'stopped',
      port: 6379,
      memoryUsage: '0 MB',
      cpuUsage: '0.0%',
      description: 'Advanced Key-Value In-Memory Data Store',
    },
    {
      name: 'systemd-journald.service',
      status: 'running',
      memoryUsage: '32 MB',
      cpuUsage: '0.2%',
      description: 'Journal Service Manager for System Logs',
    },
  ]);

  const toggleServiceStatus = (serviceName: string) => {
    setServices((prev) =>
      prev.map((s) => {
        if (s.name === serviceName) {
          const nextStatus = s.status === 'running' ? 'stopped' : 'running';
          return {
            ...s,
            status: nextStatus,
            memoryUsage: nextStatus === 'running' ? '35 MB' : '0 MB',
          };
        }
        return s;
      })
    );
  };

  const filtered = services.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>
              <Server className="w-4 h-4 text-blue-600" />
              Quản lý Dịch vụ Systemd & Background Daemons
            </CardTitle>
            <CardDescription>
              Theo dõi và điều khiển trạng thái các ứng dụng máy chủ trên VPS
            </CardDescription>
          </div>

          <div className="w-full sm:w-64">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm tên dịch vụ (vd: nginx, postgres)..."
              className="h-8 text-xs"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs font-mono-code">
            {filtered.map((svc) => (
              <div
                key={svc.name}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm font-mono-code">
                      {svc.name}
                    </span>
                    <Badge variant={svc.status === 'running' ? 'online' : 'offline'}>
                      {svc.status === 'running' ? 'RUNNING' : 'STOPPED'}
                    </Badge>
                    {svc.port && (
                      <span className="text-[11px] bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-800 px-1.5 py-0.2">
                        :{svc.port}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 font-sans text-xs">{svc.description}</p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right text-[11px] text-slate-500">
                    <div>RAM: <strong className="text-slate-800 dark:text-slate-200">{svc.memoryUsage}</strong></div>
                    <div>CPU: <strong className="text-slate-800 dark:text-slate-200">{svc.cpuUsage}</strong></div>
                  </div>

                  <Button
                    variant={svc.status === 'running' ? 'outline' : 'blue-solid'}
                    size="sm"
                    onClick={() => toggleServiceStatus(svc.name)}
                  >
                    {svc.status === 'running' ? (
                      <>
                        <Square className="w-3 h-3 text-red-500" /> Dừng
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3" /> Khởi chạy
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
