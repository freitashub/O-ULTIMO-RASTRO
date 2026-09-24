import Phaser from 'phaser';
import { getState } from '@/game/GameState';

export type AudioChannel = 'master' | 'music' | 'sfx' | 'voice' | 'ambience';

type VolumeCapableSound = Phaser.Sound.BaseSound & { setVolume(v: number): void };

let currentMusic: VolumeCapableSound | null = null;
let currentMusicKey: string | null = null;
let currentAmbience: VolumeCapableSound | null = null;
let currentAmbienceKey: string | null = null;
let currentVoice: Phaser.Sound.BaseSound | null = null;
let muted = false;

function asVolumeCapable(sound: Phaser.Sound.BaseSound | null): VolumeCapableSound | null {
  if (!sound) return null;
  const candidate = sound as Partial<VolumeCapableSound>;
  if (typeof candidate.setVolume === 'function') {
    return sound as VolumeCapableSound;
  }
  return null;
}

export function channelVolume(channel: Exclude<AudioChannel, 'master'>): number {
  const s = getState().audioSettings;
  if (muted || s.muted) return 0;
  const channelVol =
    channel === 'music'
      ? s.musicVolume
      : channel === 'sfx'
        ? s.sfxVolume
        : channel === 'voice'
          ? s.voiceVolume
          : s.ambienceVolume;
  return Math.max(0, Math.min(1, s.masterVolume * channelVol));
}

function applyVolumes(): void {
  if (currentMusic) currentMusic.setVolume(channelVolume('music'));
  if (currentAmbience) currentAmbience.setVolume(channelVolume('ambience'));
  const voice = asVolumeCapable(currentVoice);
  if (voice) voice.setVolume(channelVolume('voice'));
}

export function playMusic(scene: Phaser.Scene, key: string, loop = true): void {
  stopMusic();
  if (!scene.cache.audio.exists(key)) {
    console.warn(`Áudio ${key} não encontrado no cache.`);
    return;
  }
  const sound = scene.sound.add(key, { loop, volume: channelVolume('music') });
  currentMusic = asVolumeCapable(sound);
  currentMusicKey = key;
  sound.play();
}

export function stopMusic(): void {
  if (currentMusic) {
    currentMusic.stop();
    currentMusic.destroy();
    currentMusic = null;
  }
  currentMusicKey = null;
}

export function getCurrentMusicKey(): string | null {
  return currentMusicKey;
}

export function playAmbience(scene: Phaser.Scene, key: string, loop = true): void {
  stopAmbience();
  if (!scene.cache.audio.exists(key)) {
    console.warn(`Ambience ${key} não encontrado no cache.`);
    return;
  }
  const sound = scene.sound.add(key, { loop, volume: channelVolume('ambience') });
  currentAmbience = asVolumeCapable(sound);
  currentAmbienceKey = key;
  sound.play();
}

export function stopAmbience(): void {
  if (currentAmbience) {
    currentAmbience.stop();
    currentAmbience.destroy();
    currentAmbience = null;
  }
  currentAmbienceKey = null;
}

export function getCurrentAmbienceKey(): string | null {
  return currentAmbienceKey;
}

export function playSfx(scene: Phaser.Scene, key: string, volume?: number): void {
  if (!scene.cache.audio.exists(key)) {
    console.warn(`SFX ${key} não encontrado.`);
    return;
  }
  const vol = volume !== undefined ? volume : channelVolume('sfx');
  scene.sound.play(key, { volume: vol });
}

/** Toca uma voz (apenas uma por vez). Retorna o som para sincronização, ou null. */
export function playVoice(scene: Phaser.Scene, key: string): Phaser.Sound.BaseSound | null {
  stopVoice();
  if (!scene.cache.audio.exists(key)) {
    console.warn(`Voice ${key} não encontrada.`);
    return null;
  }
  const sound = scene.sound.add(key, { volume: channelVolume('voice') });
  currentVoice = sound;
  sound.once('complete', () => {
    if (currentVoice === sound) currentVoice = null;
    sound.destroy();
  });
  sound.play();
  return sound;
}

export function stopVoice(): void {
  if (currentVoice) {
    currentVoice.stop();
    currentVoice.destroy();
    currentVoice = null;
  }
}

export function pauseVoice(): void {
  currentVoice?.pause();
}

export function resumeVoice(): void {
  currentVoice?.resume();
}

export function setChannelVolume(
  channel: Exclude<AudioChannel, 'master'>,
  volume: number
): void {
  const s = getState().audioSettings;
  const clamped = Math.max(0, Math.min(1, volume));
  if (channel === 'music') s.musicVolume = clamped;
  if (channel === 'sfx') s.sfxVolume = clamped;
  if (channel === 'voice') s.voiceVolume = clamped;
  if (channel === 'ambience') s.ambienceVolume = clamped;
  applyVolumes();
}

export function setMasterVolume(volume: number): void {
  getState().audioSettings.masterVolume = Math.max(0, Math.min(1, volume));
  applyVolumes();
}

/** Reaplica volumes atuais (após carregar save ou mudar settings). */
export function refreshVolumes(): void {
  muted = getState().audioSettings.muted;
  applyVolumes();
}

export function toggleMute(): boolean {
  const next = !isMuted();
  muted = next;
  getState().audioSettings.muted = next;
  applyVolumes();
  return next;
}

export function setMuted(value: boolean): void {
  muted = value;
  getState().audioSettings.muted = value;
  applyVolumes();
}

export function isMuted(): boolean {
  return muted || getState().audioSettings.muted;
}

export function fadeInMusic(
  scene: Phaser.Scene,
  key: string,
  durationMs = 1000,
  targetVolume?: number
): void {
  playMusic(scene, key, true);
  if (!currentMusic) return;
  const target = targetVolume ?? channelVolume('music');
  currentMusic.setVolume(0);
  const proxy = { v: 0 };
  scene.tweens.add({
    targets: proxy,
    v: target,
    duration: durationMs,
    onUpdate: () => {
      if (currentMusic) currentMusic.setVolume(proxy.v);
    }
  });
}

export function fadeOutMusic(scene: Phaser.Scene, durationMs = 1000): void {
  if (!currentMusic) return;
  const music = currentMusic;
  const start = channelVolume('music');
  const proxy = { v: start };
  currentMusic = null;
  currentMusicKey = null;
  scene.tweens.add({
    targets: proxy,
    v: 0,
    duration: durationMs,
    onUpdate: () => {
      music.setVolume(proxy.v);
    },
    onComplete: () => {
      music.stop();
      music.destroy();
    }
  });
}

export function setMusicVolume(_scene: Phaser.Scene, volume: number): void {
  setChannelVolume('music', volume);
}

export function pauseAllAudio(): void {
  currentMusic?.pause();
  currentAmbience?.pause();
  currentVoice?.pause();
}

export function resumeAllAudio(): void {
  currentMusic?.resume();
  currentAmbience?.resume();
  currentVoice?.resume();
}

export function stopAllAudio(): void {
  stopMusic();
  stopAmbience();
  stopVoice();
}
