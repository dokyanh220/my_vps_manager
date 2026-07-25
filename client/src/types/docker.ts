import type { SshConnectionRequestDto } from './vps';

export interface DockerOverviewDto {
  totalContainers: number;
  runningContainers: number;
  stoppedContainers: number;
  totalComposeProjects: number;
  danglingVolumesCount: number;
  diskUsageSummary: string;
}

export interface DockerContainerDto {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
  ports: string;
  createdAt: string;
  isCompose: boolean;
  composeProject?: string;
  composeService?: string;
  workingDir?: string;
  configFiles?: string;
}

export const DockerProjectStatus = {
  Running: 0,
  Partial: 1,
  Stopped: 2,
  OrphanedFiles: 3,
} as const;

export type DockerProjectStatus = (typeof DockerProjectStatus)[keyof typeof DockerProjectStatus];

export interface DockerComposeProjectDto {
  name: string;
  workingDir: string;
  configFiles: string[];
  status: DockerProjectStatus;
  containers: DockerContainerDto[];
}

export interface DockerContainerActionRequestDto {
  connection: SshConnectionRequestDto;
  containerId: string;
  action: 'start' | 'stop' | 'restart' | 'remove';
}

export interface DockerComposeActionRequestDto {
  connection: SshConnectionRequestDto;
  workingDir: string;
  action: 'up' | 'down' | 'stop' | 'restart' | 'pull';
}

export interface DockerComposeFileRequestDto {
  connection: SshConnectionRequestDto;
  filePath: string;
  content?: string;
}
