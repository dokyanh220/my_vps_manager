import React, { useState, useEffect, useCallback } from 'react';
import {
  Boxes,
  Play,
  Square,
  RotateCw,
  Trash2,
  FileCode,
  Terminal as TerminalIcon,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Folder,
  Layers,
  Database,
  HardDrive,
  Download,
  Save,
  X,
  Copy,
  Check,
} from 'lucide-react';
import type { VpsProfile } from '../../types/vps';
import type {
  DockerOverviewDto,
  DockerContainerDto,
  DockerComposeProjectDto,
} from '../../types/docker';
import { DockerProjectStatus } from '../../types/docker';
import {
  getDockerOverview,
  getDockerContainers,
  executeContainerAction,
  getContainerLogs,
  discoverComposeProjects,
  executeComposeAction,
  getComposeFile,
  saveComposeFile,
  pruneVolumes,
  pruneSystem,
} from '../../services/dockerApi';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface DockerTabProps {
  activeProfile: VpsProfile;
}

type SubTab = 'overview' | 'compose' | 'containers' | 'prune';

export const DockerTab: React.FC<DockerTabProps> = ({ activeProfile }) => {
  const [subTab, setSubTab] = useState<SubTab>('compose');

  // Loading States
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [loadingCompose, setLoadingCompose] = useState(false);
  const [loadingContainers, setLoadingContainers] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Data States
  const [overview, setOverview] = useState<DockerOverviewDto | null>(null);
  const [composeProjects, setComposeProjects] = useState<DockerComposeProjectDto[]>([]);
  const [containers, setContainers] = useState<DockerContainerDto[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [stateFilter, setStateFilter] = useState<'all' | 'running' | 'stopped'>('all');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Logs Modal State
  const [logModal, setLogModal] = useState<{ open: boolean; containerId: string; name: string; logs: string }>({
    open: false,
    containerId: '',
    name: '',
    logs: '',
  });
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Compose File Editor Modal State
  const [composeModal, setComposeModal] = useState<{ open: boolean; filePath: string; content: string; original: string }>({
    open: false,
    filePath: '',
    content: '',
    original: '',
  });
  const [loadingYaml, setLoadingYaml] = useState(false);
  const [savingYaml, setSavingYaml] = useState(false);
  const [copiedLogs, setCopiedLogs] = useState(false);

  // Data Fetchers
  const fetchOverview = useCallback(async () => {
    if (!activeProfile.host) return;
    setLoadingOverview(true);
    const res = await getDockerOverview(activeProfile);
    setLoadingOverview(false);
    if (res.success && res.data) {
      setOverview(res.data);
    }
  }, [activeProfile]);

  const fetchComposeProjects = useCallback(async () => {
    if (!activeProfile.host) return;
    setLoadingCompose(true);
    const res = await discoverComposeProjects(activeProfile);
    setLoadingCompose(false);
    if (res.success && res.data) {
      setComposeProjects(res.data);
    } else if (res.message) {
      setActionMessage({ type: 'error', text: res.message });
    }
  }, [activeProfile]);

  const fetchContainers = useCallback(async () => {
    if (!activeProfile.host) return;
    setLoadingContainers(true);
    const res = await getDockerContainers(activeProfile);
    setLoadingContainers(false);
    if (res.success && res.data) {
      setContainers(res.data);
    }
  }, [activeProfile]);

  const refreshAllData = useCallback(() => {
    fetchOverview();
    fetchComposeProjects();
    fetchContainers();
  }, [fetchOverview, fetchComposeProjects, fetchContainers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshAllData();
    }, 0);
    return () => clearTimeout(timer);
  }, [refreshAllData]);

  // Handlers for Container Actions
  const handleContainerAction = async (containerId: string, action: 'start' | 'stop' | 'restart' | 'remove') => {
    setActionInProgress(`container-${containerId}-${action}`);
    setActionMessage(null);
    const res = await executeContainerAction(activeProfile, containerId, action);
    setActionInProgress(null);
    if (res.success) {
      setActionMessage({ type: 'success', text: `Thao tác ${action} trên container thành công!` });
      refreshAllData();
    } else {
      setActionMessage({ type: 'error', text: res.message || `Thực thi ${action} thất bại` });
    }
  };

  const handleOpenLogs = async (containerId: string, name: string) => {
    setLogModal({ open: true, containerId, name, logs: 'Đang tải nhật ký...' });
    setLoadingLogs(true);
    const res = await getContainerLogs(activeProfile, containerId, 200);
    setLoadingLogs(false);
    setLogModal({
      open: true,
      containerId,
      name,
      logs: res.logs || 'Không có nhật ký khả dụng.',
    });
  };

  // Handlers for Compose Actions
  const handleComposeAction = async (workingDir: string, action: 'up' | 'down' | 'stop' | 'restart' | 'pull') => {
    setActionInProgress(`compose-${workingDir}-${action}`);
    setActionMessage(null);
    const res = await executeComposeAction(activeProfile, workingDir, action);
    setActionInProgress(null);
    if (res.success) {
      setActionMessage({ type: 'success', text: `Đã thực thi docker compose ${action} thành công!` });
      refreshAllData();
    } else {
      setActionMessage({ type: 'error', text: res.message || `Lỗi thực thi docker compose ${action}` });
    }
  };

  const handleOpenComposeFile = async (filePath: string) => {
    setComposeModal({ open: true, filePath, content: 'Đang đọc tệp YML...', original: '' });
    setLoadingYaml(true);
    const res = await getComposeFile(activeProfile, filePath);
    setLoadingYaml(false);
    if (res.success && res.content !== undefined) {
      setComposeModal({ open: true, filePath, content: res.content, original: res.content });
    } else {
      setComposeModal({ open: true, filePath, content: `# Không thể đọc tệp ${filePath}\n# ${res.message || ''}`, original: '' });
    }
  };

  const handleSaveComposeFile = async () => {
    if (!composeModal.filePath) return;
    setSavingYaml(true);
    const res = await saveComposeFile(activeProfile, composeModal.filePath, composeModal.content);
    setSavingYaml(false);
    if (res.success) {
      setActionMessage({ type: 'success', text: 'Lưu tệp docker-compose.yml thành công!' });
      setComposeModal((prev) => ({ ...prev, original: prev.content }));
    } else {
      setActionMessage({ type: 'error', text: res.message || 'Lỗi khi lưu tệp Compose' });
    }
  };

  // Handlers for Prune Operations
  const handlePruneVolumes = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa tất cả Dangling Volumes (Dung lượng dư thừa không dùng)?')) return;
    setActionInProgress('prune-volumes');
    const res = await pruneVolumes(activeProfile);
    setActionInProgress(null);
    if (res.success) {
      setActionMessage({ type: 'success', text: res.message || 'Đã dọn dẹp Docker Volumes!' });
      refreshAllData();
    } else {
      setActionMessage({ type: 'error', text: res.message || 'Lỗi dọn dẹp Volumes' });
    }
  };

  const handlePruneSystem = async () => {
    if (!confirm('CẢNH BÁO: Hành động này sẽ xóa tất cả Container đã dừng, Images dư thừa và Mạng không sử dụng. Tiếp tục?')) return;
    setActionInProgress('prune-system');
    const res = await pruneSystem(activeProfile);
    setActionInProgress(null);
    if (res.success) {
      setActionMessage({ type: 'success', text: res.message || 'Đã dọn dẹp hệ thống Docker thành công!' });
      refreshAllData();
    } else {
      setActionMessage({ type: 'error', text: res.message || 'Lỗi dọn dẹp Docker System' });
    }
  };

  const filteredContainers = containers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.image.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.id.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (c.composeProject && c.composeProject.toLowerCase().includes(searchFilter.toLowerCase()));

    if (stateFilter === 'running') return matchesSearch && c.state.toLowerCase() === 'running';
    if (stateFilter === 'stopped') return matchesSearch && c.state.toLowerCase() !== 'running';
    return matchesSearch;
  });

  const getStatusBadge = (status: DockerProjectStatus) => {
    switch (status) {
      case DockerProjectStatus.Running:
        return <Badge variant="online">RUNNING</Badge>;
      case DockerProjectStatus.Partial:
        return <Badge variant="warning">PARTIAL</Badge>;
      case DockerProjectStatus.Stopped:
        return <Badge variant="offline">STOPPED</Badge>;
      default:
        return <Badge variant="neutral">ORPHANED YML</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Quản lý Docker
              <span className="text-xs font-normal bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 border border-blue-300 dark:border-blue-700">
                Auto-Discovery 100%
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Quản lý Container, tự động phát hiện dự án Compose trên VPS, thực thi Up/Down và dọn dẹp bộ nhớ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAllData}
            disabled={loadingOverview || loadingCompose || loadingContainers}
            title="Quét lại hệ thống Docker trên VPS"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingOverview || loadingCompose || loadingContainers ? 'animate-spin text-blue-600' : ''}`} />
            <span>Quét lại VPS</span>
          </Button>
        </div>
      </div>

      {/* Real-time Status Message Banner */}
      {actionMessage && (
        <div
          className={`p-3.5 border text-xs font-mono-code flex items-center justify-between ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stat Cards Grid Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tổng Containers</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono-code mt-1">
                {overview ? overview.totalContainers : '--'}
              </h3>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 font-mono-code">
                <span className="text-emerald-600 font-semibold">{overview ? overview.runningContainers : 0} Running</span>
                <span>•</span>
                <span className="text-slate-400">{overview ? overview.stoppedContainers : 0} Stopped</span>
              </div>
            </div>
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dự án Compose</p>
              <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono-code mt-1">
                {overview ? overview.totalComposeProjects : composeProjects.length}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">Phát hiện tự động trên đĩa</p>
            </div>
            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dangling Volumes</p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono-code mt-1">
                {overview ? overview.danglingVolumesCount : '--'}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">Volume không sử dụng</p>
            </div>
            <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dọn dẹp hệ thống</p>
              <div className="flex items-center gap-2 mt-2">
                <Button variant="outline" size="sm" className="text-xs" onClick={handlePruneVolumes} disabled={actionInProgress !== null}>
                  Prune Vol
                </Button>
                <Button variant="destructive" size="sm" className="text-xs" onClick={handlePruneSystem} disabled={actionInProgress !== null}>
                  Prune System
                </Button>
              </div>
            </div>
            <div className="w-10 h-10 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Sub-Tabs Bar */}
      <div className="flex items-center border-b border-slate-200 dark:border-slate-800 space-x-1">
        <button
          onClick={() => setSubTab('compose')}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            subTab === 'compose'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          Dự án Docker Compose Discovery ({composeProjects.length})
        </button>

        <button
          onClick={() => setSubTab('containers')}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            subTab === 'containers'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Boxes className="w-4 h-4" />
          Danh sách Containers ({containers.length})
        </button>

        <button
          onClick={() => setSubTab('overview')}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            subTab === 'overview'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          Dung lượng & Thông số Đĩa
        </button>
      </div>

      {/* SUB-TAB 1: DỰ ÁN DOCKER COMPOSE DISCOVERY */}
      {subTab === 'compose' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Hệ thống tự động phát hiện 100% dự án Compose thông qua nhãn Container và quét tệp YML trên thư mục đĩa VPS.
            </p>
            <Button variant="outline" size="sm" onClick={fetchComposeProjects} disabled={loadingCompose}>
              <RefreshCw className={`w-3.5 h-3.5 ${loadingCompose ? 'animate-spin text-blue-600' : ''}`} />
              Quét lại Compose
            </Button>
          </div>

          {loadingCompose ? (
            <Card>
              <CardContent className="p-8 text-center text-xs text-slate-500 font-mono-code">
                Đang quét các tệp docker-compose.yml trên toàn bộ VPS...
              </CardContent>
            </Card>
          ) : composeProjects.length === 0 ? (
            <Card className="border-dashed p-8 text-center">
              <Layers className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Không tìm thấy dự án Compose nào</h3>
              <p className="text-xs text-slate-500 mt-1">VPS hiện chưa có container chạy từ Docker Compose hoặc chưa chứa tệp YML trong các thư mục chuẩn.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {composeProjects.map((project, idx) => (
                <Card key={idx} className="border-l-4 border-l-blue-600">
                  <CardHeader className="py-3 flex flex-row items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <Folder className="w-5 h-5 text-blue-600 shrink-0" />
                      <div>
                        <CardTitle className="text-sm font-mono-code flex items-center gap-2">
                          {project.name}
                          {getStatusBadge(project.status)}
                        </CardTitle>
                        <CardDescription className="text-xs font-mono-code mt-0.5 flex items-center gap-2">
                          <span>Path: {project.workingDir || 'N/A'}</span>
                        </CardDescription>
                      </div>
                    </div>

                    {/* Compose Action Buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 font-mono-code"
                        onClick={() => handleComposeAction(project.workingDir, 'up')}
                        disabled={actionInProgress !== null}
                        title="Chạy docker compose up -d"
                      >
                        <Play className="w-3 h-3" /> Up -d
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950 font-mono-code"
                        onClick={() => handleComposeAction(project.workingDir, 'restart')}
                        disabled={actionInProgress !== null}
                        title="Khởi động lại docker compose restart"
                      >
                        <RotateCw className="w-3 h-3" /> Restart
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs text-blue-600 border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950 font-mono-code"
                        onClick={() => handleComposeAction(project.workingDir, 'pull')}
                        disabled={actionInProgress !== null}
                        title="Cập nhật image: docker compose pull"
                      >
                        <Download className="w-3 h-3" /> Pull
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950 font-mono-code"
                        onClick={() => handleComposeAction(project.workingDir, 'down')}
                        disabled={actionInProgress !== null}
                        title="Dừng & gỡ bỏ: docker compose down"
                      >
                        <Square className="w-3 h-3" /> Down
                      </Button>

                      {project.configFiles && project.configFiles.length > 0 && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="text-xs font-mono-code"
                          onClick={() => handleOpenComposeFile(project.configFiles[0])}
                          title="Xem & Chỉnh sửa tệp YML"
                        >
                          <FileCode className="w-3.5 h-3.5 text-blue-600" /> Sửa YML
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="p-4">
                    {/* Project Config Files & Container List */}
                    <div className="space-y-3">
                      {project.configFiles && project.configFiles.length > 0 && (
                        <div className="text-xs font-mono-code text-slate-500 flex items-center gap-2">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Tệp YML:</span>
                          {project.configFiles.map((f, i) => (
                            <span key={i} className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 border border-slate-200 dark:border-slate-700">
                              {f}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Containers inside this project */}
                      <div>
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                          Danh sách Services / Containers thuộc dự án:
                        </div>
                        {project.containers && project.containers.length > 0 ? (
                          <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs font-mono-code">
                            {project.containers.map((c) => (
                              <div key={c.id} className="py-2 flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${c.state.toLowerCase() === 'running' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                  <strong className="text-slate-900 dark:text-slate-100">{c.name}</strong>
                                  <span className="text-slate-400">({c.image})</span>
                                </div>
                                <div className="flex items-center gap-3 text-[11px]">
                                  <span className="text-slate-500">{c.ports || 'Không mở cổng'}</span>
                                  <span className={c.state.toLowerCase() === 'running' ? 'text-emerald-600' : 'text-slate-400'}>
                                    {c.status}
                                  </span>
                                  <button
                                    onClick={() => handleOpenLogs(c.id, c.name)}
                                    className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                  >
                                    Xem Logs
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 italic">Dự án đang ở trạng thái dừng hoặc chưa khởi chạy containers nào.</div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: DANH SÁCH CONTAINERS */}
      {subTab === 'containers' && (
        <div className="space-y-4">
          {/* Controls Bar: Search & State Filter */}
          <div className="flex items-center justify-between gap-4 flex-wrap bg-white dark:bg-slate-900 p-3 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Tìm kiếm container theo tên, image, ID, compose project..."
                className="w-full text-xs bg-transparent border-b border-slate-300 dark:border-slate-700 pb-1 focus:outline-none focus:border-blue-600 font-mono-code"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Lọc trạng thái:</span>
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value as 'all' | 'running' | 'stopped')}
                className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2 py-1 text-xs font-mono-code focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                <option value="all">Tất cả ({containers.length})</option>
                <option value="running">Đang chạy ({containers.filter((c) => c.state.toLowerCase() === 'running').length})</option>
                <option value="stopped">Đã dừng ({containers.filter((c) => c.state.toLowerCase() !== 'running').length})</option>
              </select>

              <Button variant="outline" size="sm" onClick={fetchContainers} disabled={loadingContainers}>
                <RefreshCw className={`w-3.5 h-3.5 ${loadingContainers ? 'animate-spin text-blue-600' : ''}`} />
                Làm mới
              </Button>
            </div>
          </div>

          {/* Containers Table */}
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left text-xs font-mono-code divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Trạng thái</th>
                    <th className="p-3">Tên Container</th>
                    <th className="p-3">Image</th>
                    <th className="p-3">Cổng (Ports)</th>
                    <th className="p-3">Compose Project</th>
                    <th className="p-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredContainers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                        Không tìm thấy Container nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredContainers.map((c) => {
                      const isRunning = c.state.toLowerCase() === 'running';
                      return (
                        <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="p-3 whitespace-nowrap">
                            {isRunning ? <Badge variant="online">RUNNING</Badge> : <Badge variant="offline">STOPPED</Badge>}
                          </td>
                          <td className="p-3 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                            {c.name}
                            <div className="text-[10px] text-slate-400 font-normal">ID: {c.id.substring(0, 12)}</div>
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-300 max-w-[200px] truncate" title={c.image}>
                            {c.image}
                          </td>
                          <td className="p-3 text-slate-500 max-w-[180px] truncate" title={c.ports}>
                            {c.ports || '--'}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {c.isCompose ? (
                              <span className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 border border-blue-200 dark:border-blue-800">
                                {c.composeProject}
                              </span>
                            ) : (
                              <span className="text-slate-400">Standalone</span>
                            )}
                          </td>
                          <td className="p-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              {isRunning ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-amber-600 hover:text-amber-700"
                                  onClick={() => handleContainerAction(c.id, 'stop')}
                                  disabled={actionInProgress !== null}
                                  title="Stop Container"
                                >
                                  <Square className="w-3.5 h-3.5" /> Stop
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-emerald-600 hover:text-emerald-700"
                                  onClick={() => handleContainerAction(c.id, 'start')}
                                  disabled={actionInProgress !== null}
                                  title="Start Container"
                                >
                                  <Play className="w-3.5 h-3.5" /> Start
                                </Button>
                              )}

                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-blue-600 hover:text-blue-700"
                                onClick={() => handleContainerAction(c.id, 'restart')}
                                disabled={actionInProgress !== null}
                                title="Restart Container"
                              >
                                <RotateCw className="w-3.5 h-3.5" /> Restart
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-slate-600 hover:text-slate-800 dark:text-slate-300"
                                onClick={() => handleOpenLogs(c.id, c.name)}
                                title="Xem Logs"
                              >
                                <TerminalIcon className="w-3.5 h-3.5" /> Logs
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-red-600 hover:text-red-700"
                                onClick={() => handleContainerAction(c.id, 'remove')}
                                disabled={actionInProgress !== null}
                                title="Remove Container"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SUB-TAB 3: DUNG LƯỢNG & THÔNG SỐ ĐĨA DOCKER */}
      {subTab === 'overview' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="py-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm">Báo cáo Dung lượng đĩa Docker (`docker system df`)</CardTitle>
                <CardDescription>Chi tiết sử dụng bộ nhớ cho Images, Containers, Local Volumes và Build Cache</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchOverview} disabled={loadingOverview}>
                <RefreshCw className={`w-3.5 h-3.5 ${loadingOverview ? 'animate-spin text-blue-600' : ''}`} />
                Cập nhật
              </Button>
            </CardHeader>
            <CardContent className="p-4">
              <pre className="p-4 bg-slate-950 text-slate-200 font-mono-code text-xs overflow-x-auto leading-relaxed border border-slate-800">
                {overview && overview.diskUsageSummary
                  ? overview.diskUsageSummary
                  : 'Đang tải dữ liệu dung lượng đĩa Docker từ VPS...'}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}

      {/* LOGS VIEWER MODAL */}
      {logModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TerminalIcon className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-sm font-mono-code">
                  Logs Container: <span className="text-blue-400">{logModal.name}</span>
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs border-slate-700"
                  onClick={() => {
                    navigator.clipboard.writeText(logModal.logs);
                    setCopiedLogs(true);
                    setTimeout(() => setCopiedLogs(false), 1500);
                  }}
                >
                  {copiedLogs ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedLogs ? 'Đã chép' : 'Sao chép Logs'}
                </Button>
                <button
                  onClick={() => setLogModal({ open: false, containerId: '', name: '', logs: '' })}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto bg-[#0a0e17] font-mono-code text-xs text-slate-300 leading-relaxed min-h-[300px]">
              {loadingLogs ? (
                <div className="text-amber-400 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Đang lấy 200 dòng logs mới nhất từ VPS...
                </div>
              ) : (
                <pre className="whitespace-pre-wrap font-mono-code">{logModal.logs}</pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* COMPOSE YML FILE EDITOR MODAL */}
      {composeModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-sm font-mono-code truncate max-w-lg">
                  Tệp YML: <span className="text-blue-400">{composeModal.filePath}</span>
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="blue-solid"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleSaveComposeFile}
                  disabled={savingYaml || loadingYaml || composeModal.content === composeModal.original}
                >
                  <Save className={`w-3.5 h-3.5 ${savingYaml ? 'animate-spin' : ''}`} />
                  {savingYaml ? 'Đang lưu...' : 'Lưu Tệp YML'}
                </Button>

                <button
                  onClick={() => setComposeModal({ open: false, filePath: '', content: '', original: '' })}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-hidden bg-[#090d16] flex flex-col">
              {loadingYaml ? (
                <div className="p-8 text-amber-400 flex items-center gap-2 font-mono-code text-xs">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Đang đọc nội dung tệp docker-compose.yml từ VPS...
                </div>
              ) : (
                <textarea
                  value={composeModal.content}
                  onChange={(e) => setComposeModal((prev) => ({ ...prev, content: e.target.value }))}
                  className="w-full h-[450px] p-4 bg-[#0a0e17] text-slate-100 font-mono-code text-xs leading-relaxed focus:outline-none border border-slate-800 resize-none"
                  placeholder="Nội dung docker-compose.yml..."
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
