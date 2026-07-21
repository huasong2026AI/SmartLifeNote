import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Camera, MapPin, Tag, X, Check, Volume2, Globe } from 'lucide-react';
import { locationService } from '../services/locationService';
import { speechService } from '../services/speechService';

export default function NoteInputModal({ isOpen, onClose, onSaveNote, editingNote }) {
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isSpeechToText, setIsSpeechToText] = useState(false);
  const [speechLang, setSpeechLang] = useState('zh-CN'); // 'zh-CN' | 'ja-JP' | 'en-US'
  const [imagePreview, setImagePreview] = useState(null);
  const [audioRecording, setAudioRecording] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  const baseContentRef = useRef('');

  // Reset or load editing note when modal opens
  useEffect(() => {
    if (isOpen) {
      if (editingNote) {
        setContent(editingNote.content || '');
        setLocation(editingNote.location || '');
        setTags(editingNote.tags || []);
        setImagePreview(editingNote.imageUrl || null);
        setAudioRecording(editingNote.audioUrl ? { audioUrl: editingNote.audioUrl } : null);
      } else {
        setContent('');
        setImagePreview(null);
        setAudioRecording(null);
        fetchCurrentLocation();
      }
    }
  }, [isOpen, editingNote]);

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

  // Toggle real-time speech to text with language support
  const handleToggleSpeechToText = () => {
    if (!speechService.isSpeechRecognitionSupported()) {
      alert('您的浏览器不支持实时语音识别，请直接输入文本或录音');
      return;
    }

    if (isSpeechToText) {
      speechService.stopSpeechToText();
      setIsSpeechToText(false);
    } else {
      baseContentRef.current = content;
      setIsSpeechToText(true);
      speechService.startSpeechToText(
        (result) => {
          if (result.full) {
            const prefix = baseContentRef.current.trim();
            const newText = prefix ? `${prefix} ${result.full}` : result.full;
            setContent(newText);
          }
        },
        (err) => {
          console.warn(err);
          setIsSpeechToText(false);
        },
        speechLang
      );
    }
  };

  // Switch speech recognition language dynamically
  const handleSpeechLangChange = (lang) => {
    setSpeechLang(lang);
    if (isSpeechToText) {
      speechService.stopSpeechToText();
      speechService.startSpeechToText(
        (result) => {
          if (result.full) {
            const prefix = baseContentRef.current.trim();
            const newText = prefix ? `${prefix} ${result.full}` : result.full;
            setContent(newText);
          }
        },
        (err) => console.warn(err),
        lang
      );
    }
  };

  // Toggle Audio recording
  const handleToggleAudioRecording = async () => {
    if (isRecordingVoice) {
      const audioResult = await speechService.stopAudioRecording();
      setIsRecordingVoice(false);
      if (audioResult) {
        setAudioRecording(audioResult);
      }
    } else {
      try {
        await speechService.startAudioRecording();
        setIsRecordingVoice(true);
      } catch (e) {
        alert('无法启动麦克风录音，请检查权限。');
      }
    }
  };

  // Handle Photo input
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
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
    if (!content.trim() && !imagePreview && !audioRecording) {
      alert('请输入文字、录音或选择图片');
      return;
    }

    const now = new Date();
    const formattedTimestamp = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(
      now.getHours()
    ).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let noteType = editingNote ? editingNote.type : 'text';
    if (audioRecording) noteType = 'voice';
    else if (imagePreview) noteType = 'photo';

    const noteToSave = {
      id: editingNote ? editingNote.id : `note-${Date.now()}`,
      content: content.trim() || (audioRecording ? '语音随记录音' : '拍照记录'),
      type: noteType,
      timestamp: editingNote ? editingNote.timestamp : formattedTimestamp,
      location: location || '未定地点',
      tags: tags.length > 0 ? tags : ['日常'],
      aiAnalyzed: editingNote ? editingNote.aiAnalyzed : false,
      audioUrl: audioRecording ? audioRecording.audioUrl : null,
      imageUrl: imagePreview || null
    };

    onSaveNote(noteToSave);
    if (isSpeechToText) speechService.stopSpeechToText();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-white/95 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-sky-100 animate-in slide-in-from-bottom duration-300 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-sky-500/10 via-sky-400/10 to-blue-500/10 border-b border-sky-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
            {editingNote ? '修改随手记记录' : '记随手记'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Main Text Input Area */}
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="在此记录想法、账单、健康状况、句子口诀..."
              rows={4}
              className="w-full p-3.5 rounded-2xl bg-sky-50/40 border border-sky-200/60 focus:bg-white focus:border-sky-400 focus:ring-2 focus:ring-sky-200 text-sm text-slate-800 placeholder-slate-400 resize-none transition-all outline-none"
            />
          </div>

          {/* Quick Media Attachments & Controls */}
          <div className="flex flex-col gap-2 bg-slate-50/90 p-2.5 rounded-2xl border border-slate-200/60">
            <div className="flex items-center justify-between gap-2">
              {/* Speech to Text live toggle */}
              <button
                type="button"
                onClick={handleToggleSpeechToText}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  isSpeechToText
                    ? 'bg-rose-500 text-white animate-pulse shadow-sm'
                    : 'bg-sky-100/90 text-sky-800 hover:bg-sky-200'
                }`}
              >
                {isSpeechToText ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span>{isSpeechToText ? '正在识别中...' : '语音转字'}</span>
              </button>

              {/* Language Selector */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                <Globe className="w-3.5 h-3.5 text-sky-600 ml-1" />
                <button
                  type="button"
                  onClick={() => handleSpeechLangChange('zh-CN')}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                    speechLang === 'zh-CN'
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  中文
                </button>
                <button
                  type="button"
                  onClick={() => handleSpeechLangChange('ja-JP')}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                    speechLang === 'ja-JP'
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  日本語
                </button>
                <button
                  type="button"
                  onClick={() => handleSpeechLangChange('en-US')}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                    speechLang === 'en-US'
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/50">
              {/* Micro Audio Recording toggle */}
              <button
                type="button"
                onClick={handleToggleAudioRecording}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                  isRecordingVoice
                    ? 'bg-red-500 text-white animate-bounce shadow-sm'
                    : 'bg-blue-100/80 text-blue-800 hover:bg-blue-200'
                }`}
              >
                <Volume2 className="w-4 h-4" />
                <span>{isRecordingVoice ? '录音中...' : '保存录音音频'}</span>
              </button>

              {/* Photo Capture / Upload */}
              <label className="px-3 py-1.5 rounded-xl bg-teal-100/80 text-teal-800 hover:bg-teal-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all">
                <Camera className="w-4 h-4" />
                <span>拍照/图片</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Image Preview attachment if present */}
          {imagePreview && (
            <div className="relative rounded-2xl overflow-hidden border border-sky-200 max-h-40">
              <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover" />
              <button
                type="button"
                onClick={() => setImagePreview(null)}
                className="absolute top-2 right-2 p-1 rounded-full bg-slate-900/60 text-white hover:bg-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Audio Recording preview badge */}
          {audioRecording && (
            <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-sky-800 font-medium">
                <Volume2 className="w-4 h-4 text-sky-600 animate-pulse" />
                <span>已录制语音音频片段</span>
              </div>
              <button
                type="button"
                onClick={() => setAudioRecording(null)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                移除
              </button>
            </div>
          )}

          {/* Location Bar */}
          <div className="flex items-center gap-2 bg-sky-50/50 p-2.5 rounded-2xl border border-sky-100">
            <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="地点标签 (如: 家中/马记永/社区医院)"
              className="flex-1 bg-transparent text-xs text-slate-700 placeholder-slate-400 outline-none"
            />
            <button
              type="button"
              onClick={fetchCurrentLocation}
              disabled={isLocating}
              className="text-[11px] px-2 py-0.5 rounded-lg bg-sky-100 text-sky-800 hover:bg-sky-200"
            >
              {isLocating ? '定位中...' : '重测定位'}
            </button>
          </div>

          {/* Dynamic Tags Input */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <Tag className="w-3.5 h-3.5 text-sky-600" />
              <span>智能标签:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {tags.map((t, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-100/70 text-sky-800 text-xs border border-sky-200"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-sky-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="+ 自定义标签"
                  className="px-2 py-1 rounded-full bg-slate-100 text-xs text-slate-700 outline-none w-24 border border-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-sm font-bold shadow-md shadow-sky-200 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              {editingNote ? '保存修改记录' : '保存笔记并预处理'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
