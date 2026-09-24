# HISTORY.md

## v0.2.0 (2026-09-23) — Integração completa

### Added
- GameState v3: flags, unlockedEndings, language, audio/subtitle/accessibility settings
- Save migration v1→v2→v3 (`migrateSave`)
- Phases 4–20 complete (20 total) from official spec
- Clues v3 fields + 21 clues
- Cube config (`cube-config.json`) loaded by PuzzleScene
- REVELATION step in ChoiceScene narrative chain
- i18n: pt-BR / en-US / es-ES with `t(key, params?)`
- SettingsScene (audio / subtitles / accessibility tabs)
- AudioManager modular (music/ambience/sfx/voice, master, mute, fade)
- SubtitleRenderer
- DialogueSystem (play/pause/skip/replay)
- CutscenePlayer (dialogue/subtitle/wait/sfx/voice/camera steps)
- AssetRegistry + optional asset loading
- EndingResolver (reason strings for ending rules)
- Language toggle in menu, persisted to save
- Settings shortcuts in main menu
- docs/ documentation

### Changed
- ChoiceSystem sets flags on reward/wrong choices
- PreloadScene loads via AssetRegistry (tolerant of missing optional assets)
- StoryScene shows subtitles for intro line
- Transformation hints via i18n keys
- Smoke test updated for real phases 4–20 and expanded menu

### Preserved
- Ending rules (bad/secret/good) unchanged from spec
- TransformationSystem thresholds unchanged
- All prior tests kept green

## v0.1.0 — Technical foundation
- 13 scenes, core systems, 81 unit tests, smoke 14/14
