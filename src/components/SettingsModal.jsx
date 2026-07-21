import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Save, Check, ShieldCheck, Cpu, Lock, Sparkles, Gift } from 'lucide-react';
import { storageService, DEFAULT_SETTINGS, VALID_AUTHOR_PASSWORDS } from '../services/storageService';

export default function SettingsModal({ isOpen, onClose, onSettingsSaved }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [showKey, setShowKey] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [callCount, setCallCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setSettings(storageService.getSettings());
      setCallCount(storageService.getAuthorCallCount());
      setSavedSuccess(false);
    }
  }, [isOpen]);

  const handleSave = (e) => {
    e.preventDefault();
    storageService.saveSettings(settings);
    setSavedSuccess(true);
    if (onSettingsSaved) onSettingsSaved(settings);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  if (!isOpen) return null;

  const isAuthorPassValid =
    settings.authorPassword &&
    VALID_AUTHOR_PASSWORDS.includes(settings.authorPassword.trim().toUpperCase());

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/95 rounded-3xl shadow-2xl overflow-hidden border border-sky-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-sky-500/10 via-emerald-500/10 to-teal-500/10 border-b border-sky-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Key className="w-5 h-5 text-sky-600" />
            AI 模型与 API Key 配置
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
          {/* Privacy Note */}
          <div className="p-3 rounded-2xl bg-sky-50/80 border border-sky-200 text-sky-900 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>隐私声明：</strong>API Key 仅保存在您本地手机/浏览器的 LocalStorage 中，直接与 AI 官方接口通信。
            </p>
          </div>

          {/* Author Password Shared Activation Option */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
                <Gift className="w-4 h-4 text-amber-600" />
                作者授权密码 (无 Key 时试用)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                限额 10 次 (已用 {callCount}/10)
              </span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              提示：如果您没有 Key，可向作者要一个【授权密码】（如 <code className="font-mono bg-amber-100 px-1 py-0.5 rounded font-bold">888888</code>），解锁内置免费的 <strong>Gemini 3.1 Flash Lite</strong> 体验！
            </p>

            <div className="relative pt-1">
              <input
                type={showPass ? 'text' : 'password'}
                value={settings.authorPassword || ''}
                onChange={(e) => setSettings({ ...settings, authorPassword: e.target.value })}
                placeholder="输入作者授权密码 (如: 888888)"
                className="w-full p-2.5 pr-10 rounded-xl bg-white border border-amber-300 text-xs text-slate-800 font-mono outline-none focus:ring-2 focus:ring-amber-300"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
              >
                {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            {isAuthorPassValid && (
              <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>授权密码有效！解锁 Gemini 3.1 Flash Lite 模型 (剩余 {10 - callCount} 次)</span>
              </div>
            )}
          </div>

          {/* AI Provider Switcher */}
          <div className="space-y-1.5 pt-1 border-t border-slate-100">
            <label className="font-bold text-slate-700 block">选择 AI 服务商 (使用个人 Key)</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSettings({ ...settings, provider: 'gemini', model: 'gemini-3.1-flash-lite' })}
                className={`py-2.5 px-3 rounded-2xl border text-center font-bold transition-all ${
                  settings.provider === 'gemini'
                    ? 'bg-sky-50 border-sky-400 text-sky-800 ring-2 ring-sky-200'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                Google Gemini
              </button>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, provider: 'deepseek', model: 'deepseek-chat' })}
                className={`py-2.5 px-3 rounded-2xl border text-center font-bold transition-all ${
                  settings.provider === 'deepseek'
                    ? 'bg-blue-50 border-blue-400 text-blue-800 ring-2 ring-blue-200'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                DeepSeek (可选)
              </button>
            </div>
          </div>

          {/* Model Selection */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-sky-600" />
              <span>选择模型 (Model ID)</span>
            </label>
            {settings.provider === 'gemini' ? (
              <select
                value={settings.model}
                onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                className="w-full p-3 rounded-2xl bg-sky-50/50 border border-sky-200 text-xs text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-sky-300"
              >
                <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (首选 - 每日免费额度最高)</option>
                <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                <option value="gemini-2.0-flash-lite">gemini-2.0-flash-lite</option>
                <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                <option value="gemini-1.5-flash">gemini-1.5-flash</option>
              </select>
            ) : (
              <select
                value={settings.model}
                onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                className="w-full p-3 rounded-2xl bg-blue-50/50 border border-blue-200 text-xs text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="deepseek-chat">deepseek-chat (V3)</option>
                <option value="deepseek-reasoner">deepseek-reasoner (R1)</option>
              </select>
            )}
          </div>

          {/* Custom Model Input */}
          <div className="space-y-1">
            <label className="text-slate-500 text-[11px]">或输入官方自定义模型 ID (如 gemini-3.1-flash-lite):</label>
            <input
              type="text"
              value={settings.customModel || ''}
              onChange={(e) => setSettings({ ...settings, customModel: e.target.value })}
              placeholder="留空则默认使用下拉菜单选中的模型"
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-300"
            />
          </div>

          {/* User API Key Input */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">
              {settings.provider === 'gemini' ? '个人 Gemini API Key' : '个人 DeepSeek API Key'}
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={settings.apiKey || ''}
                onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                placeholder={`请输入您的个人 ${
                  settings.provider === 'gemini' ? 'Google Gemini Key' : 'DeepSeek Key'
                }`}
                className="w-full p-3 pr-10 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono outline-none focus:bg-white focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              className={`w-full py-3 rounded-2xl text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 ${
                savedSuccess
                  ? 'bg-emerald-600'
                  : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700'
              }`}
            >
              {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{savedSuccess ? '保存成功！' : '保存设置'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
