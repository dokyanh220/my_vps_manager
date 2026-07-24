import type { SshConnectionRequestDto, VpsSystemInfoResponseDto } from '../types/vps';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5141/api/vps';

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

export async function testSshConnection(req: SshConnectionRequestDto): Promise<{ success: boolean; message: string }> {
  try {
    const payload = buildPayload(req);
    const res = await fetch(`${BASE_URL}/test-connection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        success: false,
        message: data?.message || `Lỗi kết nối HTTP (${res.status}): Không thể thực hiện lệnh Test SSH`,
      };
    }

    return {
      success: data?.success ?? false,
      message: data?.message || 'Không có phản hồi thông báo từ API',
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Không thể kết nối đến máy chủ API (http://localhost:5141)';
    return {
      success: false,
      message: `Lỗi mạng/API Server: ${errorMessage}`,
    };
  }
}

export async function getVpsSystemInfo(req: SshConnectionRequestDto): Promise<{ success: boolean; data?: VpsSystemInfoResponseDto; message?: string }> {
  try {
    const payload = buildPayload(req);
    const res = await fetch(`${BASE_URL}/system-info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        success: false,
        message: data?.message || `Lỗi API (${res.status}): Không thể trích xuất thông tin hệ thống`,
      };
    }

    if (data && data.success && data.data) {
      return {
        success: true,
        data: data.data,
      };
    }

    return {
      success: false,
      message: data?.message || 'Không thể trích xuất dữ liệu hệ thống từ máy chủ VPS',
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Không thể kết nối tới máy chủ Backend API (http://localhost:5141)';
    return {
      success: false,
      message: errorMessage,
    };
  }
}
