/**
 * MiroFish v4 - 音效系统
 * Web Audio API 生成音效
 */

class AudioSystem {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.enabled = true;
    this.sounds = {};
    this._init();
  }

  _init() {
    const start = () => {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.master = this.ctx.createGain();
        this.master.connect(this.ctx.destination);
        this.master.gain.value = 0.6;
        this._build();
      }
      document.removeEventListener('click', start);
      document.removeEventListener('touchstart', start);
    };
    document.addEventListener('click', start);
    document.addEventListener('touchstart', start);
  }

  _build() {
    this.sounds.click = () => this._tone(800, 600, 0.1, 0.25);
    this.sounds.hover = () => this._tone(1000, 1000, 0.05, 0.04);
    this.sounds.type = () => this._tone(600 + Math.random() * 200, 600, 0.04, 0.08);
    this.sounds.transition = () => this._tone(400, 800, 0.3, 0.15);
    this.sounds.expand = () => this._tone(400, 800, 0.15, 0.15);
    this.sounds.collapse = () => this._tone(800, 400, 0.15, 0.15);
    this.sounds.pulse = () => this._tone(440, 440, 0.2, 0.2);
    this.sounds.progress = () => this._steps([500, 600, 700], 0.05, 0.12);
    this.sounds.data = () => this._steps([800, 1000, 1200], 0.05, 0.1);
    this.sounds.connect = () => {
      if (!this.enabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.connect(g); g.connect(this.master);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.setValueAtTime(800, now + 0.1);
      osc.frequency.setValueAtTime(600, now + 0.2);
      g.gain.setValueAtTime(0.15, now);
      g.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now); osc.stop(now + 0.3);
    };
    this.sounds.scan = () => {
      if (!this.enabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.connect(g); g.connect(this.master);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.5);
      osc.frequency.exponentialRampToValueAtTime(300, now + 1);
      g.gain.setValueAtTime(0.12, now);
      g.gain.exponentialRampToValueAtTime(0.01, now + 1);
      osc.start(now); osc.stop(now + 1);
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
        g.gain.setValueAtTime(0.25, now + i * 0.1);
        g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.2);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.2);
      });
    };
    this.sounds.complete = () => {
      if (!this.enabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.connect(g); g.connect(this.master);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.1);
        g.gain.setValueAtTime(0.2, now + i * 0.1);
        g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.3);
      });
    };
    this.sounds.warning = () => {
      if (!this.enabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      for (let i = 0; i < 2; i++) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.connect(g); g.connect(this.master);
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now + i * 0.15);
        g.gain.setValueAtTime(0.15, now + i * 0.15);
        g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.1);
        osc.start(now + i * 0.15);
        osc.stop(now + i * 0.15 + 0.1);
      }
    };
    this.sounds.error = () => {
      if (!this.enabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.connect(g); g.connect(this.master);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
      g.gain.setValueAtTime(0.25, now);
      g.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now); osc.stop(now + 0.3);
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

  play(name) {
    if (this.sounds[name]) this.sounds[name]();
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

window.audioSystem = new AudioSystem();
