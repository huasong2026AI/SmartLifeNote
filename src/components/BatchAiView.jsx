import React, { useState } from 'react';
import { Bot, Folder, FolderOpen, ChevronDown, ChevronRight, Clock, Code, Sparkles, FileText, Bell, GraduationCap, DollarSign } from 'lucide-react';

const MAP_COLOR_PALETTES = [
  {
    tier1Header: 'bg-sky-500/10 border-sky-400 text-sky-900',
    tier1Badge: 'bg-sky-200/80 text-sky-900',
    tier2Card: 'bg-sky-50/80 border-sky-200 text-sky-800',
    tier2Badge: 'bg-sky-100 text-sky-700 border-sky-200',
    tier3Record: 'bg-white border-sky-100 hover:bg-sky-50/60',
    accentText: 'text-sky-600',
    iconColor: 'text-sky-500'
  },
  {
    tier1Header: 'bg-emerald-500/10 border-emerald-400 text-emerald-900',
    tier1Badge: 'bg-emerald-200/80 text-emerald-900',
    tier2Card: 'bg-emerald-50/80 border-emerald-200 text-emerald-800',
    tier2Badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    tier3Record: 'bg-white border-emerald-100 hover:bg-emerald-50/60',
    accentText: 'text-emerald-600',
    iconColor: 'text-emerald-500'
  },
  {
    tier1Header: 'bg-amber-500/10 border-amber-400 text-amber-900',
    tier1Badge: 'bg-amber-200/80 text-amber-900',
    tier2Card: 'bg-amber-50/80 border-amber-200 text-amber-800',
    tier2Badge: 'bg-amber-100 text-amber-700 border-amber-200',
    tier3Record: 'bg-white border-amber-100 hover:bg-amber-50/60',
    accentText: 'text-amber-600',
    iconColor: 'text-amber-500'
  },
  {
    tier1Header: 'bg-purple-500/10 border-purple-400 text-purple-900',
    tier1Badge: 'bg-purple-200/80 text-purple-900',
    tier2Card: 'bg-purple-50/80 border-purple-200 text-purple-800',
    tier2Badge: 'bg-purple-100 text-purple-700 border-purple-200',
    tier3Record: 'bg-white border-purple-100 hover:bg-purple-50/60',
    accentText: 'text-purple-600',
    iconColor: 'text-purple-500'
  },
  {
    tier1Header: 'bg-rose-500/10 border-rose-400 text-rose-900',
    tier1Badge: 'bg-rose-200/80 text-rose-900',
    tier2Card: 'bg-rose-50/80 border-rose-200 text-rose-800',
    tier2Badge: 'bg-rose-100 text-rose-700 border-rose-200',
    tier3Record: 'bg-white border-rose-100 hover:bg-rose-50/60',
    accentText: 'text-rose-600',
    iconColor: 'text-rose-500'
  },
  {
    tier1Header: 'bg-teal-500/10 border-teal-400 text-teal-900',
    tier1Badge: 'bg-teal-200/80 text-teal-900',
    tier2Card: 'bg-teal-50/80 border-teal-200 text-teal-800',
    tier2Badge: 'bg-teal-100 text-teal-700 border-teal-200',
    tier3Record: 'bg-white border-teal-100 hover:bg-teal-50/60',
    accentText: 'text-teal-600',
    iconColor: 'text-teal-500'
  }
];

export default function BatchAiView({ batchResults, onRunBatchAi, isAnalyzing }) {
  const [showRawJson, setShowRawJson] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState({});

  if (!batchResults) {
    return (
      <div className="p-6 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-sky-100 to-blue-100 border border-sky-200 flex items-center justify-center text-sky-600 shadow-sm">
          <Bot className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-800">尚未进行三级目录 AI 归类</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            录入笔记后，点击“AI归类”将自动构建【工作事业 / 学习提升 / 娱乐休闲 / 求医问诊】地图分色脉络树。
          </p>
        </div>
        <button
          onClick={onRunBatchAi}
          disabled={isAnalyzing}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-bold shadow-md shadow-sky-200 active:scale-95 transition-all inline-flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isAnalyzing ? 'AI 正在智能分析中...' : '开始三级目录 AI 归类'}</span>
        </button>
      </div>
    );
  }

  const { hierarchical_categories } = batchResults;

  const toggleCategory = (catName) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catName]: !prev[catName]
    }));
  };

  // Clean label helper to strip unwanted "(一级大类)" / "(二级主题)" strings if LLM returns them
  const cleanCategoryName = (str) => {
    if (!str) return '';
    return str.replace(/\(一级大类\)/g, '').replace(/\(二级主题\)/g, '').trim();
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header Banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-sky-500/10 via-purple-500/10 to-emerald-500/10 border border-sky-200/80 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-sky-900">
            <Sparkles className="w-4 h-4 text-sky-600" />
            <span>地图分色 · 三级目录 AI 脉络</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            分类：工作事业 · 学习提升 · 娱乐休闲 · 求医问诊 · 车辆出行 · 财务消费
          </p>
        </div>

        <button
          onClick={() => setShowRawJson(!showRawJson)}
          className="px-3 py-1.5 rounded-xl bg-white/90 border border-sky-200 text-xs font-medium text-slate-700 hover:bg-white flex items-center gap-1 shadow-xs"
        >
          <Code className="w-3.5 h-3.5 text-sky-600" />
          <span>{showRawJson ? '看目录树' : '看 JSON'}</span>
        </button>
      </div>

      {showRawJson ? (
        /* Raw JSON Output View */
        <div className="p-4 rounded-3xl bg-slate-900 text-sky-300 font-mono text-xs overflow-x-auto border border-slate-800 shadow-inner">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400">
            <span>Structured JSON Response</span>
            <span className="text-[10px]">utf-8</span>
          </div>
          <pre className="whitespace-pre-wrap">{JSON.stringify(batchResults, null, 2)}</pre>
        </div>
      ) : (
        /* 3-Tier Map-Color Hierarchy Tree View */
        <div className="space-y-3">
          {(!hierarchical_categories || hierarchical_categories.length === 0) ? (
            <div className="p-6 text-center text-xs text-slate-500">
              未匹配到有效归类，请尝试录入更多随手记后再次分析。
            </div>
          ) : (
            hierarchical_categories.map((tier1, idx) => {
              const palette = MAP_COLOR_PALETTES[idx % MAP_COLOR_PALETTES.length];
              const isCollapsed = collapsedCategories[tier1.main_category];
              const totalRecordsCount = (tier1.subcategories || []).reduce(
                (acc, sub) => acc + (sub.records?.length || 0),
                0
              );
              const cleanMainName = cleanCategoryName(tier1.main_category);

              return (
                <div
                  key={idx}
                  className="rounded-3xl glass-card overflow-hidden transition-all shadow-xs border-2"
                  style={{ borderColor: 'rgba(255,255,255,0.8)' }}
                >
                  {/* Tier 1 Header */}
                  <button
                    onClick={() => toggleCategory(tier1.main_category)}
                    className={`w-full p-4 flex items-center justify-between transition-all text-left border-b ${palette.tier1Header}`}
                  >
                    <div className="flex items-center gap-2.5">
                      {isCollapsed ? (
                        <Folder className={`w-5 h-5 ${palette.iconColor}`} />
                      ) : (
                        <FolderOpen className={`w-5 h-5 ${palette.iconColor}`} />
                      )}
                      <div>
                        <h3 className="text-sm font-bold flex items-center gap-2">
                          <span>{cleanMainName}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${palette.tier1Badge}`}>
                            {totalRecordsCount} 条记录
                          </span>
                        </h3>
                      </div>
                    </div>

                    <div className="text-slate-400">
                      {isCollapsed ? (
                        <ChevronRight className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </button>

                  {/* Tier 2 & Tier 3 Body */}
                  {!isCollapsed && (
                    <div className="p-3 space-y-3 bg-white/60">
                      {tier1.subcategories?.map((tier2, subIdx) => {
                        const cleanSubName = cleanCategoryName(tier2.sub_category);

                        return (
                          <div
                            key={subIdx}
                            className={`p-3.5 rounded-2xl border space-y-3 shadow-2xs ${palette.tier2Card}`}
                          >
                            {/* Tier 2 Header */}
                            <div className="flex items-center justify-between border-b border-white/60 pb-2">
                              <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full bg-current ${palette.iconColor}`} />
                                <h4 className="text-xs font-bold text-slate-800">
                                  {cleanSubName}
                                </h4>
                              </div>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${palette.tier2Badge}`}>
                                {tier2.records?.length || 0} 条明细
                              </span>
                            </div>

                            {tier2.description && (
                              <p className="text-[11px] text-slate-600 bg-white/70 p-2 rounded-xl border border-white/80 leading-relaxed">
                                💡 <strong>说明:</strong> {tier2.description}
                              </p>
                            )}

                            {/* Tier 3 Records */}
                            {tier2.records && tier2.records.length > 0 && (
                              <div className="space-y-2 pl-2 border-l-2" style={{ borderColor: 'currentColor' }}>
                                {tier2.records.map((record, recIdx) => (
                                  <div
                                    key={recIdx}
                                    className={`p-2.5 rounded-xl border text-xs space-y-1 shadow-2xs transition-all ${palette.tier3Record}`}
                                  >
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span className="font-bold text-slate-800 flex items-center gap-1">
                                        <FileText className={`w-3.5 h-3.5 ${palette.accentText}`} />
                                        {record.object || '事件明细'}
                                      </span>
                                      <span className="text-slate-400 flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-slate-400" />
                                        {record.event_time}
                                      </span>
                                    </div>

                                    <p className="text-slate-700 font-normal leading-relaxed text-[11px]">
                                      {record.content_summary}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* AI Derived Predictive Reminders */}
                            {tier2.sub_predictive_reminders && tier2.sub_predictive_reminders.length > 0 && (
                              <div className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-200 text-xs space-y-1.5">
                                <div className="flex items-center gap-1.5 text-amber-900 font-bold text-[11px]">
                                  <Bell className="w-3.5 h-3.5 text-amber-600" />
                                  <span>🔔 预测提醒</span>
                                </div>
                                {tier2.sub_predictive_reminders.map((pr, prIdx) => (
                                  <div key={prIdx} className="text-[11px] text-amber-900 flex justify-between items-center bg-white/80 p-1.5 rounded-lg border border-amber-100">
                                    <span>{pr.title} ({pr.reason})</span>
                                    <span className="font-bold text-amber-700 text-[10px] px-1.5 py-0.5 bg-amber-100 rounded-md shrink-0 ml-1">{pr.date}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* AI Derived Knowledge Flashcards */}
                            {tier2.sub_knowledge_cards && tier2.sub_knowledge_cards.length > 0 && (
                              <div className="p-2.5 rounded-xl bg-emerald-50/90 border border-emerald-200 text-xs space-y-1.5">
                                <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-[11px]">
                                  <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>💡 知识复习总结</span>
                                </div>
                                {tier2.sub_knowledge_cards.map((kc, kcIdx) => (
                                  <div key={kcIdx} className="text-[11px] text-emerald-900 bg-white/80 p-2 rounded-lg border border-emerald-100 space-y-1">
                                    <div className="font-bold text-emerald-800">{kc.concept}</div>
                                    <div className="text-[10px] text-slate-600">{kc.key_point}</div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* AI Derived Sub Financial Total */}
                            {typeof tier2.sub_financial_total === 'number' && tier2.sub_financial_total > 0 && (
                              <div className="p-2 rounded-xl bg-sky-50/90 border border-sky-200 text-xs flex items-center justify-between text-sky-900 font-semibold text-[11px]">
                                <span className="flex items-center gap-1">
                                  <DollarSign className="w-3.5 h-3.5 text-sky-600" />
                                  财务支出小计:
                                </span>
                                <span className="font-bold text-sky-800 text-xs">¥ {tier2.sub_financial_total} 元</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
