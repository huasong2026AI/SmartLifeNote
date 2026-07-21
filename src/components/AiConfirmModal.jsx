import React from 'react';
import { Bot, AlertTriangle, Check, X, ShieldAlert, Gift } from 'lucide-react';
import { storageService, VALID_AUTHOR_PASSWORDS } from '../services/storageService';

export default function AiConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  noteCount,
  settings
}) {
  if (!isOpen) return null;

  const userKey = (settings.apiKey || '').trim();
  const pass = (settings.authorPassword || '').trim();
  const isPassValid = pass && VALID_AUTHOR_PASSWORDS.includes(pass.toUpperCase());

  const count = storageService.getAuthorCallCount();
  const maxLimit = 10;
  const isLimitReached = isPassValid && !userKey && count >= maxLimit;

  const hasEffectiveAccess = userKey || (isPassValid && !isLimitReached);

  let providerName = 'Google Gemini API';
  let modelName = 'gemini-3.1-flash-lite';

  if (userKey) {
    providerName = settings.provider === 'deepseek' ? 'DeepSeek API' : 'Google Gemini API';
    modelName = settings.customModel || settings.model || 'gemini-3.1-flash-lite';
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-sky-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-sky-500/10 via-blue-500/10 to-teal-500/10 border-b border-sky-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Bot className="w-5 h-5 text-sky-600" />
            确认调用 AI 大模型进行智能分析
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm font-bold"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 space-y-2">
            <div className="flex justify-between items-center text-slate-700">
              <span>待分析随手记条数:</span>
              <span className="font-bold text-sky-800 text-sm">{noteCount} 条</span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span>调用服务商:</span>
              <span className="font-bold text-slate-800">{providerName}</span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span>调用模型 (Model):</span>
              <span className="font-bold text-blue-700">{modelName}</span>
            </div>
            {!userKey && isPassValid && (
              <div className="flex justify-between items-center text-amber-800 pt-1 border-t border-sky-100 font-bold">
                <span className="flex items-center gap-1">
                  <Gift className="w-3.5 h-3.5 text-amber-600" />
                  使用作者密码试用:
                </span>
                <span>剩余 {maxLimit - count} / {maxLimit} 次</span>
              </div>
            )}
          </div>

          {!hasEffectiveAccess ? (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed font-medium">
                  <strong>未检测到有效的 Key 或授权密码：</strong>
                  {isLimitReached ? (
                    <span>您的作者授权密码 10 次免费试用额度已用完，请配置您自己的 API Key 继续使用。</span>
                  ) : (
                    <span>如果您没有 API Key，可以问作者要一个【授权密码】（如 888888）在 Key 设置中输入，体验免费 AI 分析！</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200 text-blue-900 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                点击确认后，系统将把您录入的 {noteCount} 条笔记发送给大模型进行三级目录归类、关联脉络绑定与衍生预测总结。
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all"
            >
              取消
            </button>
            <button
              onClick={onConfirm}
              disabled={!hasEffectiveAccess}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold shadow-md shadow-sky-200 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>确认开始 AI 智能分析</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
