import { describe, it, expect } from 'vitest';
import { createCutscenePlayer, CutscenePlayer } from '@/systems/CutscenePlayer';
import { createDialogueSystem } from '@/systems/DialogueSystem';
import { createSubtitleRenderer } from '@/systems/SubtitleRenderer';

const fakeScene = {
  time: {
    delayedCall: (_ms: number, cb: () => void) => {
      cb();
      return { remove: () => undefined };
    },
    now: 0
  },
  game: {
    registry: {
      get: () => undefined
    }
  },
  cameras: {
    main: {
      scrollX: 0,
      scrollY: 0,
      zoom: 1,
      width: 800,
      height: 600
    }
  },
  tweens: {
    add: (config: { onComplete?: () => void }) => {
      config.onComplete?.();
      return {};
    }
  },
  add: {
    text: () => ({
      setOrigin: function () {
        return this;
      },
      setDepth: function () {
        return this;
      },
      destroy: () => undefined
    }),
    rectangle: () => ({
      setDepth: function () {
        return this;
      },
      setOrigin: function () {
        return this;
      },
      destroy: () => undefined
    })
  },
  cache: {
    audio: { exists: () => false }
  },
  sound: {
    add: () => ({ play: () => undefined }),
    play: () => undefined
  }
} as unknown as Phaser.Scene;

describe('DialogueSystem', () => {
  it('plays lines and ends', () => {
    const dialogue = createDialogueSystem(fakeScene);
    let ended = false;
    let linesSeen = 0;
    dialogue.play(
      [
        { id: 'a', character: 'theo', text: 'Olá', duration: 10 },
        { id: 'b', character: 'clara', text: 'Oi', duration: 10 }
      ],
      {
        onLine: () => {
          linesSeen += 1;
        },
        onEnd: () => {
          ended = true;
        }
      }
    );
    expect(linesSeen).toBeGreaterThanOrEqual(1);
    expect(ended || dialogue.getState() === 'playing').toBe(true);
  });

  it('skip ends immediately', () => {
    const dialogue = createDialogueSystem(fakeScene);
    let ended = false;
    dialogue.play([{ id: 'a', character: 'theo', text: 'x', duration: 9999 }], {
      onEnd: () => {
        ended = true;
      }
    });
    dialogue.skip();
    expect(ended).toBe(true);
    expect(dialogue.getState()).toBe('ended');
  });
});

describe('SubtitleRenderer', () => {
  it('shows and clears without crash', () => {
    const subs = createSubtitleRenderer(fakeScene);
    subs.show({ text: 'Olá', startMs: 0, endMs: 100, speaker: 'theo' });
    expect(subs.isEnabled()).toBe(true);
    subs.clear();
    subs.destroy();
  });
});

describe('CutscenePlayer', () => {
  it('plays a wait sequence to end', () => {
    const player = createCutscenePlayer(fakeScene);
    let ended = false;
    player.play([{ type: 'wait', duration: 1 }], {
      onEnd: () => {
        ended = true;
      }
    });
    expect(ended).toBe(true);
    expect(player.getState()).toBe('ended');
  });

  it('skip finishes cutscene', () => {
    const player: CutscenePlayer = createCutscenePlayer(fakeScene);
    let ended = false;
    player.play([{ type: 'wait', duration: 9999 }], {
      onEnd: () => {
        ended = true;
      }
    });
    player.skip();
    expect(ended || player.getState() === 'ended').toBe(true);
  });
});
