import React from 'react';
import { ServerOff, Plus, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';

interface EmptyServerStateProps {
  onAddNewVps: () => void;
}

export const EmptyServerState: React.FC<EmptyServerStateProps> = ({ onAddNewVps }) => {
  return (
    <Card className="border-2 border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 my-12">
      <CardContent className="p-12 text-center space-y-6 max-w-lg mx-auto">
        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
          <ServerOff className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Không có máy chủ VPS
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Danh sách máy chủ đang trống. Hãy thêm máy chủ để nhập địa chỉ IP, cổng SSH, tài khoản và bắt đầu theo dõi hiệu năng hệ thống.
          </p>
        </div>

        <div className="pt-2 flex justify-center">
          <Button variant="blue-solid" size="lg" onClick={onAddNewVps}>
            <Plus className="w-4 h-4" /> Thêm máy chủ
          </Button>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 font-mono-code flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Tất cả thông số VPS của bạn được lưu an toàn trong LocalStorage trình duyệt</span>
        </div>
      </CardContent>
    </Card>
  );
};
