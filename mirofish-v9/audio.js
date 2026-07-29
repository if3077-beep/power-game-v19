/**
 * MiroFish v9 - 增强音效系统
 * Web Audio API + 环境音 + 情绪音效
 */

class AudioSystem {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.enabled = true;
    this.sounds = {};
    this.bgmGain = null;
    this.bgmRunning = false;
    this._init();
  }

  _init() {
    const start = () => {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.master = this.ctx.createGain();
        this.master.connect(this.ctx.destination);
        this.master.gain.value = 0.5;

        this.bgmGain = this.ctx.createGain();
        this.bgmGain.connect(this.master);
        this.bgmGain.gain.value = 0.08;

        this._build();
      }
      document.removeEventListener('click', start);
      document.removeEventListener('touchstart', start);
    };
    document.addEventListener('click', start);
    document.addEventListener('touchstart', start);
  }

  _build() {
    // 基础交互音
    this.sounds.click = () => this._tone(600, 800, 0.08, 0.15);
    this.sounds.hover = () => this._tone(900, 1100, 0.04, 0.03);
    this.sounds.type = () => this._tone(500 + Math.random() * 300, 500, 0.03, 0.06);

    // 阶段转换音
    this.sounds.transition = () => {
      this._tone(300, 600, 0.25, 0.12);
      setTimeout(() => this._tone(400, 800, 0.2, 0.1), 100);
    };

    // 推演过程音
    this.sounds.scan = () => {
      if (!this.enabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.connect(g); g.connect(this.master);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.4);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.8);
      g.gain.setValueAtTime(0.08, now);
      g.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
      osc.start(now); osc.stop(now + 0.8);
    };

    this.sounds.progress = () => this._steps([400, 500, 600], 0.06, 0.08);
    this.sounds.data = () => this._steps([600, 800, 1000], 0.04, 0.06);

    // 完成音（更丰富的和弦）
    this.sounds.complete = () => {
      if (!this.enabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      const chord = [523.25, 659.25, 783.99, 1046.50];
      chord.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.connect(g); g.connect(this.master);
        osc.type = i < 2 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(f, now + i * 0.08);
        g.gain.setValueAtTime(0.15, now + i * 0.08);
        g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.4);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.4);
      });
    };

    this.sounds.success = () => {
      if (!this.enabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.connect(g); g.connect(this.master);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.1);
        g.gain.setValueAtTime(0.2, now + i * 0.1);
        g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.25);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.25);
      });
    };

    // 警告音
    this.sounds.warning = () => {
      if (!this.enabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      for (let i = 0; i < 2; i++) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.connect(g); g.connect(this.master);
        osc.type = 'square';
        osc.frequency.setValueAtTime(330, now + i * 0.15);
        g.gain.setValueAtTime(0.1, now + i * 0.15);
        g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.1);
        osc.start(now + i * 0.15);
        osc.stop(now + i * 0.15 + 0.1);
      }
    };

    // 错误音
    this.sounds.error = () => {
      if (!this.enabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.connect(g); g.connect(this.master);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(250, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.3);
      g.gain.setValueAtTime(0.15, now);
      g.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now); osc.stop(now + 0.3);
    };

    // 新增：洞察揭示音
    this.sounds.insight = () => {
      if (!this.enabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.connect(g); g.connect(this.master);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      g.gain.setValueAtTime(0.1, now);
      g.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now); osc.stop(now + 0.2);
    };

    // 新增：选择音
    this.sounds.select = () => {
      if (!this.enabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      [660, 880].forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.connect(g); g.connect(this.master);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.06);
        g.gain.setValueAtTime(0.12, now + i * 0.06);
        g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.06 + 0.15);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.15);
      });
    };

    // 新增：揭示音（结果出现时）
    this.sounds.reveal = () => {
      if (!this.enabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      [330, 440, 550, 660, 880].forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.connect(g); g.connect(this.master);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.05);
        g.gain.setValueAtTime(0.08, now + i * 0.05);
        g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.3);
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.3);
      });
    };

    // 新增：打字机音效
    this.sounds.typewriter = () => {
      if (!this.enabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      const freq = 800 + Math.random() * 400;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.connect(g); g.connect(this.master);
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now);
      g.gain.setValueAtTime(0.02, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
      osc.start(now); osc.stop(now + 0.02);
    };
  }

  _tone(startFreq, endFreq, duration, gain) {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.connect(g); g.connect(this.master);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.01, now + duration);
    osc.start(now); osc.stop(now + duration);
  }

  _steps(freqs, stepDur, gain) {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    freqs.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.connect(g); g.connect(this.master);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * stepDur);
      g.gain.setValueAtTime(gain, now + i * stepDur);
      g.gain.exponentialRampToValueAtTime(0.01, now + i * stepDur + stepDur * 1.5);
      osc.start(now + i * stepDur);
      osc.stop(now + i * stepDur + stepDur * 1.5);
    });
  }

  // 环境 BGM（低频嗡鸣）
  startAmbient(mood) {
    if (!this.enabled || !this.ctx || this.bgmRunning) return;
    this.bgmRunning = true;

    const baseFreqs = {
      anxious: [110, 130.81, 146.83],
      angry: [98, 116.54, 130.81],
      sad: [130.81, 146.83, 164.81],
      confused: [123.47, 138.59, 155.56],
      hopeful: [164.81, 196, 220],
      fearful: [98, 110, 123.47],
      neutral: [130.81, 164.81, 196],
      excited: [196, 246.94, 293.66],
    };

    const freqs = baseFreqs[mood] || baseFreqs.neutral;
    let idx = 0;

    const playNote = () => {
      if (!this.bgmRunning || !this.enabled) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.connect(g); g.connect(this.bgmGain);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freqs[idx % freqs.length], now);
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.3, now + 0.5);
      g.gain.linearRampToValueAtTime(0, now + 2.5);
      osc.start(now); osc.stop(now + 2.5);
      idx++;
      setTimeout(playNote, 2500);
    };

    playNote();
  }

  stopAmbient() {
    this.bgmRunning = false;
  }

  play(name) {
    if (this.sounds[name]) this.sounds[name]();
  }

  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) this.stopAmbient();
    return this.enabled;
  }
}

window.audioSystem = new AudioSystem();
