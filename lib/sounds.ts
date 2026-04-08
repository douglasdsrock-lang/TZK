'use client';

/**
 * Utility to play gamer-style sound effects using Web Audio API
 */
class SoundManager {
  private audioContext: AudioContext | null = null;

  private init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  /**
   * Plays a "gamer" click sound
   */
  playClick() {
    try {
      this.init();
      if (!this.audioContext) return;

      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      // Gamer click style: short, high-pitched to low-pitched sweep
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.1);

      gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      osc.start();
      osc.stop(this.audioContext.currentTime + 0.1);
    } catch (error) {
      console.warn('Audio playback failed:', error);
    }
  }

  /**
   * Plays a "success" or "select" sound
   */
  playSelect() {
    try {
      this.init();
      if (!this.audioContext) return;

      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, this.audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.1);

      gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      osc.start();
      osc.stop(this.audioContext.currentTime + 0.2);
    } catch (error) {
      console.warn('Audio playback failed:', error);
    }
  }

  /**
   * Plays a "Level Up" celebratory sound
   */
  playLevelUp() {
    try {
      this.init();
      if (!this.audioContext) return;

      const now = this.audioContext.currentTime;
      
      // Arpeggio sound
      [440, 554.37, 659.25, 880].forEach((freq, i) => {
        const osc = this.audioContext!.createOscillator();
        const gain = this.audioContext!.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        
        gain.gain.setValueAtTime(0.05, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
        
        osc.connect(gain);
        gain.connect(this.audioContext!.destination);
        
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.3);
      });
    } catch (error) {
      console.warn('Audio playback failed:', error);
    }
  }

  /**
   * Plays an "Achievement" unlock sound
   */
  playAchievement() {
    try {
      this.init();
      if (!this.audioContext) return;

      const now = this.audioContext.currentTime;
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.2); // C6

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      osc.start();
      osc.stop(now + 0.4);
    } catch (error) {
      console.warn('Audio playback failed:', error);
    }
  }
}

export const soundManager = new SoundManager();
