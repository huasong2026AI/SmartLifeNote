import React, { useState } from 'react';
import { Download, Upload, FileJson, FileSpreadsheet, Check, AlertCircle } from 'lucide-react';
import { storageService } from '../services/storageService';

export default function ImportExportModal({ isOpen, onClose, onDataImported }) {
  const [importStatus, setImportStatus] = useState(null);

  if (!isOpen) return null;

  const handleExportJSON = () => {
    storageService.exportDataJSON();
  };

  const handleExportCSV = () => {
    storageService.exportDataCSV();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const res = storageService.importDataJSON(content);
        if (res.success) {
          setImportStatus({ success: true, message: `成功导入 ${res.count} 条记录！` });
          if (onDataImported) onDataImported();
          setTimeout(() => {
            setImportStatus(null);
            onClose();
          }, 1000);
        } else {
          setImportStatus({ success: false, message: res.error });
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/95 rounded-3xl shadow-2xl overflow-hidden border border-emerald-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-teal-500/10 border-b border-emerald-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Download className="w-5 h-5 text-emerald-600" />
            数据备份与导入导出
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            记录保存在您的手机/浏览器本地。导出格式可用于在电脑或新手机中还原全量数据。
          </p>

          {/* Export Actions */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-700">导出数据至手机保存:</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExportJSON}
                className="p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-bold flex flex-col items-center gap-1.5 transition-all"
              >
                <FileJson className="w-6 h-6 text-emerald-600" />
                <span>导出 JSON 完整备份</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="p-3 rounded-2xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-900 font-bold flex flex-col items-center gap-1.5 transition-all"
              >
                <FileSpreadsheet className="w-6 h-6 text-sky-600" />
                <span>导出 CSV 表格文件</span>
              </button>
            </div>
          </div>

          {/* Import Actions */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h3 className="font-bold text-slate-700">从本地备份文件恢复导入:</h3>
            <label className="w-full p-4 rounded-2xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all">
              <Upload className="w-6 h-6 text-emerald-600" />
              <span className="font-bold text-slate-700">点击选择 JSON 备份文件</span>
              <span className="text-[10px] text-slate-400">支持还原之前的随手记全量记录</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Status Alert */}
          {importStatus && (
            <div
              className={`p-3 rounded-2xl flex items-center gap-2 font-bold ${
                importStatus.success
                  ? 'bg-emerald-100 text-emerald-900'
                  : 'bg-rose-100 text-rose-900'
              }`}
            >
              {importStatus.success ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              )}
              <span>{importStatus.message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
