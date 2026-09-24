import Phaser from 'phaser';

import { gameConfig } from '@/config/gameConfig';

import { BootScene } from '@/scenes/BootScene';
import { PreloadScene } from '@/scenes/PreloadScene';
import { TitleScene } from '@/scenes/TitleScene';
import { MenuScene } from '@/scenes/MenuScene';
import { IntroScene } from '@/scenes/IntroScene';
import { StoryScene } from '@/scenes/StoryScene';
import { ChoiceScene } from '@/scenes/ChoiceScene';
import { CluesScene } from '@/scenes/CluesScene';
import { DiaryScene } from '@/scenes/DiaryScene';
import { PuzzleScene } from '@/scenes/PuzzleScene';
import { EndingScene } from '@/scenes/EndingScene';
import { EndingTestScene } from '@/scenes/EndingTestScene';
import { CreditsScene } from '@/scenes/CreditsScene';
import { SettingsScene } from '@/scenes/SettingsScene';
import { CutsceneScene } from '@/scenes/CutsceneScene';

const config: Phaser.Types.Core.GameConfig = {
  ...gameConfig,
  scene: [
    BootScene,
    PreloadScene,
    TitleScene,
    MenuScene,
    IntroScene,
    StoryScene,
    ChoiceScene,
    CluesScene,
    DiaryScene,
    PuzzleScene,
    EndingScene,
    EndingTestScene,
    CreditsScene,
    SettingsScene,
    CutsceneScene
  ]
};

const game = new Phaser.Game(config);

// Exposto apenas em dev para automação de QA (final-qa-av.mjs); ausente no build de produção.
if (import.meta.env.DEV) {
  (window as unknown as { __UR_GAME__?: Phaser.Game }).__UR_GAME__ = game;
}
