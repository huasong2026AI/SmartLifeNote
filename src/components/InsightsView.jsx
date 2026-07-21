import React from 'react';
import { Bell, GraduationCap, DollarSign, Sparkles, Folder } from 'lucide-react';

const MAP_COLOR_PALETTES = [
  {
    tier1Header: 'bg-sky-500/10 border-sky-400 text-sky-900',
    tier1Badge: 'bg-sky-200/80 text-sky-900',
    tier2Card: 'bg-sky-50/80 border-sky-200 text-sky-800',
    iconColor: 'text-sky-500'
  },
  {
    tier1Header: 'bg-emerald-500/10 border-emerald-400 text-emerald-900',
    tier1Badge: 'bg-emerald-200/80 text-emerald-900',
    tier2Card: 'bg-emerald-50/80 border-emerald-200 text-emerald-800',
    iconColor: 'text-emerald-500'
  },
  {
    tier1Header: 'bg-amber-500/10 border-amber-400 text-amber-900',
    tier1Badge: 'bg-amber-200/80 text-amber-900',
    tier2Card: 'bg-amber-50/80 border-amber-200 text-amber-800',
    iconColor: 'text-amber-500'
  },
  {
    tier1Header: 'bg-purple-500/10 border-purple-400 text-purple-900',
    tier1Badge: 'bg-purple-200/80 text-purple-900',
    tier2Card: 'bg-purple-50/80 border-purple-200 text-purple-800',
    iconColor: 'text-purple-500'
  },
  {
    tier1Header: 'bg-rose-500/10 border-rose-400 text-rose-900',
    tier1Badge: 'bg-rose-200/80 text-rose-900',
    tier2Card: 'bg-rose-50/80 border-rose-200 text-rose-800',
    iconColor: 'text-rose-500'
  },
  {
    tier1Header: 'bg-teal-500/10 border-teal-400 text-teal-900',
    tier1Badge: 'bg-teal-200/80 text-teal-900',
    tier2Card: 'bg-teal-50/80 border-teal-200 text-teal-800',
    iconColor: 'text-teal-500'
  }
];

export default function InsightsView({ batchResults }) {
  if (!batchResults) {
    return (
      <div className="p-6 text-center space-y-3">
        <div className="w-14 h-14 mx-auto rounded-3xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
          <Sparkles className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800">暂无三级目录预测与总结数据</h3>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          点击顶部“AI归类”并确认后，AI 将基于分类结构（工作事业 / 学习提升 / 娱乐休闲 等）在各主题下自动衍生预测与总结。
        </p>
      </div>
    );
  }

  const { hierarchical_categories, global_financial_summary } = batchResults;

  const cleanCategoryName = (str) => {
    if (!str) return '';
    return str.replace(/\(一级大类\)/g, '').replace(/\(二级主题\)/g, '').trim();
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-sky-500/10 via-amber-500/10 to-emerald-500/10 border border-sky-200/80">
        <div className="flex items-center gap-1.5 text-xs font-bold text-sky-900">
          <Sparkles className="w-4 h-4 text-sky-600" />
          <span>AI 归类衍生 · 预测提醒与知识总结</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-0.5">
          包含：工作事业 · 学习提升 · 娱乐休闲 · 求医问诊 · 车辆出行 · 财务消费
        </p>
      </div>

      {/* Global Financial Overall Banner if present */}
      {global_financial_summary && global_financial_summary.total_expense > 0 && (
        <div className="p-4 rounded-3xl bg-gradient-to-tr from-sky-500/15 via-blue-500/10 to-emerald-500/15 border border-sky-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <DollarSign className="w-4 h-4 text-sky-600" />
              全局财务支出总结
            </span>
            <span className="text-lg font-black text-sky-900">
              ¥ {global_financial_summary.total_expense} 元
            </span>
          </div>
          {global_financial_summary.items && global_financial_summary.items.length > 0 && (
            <div className="space-y-1 pt-1.5 border-t border-sky-100/80 text-xs">
              {global_financial_summary.items.map((fi, i) => (
                <div key={i} className="flex justify-between text-slate-600 text-[11px]">
                  <span>{fi.item} ({fi.category})</span>
                  <span className="font-semibold text-slate-800">¥ {fi.amount}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Categorized Predictions & Summaries */}
      <div className="space-y-3">
        {hierarchical_categories?.map((tier1, idx) => {
          const palette = MAP_COLOR_PALETTES[idx % MAP_COLOR_PALETTES.length];
          const cleanMainName = cleanCategoryName(tier1.main_category);

          return (
            <div
              key={idx}
              className="rounded-3xl glass-card overflow-hidden shadow-xs border-2"
              style={{ borderColor: 'rgba(255,255,255,0.8)' }}
            >
              {/* Tier 1 Header */}
              <div className={`p-3.5 flex items-center justify-between border-b ${palette.tier1Header}`}>
                <div className="flex items-center gap-2">
                  <Folder className={`w-4 h-4 ${palette.iconColor}`} />
                  <h3 className="text-xs font-bold text-slate-800">{cleanMainName}</h3>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${palette.tier1Badge}`}>
                  预测与总结
                </span>
              </div>

              {/* Tier 2 & Sub-Predictions/Summaries Body */}
              <div className="p-3 space-y-3 bg-white/60">
                {tier1.subcategories?.map((tier2, subIdx) => {
                  const cleanSubName = cleanCategoryName(tier2.sub_category);
                  const hasReminders = tier2.sub_predictive_reminders?.length > 0;
                  const hasKnowledge = tier2.sub_knowledge_cards?.length > 0;
                  const hasFinancial = tier2.sub_financial_total > 0;

                  return (
                    <div
                      key={subIdx}
                      className={`p-3 rounded-2xl border space-y-2 ${palette.tier2Card}`}
                    >
                      {/* Tier 2 Sub-header */}
                      <div className="flex items-center justify-between border-b border-white/60 pb-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                          <span className={`w-2 h-2 rounded-full ${palette.iconColor} bg-current`} />
                          <span>{cleanSubName}</span>
                        </div>
                      </div>

                      {/* Sub-Predictive Reminders */}
                      {hasReminders && (
                        <div className="space-y-1.5 pt-1">
                          <div className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                            <Bell className="w-3.5 h-3.5 text-amber-600" />
                            <span>预测提醒事项:</span>
                          </div>
                          {tier2.sub_predictive_reminders.map((pr, pIdx) => (
                            <div key={pIdx} className="p-2 rounded-xl bg-amber-50/90 border border-amber-200 text-xs space-y-0.5">
                              <div className="flex items-center justify-between font-bold text-amber-900 text-[11px]">
                                <span>{pr.title}</span>
                                <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-md font-semibold">{pr.date}</span>
                              </div>
                              <p className="text-[10px] text-amber-800">{pr.reason}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Sub-Knowledge Flashcards */}
                      {hasKnowledge && (
                        <div className="space-y-1.5 pt-1">
                          <div className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                            <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                            <span>知识学习总结卡片:</span>
                          </div>
                          {tier2.sub_knowledge_cards.map((kc, kIdx) => (
                            <div key={kIdx} className="p-2.5 rounded-xl bg-emerald-50/90 border border-emerald-200 text-xs space-y-1">
                              <div className="font-bold text-emerald-900 text-[11px] font-mono">{kc.concept}</div>
                              <div className="text-[10px] text-emerald-800 leading-relaxed">💡 要点: {kc.key_point}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Sub-Financial Expense */}
                      {hasFinancial && (
                        <div className="p-2 rounded-xl bg-sky-50/90 border border-sky-200 text-xs flex items-center justify-between text-sky-900 font-semibold text-[11px]">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5 text-sky-600" />
                            财务小计:
                          </span>
                          <span className="font-bold text-sky-800 text-xs">¥ {tier2.sub_financial_total} 元</span>
                        </div>
                      )}

                      {!hasReminders && !hasKnowledge && !hasFinancial && (
                        <div className="text-[11px] text-slate-400 py-1 italic">
                          此类下暂无衍生提醒与总结
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
