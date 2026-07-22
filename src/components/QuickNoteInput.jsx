import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Camera, MapPin, Tag, Check, Volume2, Globe, Sparkles, X, Image as ImageIcon, Loader } from 'lucide-react';
import { locationService } from '../services/locationService';
import { speechService } from '../services/speechService';
import { aiService } from '../services/aiService';

export default function QuickNoteInput({ onSaveNote, editingNote, onCancelEdit }) {
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isSpeechToText, setIsSpeechToText] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false); // AI real-time transcription status
  const [speechLang, setSpeechLang] = useState('zh-CN');
  const [imagePreview, setImagePreview] = useState(null);
  const [audioRecording, setAudioRecording] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  const baseContentRef = useRef('');
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Reset speech-to-text state cleanly
  const resetSpeechState = () => {
    speechService.stopSpeechToText();
    setIsSpeechToText(false);
    setIsRecordingVoice(false);
  };

  // Populate data when editingNote changes or initial mount
  useEffect(() => {
    resetSpeechState();
    if (editingNote) {
      setContent(editingNote.content || '');
      setLocation(editingNote.location || '');
      setTags(editingNote.tags || []);
      setImagePreview(editingNote.imageUrl || null);
      setAudioRecording(
        editingNote.audioUrl
          ? {
              audioUrl: editingNote.audioUrl,
              audioBase64: editingNote.audioBase64 || null,
              audioMimeType: editingNote.audioMimeType || 'audio/webm'
            }
          : null
      );
    } else {
      setContent('');
      setImagePreview(null);
      setAudioRecording(null);
      fetchCurrentLocation();
    }
  }, [editingNote]);

  // Clean cleanup on unmount
  useEffect(() => {
    return () => {
      resetSpeechState();
    };
  }, []);

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

  // Toggle real-time speech to text (Browser API fallback)
  const handleToggleSpeechToText = () => {
    if (!speechService.isSpeechRecognitionSupported()) {
      alert(
        '提示：当前手机浏览器不支持实时语音监听。您可以直接使用下方「保存录音音频」进行录音，录音结束后系统会自动调用 Google Gemini 大模型进行高精确度文字转写！'
      );
      return;
    }

    if (isSpeechToText) {
      resetSpeechState();
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
          resetSpeechState();
        },
        speechLang
      );
    }
  };

  // Switch speech recognition language dynamically (Browser API)
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

  // Toggle Audio recording and trigger Automatic Gemini transcription
  const handleToggleAudioRecording = async () => {
    if (isRecordingVoice) {
      const audioResult = await speechService.stopAudioRecording();
      setIsRecordingVoice(false);
      
      if (audioResult && audioResult.audioBlob) {
        setIsTranscribing(true);
        // Convert audio to Base64 dataURL for Multimodal Gemini analysis
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64data = reader.result;
          setAudioRecording({
            audioUrl: audioResult.audioUrl,
            audioBase64: base64data,
            audioMimeType: audioResult.audioBlob.type || 'audio/webm'
          });

          // Trigger automatic transcription via Gemini
          try {
            const transcribedText = await aiService.transcribeAudio(
              base64data,
              audioResult.audioBlob.type || 'audio/webm',
              {}
            );
            if (transcribedText) {
              setContent((prev) =>
                prev ? `${prev.trim()}\n${transcribedText}` : transcribedText
              );
            }
          } catch (err) {
            console.error('Gemini transcription failed, fallback to audio only:', err);
          } finally {
            setIsTranscribing(false);
          }
        };
        reader.readAsDataURL(audioResult.audioBlob);
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
      audioBase64: audioRecording ? audioRecording.audioBase64 : null,
      audioMimeType: audioRecording ? audioRecording.audioMimeType : null,
      imageUrl: imagePreview || null
    };

    resetSpeechState();
    onSaveNote(noteToSave);

    // Reset form after saving
    setContent('');
    setImagePreview(null);
    setAudioRecording(null);
    setTags([]);
  };

  return (
    <div className="w-full bg-white/95 rounded-3xl p-4 shadow-md border border-sky-100 space-y-3 relative transition-all">
      {/* Title Bar inside the inline Card */}
      <div className="flex items-center justify-between pb-1 border-b border-sky-50">
        <h2 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-sky-600" />
          <span>{editingNote ? '修改随手记记录' : '快速随手记 (直接在此录入)'}</span>
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
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              isTranscribing
                ? '🎙️ AI 正在听写解析您的录音，请稍候...'
                : '在此记录想法、账单、健康状况、句子口诀...'
            }
            disabled={isTranscribing}
            rows={3}
            className={`w-full p-3 rounded-2xl border text-xs text-slate-800 placeholder-slate-400 resize-none transition-all outline-none ${
              isTranscribing
                ? 'bg-amber-50/50 border-amber-300 ring-2 ring-amber-200 animate-pulse'
                : 'bg-sky-50/40 border-sky-200/60 focus:bg-white focus:border-sky-400 focus:ring-2 focus:ring-sky-200'
            }`}
          />
          {isTranscribing && (
            <div className="absolute right-3 bottom-3 flex items-center gap-1.5 text-[10px] text-amber-700 font-bold bg-white/95 px-2 py-1 rounded-lg border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>AI 转写中...</span>
            </div>
          )}
        </div>

        {/* Media Attachments & Voice Controls */}
        <div className="flex flex-col gap-2 bg-slate-50/90 p-2 rounded-2xl border border-slate-200/60">
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
              {isSpeechToText ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              <span>{isSpeechToText ? '正在识别中...' : '语音转字'}</span>
            </button>

            {/* Language Selector */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
              <Globe className="w-3 h-3 text-sky-600 ml-1" />
              <button
                type="button"
                onClick={() => handleSpeechLangChange('zh-CN')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
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
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
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
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                  speechLang === 'en-US'
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                English
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-200/50">
            {/* Micro Audio Recording toggle with AI Autotranscribe */}
            <button
              type="button"
              onClick={handleToggleAudioRecording}
              disabled={isTranscribing}
              className={`px-2 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all ${
                isRecordingVoice
                  ? 'bg-red-500 text-white animate-bounce shadow-sm'
                  : isTranscribing
                  ? 'bg-amber-100 text-amber-800 opacity-60 cursor-not-allowed'
                  : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>
                {isRecordingVoice ? '点此停止并转字' : isTranscribing ? '正在转字...' : '录音 + AI转字'}
              </span>
            </button>

            {/* Direct Camera Button */}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="px-2 py-1.5 rounded-xl bg-teal-100 text-teal-800 hover:bg-teal-200 text-[10px] font-bold flex items-center gap-1 transition-all"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>直接拍照</span>
            </button>

            {/* Choose from gallery button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2 py-1.5 rounded-xl bg-sky-100 text-sky-800 hover:bg-sky-200 text-[10px] font-bold flex items-center gap-1 transition-all"
            >
              <ImageIcon className="w-3.5 h-3.5" />
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

        {/* Audio Recording preview badge */}
        {audioRecording && (
          <div className="p-2.5 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] text-sky-800 font-medium">
              <Volume2 className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
              <span>已录制语音音频片段</span>
            </div>
            <button
              type="button"
              onClick={() => setAudioRecording(null)}
              className="text-[11px] text-slate-400 hover:text-slate-600"
            >
              移除
            </button>
          </div>
        )}

        {/* Location Bar */}
        <div className="flex items-center gap-2 bg-sky-50/50 p-2 rounded-2xl border border-sky-100">
          <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="地点标签 (如: 家中/社区医院)"
            className="flex-1 bg-transparent text-[11px] text-slate-700 placeholder-slate-400 outline-none"
          />
          <button
            type="button"
            onClick={fetchCurrentLocation}
            disabled={isLocating}
            className="text-[10px] px-2 py-0.5 rounded-lg bg-sky-100 text-sky-800 hover:bg-sky-200"
          >
            {isLocating ? '定位中...' : '重测定位'}
          </button>
        </div>

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
            disabled={isTranscribing}
            className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-bold shadow-md shadow-sky-200 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            {editingNote ? '保存修改记录' : '保存记录并自动打标签'}
          </button>
        </div>
      </form>
    </div>
  );
}
