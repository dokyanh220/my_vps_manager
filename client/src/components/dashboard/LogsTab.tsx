import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  ShieldAlert,
  RefreshCw,
  Search,
  Filter,
  ListFilter,
  Key,
  AlertTriangle,
  FileSearch,
  Terminal,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
} from 'lucide-react';
import type { VpsProfile } from '../../types/vps';
import type {
  LogSourceDto,
  SystemLogResponseDto,
  SshAuditLogDto,
} from '../../types/logs';
import { getLogSources, readLogs, getSshAuditLogs } from '../../services/logsApi';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface LogsTabProps {
  activeProfile: VpsProfile;
}

type MainTab = 'system-logs' | 'ssh-audit';

export const LogsTab: React.FC<LogsTabProps> = ({ activeProfile }) => {
  const [mainTab, setMainTab] = useState<MainTab>('system-logs');

  // Loading States
  const [loadingSources, setLoadingSources] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingSshAudit, setLoadingSshAudit] = useState(false);

  // Data States
  const [logSources, setLogSources] = useState<LogSourceDto | null>(null);
  const [logResponse, setLogResponse] = useState<SystemLogResponseDto | null>(null);
  const [sshAudit, setSshAudit] = useState<SshAuditLogDto | null>(null);

  // Form Filter States for System Logs
  const [sourceType, setSourceType] = useState<'Journald' | 'File'>('Journald');
  const [target, setTarget] = useState<string>('syslog');
  const [severity, setSeverity] = useState<string>('');
  const [keyword, setKeyword] = useState<string>('');
  const [lines, setLines] = useState<number>(200);
  const [viewMode, setViewMode] = useState<'parsed' | 'raw'>('parsed');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch Log Sources from VPS (/var/log files & systemd services)
  const fetchSources = useCallback(async () => {
    if (!activeProfile || !activeProfile.host) return;
    setLoadingSources(true);
    const res = await getLogSources(activeProfile);
    setLoadingSources(false);
    if (res.success && res.data) {
      setLogSources(res.data);
      if (sourceType === 'Journald' && res.data.systemdServices.length > 0) {
        setTarget(res.data.systemdServices[0]);
      } else if (sourceType === 'File' && res.data.logFiles.length > 0) {
        setTarget(res.data.logFiles[0].filePath);
      }
    }
  }, [activeProfile, sourceType]);

  // Fetch System Logs (/api/logs/read)
  const fetchLogs = useCallback(async () => {
    if (!activeProfile || !activeProfile.host) return;
    setLoadingLogs(true);
    setErrorMessage(null);
    const res = await readLogs({
      connection: activeProfile,
      sourceType,
      target: target || (sourceType === 'Journald' ? 'syslog' : '/var/log/syslog'),
      lines,
      severity,
      keyword,
    });
    setLoadingLogs(false);
    if (res.success && res.data) {
      setLogResponse(res.data);
    } else if (res.message) {
      setErrorMessage(res.message);
    }
  }, [activeProfile, sourceType, target, lines, severity, keyword]);

  // Fetch SSH Audit Logs (/api/logs/ssh-audit)
  const fetchSshAudit = useCallback(async () => {
    if (!activeProfile || !activeProfile.host) return;
    setLoadingSshAudit(true);
    const res = await getSshAuditLogs(activeProfile, 500);
    setLoadingSshAudit(false);
    if (res.success && res.data) {
      setSshAudit(res.data);
    }
  }, [activeProfile]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSources();
      fetchLogs();
      fetchSshAudit();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchSources, fetchLogs, fetchSshAudit]);

  const handleSourceTypeChange = (newType: 'Journald' | 'File') => {
    setSourceType(newType);
    if (logSources) {
      if (newType === 'Journald' && logSources.systemdServices.length > 0) {
        setTarget(logSources.systemdServices[0]);
      } else if (newType === 'File' && logSources.logFiles.length > 0) {
        setTarget(logSources.logFiles[0].filePath);
      }
    }
  };

  const getSeverityBadge = (level: string) => {
    const lvl = level.toUpperCase();
    if (lvl.includes('ERR') || lvl.includes('CRIT') || lvl.includes('EMERG')) {
      return <Badge variant="offline">ERROR</Badge>;
    }
    if (lvl.includes('WARN')) {
      return <Badge variant="warning">WARN</Badge>;
    }
    if (lvl.includes('SSH')) {
      return <Badge variant="blue">SSH</Badge>;
    }
    return <Badge variant="neutral">INFO</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Main Sub-tab Selector */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Nhật ký Hệ thống & Kiểm toán SSH (System Logs & SSH Audit)
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Trích xuất nhật ký thực thi journalctl, file `/var/log/*` và phát hiện tấn công Brute-force SSH
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 border-b-2 lg:border-b-0 border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setMainTab('system-logs')}
            className={`px-4 py-2 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              mainTab === 'system-logs'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/40'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <FileSearch className="w-4 h-4" /> Nhật ký Hệ thống (/api/logs/read)
          </button>
          <button
            onClick={() => setMainTab('ssh-audit')}
            className={`px-4 py-2 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              mainTab === 'ssh-audit'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/40'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-500" /> Kiểm toán SSH & Brute-Force
          </button>
        </div>
      </div>

      {/* ERROR BANNER */}
      {errorMessage && (
        <div className="p-3.5 bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-900 dark:text-red-200 text-xs font-mono-code flex items-center justify-between">
          <span>{errorMessage}</span>
          <Button variant="ghost" size="sm" onClick={() => setErrorMessage(null)}>
            Đóng
          </Button>
        </div>
      )}

      {/* MAIN TAB 1: SYSTEM LOGS */}
      {mainTab === 'system-logs' && (
        <div className="space-y-4">
          {/* Controls Bar for Logs Filtering */}
          <Card>
            <CardHeader className="py-3 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
              <CardTitle className="text-sm flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-600" />
                Bộ Lọc Nhật Ký Nâng Cao (Advanced Log Filter)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs font-mono-code">
              {/* Source Type Selector */}
              <div>
                <label className="block text-slate-500 font-sans mb-1 font-medium">Loại Nguồn Log:</label>
                <select
                  value={sourceType}
                  onChange={(e) => handleSourceTypeChange(e.target.value as 'Journald' | 'File')}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2.5 py-1.5 focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  <option value="Journald">Systemd Journalctl</option>
                  <option value="File">File Log (/var/log/*)</option>
                </select>
              </div>

              {/* Target Service / File Selector */}
              <div>
                <label className="block text-slate-500 font-sans mb-1 font-medium">Nguồn Dữ Liệu Target:</label>
                <select
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2.5 py-1.5 focus:outline-none focus:border-blue-600 cursor-pointer"
                  disabled={loadingSources}
                >
                  {sourceType === 'Journald' ? (
                    logSources?.systemdServices.map((srv, idx) => (
                      <option key={idx} value={srv}>
                        Service: {srv}
                      </option>
                    )) || <option value="syslog">syslog</option>
                  ) : (
                    logSources?.logFiles.map((file, idx) => (
                      <option key={idx} value={file.filePath}>
                        File: {file.fileName}
                      </option>
                    )) || <option value="/var/log/syslog">/var/log/syslog</option>
                  )}
                </select>
              </div>

              {/* Severity Level Filter */}
              <div>
                <label className="block text-slate-500 font-sans mb-1 font-medium">Mức Độ (Severity):</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2.5 py-1.5 focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  <option value="">Tất cả Severity</option>
                  <option value="err">Error / Critical</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                  <option value="debug">Debug</option>
                </select>
              </div>

              {/* Keyword Search */}
              <div>
                <label className="block text-slate-500 font-sans mb-1 font-medium">Từ Khóa Keyword:</label>
                <div className="relative">
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Tìm theo từ khóa..."
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2.5 py-1.5 pr-7 focus:outline-none focus:border-blue-600"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5" />
                </div>
              </div>

              {/* Lines & Execute */}
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-slate-500 font-sans mb-1 font-medium">Số Dòng:</label>
                  <select
                    value={lines}
                    onChange={(e) => setLines(Number(e.target.value))}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2.5 py-1.5 focus:outline-none focus:border-blue-600 cursor-pointer"
                  >
                    <option value={100}>100 dòng</option>
                    <option value={200}>200 dòng</option>
                    <option value={500}>500 dòng</option>
                    <option value={1000}>1000 dòng</option>
                  </select>
                </div>
                <Button variant="blue-solid" className="h-9 px-3 text-xs" onClick={fetchLogs} disabled={loadingLogs}>
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
                  Tải Log
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Log Output Table & View Mode Toggle */}
          <Card>
            <CardHeader className="py-3 flex flex-row items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ListFilter className="w-4 h-4 text-blue-600" />
                <CardTitle className="text-sm font-mono-code">
                  Target: <span className="text-blue-600 dark:text-blue-400">{logResponse?.target || target}</span> ({logResponse?.entries.length || 0} kết quả)
                </CardTitle>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'parsed' ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs font-mono-code"
                  onClick={() => setViewMode('parsed')}
                >
                  Chế độ Phân tích
                </Button>
                <Button
                  variant={viewMode === 'raw' ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs font-mono-code"
                  onClick={() => setViewMode('raw')}
                >
                  <Terminal className="w-3.5 h-3.5 mr-1" /> Raw Terminal
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {loadingLogs ? (
                <div className="p-8 text-center text-amber-500 font-mono-code text-xs flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Đang truy vấn dữ liệu log từ VPS...
                </div>
              ) : viewMode === 'raw' ? (
                <pre className="p-4 bg-[#0a0e17] text-slate-200 font-mono-code text-xs leading-relaxed overflow-x-auto border-t border-slate-800 max-h-[600px]">
                  {logResponse?.rawOutput || 'Không có dữ liệu log thô.'}
                </pre>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800 font-mono-code text-xs max-h-[600px] overflow-y-auto">
                  {logResponse?.entries && logResponse.entries.length > 0 ? (
                    logResponse.entries.map((entry, idx) => (
                      <div key={idx} className="p-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <span className="text-slate-400 text-[11px] shrink-0 font-mono-code">{entry.timestamp}</span>
                        <span className="shrink-0">{getSeverityBadge(entry.level)}</span>
                        <span className="text-blue-700 dark:text-blue-400 font-bold shrink-0 font-mono-code">
                          [{entry.service}]
                        </span>
                        <span className="text-slate-800 dark:text-slate-200 font-sans leading-relaxed break-all">
                          {entry.message}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-400 font-sans italic">
                      Không tìm thấy nhật ký nào phù hợp với bộ lọc.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* MAIN TAB 2: SSH AUDIT & BRUTE-FORCE DETECTION */}
      {mainTab === 'ssh-audit' && (
        <div className="space-y-6">
          {/* Header Controls for SSH Audit */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Phần mềm tự động phân tích `/var/log/auth.log` hoặc `journalctl _COMM=sshd` để bóc tách lịch sử đăng nhập thành công/thất bại và cảnh báo tấn công dò mật khẩu.
            </p>
            <Button variant="outline" size="sm" onClick={fetchSshAudit} disabled={loadingSshAudit}>
              <RefreshCw className={`w-3.5 h-3.5 ${loadingSshAudit ? 'animate-spin text-blue-600' : ''}`} />
              Quét lại SSH Audit
            </Button>
          </div>

          {/* BRUTE FORCE SUSPICIOUS IPS WARNING BANNER */}
          {sshAudit && sshAudit.suspiciousIps && sshAudit.suspiciousIps.length > 0 && (
            <Card className="border-l-4 border-l-red-600 bg-red-50/50 dark:bg-red-950/30">
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-bold text-red-900 dark:text-red-200 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 animate-bounce" />
                  CẢNH BÁO: Phát hiện IP có dấu hiệu tấn công Brute-Force ({sshAudit.suspiciousIps.length} IP)
                </CardTitle>
                <CardDescription className="text-xs text-red-700 dark:text-red-300">
                  Các địa chỉ IP dưới đây có số lần thử đăng nhập thất bại liên tiếp vượt quá ngưỡng an toàn.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 font-mono-code text-xs">
                  {sshAudit.suspiciousIps.map((ip, idx) => (
                    <div key={idx} className="p-3 bg-white dark:bg-slate-900 border border-red-300 dark:border-red-800 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-red-700 dark:text-red-400 text-sm">{ip.ipAddress}</span>
                        <Badge variant="offline">{ip.failedAttempts} Thất bại</Badge>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Lần thử gần nhất: {ip.lastAttemptTimestamp}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* SSH LOGIN HISTORY EVENTS TABLE */}
          <Card>
            <CardHeader className="py-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Key className="w-4 h-4 text-blue-600" />
                Lịch sử Đăng nhập SSH Máy Chủ ({sshAudit?.loginEvents.length || 0} Sự kiện)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {loadingSshAudit ? (
                <div className="p-8 text-center text-amber-500 font-mono-code text-xs flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Đang bóc tách dữ liệu đăng nhập SSH...
                </div>
              ) : (
                <table className="w-full text-left text-xs font-mono-code divide-y divide-slate-200 dark:divide-slate-800">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Thời gian</th>
                      <th className="p-3">Kết quả</th>
                      <th className="p-3">Tài khoản</th>
                      <th className="p-3">Địa chỉ IP Nguồn</th>
                      <th className="p-3">Cổng (Port)</th>
                      <th className="p-3">Phương thức Auth</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {sshAudit?.loginEvents && sshAudit.loginEvents.length > 0 ? (
                      sshAudit.loginEvents.map((evt, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3 whitespace-nowrap text-slate-500">{evt.timestamp}</td>
                          <td className="p-3 whitespace-nowrap">
                            {evt.isSuccess ? (
                              <span className="flex items-center gap-1 text-emerald-600 font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> THÀNH CÔNG
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-red-600 font-bold">
                                <XCircle className="w-3.5 h-3.5 text-red-500" /> THẤT BẠI
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                            <span className="flex items-center gap-1">
                              <UserCheck className="w-3.5 h-3.5 text-slate-400" /> {evt.username}
                            </span>
                          </td>
                          <td className="p-3 text-blue-600 dark:text-blue-400 font-bold whitespace-nowrap">
                            {evt.ipAddress}
                          </td>
                          <td className="p-3 text-slate-500 whitespace-nowrap">:{evt.port || 22}</td>
                          <td className="p-3 whitespace-nowrap">
                            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                              {evt.authMethod || 'password'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                          Chưa có sự kiện đăng nhập SSH nào được ghi nhận.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
