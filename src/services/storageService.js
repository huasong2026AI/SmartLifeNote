// Storage service for AI Smart Life Note with Vite Environment Variable Support

const NOTES_KEY = 'smart_life_notes';
const SETTINGS_KEY = 'smart_life_settings';
const BATCH_RESULTS_KEY = 'smart_life_batch_results';
const AUTHOR_CALL_COUNT_KEY = 'smart_life_author_call_count';

export const DEFAULT_SETTINGS = {
  provider: 'gemini', // 'gemini' | 'deepseek'
  apiKey: '',
  authorPassword: '', // Author shared password
  model: 'gemini-3.1-flash-lite',
  customModel: '',
  autoLocation: true,
  autoTagging: true
};

// Valid author passwords (read from env or fallback list)
const ENV_AUTHOR_PASS = import.meta.env.VITE_AUTHOR_PASSWORD;
export const VALID_AUTHOR_PASSWORDS = [
  ENV_AUTHOR_PASS,
  '888888',
  'VIP888',
  'AUTHOR888',
  'SMARTNOTE'
].filter(Boolean);

// Read author key strictly from Vite Environment Variable or fallback
const getEnvAuthorKey = () => {
  return import.meta.env.VITE_GEMINI_API_KEY || '';
};

export const storageService = {
  // Load notes
  getNotes: () => {
    try {
      const data = localStorage.getItem(NOTES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error loading notes:', e);
      return [];
    }
  },

  saveNotes: (notes) => {
    try {
      localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    } catch (e) {
      console.error('Error saving notes:', e);
    }
  },

  addNote: (note) => {
    const notes = storageService.getNotes();
    const newNotes = [note, ...notes];
    storageService.saveNotes(newNotes);
    return newNotes;
  },

  deleteNote: (id) => {
    const notes = storageService.getNotes();
    const updated = notes.filter((n) => n.id !== id);
    storageService.saveNotes(updated);
    return updated;
  },

  updateNote: (updatedNote) => {
    const notes = storageService.getNotes();
    const updated = notes.map((n) => (n.id === updatedNote.id ? updatedNote : n));
    storageService.saveNotes(updated);
    return updated;
  },

  clearAll: () => {
    localStorage.removeItem(NOTES_KEY);
    localStorage.removeItem(BATCH_RESULTS_KEY);
  },

  getSettings: () => {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings: (settings) => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving settings:', e);
    }
  },

  // Author password call limit counter (Max 10 calls)
  getAuthorCallCount: () => {
    try {
      const count = localStorage.getItem(AUTHOR_CALL_COUNT_KEY);
      return count ? parseInt(count, 10) : 0;
    } catch (e) {
      return 0;
    }
  },

  incrementAuthorCallCount: () => {
    const current = storageService.getAuthorCallCount();
    const next = current + 1;
    localStorage.setItem(AUTHOR_CALL_COUNT_KEY, next.toString());
    return next;
  },

  // Resolve actual API Key & Model (using User's own key OR author key via password / env)
  resolveEffectiveApiKeyAndModel: () => {
    const settings = storageService.getSettings();
    const userKey = (settings.apiKey || '').trim();
    const pass = (settings.authorPassword || '').trim();

    // 1. User provided their own Key
    if (userKey) {
      return {
        apiKey: userKey,
        model: settings.customModel || settings.model || 'gemini-3.1-flash-lite',
        isAuthorPassUsed: false,
        remainingCalls: Infinity
      };
    }

    // 2. User entered valid author password or env password
    const envAuthorKey = getEnvAuthorKey();
    if (pass && VALID_AUTHOR_PASSWORDS.includes(pass.toUpperCase())) {
      const count = storageService.getAuthorCallCount();
      const maxLimit = 10;
      if (count >= maxLimit) {
        throw new Error(
          `您的作者授权密码免费额度 (${count}/${maxLimit} 次) 已用完！请在设置中输入您自己的 API Key 继续使用。`
        );
      }
      return {
        apiKey: envAuthorKey,
        model: 'gemini-3.1-flash-lite',
        isAuthorPassUsed: true,
        remainingCalls: maxLimit - count
      };
    }

    // 3. Fallback to Env variable if set directly
    if (envAuthorKey) {
      return {
        apiKey: envAuthorKey,
        model: settings.customModel || settings.model || 'gemini-3.1-flash-lite',
        isAuthorPassUsed: false,
        remainingCalls: Infinity
      };
    }

    // 4. No valid key or password
    return {
      apiKey: '',
      model: settings.model,
      isAuthorPassUsed: false,
      remainingCalls: 0
    };
  },

  getBatchResults: () => {
    try {
      const data = localStorage.getItem(BATCH_RESULTS_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  saveBatchResults: (results) => {
    try {
      localStorage.setItem(BATCH_RESULTS_KEY, JSON.stringify(results));
    } catch (e) {
      console.error('Error saving batch results:', e);
    }
  },

  exportDataJSON: () => {
    const notes = storageService.getNotes();
    const batchResults = storageService.getBatchResults();
    const exportObject = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      notes,
      batchResults
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(exportObject, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `smart_life_notes_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  exportDataCSV: () => {
    const notes = storageService.getNotes();
    const headers = ['ID', '时间', '地点', '类型', '内容', '标签'];
    const rows = notes.map((n) => [
      n.id,
      `"${n.timestamp || ''}"`,
      `"${n.location || ''}"`,
      n.type,
      `"${(n.content || '').replace(/"/g, '""')}"`,
      `"${(n.tags || []).join(',')}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `smart_life_notes_${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  importDataJSON: (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.notes && Array.isArray(parsed.notes)) {
        storageService.saveNotes(parsed.notes);
        if (parsed.batchResults) {
          storageService.saveBatchResults(parsed.batchResults);
        }
        return { success: true, count: parsed.notes.length };
      }
      return { success: false, error: '格式错误：未找到有效的笔记数组' };
    } catch (e) {
      return { success: false, error: `解析 JSON 失败: ${e.message}` };
    }
  }
};
