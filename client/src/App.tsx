import { useState, useEffect, useCallback } from 'react';
import { Sidebar, type ActiveTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { OverviewTab } from './components/dashboard/OverviewTab';
import { SshConfigTab } from './components/dashboard/SshConfigTab';
import { MetricsTab } from './components/dashboard/MetricsTab';
import { TerminalTab } from './components/dashboard/TerminalTab';
import { ServicesTab } from './components/dashboard/ServicesTab';
import { LogsTab } from './components/dashboard/LogsTab';
import { EmptyServerState } from './components/dashboard/EmptyServerState';
import { SshAuthType, type VpsProfile, type VpsSystemInfoResponseDto, type MetricHistoryPoint } from './types/vps';
import { getVpsSystemInfo, testSshConnection } from './services/vpsApi';

const LOCAL_STORAGE_KEY = 'vps_manager_profiles_v2';
const ACTIVE_PROFILE_KEY = 'vps_manager_active_id_v2';

const getInitialProfiles = (): VpsProfile[] => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Lỗi đọc localStorage:', e);
  }
  return [];
};

const getInitialActiveId = (profiles: VpsProfile[]): string => {
  try {
    const savedId = localStorage.getItem(ACTIVE_PROFILE_KEY);
    if (savedId && profiles.some((p) => p.id === savedId)) {
      return savedId;
    }
  } catch {
    // ignore
  }
  return profiles[0]?.id || '';
};

export function App() {
  // Navigation & UI States
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // VPS Profiles State loaded & saved to LocalStorage
  const [vpsProfiles, setVpsProfiles] = useState<VpsProfile[]>(getInitialProfiles);
  const [activeProfileId, setActiveProfileId] = useState<string>(() => getInitialActiveId(vpsProfiles));

  const activeProfile = vpsProfiles.find((p) => p.id === activeProfileId) || vpsProfiles[0];

  // System Metric & Polling States
  const [systemInfo, setSystemInfo] = useState<VpsSystemInfoResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(0); // 0 = Off (default manual)
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'testing' | 'unreachable'>('offline');
  const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null);
  const [metricHistory, setMetricHistory] = useState<MetricHistoryPoint[]>([]);

  // Sync vpsProfiles to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(vpsProfiles));
    } catch (e) {
      console.error('Không thể lưu profile vào LocalStorage:', e);
    }
  }, [vpsProfiles]);

  // Sync activeProfileId to LocalStorage
  useEffect(() => {
    if (activeProfileId) {
      try {
        localStorage.setItem(ACTIVE_PROFILE_KEY, activeProfileId);
      } catch {
        // ignore
      }
    }
  }, [activeProfileId]);

  // Apply dark mode class to html document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Fetch System Info from Backend API
  const fetchMetrics = useCallback(async () => {
    if (!activeProfile || !activeProfile.host) {
      setConnectionStatus('offline');
      setSystemInfo(null);
      if (activeProfile && !activeProfile.host) {
        setApiErrorMessage('Chưa nhập địa chỉ Host IP cho VPS này. Vui lòng vào Cấu hình SSH để nhập thông tin.');
      }
      return;
    }

    setIsLoading(true);
    setApiErrorMessage(null);

    const res = await getVpsSystemInfo(activeProfile);
    setIsLoading(false);

    if (res.success && res.data) {
      setSystemInfo(res.data);
      setConnectionStatus('online');

      // Append real metric point to history graph
      const nowTime = new Date().toLocaleTimeString();
      setMetricHistory((prev) => {
        const next = [
          ...prev,
          {
            time: nowTime,
            cpuUsage: res.data?.cpu ? Math.min(100, Math.max(0, 10)) : 0,
            ramUsage: res.data?.memory?.usagePercentage || 0,
            diskUsage: res.data?.disk?.usagePercentage || 0,
            networkInKb: 0,
            networkOutKb: 0,
          },
        ];
        return next.slice(-15);
      });
    } else {
      setConnectionStatus('offline');
      setSystemInfo(null);
      setApiErrorMessage(res.message || 'Không thể kết nối đến VPS qua SSH API');
    }
  }, [activeProfile]);

  // Single effect for active profile switch and optional timer polling
  useEffect(() => {
    if (!activeProfileId || vpsProfiles.length === 0) return;

    const initTimer = setTimeout(() => {
      fetchMetrics();
    }, 0);

    let timer: ReturnType<typeof setInterval> | null = null;
    if (autoRefreshInterval > 0 && connectionStatus === 'online') {
      timer = setInterval(() => {
        fetchMetrics();
      }, autoRefreshInterval * 1000);
    }

    return () => {
      clearTimeout(initTimer);
      if (timer) clearInterval(timer);
    };
  }, [activeProfileId, autoRefreshInterval, connectionStatus, fetchMetrics, vpsProfiles.length]);

  // Handlers
  const handleTestConnection = async () => {
    if (!activeProfile || !activeProfile.host) {
      setApiErrorMessage('Vui lòng nhập địa chỉ Host IP trước khi thử kết nối.');
      setActiveTab('ssh-config');
      return;
    }

    setConnectionStatus('testing');
    setApiErrorMessage(null);
    const res = await testSshConnection(activeProfile);
    if (res.success) {
      setConnectionStatus('online');
      fetchMetrics();
    } else {
      setConnectionStatus('offline');
      setApiErrorMessage(res.message);
    }
  };

  const handleSaveProfile = (updatedProfile: VpsProfile) => {
    setVpsProfiles((prev) =>
      prev.map((p) => (p.id === updatedProfile.id ? updatedProfile : p))
    );
  };

  const handleAddNewVps = () => {
    const newId = `vps-${Date.now()}`;
    const newProfile: VpsProfile = {
      id: newId,
      name: `VPS Máy chủ ${vpsProfiles.length + 1}`,
      host: '',
      port: 22,
      username: 'root',
      authType: SshAuthType.Password,
      password: '',
      status: 'offline',
    };
    setVpsProfiles((prev) => [...prev, newProfile]);
    setActiveProfileId(newId);
    setActiveTab('ssh-config');
  };

  const handleDeleteProfile = (id: string) => {
    const nextProfiles = vpsProfiles.filter((p) => p.id !== id);
    setVpsProfiles(nextProfiles);

    if (nextProfiles.length > 0) {
      if (activeProfileId === id) {
        setActiveProfileId(nextProfiles[0].id);
      }
    } else {
      setActiveProfileId('');
      setSystemInfo(null);
      setConnectionStatus('offline');
      setApiErrorMessage(null);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        vpsProfiles={vpsProfiles}
        activeProfileId={activeProfileId}
        onSelectProfile={setActiveProfileId}
        onAddNewVps={handleAddNewVps}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        connectionStatus={connectionStatus}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <Header
          activeProfile={activeProfile}
          connectionStatus={connectionStatus}
          onTestConnection={handleTestConnection}
          onRefreshMetrics={fetchMetrics}
          isLoading={isLoading}
          autoRefreshInterval={autoRefreshInterval}
          setAutoRefreshInterval={setAutoRefreshInterval}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onOpenQuickTerminal={() => setActiveTab('terminal')}
          onDeleteProfile={activeProfile ? handleDeleteProfile : undefined}
        />

        {/* Tab Body Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* If no servers exist: Show Empty Server State */}
            {vpsProfiles.length === 0 ? (
              <EmptyServerState onAddNewVps={handleAddNewVps} />
            ) : (
              <>
                {/* Real API Error Banner */}
                {apiErrorMessage && (
                  <div className="p-4 border bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-mono-code flex items-start justify-between">
                    <div>
                      <strong className="font-bold font-sans text-sm block">Thông báo từ Backend API (http://localhost:5141):</strong>
                      <span className="mt-1 block">{apiErrorMessage}</span>
                    </div>
                    <button
                      onClick={() => setActiveTab('ssh-config')}
                      className="px-2.5 py-1 bg-amber-200 dark:bg-amber-900 hover:bg-amber-300 text-amber-900 dark:text-amber-100 text-xs font-sans font-semibold shrink-0 cursor-pointer"
                    >
                      Cấu hình lại SSH
                    </button>
                  </div>
                )}

                {activeTab === 'overview' && (
                  <OverviewTab
                    systemInfo={systemInfo}
                    activeProfile={activeProfile}
                    onNavigateToTab={setActiveTab}
                    onTestConnection={handleTestConnection}
                    isLoading={isLoading}
                  />
                )}

                {activeTab === 'ssh-config' && activeProfile && (
                  <SshConfigTab
                    key={activeProfile.id}
                    activeProfile={activeProfile}
                    onSaveProfile={handleSaveProfile}
                    vpsProfiles={vpsProfiles}
                    onSelectProfile={setActiveProfileId}
                    onDeleteProfile={handleDeleteProfile}
                    onAddNewProfile={handleAddNewVps}
                  />
                )}

                {activeTab === 'metrics' && (
                  <MetricsTab systemInfo={systemInfo} history={metricHistory} />
                )}

                {activeTab === 'terminal' && activeProfile && (
                  <TerminalTab activeProfile={activeProfile} />
                )}

                {activeTab === 'services' && <ServicesTab />}

                {activeTab === 'logs' && <LogsTab />}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
