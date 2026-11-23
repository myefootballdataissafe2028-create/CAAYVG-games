class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  private playTone(
    freqStart: number,
    freqEnd: number,
    duration: number,
    type: OscillatorType = 'square',
    gainPeak = 0.08,
    delay = 0
  ) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, now);
    if (freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqEnd), now + duration);
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(gainPeak, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playMenuBlip() {
    this.playTone(520, 780, 0.06, 'square', 0.06);
  }

  public playPass() {
    const pitchVar = 0.94 + Math.random() * 0.12;
    this.playTone(220 * pitchVar, 110 * pitchVar, 0.07, 'triangle', 0.1);
  }

  public playShoot(power = 0.8) {
    const pitchVar = 0.95 + Math.random() * 0.1;
    this.playTone((260 + power * 120) * pitchVar, 65, 0.14, 'square', 0.11);
  }

  public playTackle() {
    this.playTone(150, 55, 0.1, 'sawtooth', 0.08);
  }

  public playWhistle() {
    this.playTone(2150, 2240, 0.09, 'square', 0.06, 0);
    this.playTone(2260, 2120, 0.14, 'square', 0.06, 0.11);
  }

  public playCard(isRed: boolean) {
    if (isRed) {
      this.playTone(392, 370, 0.14, 'sawtooth', 0.1, 0);
      this.playTone(261, 220, 0.28, 'sawtooth', 0.11, 0.15);
    } else {
      this.playTone(523, 523, 0.1, 'square', 0.08, 0);
      this.playTone(440, 440, 0.14, 'square', 0.08, 0.11);
    }
  }

  public playGoalFanfare() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.playTone(n, n, idx === 3 ? 0.35 : 0.11, 'square', 0.09, idx * 0.1);
    });
  }

  public playPostClang() {
    this.playTone(880, 440, 0.16, 'triangle', 0.11);
  }

  public playCrowdChant(intensity: number, isRivalry: boolean) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    // Rhythmic 8-bit "Oh-Oh-Oh!" stadium chant melody + drum beat scaled by intensity
    const vol = Math.min(0.055, 0.02 + intensity * 0.035);
    const notes = isRivalry ? [330, 392, 440, 392, 523] : [262, 294, 330, 294];
    notes.forEach((freq, idx) => {
      this.playTone(freq, freq * 1.02, 0.14, 'triangle', vol, idx * 0.16);
      // Soft drum pulse on beats 0 and 2
      if (idx % 2 === 0) {
        this.playTone(110, 45, 0.08, 'sine', vol * 1.2, idx * 0.16);
      }
    });
  }
}

export const soundEngine = new SoundEngine();
