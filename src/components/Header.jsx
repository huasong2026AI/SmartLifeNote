import React from 'react';
import { Sparkles, Key, Download, Bot } from 'lucide-react';

export default function Header({
  apiKeyConfigured,
  onOpenSettings,
  onOpenImportExport,
  onRunBatchAi,
  isAnalyzing,
  unprocessedCount
}) {
  return (
    <header className="sticky top-0 z-30 px-4 py-3 bg-white/85 backdrop-blur-md border-b border-sky-100/80 shadow-xs">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-400 to-blue-500 flex items-center justify-center text-white shadow-sm shadow-sky-200">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
              智能随手记
            </h1>
            <p className="text-[11px] text-slate-500">语音·拍照·碎片信息归类与预测</p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-1.5">
          {/* API Key Status */}
          <button
            onClick={onOpenSettings}
            className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1 transition-all ${
              apiKeyConfigured
                ? 'bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200/60'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/80'
            }`}
            title="配置 API Key"
          >
            <Key className="w-4 h-4" />
            <span className="hidden sm:inline">
              {apiKeyConfigured ? 'Key已配置' : '设置Key'}
            </span>
          </button>

          {/* Import / Export */}
          <button
            onClick={onOpenImportExport}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-medium transition-all"
            title="导入/导出数据"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* AI Comprehensive Analysis & Prediction Button */}
          <button
            onClick={onRunBatchAi}
            disabled={isAnalyzing}
            className="relative px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-sky-200 active:scale-95 transition-all disabled:opacity-50"
          >
            <Bot className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>AI 智能分析</span>
            {unprocessedCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-white text-blue-700 text-[10px] font-bold">
                {unprocessedCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
