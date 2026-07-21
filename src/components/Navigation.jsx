import React from 'react';
import { Notebook, GitMerge, Lightbulb, Settings } from 'lucide-react';

export default function Navigation({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'notes', label: '所有笔记', icon: Notebook },
    { id: 'batch', label: 'AI归类脉络', icon: GitMerge },
    { id: 'insights', label: '预测与总结', icon: Lightbulb },
    { id: 'settings', label: 'Key设置', icon: Settings }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-lg border-t border-emerald-100/80 shadow-lg">
      <div className="max-w-md mx-auto px-4 py-2 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-emerald-700 font-bold bg-emerald-50/80'
                  : 'text-slate-400 hover:text-slate-600 font-normal'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[11px] leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
