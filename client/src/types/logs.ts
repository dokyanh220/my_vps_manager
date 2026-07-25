import type { SshConnectionRequestDto } from './vps';

export interface LogFileInfo {
  filePath: string;
  fileName: string;
  sizeBytes: number;
  lastModified: string;
}

export interface LogSourceDto {
  logFiles: LogFileInfo[];
  systemdServices: string[];
}

export interface SystemLogRequestDto {
  connection: SshConnectionRequestDto;
  sourceType: 'Journald' | 'File';
  target: string;
  lines: number;
  severity?: string;
  keyword?: string;
  since?: string;
  until?: string;
}

export interface LogEntryDto {
  timestamp: string;
  level: string;
  service: string;
  message: string;
}

export interface SystemLogResponseDto {
  target: string;
  sourceType: string;
  totalLines: number;
  entries: LogEntryDto[];
  rawOutput: string;
}

export interface SshLoginEventDto {
  timestamp: string;
  isSuccess: boolean;
  username: string;
  ipAddress: string;
  port: number;
  authMethod: string;
}

export interface BruteForceIpSummaryDto {
  ipAddress: string;
  failedAttempts: number;
  lastAttemptTimestamp: string;
}

export interface SshAuditLogDto {
  loginEvents: SshLoginEventDto[];
  suspiciousIps: BruteForceIpSummaryDto[];
}
