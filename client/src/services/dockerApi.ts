import type { SshConnectionRequestDto } from '../types/vps';
import type {
  DockerOverviewDto,
  DockerContainerDto,
  DockerComposeProjectDto,
} from '../types/docker';

const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/api\/vps\/?$/, '')}/api/docker`
  : 'http://localhost:5141/api/docker';

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

export async function getDockerOverview(
  req: SshConnectionRequestDto
): Promise<{ success: boolean; data?: DockerOverviewDto; message?: string }> {
  try {
    const res = await fetch(`${BASE_URL}/overview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload(req)),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return { success: false, message: json?.message || 'Không thể lấy tổng quan Docker' };
    }
    return { success: true, data: json.data };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : String(err) };
  }
}

export async function getDockerContainers(
  req: SshConnectionRequestDto
): Promise<{ success: boolean; data?: DockerContainerDto[]; message?: string }> {
  try {
    const res = await fetch(`${BASE_URL}/containers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload(req)),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return { success: false, message: json?.message || 'Không thể tải danh sách Containers' };
    }
    return { success: true, data: json.data || [] };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : String(err) };
  }
}

export async function executeContainerAction(
  req: SshConnectionRequestDto,
  containerId: string,
  action: 'start' | 'stop' | 'restart' | 'remove'
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${BASE_URL}/containers/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        connection: buildPayload(req),
        containerId,
        action,
      }),
    });
    const json = await res.json().catch(() => null);
    return { success: json?.success ?? false, message: json?.message || 'Thao tác thất bại' };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : String(err) };
  }
}

export async function getContainerLogs(
  req: SshConnectionRequestDto,
  containerId: string,
  tail = 200
): Promise<{ success: boolean; logs?: string; message?: string }> {
  try {
    const res = await fetch(`${BASE_URL}/containers/logs?containerId=${encodeURIComponent(containerId)}&tail=${tail}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload(req)),
    });
    const json = await res.json().catch(() => null);
    return { success: true, logs: json?.logs || '' };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : String(err) };
  }
}

export async function discoverComposeProjects(
  req: SshConnectionRequestDto
): Promise<{ success: boolean; data?: DockerComposeProjectDto[]; message?: string }> {
  try {
    const res = await fetch(`${BASE_URL}/compose/discover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload(req)),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return { success: false, message: json?.message || 'Không thể tự động phát hiện dự án Compose' };
    }
    return { success: true, data: json.data || [] };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : String(err) };
  }
}

export async function executeComposeAction(
  req: SshConnectionRequestDto,
  workingDir: string,
  action: 'up' | 'down' | 'stop' | 'restart' | 'pull'
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${BASE_URL}/compose/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        connection: buildPayload(req),
        workingDir,
        action,
      }),
    });
    const json = await res.json().catch(() => null);
    return { success: json?.success ?? false, message: json?.message || 'Thao tác Compose thất bại' };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : String(err) };
  }
}

export async function getComposeFile(
  req: SshConnectionRequestDto,
  filePath: string
): Promise<{ success: boolean; content?: string; message?: string }> {
  try {
    const res = await fetch(`${BASE_URL}/compose/file`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        connection: buildPayload(req),
        filePath,
      }),
    });
    const json = await res.json().catch(() => null);
    return { success: json?.success ?? false, content: json?.content || '', message: json?.message };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : String(err) };
  }
}

export async function saveComposeFile(
  req: SshConnectionRequestDto,
  filePath: string,
  content: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${BASE_URL}/compose/file/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        connection: buildPayload(req),
        filePath,
        content,
      }),
    });
    const json = await res.json().catch(() => null);
    return { success: json?.success ?? false, message: json?.message || 'Lưu file Compose thất bại' };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : String(err) };
  }
}

export async function pruneVolumes(
  req: SshConnectionRequestDto
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${BASE_URL}/prune/volumes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload(req)),
    });
    const json = await res.json().catch(() => null);
    return { success: json?.success ?? false, message: json?.message };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : String(err) };
  }
}

export async function pruneSystem(
  req: SshConnectionRequestDto
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${BASE_URL}/prune/system`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload(req)),
    });
    const json = await res.json().catch(() => null);
    return { success: json?.success ?? false, message: json?.message };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : String(err) };
  }
}
