export class AudioEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this._enabled = true;
    }

    get isEnabled() {
        return this._enabled;
    }

    init() {
        if (!this.ctx && this._enabled) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            this.masterGain.gain.value = 0.3;
        }
    }

    toggle() {
        this._enabled = !this._enabled;
        if (!this._enabled && this.ctx) {
            this.ctx.suspend();
        } else if (this._enabled && this.ctx) {
            this.ctx.resume();
        }
        return this._enabled;
    }

    playKeystroke() {
        if (!this._enabled) return;
        this.init();
        const bufferSize = this.ctx.sampleRate * 0.045; // 45ms
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1200;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.045);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start();
        noise.stop(this.ctx.currentTime + 0.045);
    }

    playCorrect() {
        if (!this._enabled) return;
        this.init();
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';

        osc1.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
        osc2.frequency.setValueAtTime(880, this.ctx.currentTime); // A5

        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.masterGain);

        osc1.start();
        osc2.start();
        osc1.stop(this.ctx.currentTime + 0.3);
        osc2.stop(this.ctx.currentTime + 0.3);
    }

    playWrong() {
        if (!this._enabled) return;
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.2);

        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    }

    playCombo(multiplier) {
        if (!this._enabled) return;
        this.init();
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        const numNotes = Math.min(multiplier, notes.length);

        for (let i = 0; i < numNotes; i++) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(notes[i], this.ctx.currentTime + i * 0.1);
            
            gain.gain.setValueAtTime(0.3, this.ctx.currentTime + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + i * 0.1 + 0.3);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start(this.ctx.currentTime + i * 0.1);
            osc.stop(this.ctx.currentTime + i * 0.1 + 0.3);
        }

        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(65.41, this.ctx.currentTime); // C2
        subOsc.frequency.exponentialRampToValueAtTime(32.7, this.ctx.currentTime + 0.3);
        subGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
        subGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        subOsc.connect(subGain);
        subGain.connect(this.masterGain);
        subOsc.start();
        subOsc.stop(this.ctx.currentTime + 0.3);
    }

    playTick() {
        if (!this._enabled) return;
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.03);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.03);
    }

    playUrgent() {
        if (!this._enabled) return;
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(60, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playLevelUp() {
        if (!this._enabled) return;
        this.init();
        const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
        for (let i = 0; i < notes.length; i++) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'square';
            osc.frequency.setValueAtTime(notes[i], this.ctx.currentTime + i * 0.1);
            
            gain.gain.setValueAtTime(0.2, this.ctx.currentTime + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + i * 0.1 + 0.4);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start(this.ctx.currentTime + i * 0.1);
            osc.stop(this.ctx.currentTime + i * 0.1 + 0.4);
        }
    }
}
