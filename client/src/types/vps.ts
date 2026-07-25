export const SshAuthType = {
  Password: 0,
  PrivateKey: 1,
} as const;

export type SshAuthType = typeof SshAuthType[keyof typeof SshAuthType];

export interface SshConnectionRequestDto {
  host: string;
  port: number;
  username: string;
  authType: SshAuthType;
  password?: string;
  privateKey?: string;
  passphrase?: string;
}

export interface OsInfoDto {
  hostname: string;
  distribution: string;
  kernelVersion: string;
  uptime: string;
}

export interface CpuInfoDto {
  modelName: string;
  cores: number;
}

export interface MemoryInfoDto {
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  usagePercentage: number;
}

export interface DiskInfoDto {
  mountPoint: string;
  totalBytes: number;
  usedBytes: number;
  availableBytes: number;
  usagePercentage: number;
}

export interface NetworkInterfaceDto {
  interfaceName: string;
  ipAddress: string;
  rxBytesTotal: number;
  txBytesTotal: number;
  formattedRxTotal: string;
  formattedTxTotal: string;
}

export interface VpsSystemInfoResponseDto {
  os: OsInfoDto;
  cpu: CpuInfoDto;
  memory: MemoryInfoDto;
  disk: DiskInfoDto;
  networks?: NetworkInterfaceDto[];
}

export interface VpsProfile extends SshConnectionRequestDto {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'testing' | 'unreachable';
  lastChecked?: string;
  tags?: string[];
}

export interface ServiceItem {
  name: string;
  status: 'running' | 'stopped' | 'restarting' | 'failed';
  port?: number;
  memoryUsage?: string;
  cpuUsage?: string;
  description: string;
}

export interface MetricHistoryPoint {
  time: string;
  cpuUsage: number;
  ramUsage: number;
  diskUsage: number;
  networkInKb: number;
  networkOutKb: number;
}
