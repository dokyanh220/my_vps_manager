import React, { useState } from 'react';
import {
  FileText,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SSH';
  source: string;
  message: string;
}

export const LogsTab: React.FC = () => {
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [logs] = useState<LogEntry[]>([
    {
      id: '1',
      timestamp: '2026-07-24 08:10:22',
      level: 'SSH',
      source: 'sshd[892]',
      message: 'Accepted publickey for root from 113.161.45.12 port 52310 ssh2: ED25519',
    },
    {
      id: '2',
      timestamp: '2026-07-24 08:05:00',
      level: 'INFO',
      source: 'systemd[1]',
      message: 'Started Nginx HTTP Server background worker process.',
    },
    {
      id: '3',
      timestamp: '2026-07-24 07:55:18',
      level: 'WARN',
      source: 'kernel',
      message: 'Memory buffer threshold crossed 75%. Triggering automatic slab cleanup.',
    },
    {
      id: '4',
      timestamp: '2026-07-24 07:30:11',
      level: 'SSH',
      source: 'sshd[892]',
      message: 'Failed password for invalid user admin from 185.220.101.4 port 41200 ssh2',
    },
    {
      id: '5',
      timestamp: '2026-07-24 06:14:02',
      level: 'INFO',
      source: 'cron[104]',
      message: 'Executed hourly system metric cleanup script successfully.',
    },
  ]);

  const filteredLogs = logs.filter((log) => {
    const matchLevel = filterLevel === 'ALL' || log.level === filterLevel;
    const matchText =
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.source.toLowerCase().includes(searchTerm.toLowerCase());
    return matchLevel && matchText;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle>
              <FileText className="w-4 h-4 text-blue-600" />
              Nhật ký Hệ thống System Logs & SSH Audit
            </CardTitle>
            <CardDescription>Trích xuất nhật ký thực thi `/var/log/syslog` & `auth.log`</CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 text-xs">
              {['ALL', 'SSH', 'INFO', 'WARN', 'ERROR'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setFilterLevel(lvl)}
                  className={`px-2.5 py-1 text-xs font-mono-code cursor-pointer ${
                    filterLevel === lvl
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            <div className="w-48">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm nội dung log..."
                className="h-8 text-xs"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y divide-slate-200 dark:divide-slate-800 font-mono-code text-xs">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-3.5 flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <span className="text-slate-400 text-[11px] shrink-0">{log.timestamp}</span>
                <span className="shrink-0">
                  <Badge
                    variant={
                      log.level === 'SSH'
                        ? 'blue'
                        : log.level === 'WARN'
                        ? 'warning'
                        : log.level === 'ERROR'
                        ? 'offline'
                        : 'neutral'
                    }
                  >
                    {log.level}
                  </Badge>
                </span>
                <span className="text-blue-700 dark:text-blue-400 font-bold shrink-0 font-mono-code">
                  [{log.source}]
                </span>
                <span className="text-slate-800 dark:text-slate-200 font-sans leading-relaxed">
                  {log.message}
                </span>
              </div>
            ))}

            {filteredLogs.length === 0 && (
              <div className="p-8 text-center text-slate-500 font-sans">
                Không tìm thấy nhật ký thỏa mãn bộ lọc.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
