import React from 'react';
import { Clock, MapPin, Tag, Trash2, Mic, Camera, FileText, Sparkles, Edit3 } from 'lucide-react';

export default function NoteCard({
  note,
  isSelected,
  onToggleSelect,
  onDelete,
  onEdit,
  aiMetadata
}) {
  const isVoice = note.type === 'voice' || note.audioUrl;
  const isPhoto = note.type === 'photo' || note.imageUrl;

  return (
    <div
      className={`relative p-4 rounded-2xl transition-all border ${
        isSelected
          ? 'bg-sky-50/90 border-sky-400 ring-2 ring-sky-300 shadow-md'
          : 'glass-card border-white/90 hover:border-sky-200 shadow-xs'
      }`}
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {/* Select checkbox for batch AI */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(note.id)}
            className="w-4 h-4 rounded-md border-sky-300 text-sky-600 focus:ring-sky-400 cursor-pointer accent-sky-600"
          />

          {/* Type Badge */}
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
              isVoice
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : isPhoto
                ? 'bg-teal-50 text-teal-700 border-teal-200'
                : 'bg-sky-50 text-sky-700 border-sky-200'
            }`}
          >
            {isVoice ? (
              <Mic className="w-3 h-3" />
            ) : isPhoto ? (
              <Camera className="w-3 h-3" />
            ) : (
              <FileText className="w-3 h-3" />
            )}
            {isVoice ? '语音笔记' : isPhoto ? '拍照笔记' : '文字笔记'}
          </span>

          {/* AI Analyzed Badge */}
          {aiMetadata && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
              <Sparkles className="w-2.5 h-2.5 text-blue-500" />
              {aiMetadata.category || '已AI归类'}
            </span>
          )}
        </div>

        {/* Action Buttons: Edit and Delete */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(note)}
            className="p-1 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
            title="修改笔记"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(note.id)}
            className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
            title="删除笔记"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Note Content Text */}
      <p className="text-sm text-slate-800 leading-relaxed font-normal my-2 select-text whitespace-pre-wrap">
        {note.content}
      </p>

      {/* Photo attachment if available */}
      {note.imageUrl && (
        <div className="my-2 rounded-xl overflow-hidden border border-sky-100 max-h-48 bg-slate-50">
          <img
            src={note.imageUrl}
            alt="Attachment"
            className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      {/* Audio Player if available */}
      {note.audioUrl && (
        <div className="my-2.5 p-2 rounded-xl bg-sky-50/80 border border-sky-100 flex items-center gap-2">
          <audio controls src={note.audioUrl} className="w-full h-8 accent-sky-600" />
        </div>
      )}

      {/* AI Extraction Details preview if analyzed */}
      {aiMetadata && (
        <div className="my-2.5 p-2.5 rounded-xl bg-gradient-to-r from-sky-50/80 to-blue-50/80 border border-sky-100/80 text-xs space-y-1">
          <div className="flex items-center justify-between text-sky-900 font-semibold">
            <span>对象: {aiMetadata.object || '通用'}</span>
            <span className="text-blue-700 font-normal">分类: {aiMetadata.category}</span>
          </div>
          {aiMetadata.needs_reminder && (
            <div className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
              <span>🔔 未来提醒: {aiMetadata.reminder_reason}</span>
            </div>
          )}
        </div>
      )}

      {/* Bottom Metadata Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-sky-100/60 text-[11px] text-slate-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-sky-600" />
            {note.timestamp}
          </span>
          {note.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-blue-600" />
              {note.location}
            </span>
          )}
        </div>

        {/* Tags */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-[50%]">
          {(note.tags || []).map((tag, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-md bg-sky-100/60 text-sky-800 text-[10px] font-medium shrink-0"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
