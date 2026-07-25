import type { SshConnectionRequestDto } from '../types/vps';
import type {
  LogSourceDto,
  SystemLogRequestDto,
  SystemLogResponseDto,
  SshAuditLogDto,
} from '../types/logs';

const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/api\/vps\/?$/, '')}/api/logs`
  : 'http://localhost:5141/api/logs';

function buildPayload(req: SshConnectionRequestDto) {
  return {
    host: req.host,
    port: Number(req.port) || 22,
    username: req.username,
    authType: Number(req.authType),
    ...(Number(req.authType) === 0
      ? { password: req.password || '' }
      : { privateKey: req.privateKey || '', passphrase: req.passphrase || '' }),
  };
}

export async function getLogSources(
  connection: SshConnectionRequestDto
): Promise<{ success: boolean; data?: LogSourceDto; message?: string }> {
  try {
    const res = await fetch(`${BASE_URL}/sources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload(connection)),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return { success: false, message: json?.message || 'Không thể liệt kê nguồn log từ VPS' };
    }
    return { success: true, data: json.data };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : String(err) };
  }
}

export async function readLogs(
  req: Omit<SystemLogRequestDto, 'connection'> & { connection: SshConnectionRequestDto }
): Promise<{ success: boolean; data?: SystemLogResponseDto; message?: string }> {
  try {
    const res = await fetch(`${BASE_URL}/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json font-mono-code' },
      body: JSON.stringify({
        connection: buildPayload(req.connection),
        sourceType: req.sourceType,
        target: req.target,
        lines: req.lines || 200,
        severity: req.severity || '',
        keyword: req.keyword || '',
        since: req.since || '',
        until: req.until || '',
      }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return { success: false, message: json?.message || 'Không thể đọc nhật ký từ VPS' };
    }
    return { success: true, data: json.data };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : String(err) };
  }
}

export async function getSshAuditLogs(
  connection: SshConnectionRequestDto,
  lines = 500
): Promise<{ success: boolean; data?: SshAuditLogDto; message?: string }> {
  try {
    const res = await fetch(`${BASE_URL}/ssh-audit?lines=${lines}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload(connection)),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return { success: false, message: json?.message || 'Không thể trích xuất SSH audit logs' };
    }
    return { success: true, data: json.data };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : String(err) };
  }
}
