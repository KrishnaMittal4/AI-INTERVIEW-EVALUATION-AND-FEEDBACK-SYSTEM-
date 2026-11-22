/**
 * Centralized Text-to-Speech (TTS) Service
 * Clean abstraction layer over Web Speech API (SpeechSynthesis)
 * with support for future cloud TTS provider swaps (ElevenLabs, Google Cloud TTS, etc.)
 */

class TTSService {
  constructor() {
    this.synth = typeof window !== "undefined" ? window.speechSynthesis : null;
    this.isMuted = false;
    this.rate = 0.88; // Professional measured pace
    this.pitch = 0.82; // Authoritative pitch
    this.selectedVoice = null;
    this.onStateChangeCallbacks = new Set();
    this.isSpeaking = false;
    this.currentText = "";
    this.lastSpokenType = null; // 'question' | 'feedback' | 'intro' | 'transition'
    this.lastSpokenText = {
      question: "",
      feedback: "",
      intro: "",
      transition: "",
    };

    if (this.synth) {
      this._initVoices();
      if (typeof window !== "undefined") {
        window.speechSynthesis.onvoiceschanged = () => this._initVoices();
      }
    }
  }

  _initVoices() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    if (!voices || voices.length === 0) return;

    // Professional voice ranking
    const preferred =
      voices.find(v => /en[-_](GB|US)/i.test(v.lang) && /daniel/i.test(v.name)) ||
      voices.find(v => /en[-_]GB/i.test(v.lang) && /google/i.test(v.name)) ||
      voices.find(v => /en[-_]GB/i.test(v.lang)) ||
      voices.find(v => /en[-_]US/i.test(v.lang) && /google/i.test(v.name) && /male/i.test(v.name)) ||
      voices.find(v => /en[-_]US/i.test(v.lang) && /natural|neural/i.test(v.name)) ||
      voices.find(v => /en[-_]US/i.test(v.lang)) ||
      voices.find(v => /en/i.test(v.lang));

    if (preferred) {
      this.selectedVoice = preferred;
    }
  }

  subscribe(callback) {
    this.onStateChangeCallbacks.add(callback);
    return () => this.onStateChangeCallbacks.delete(callback);
  }

  _notify() {
    this.onStateChangeCallbacks.forEach(cb => {
      try {
        cb({
          isSpeaking: this.isSpeaking,
          isMuted: this.isMuted,
          rate: this.rate,
          currentText: this.currentText,
          lastType: this.lastSpokenType,
        });
      } catch (err) {
        console.error("TTS state change notification error:", err);
      }
    });
  }

  setMuted(muted) {
    this.isMuted = Boolean(muted);
    if (this.isMuted && this.synth) {
      this.stop();
    }
    this._notify();
  }

  toggleMute() {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  setRate(newRate) {
    const clamped = Math.max(0.5, Math.min(1.8, Number(newRate) || 0.88));
    this.rate = clamped;
    this._notify();
  }

  stop() {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {
        /* ignore */
      }
    }
    this.isSpeaking = false;
    this.currentText = "";
    this._notify();
  }

  /**
   * Speak a piece of text
   * @param {string} text - Message to speak
   * @param {Object} options - { type: 'question'|'feedback'|'intro', onStart, onEnd, onError }
   */
  speak(text, options = {}) {
    if (!text || typeof text !== "string") return;
    const cleanText = text.trim();
    if (!cleanText) return;

    const type = options.type || "general";
    this.lastSpokenType = type;
    this.lastSpokenText[type] = cleanText;
    this.currentText = cleanText;

    if (this.isMuted || !this.synth) {
      this._notify();
      if (options.onStart) options.onStart();
      if (options.onEnd) options.onEnd();
      return;
    }

    try {
      this.synth.cancel();
    } catch (e) {
      /* ignore */
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = this.rate;
    utterance.pitch = this.pitch;
    utterance.volume = 1.0;

    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      this._notify();
      if (options.onStart) options.onStart();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentText = "";
      this._notify();
      if (options.onEnd) options.onEnd();
    };

    utterance.onerror = (e) => {
      this.isSpeaking = false;
      this.currentText = "";
      this._notify();
      if (options.onError) options.onError(e);
      if (options.onEnd) options.onEnd();
    };

    try {
      this.synth.speak(utterance);
    } catch (err) {
      console.warn("TTS speak invocation failed:", err);
      this.isSpeaking = false;
      this._notify();
      if (options.onEnd) options.onEnd();
    }
  }

  replayQuestion() {
    if (this.lastSpokenText.question) {
      this.speak(this.lastSpokenText.question, { type: "question" });
    }
  }

  replayFeedback() {
    if (this.lastSpokenText.feedback) {
      this.speak(this.lastSpokenText.feedback, { type: "feedback" });
    }
  }
}

export const tts = new TTSService();
export default tts;
