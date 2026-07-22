import React from 'react';
import { Bell, GraduationCap, DollarSign, Sparkles, Folder, Calendar, HelpCircle, CheckSquare, Award, AlertTriangle, ShieldCheck, Bookmark, FileText } from 'lucide-react';

export default function InsightsView({ batchResults }) {
  if (!batchResults) {
    return (
      <div className="p-6 text-center space-y-3">
        <div className="w-14 h-14 mx-auto rounded-3xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
          <Sparkles className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800">暂无 AI 预测与总结档案</h3>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          点击顶部“AI 智能分析”并确认后，AI 会根据您的记录深度推算周期预测、启动事件闭环追踪、生成学习变式题以及归纳个人经验法则。
        </p>
      </div>
    );
  }

  const {
    dynamic_forecasts,
    timeline_followups,
    learning_coach,
    knowledge_archiving,
    global_financial_summary
  } = batchResults;

  return (
    <div className="space-y-5 pb-20">
      {/* Banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-sky-500/10 via-blue-500/10 to-indigo-500/10 border border-sky-200/80">
        <div className="flex items-center gap-1.5 text-xs font-bold text-sky-900">
          <Sparkles className="w-4 h-4 text-sky-600 animate-pulse" />
          <span>AI 智能衍生预测与总结报告</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-0.5">
          基于您当前的随手记录，为您量身定制的周期预测、病程/事件追踪及学习教练。
        </p>
      </div>

      {/* 1. 动态周期预测与主动提醒 (Dynamic Forecasts) */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 px-1">
          <Calendar className="w-4 h-4 text-sky-600" />
          <span>1. 动态周期预测与主动提醒</span>
        </h3>
        
        {(!dynamic_forecasts || dynamic_forecasts.length === 0) ? (
          <div className="p-4 rounded-2xl bg-slate-50 text-slate-400 text-center text-xs">
            暂无周期预测，录入猫粮购买、汽车维护或定期体检记录后即可自动触发推算。
          </div>
        ) : (
          <div className="space-y-2">
            {dynamic_forecasts.map((df, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-white border border-sky-100 space-y-1.5 shadow-2xs hover:border-sky-300 transition-all">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{df.subject}</span>
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold text-[10px]">
                    建议提醒: {df.reminder_date}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed bg-sky-50/50 p-2 rounded-xl border border-sky-100/50">
                  🔮 {df.prediction_text}
                </p>
                {df.context_details && (
                  <p className="text-[10px] text-slate-400 pl-1">
                    📎 上次关联记录: {df.context_details}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. 事件闭环与状态追踪提醒 (Timeline & Follow-ups) */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 px-1">
          <CheckSquare className="w-4 h-4 text-emerald-600" />
          <span>2. 事件闭环与追踪问询</span>
        </h3>

        {(!timeline_followups || timeline_followups.length === 0) ? (
          <div className="p-4 rounded-2xl bg-slate-50 text-slate-400 text-center text-xs">
            暂无需要闭环追踪的事件，在录入看病服药、寄退货快递等非一次性事件后，AI将自动启动持续询问。
          </div>
        ) : (
          <div className="space-y-2">
            {timeline_followups.map((tf, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-white border border-emerald-100 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    {tf.title}
                  </span>
                  <span className="text-[10px] text-slate-400">持续追踪中</span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="bg-emerald-50/60 p-2 rounded-xl border border-emerald-100/60 text-emerald-950">
                    <strong>📅 第 3 天主动询问:</strong> {tf.day_3_question}
                  </div>
                  {tf.day_10_question && (
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 text-slate-700">
                      <strong>🧹 第 10 天整理提醒:</strong> {tf.day_10_question}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. 学科与技能指导 / 主动学习教练 (Learning Coach) */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 px-1">
          <GraduationCap className="w-4 h-4 text-purple-600" />
          <span>3. 主动学习教练 & 错题自测</span>
        </h3>

        {(!learning_coach || (!learning_coach.ebbinghaus_variants && !learning_coach.variant_questions)) ? (
          <div className="p-4 rounded-2xl bg-slate-50 text-slate-400 text-center text-xs">
            暂无学习计划，录入错题公式或外语句型后，AI将在此提供变式题生成与专项学习建议。
          </div>
        ) : (
          <div className="space-y-3 p-4 rounded-3xl bg-purple-50/50 border border-purple-100 shadow-2xs">
            {/* Ebbinghaus variant exercises */}
            {learning_coach.ebbinghaus_variants && learning_coach.ebbinghaus_variants.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-purple-900">🔄 艾宾浩斯抗遗忘变式练习:</div>
                {learning_coach.ebbinghaus_variants.map((ev, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-white border border-purple-100 space-y-1 text-xs">
                    <div className="text-slate-400 text-[10px]">原记录: {ev.original_record} ({ev.review_day})</div>
                    <div className="font-semibold text-purple-950 bg-purple-50/40 p-2 rounded-lg leading-relaxed">
                      ✍️ {ev.variant_practice_prompt}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Variant questions */}
            {learning_coach.variant_questions && learning_coach.variant_questions.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-purple-100/60">
                <div className="text-[11px] font-bold text-purple-900">📚 举一反三 · 专项考点变式自测:</div>
                {learning_coach.variant_questions.map((vq, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-white border border-purple-100 space-y-1 text-xs">
                    <div className="font-bold text-purple-800 text-[11px]">专项考点: {vq.concept}</div>
                    <div className="space-y-1.5 pt-1">
                      <div className="p-2 bg-slate-50 rounded-lg text-slate-700">✍️ <strong>变式自测 1：</strong>{vq.question_1}</div>
                      <div className="p-2 bg-slate-50 rounded-lg text-slate-700">✍️ <strong>变式自测 2：</strong>{vq.question_2}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Weakness Diagnosis */}
            {learning_coach.weakness_diagnosis && (
              <div className="p-2.5 rounded-xl bg-purple-100/40 border border-purple-200 text-purple-950 text-[11px] leading-relaxed">
                🎯 <strong>薄弱项诊断:</strong> {learning_coach.weakness_diagnosis}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. 经验沉淀与“个人法则”归纳 (Knowledge Archiving) */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 px-1">
          <Award className="w-4 h-4 text-amber-600" />
          <span>4. 经验沉淀与个人法则档案</span>
        </h3>

        {(!knowledge_archiving || (!knowledge_archiving.full_case_archives && !knowledge_archiving.personal_rules)) ? (
          <div className="p-4 rounded-2xl bg-slate-50 text-slate-400 text-center text-xs">
            暂无档案归纳，多条记录累积并合并分析后，AI将在此归纳全过程档案和避坑经验。
          </div>
        ) : (
          <div className="space-y-3">
            {/* Case file archive summaries */}
            {knowledge_archiving.full_case_archives && knowledge_archiving.full_case_archives.map((arch, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/60 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                  <FileText className="w-4 h-4 text-amber-600" />
                  <span>{arch.title}</span>
                </div>
                <p className="text-[11px] text-amber-950 leading-relaxed bg-white/80 p-2.5 rounded-xl border border-amber-100 shadow-3xs">
                  {arch.summary}
                </p>
              </div>
            ))}

            {/* Personal rules/avoiding pits list */}
            {knowledge_archiving.personal_rules && knowledge_archiving.personal_rules.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="text-[11px] font-bold text-slate-800">💡 提炼的“个人避坑/经验法则”：</div>
                <div className="space-y-1.5">
                  {knowledge_archiving.personal_rules.map((rule, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[11px] leading-relaxed">
                      <span className="px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-100 text-[10px] font-bold mt-0.5 shrink-0">
                        {rule.type}
                      </span>
                      <span className="text-slate-700">{rule.rule_content}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Global Financial Summary itemized list */}
      {global_financial_summary && global_financial_summary.total_expense > 0 && (
        <div className="p-3 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-between text-xs text-sky-900">
          <span className="flex items-center gap-1 font-bold">
            <DollarSign className="w-3.5 h-3.5 text-sky-600" />
            已录入消费流水汇总计:
          </span>
          <span className="font-extrabold text-sky-800">¥ {global_financial_summary.total_expense} 元</span>
        </div>
      )}
    </div>
  );
}
