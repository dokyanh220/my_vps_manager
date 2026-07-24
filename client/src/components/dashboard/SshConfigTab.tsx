import React, { useState } from 'react';
import {
  KeyRound,
  Server,
  Zap,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Lock,
  FileCode,
  Globe,
  User,
  Shield,
  Save,
} from 'lucide-react';
import { SshAuthType, type SshConnectionRequestDto, type VpsProfile } from '../../types/vps';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Input, Textarea } from '../ui/input';
import { testSshConnection } from '../../services/vpsApi';

interface SshConfigTabProps {
  activeProfile: VpsProfile;
  onSaveProfile: (profile: VpsProfile) => void;
  vpsProfiles: VpsProfile[];
  onSelectProfile: (id: string) => void;
  onDeleteProfile: (id: string) => void;
  onAddNewProfile: () => void;
}

export const SshConfigTab: React.FC<SshConfigTabProps> = ({
  activeProfile,
  onSaveProfile,
  vpsProfiles,
  onSelectProfile,
  onDeleteProfile,
  onAddNewProfile,
}) => {
  const [formData, setFormData] = useState<SshConnectionRequestDto>({
    host: activeProfile.host,
    port: activeProfile.port || 22,
    username: activeProfile.username || 'root',
    authType: activeProfile.authType,
    password: activeProfile.password || '',
    privateKey: activeProfile.privateKey || '',
    passphrase: activeProfile.passphrase || '',
  });

  const [profileName, setProfileName] = useState(activeProfile.name || 'VPS Server');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setTestResult(null);

    const res = await testSshConnection(formData);
    setIsTesting(false);
    setTestResult(res);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: VpsProfile = {
      ...activeProfile,
      name: profileName,
      host: formData.host,
      port: Number(formData.port),
      username: formData.username,
      authType: formData.authType,
      password: formData.password,
      privateKey: formData.privateKey,
      passphrase: formData.passphrase,
      lastChecked: new Date().toLocaleTimeString(),
    };
    onSaveProfile(updated);
    setTestResult({
      success: true,
      message: `Đã lưu cấu hình máy chủ "${profileName}" thành công!`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Alert */}
      {testResult && (
        <div
          className={`p-4 border flex items-start gap-3 ${
            testResult.success
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
          }`}
        >
          {testResult.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-sm">{testResult.success ? 'Kiểm tra thành công' : 'Lỗi kết nối SSH'}</h4>
            <p className="mt-0.5 font-mono-code">{testResult.message}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Config */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                <KeyRound className="w-4 h-4 text-blue-600" />
                Thông số kết nối SSH (SSH Credentials)
              </CardTitle>
              <CardDescription>
                Cấu hình Địa chỉ Host IP, Cổng Port 22, và Phương thức Xác thực với Server API
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSave}>
              <CardContent className="space-y-4">
                {/* Profile Name & Host IP */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-blue-600" /> Tên gợi nhớ VPS
                    </label>
                    <Input
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="vd: Production Web Server 01"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-blue-600" /> Địa chỉ Host IP / Domain
                    </label>
                    <Input
                      value={formData.host}
                      onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                      placeholder="192.168.1.100 hoặc vps.mydomain.com"
                      required
                    />
                  </div>
                </div>

                {/* Username & Port */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-600" /> Tên Tài khoản SSH User
                    </label>
                    <Input
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="root hoặc ubuntu"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-blue-600" /> Cổng Port SSH
                    </label>
                    <Input
                      type="number"
                      value={formData.port}
                      onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 22 })}
                      placeholder="22"
                      required
                    />
                  </div>
                </div>

                {/* Auth Type Switcher */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Phương thức Xác thực (Authentication Type)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, authType: SshAuthType.Password })}
                      className={`p-3 border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        formData.authType === SshAuthType.Password
                          ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-600 text-blue-700 dark:text-blue-300 ring-1 ring-blue-600'
                          : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <Lock className="w-4 h-4" /> Mật khẩu (Password)
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, authType: SshAuthType.PrivateKey })}
                      className={`p-3 border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        formData.authType === SshAuthType.PrivateKey
                          ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-600 text-blue-700 dark:text-blue-300 ring-1 ring-blue-600'
                          : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <FileCode className="w-4 h-4" /> SSH Key (Private Key)
                    </button>
                  </div>
                </div>

                {/* Dynamic Auth Fields */}
                {formData.authType === SshAuthType.Password ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Mật khẩu SSH (Password)
                    </label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••••••"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Nội dung SSH Private Key (RSA, Ed25519, OpenSSH)
                      </label>
                      <Textarea
                        rows={5}
                        value={formData.privateKey}
                        onChange={(e) => setFormData({ ...formData, privateKey: e.target.value })}
                        placeholder="-----BEGIN OPENSSH PRIVATE KEY-----..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Passphrase (nếu Key có đặt khoá giải mã)
                      </label>
                      <Input
                        type="password"
                        value={formData.passphrase}
                        onChange={(e) => setFormData({ ...formData, passphrase: e.target.value })}
                        placeholder="Nhập Passphrase (nếu có)"
                      />
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex items-center justify-between gap-3 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                >
                  <Zap className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-amber-500' : 'text-blue-600'}`} />
                  {isTesting ? 'Đang thử kết nối...' : 'Thử kết nối SSH (Test API)'}
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => onDeleteProfile(activeProfile.id)}
                    title="Xóa máy chủ này"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Xóa Máy chủ
                  </Button>

                  <Button type="submit" variant="blue-solid">
                    <Save className="w-3.5 h-3.5" /> Lưu Cấu hình Profile
                  </Button>
                </div>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Right Column: Presets List */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Danh sách VPS đã lưu</CardTitle>
                <CardDescription>Chọn máy chủ để thao tác nhanh</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={onAddNewProfile} title="Thêm VPS mới">
                <Plus className="w-4 h-4 text-blue-600" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {vpsProfiles.map((p) => {
                  const isCurrent = p.id === activeProfile.id;
                  return (
                    <div
                      key={p.id}
                      className={`p-3.5 flex items-center justify-between transition-colors ${
                        isCurrent
                          ? 'bg-blue-50/70 dark:bg-blue-950/40 border-l-4 border-l-blue-600'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <button
                        onClick={() => onSelectProfile(p.id)}
                        className="text-left flex-1 font-mono-code truncate mr-2 cursor-pointer"
                      >
                        <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 font-sans">
                          {p.name}
                          {isCurrent && <span className="text-[10px] bg-blue-600 text-white px-1 font-mono-code">Đang chọn</span>}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {p.username}@{p.host || 'Chưa nhập IP'}:{p.port}
                        </p>
                      </button>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-400 hover:text-red-600 cursor-pointer"
                          onClick={() => onDeleteProfile(p.id)}
                          title="Xoá máy chủ này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
