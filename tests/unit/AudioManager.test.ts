import { describe, it, expect, beforeEach } from 'vitest';
import { resetState, getState } from '@/game/GameState';
import { channelVolume, isMuted, setChannelVolume, setMasterVolume, setMuted, toggleMute, refreshVolumes } from '@/game/AudioManager';

describe('AudioManager volumes & mute', () => {
  beforeEach(() => {
    resetState();
    setMuted(false);
  });

  it('channel volume = master × channel', () => {
    setMasterVolume(0.5);
    setChannelVolume('music', 0.5);
    expect(channelVolume('music')).toBeCloseTo(0.25);
    setChannelVolume('ambience', 1);
    expect(channelVolume('ambience')).toBeCloseTo(0.5);
  });

  it('toggleMute flips from persisted state too', () => {
    getState().audioSettings.muted = true;
    refreshVolumes();
    expect(isMuted()).toBe(true);
    expect(channelVolume('voice')).toBe(0);
    expect(toggleMute()).toBe(false);
    expect(isMuted()).toBe(false);
    expect(channelVolume('voice')).toBeGreaterThan(0);
  });
});
