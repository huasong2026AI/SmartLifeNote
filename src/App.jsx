import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import QuickNoteInput from './components/QuickNoteInput';
import NoteCard from './components/NoteCard';
import BatchAiView from './components/BatchAiView';
import InsightsView from './components/InsightsView';
import SettingsModal from './components/SettingsModal';
import ImportExportModal from './components/ImportExportModal';
import AiConfirmModal from './components/AiConfirmModal';
import { storageService, VALID_AUTHOR_PASSWORDS } from './services/storageService';
import { aiService } from './services/aiService';
import { Search, CheckSquare, Square, Trash2 } from 'lucide-react';

export default function App() {
  const [notes, setNotes] = useState([]);
  const [activeTab, setActiveTab] = useState('notes');
  const [selectedNoteIds, setSelectedNoteIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTagFilter, setActiveTagFilter] = useState('ALL');

  // Modals state
  const [editingNote, setEditingNote] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isAiConfirmOpen, setIsAiConfirmOpen] = useState(false);

  // AI State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [batchResults, setBatchResults] = useState(null);
  const [settings, setSettings] = useState(storageService.getSettings());

  // Load notes & settings on mount
  useEffect(() => {
    refreshNotes();
    setBatchResults(storageService.getBatchResults());
  }, []);

  const refreshNotes = () => {
    const loaded = storageService.getNotes();
    setNotes(loaded);
  };

  const handleSettingsSaved = (newSettings) => {
    setSettings(newSettings);
  };

  const handleSaveNote = (noteToSave) => {
    let updated;
    if (editingNote) {
      updated = storageService.updateNote(noteToSave);
      setEditingNote(null);
    } else {
      updated = storageService.addNote(noteToSave);
    }
    setNotes(updated);
  };

  const handleStartEditNote = (note) => {
    setEditingNote(note);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteNote = (id) => {
    if (window.confirm('确定要删除这条笔记吗？')) {
      const updated = storageService.deleteNote(id);
      setNotes(updated);
      setSelectedNoteIds((prev) => prev.filter((i) => i !== id));
    }
  };

  const handleClearAllNotes = () => {
    if (window.confirm('确定要清空所有已录入的随手记和 AI 归类分析数据吗？')) {
      storageService.clearAll();
      setNotes([]);
      setBatchResults(null);
      setSelectedNoteIds([]);
    }
  };

  // Toggle selection for batch AI
  const handleToggleSelect = (id) => {
    setSelectedNoteIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedNoteIds.length === notes.length) {
      setSelectedNoteIds([]);
    } else {
      setSelectedNoteIds(notes.map((n) => n.id));
    }
  };

  // Request AI batch process confirmation
  const handleRequestBatchAi = () => {
    const targetNotes =
      selectedNoteIds.length > 0
        ? notes.filter((n) => selectedNoteIds.includes(n.id))
        : notes;

    if (targetNotes.length === 0) {
      alert('没有需要分析的笔记！请先在上方框中录入随手记。');
      return;
    }

    const userKey = (settings.apiKey || '').trim();
    const pass = (settings.authorPassword || '').trim();
    const isPassValid = pass && VALID_AUTHOR_PASSWORDS.includes(pass.toUpperCase());

    if (!userKey && !isPassValid) {
      alert('没有 API Key？可以在设置中向作者要一个【授权密码】（如 888888），免费试用 10 次！');
      setIsSettingsOpen(true);
      return;
    }

    setIsAiConfirmOpen(true);
  };

  // Executed ONLY AFTER user confirms AI modal call
  const handleConfirmExecuteAi = async () => {
    setIsAiConfirmOpen(false);

    const targetNotes =
      selectedNoteIds.length > 0
        ? notes.filter((n) => selectedNoteIds.includes(n.id))
        : notes;

    setIsAnalyzing(true);
    try {
      const results = await aiService.batchProcessNotes(targetNotes, settings);
      setBatchResults(results);
      storageService.saveBatchResults(results);

      // Mark analyzed notes status
      const updatedNotes = notes.map((n) => {
        if (targetNotes.some((t) => t.id === n.id)) {
          return { ...n, aiAnalyzed: true };
        }
        return n;
      });
      storageService.saveNotes(updatedNotes);
      setNotes(updatedNotes);

      // Auto switch to AI Timelines & Category tab
      setActiveTab('batch');
    } catch (e) {
      alert(`AI 分析失败: ${e.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Collect all unique tags for filter tabs
  const allTags = Array.from(
    new Set(notes.flatMap((n) => n.tags || []))
  ).filter(Boolean);

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.location && n.location.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTag =
      activeTagFilter === 'ALL' || (n.tags && n.tags.includes(activeTagFilter));
    return matchesSearch && matchesTag;
  });

  const apiKeyConfigured =
    !!(settings.apiKey && settings.apiKey.trim()) ||
    !!(
      settings.authorPassword &&
      VALID_AUTHOR_PASSWORDS.includes(settings.authorPassword.trim().toUpperCase())
    );
  const unprocessedCount = notes.filter((n) => !n.aiAnalyzed).length;

  return (
    <div className="min-h-screen pb-24 max-w-md mx-auto relative bg-gradient-to-b from-sky-50 via-sky-100/40 to-blue-50/60 shadow-xl border-x border-sky-100/60">
      {/* Header Bar */}
      <Header
        apiKeyConfigured={apiKeyConfigured}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenImportExport={() => setIsImportExportOpen(true)}
        onOpenAddNote={() => {
          setEditingNote(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onRunBatchAi={handleRequestBatchAi}
        isAnalyzing={isAnalyzing}
        unprocessedCount={unprocessedCount}
      />

      {/* Main Content Body */}
      <main className="p-4 space-y-4">
        {/* ROW 2: Embedded Inline Note Input Card */}
        <QuickNoteInput
          onSaveNote={handleSaveNote}
          editingNote={editingNote}
          onCancelEdit={() => setEditingNote(null)}
        />

        {/* Tab 1: All Notes Feed */}
        {activeTab === 'notes' && (
          <div className="space-y-3 pt-1">
            {/* Search & Selection Controls */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索笔记内容、地点、对象..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white/80 border border-sky-100/80 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-sky-300 shadow-xs outline-none"
                  />
                </div>

                <button
                  onClick={handleSelectAll}
                  className="px-3 py-2.5 rounded-2xl bg-white/80 border border-sky-100/80 text-xs font-semibold text-slate-700 hover:bg-white flex items-center gap-1 shadow-xs shrink-0"
                >
                  {selectedNoteIds.length === notes.length && notes.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-sky-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>{selectedNoteIds.length > 0 ? `已选(${selectedNoteIds.length})` : '全选'}</span>
                </button>
              </div>

              {/* Tag Filters */}
              {allTags.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  <button
                    onClick={() => setActiveTagFilter('ALL')}
                    className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition-all ${
                      activeTagFilter === 'ALL'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-white/80 text-slate-600 hover:bg-sky-50 border border-slate-100'
                    }`}
                  >
                    全部 ({notes.length})
                  </button>
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setActiveTagFilter(tag)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all ${
                        activeTagFilter === tag
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'bg-white/80 text-slate-600 hover:bg-sky-50 border border-slate-100'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Note Cards List */}
            {filteredNotes.length === 0 ? (
              <div className="p-6 text-center glass-card rounded-3xl my-3">
                <p className="text-xs text-slate-500 font-medium">暂无随手记列表</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  在上方“快速随手记”输入框直接录入您的记录吧！
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotes.map((note) => {
                  const matchedAiMeta = batchResults?.analyzed_notes?.find(
                    (an) => an.note_id === note.id
                  );
                  return (
                    <NoteCard
                      key={note.id}
                      note={note}
                      isSelected={selectedNoteIds.includes(note.id)}
                      onToggleSelect={handleToggleSelect}
                      onDelete={handleDeleteNote}
                      onEdit={handleStartEditNote}
                      aiMetadata={matchedAiMeta}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Batch AI Context & Timelines View */}
        {activeTab === 'batch' && (
          <BatchAiView
            batchResults={batchResults}
            onRunBatchAi={handleRequestBatchAi}
            isAnalyzing={isAnalyzing}
          />
        )}

        {/* Tab 3: Insights & Predictive Reminders View */}
        {activeTab === 'insights' && <InsightsView batchResults={batchResults} />}

        {/* Tab 4: System Settings */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="p-4 rounded-3xl glass-card border-sky-200/90 space-y-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span>⚡ 系统参数与状态</span>
              </h3>
              <div className="text-xs text-slate-600 space-y-2">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span>已录入随手记总数:</span>
                  <span className="font-bold text-slate-800">{notes.length} 条</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span>支持服务商:</span>
                  <span className="font-bold text-slate-800">
                    Google Gemini / DeepSeek
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span>目前配置 Model:</span>
                  <span className="font-bold text-sky-800">
                    {settings.customModel || settings.model}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span>API Key / 授权密码状态:</span>
                  <span
                    className={`font-bold ${
                      apiKeyConfigured ? 'text-sky-600' : 'text-amber-600'
                    }`}
                  >
                    {apiKeyConfigured ? '已授权激活' : '未设置'}
                  </span>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="w-full py-2.5 rounded-2xl bg-sky-100 hover:bg-sky-200 text-sky-900 font-bold text-xs border border-sky-300 transition-all"
                >
                  配置 API Key 或作者授权密码
                </button>

                {notes.length > 0 && (
                  <button
                    onClick={handleClearAllNotes}
                    className="w-full py-2 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs border border-rose-200 transition-all flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>清空所有记录与 AI 分析结果</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Thumb Navigation Bar */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSettingsSaved={handleSettingsSaved}
      />

      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        onDataImported={refreshNotes}
      />

      <AiConfirmModal
        isOpen={isAiConfirmOpen}
        onClose={() => setIsAiConfirmOpen(false)}
        onConfirm={handleConfirmExecuteAi}
        noteCount={
          selectedNoteIds.length > 0 ? selectedNoteIds.length : notes.length
        }
        settings={settings}
      />
    </div>
  );
}
