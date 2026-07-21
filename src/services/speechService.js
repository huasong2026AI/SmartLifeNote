// Speech-to-Text and Audio Recording service with multi-language support (中文/日本語/English)

export class SpeechService {
  constructor() {
    this.recognition = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isListening = false;
    this.isRecordingAudio = false;
    this.currentLang = 'zh-CN'; // Default language

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.currentLang;
    }
  }

  isSpeechRecognitionSupported() {
    return !!this.recognition;
  }

  setLanguage(langCode) {
    this.currentLang = langCode;
    if (this.recognition) {
      this.recognition.lang = langCode;
    }
  }

  startSpeechToText(onResult, onError, langCode = 'zh-CN') {
    if (!this.recognition) {
      if (onError) onError('当前浏览器不支持实时语音识别，请直接输入文本或录音');
      return;
    }

    // Set recognition language
    this.currentLang = langCode;
    this.recognition.lang = langCode;
    this.isListening = true;
    let accumulatedFinal = '';

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          accumulatedFinal += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      onResult({
        final: accumulatedFinal,
        interim: interimTranscript,
        full: (accumulatedFinal + interimTranscript).trim()
      });
    };

    this.recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      if (onError) onError(`语音识别提示: ${event.error}`);
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        try {
          this.recognition.start();
        } catch (e) {
          // Ignore restart error
        }
      }
    };

    try {
      this.recognition.start();
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
    }
  }

  stopSpeechToText() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Ignore
      }
    }
  }

  // Audio Recording with MediaRecorder
  async startAudioRecording() {
    this.audioChunks = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
      this.isRecordingAudio = true;
      return true;
    } catch (e) {
      console.error('Microphone access denied or error:', e);
      throw e;
    }
  }

  stopAudioRecording() {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        this.isRecordingAudio = false;

        // Stop all audio tracks to release microphone
        if (this.mediaRecorder.stream) {
          this.mediaRecorder.stream.getTracks().forEach((track) => track.stop());
        }

        resolve({ audioBlob, audioUrl });
      };

      this.mediaRecorder.stop();
    });
  }
}

export const speechService = new SpeechService();
