import React, { useState, useEffect, useRef } from 'react';
import { Camera, MapPin, Tag, Check, Sparkles, X, Image as ImageIcon, RotateCw } from 'lucide-react';
import { locationService } from '../services/locationService';

export default function QuickNoteInput({ onSaveNote, editingNote, onCancelEdit }) {
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Populate data when editingNote changes or initial mount
  useEffect(() => {
    if (editingNote) {
      setContent(editingNote.content || '');
      setLocation(editingNote.location || '');
      setTags(editingNote.tags || []);
      setImagePreview(editingNote.imageUrl || null);
    } else {
      setContent('');
      setImagePreview(null);
      fetchCurrentLocation();
    }
  }, [editingNote]);

  // Auto-generate tags when text changes
  useEffect(() => {
    if (content.trim().length > 3 && !editingNote) {
      const auto = locationService.generateAutoTags(content);
      setTags((prev) => Array.from(new Set([...prev, ...auto])));
    }
  }, [content, editingNote]);

  const fetchCurrentLocation = async () => {
    setIsLocating(true);
    const loc = await locationService.getCurrentLocation();
    setLocation(loc);
    setIsLocating(false);
  };

  // Handle Photo input (converts to Base64)
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  // Tag manipulation
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Submit note (Create or Update)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim() && !imagePreview) {
      alert('请输入文字或选择图片');
      return;
    }

    const now = new Date();
    const formattedTimestamp = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(
      now.getHours()
    ).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let noteType = editingNote ? editingNote.type : 'text';
    if (imagePreview) noteType = 'photo';

    const noteToSave = {
      id: editingNote ? editingNote.id : `note-${Date.now()}`,
      content: content.trim() || '拍照记录',
      type: noteType,
      timestamp: editingNote ? editingNote.timestamp : formattedTimestamp,
      location: location || '未定地点',
      tags: tags.length > 0 ? tags : ['日常'],
      aiAnalyzed: editingNote ? editingNote.aiAnalyzed : false,
      imageUrl: imagePreview || null
    };

    onSaveNote(noteToSave);

    // Reset form after saving
    setContent('');
    setImagePreview(null);
    setTags([]);
  };

  return (
    <div className="w-full bg-white/95 rounded-3xl p-4 shadow-md border border-sky-100 space-y-3 relative transition-all">
      {/* Title Bar inside the inline Card */}
      <div className="flex items-center justify-between pb-1 border-b border-sky-50">
        <h2 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-sky-600" />
          <span>{editingNote ? '修改随手记记录' : '快速随手记 (点击键盘麦克风直接出字)'}</span>
        </h2>
        {editingNote && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center gap-1 font-semibold"
          >
            <X className="w-3 h-3" /> 取消修改
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Main Text Input Area */}
        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="在此记录想法、账单、健康状况、句子口诀..."
            rows={3}
            className="w-full p-3 rounded-2xl bg-sky-50/40 border border-sky-200/60 focus:bg-white focus:border-sky-400 focus:ring-2 focus:ring-sky-200 text-xs text-slate-800 placeholder-slate-400 resize-none transition-all outline-none"
          />
        </div>

        {/* MERGED ROW: Location Bar (Left) + Camera & Gallery Buttons (Right) */}
        <div className="flex items-center justify-between gap-2 bg-sky-50/60 p-2 rounded-2xl border border-sky-100">
          {/* Location Input & Refresh Button */}
          <div className="flex items-center gap-1.5 flex-1 min-w-0 pr-1">
            <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="地点标签..."
              className="flex-1 bg-transparent text-[11px] font-semibold text-slate-700 placeholder-slate-400 outline-none truncate"
            />
            <button
              type="button"
              onClick={fetchCurrentLocation}
              disabled={isLocating}
              className="p-1 text-sky-700 hover:bg-sky-100 rounded-lg shrink-0 transition-all"
              title="重新获取定位"
            >
              <RotateCw className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Photo Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Direct Camera Button */}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="px-2.5 py-1.5 rounded-xl bg-teal-100 text-teal-800 hover:bg-teal-200 text-[11px] font-bold flex items-center gap-1 transition-all shadow-3xs"
            >
              <Camera className="w-3.5 h-3.5 text-teal-600" />
              <span>直接拍照</span>
            </button>

            {/* Choose from gallery button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1.5 rounded-xl bg-sky-100 text-sky-800 hover:bg-sky-200 text-[11px] font-bold flex items-center gap-1 transition-all shadow-3xs"
            >
              <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
              <span>相册图片</span>
            </button>

            {/* Invisible File Input for Camera */}
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleImageUpload}
              className="hidden"
            />

            {/* Invisible File Input for Gallery */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Image Preview attachment if present */}
        {imagePreview && (
          <div className="relative rounded-2xl overflow-hidden border border-sky-200 max-h-36">
            <img src={imagePreview} alt="Preview" className="w-full h-36 object-cover" />
            <button
              type="button"
              onClick={() => setImagePreview(null)}
              className="absolute top-2 right-2 p-1 rounded-full bg-slate-900/60 text-white hover:bg-slate-900"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Dynamic Tags Input */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
            <Tag className="w-3 h-3 text-sky-600" />
            <span>标签:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {tags.map((t, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-100/70 text-sky-800 text-[10px] font-semibold border border-sky-200"
              >
                #{t}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(t)}
                  className="hover:text-sky-900"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              placeholder="+ 自定义标签"
              className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-700 outline-none w-20 border border-slate-200"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-1">
          <button
            type="submit"
            className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-bold shadow-md shadow-sky-200 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            {editingNote ? '保存修改记录' : '保存记录并自动打标签'}
          </button>
        </div>
      </form>
    </div>
  );
}
