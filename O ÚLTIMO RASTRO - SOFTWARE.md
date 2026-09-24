\# GUIA DE IMPLEMENTAÇÃO PARA ENGENHEIRO DE SOFTWARE

\#\# Projeto: O Último Rastro

\#\# Documento operacional — ação por ação, setor por setor

&nbsp;

\*\*Versão:\*\* 1.0

\*\*Público:\*\* engenheiro(a) de software responsável pela implementação técnica

\*\*Objetivo:\*\* transformar a especificação narrativa v2.0 em código funcional, testável e entregável

\*\*Pré-requisito:\*\* ler o documento de especificação completo antes de começar

&nbsp;

\---

&nbsp;

\# ÍNDICE

&nbsp;

\`\`\`text

SETOR 0  — PREPARAÇÃO DO AMBIENTE

SETOR 1  — ESTRUTURA BASE DO PROJETO

SETOR 2  — CONFIGURAÇÃO DO PHASER

SETOR 3  — TIPOS E INTERFACES

SETOR 4  — GAME STATE

SETOR 5  — SAVE MANAGER

SETOR 6  — PHASE VALIDATOR

SETOR 7  — PHASE LOADER

SETOR 8  — CHOICE SYSTEM

SETOR 9  — CLUE SYSTEM

SETOR 10 — SYMBOL SYSTEM

SETOR 11 — TRANSFORMATION SYSTEM

SETOR 12 — ENDING SYSTEM

SETOR 13 — AUDIO MANAGER

SETOR 14 — CENA: BOOT

SETOR 15 — CENA: PRELOAD

SETOR 16 — CENA: MENU

SETOR 17 — CENA: INTRO

SETOR 18 — CENA: STORY

SETOR 19 — CENA: CHOICE

SETOR 20 — CENA: DIARY

SETOR 21 — CENA: PUZZLE

SETOR 22 — CENA: ENDING

SETOR 23 — CENA: CREDITS

SETOR 24 — UI COMPONENTS

SETOR 25 — RESPONSIVIDADE

SETOR 26 — TESTES

SETOR 27 — BUILD E DEPLOY

SETOR 28 — PÓS-MVP

\`\`\`

&nbsp;

\---

&nbsp;

\# SETOR 0 — PREPARAÇÃO DO AMBIENTE

&nbsp;

\#\# Ação 0.1 — Instalar ferramentas base

&nbsp;

Verificar se estão instalados:

&nbsp;

\`\`\`bash

node \--version    \# esperado: \>= 20.x

npm \--version     \# esperado: \>= 10.x

git \--version     \# esperado: \>= 2.40

\`\`\`

&nbsp;

Se faltar algo, instalar via site oficial:

\- Node.js: https://nodejs.org

\- Git: https://git-scm.com

&nbsp;

\#\# Ação 0.2 — Verificar editor

&nbsp;

Recomendado: VS Code com extensões:

&nbsp;

\`\`\`text

ESLint

Prettier

TypeScript Vue Plugin (opcional)

EditorConfig for VS Code

\`\`\`

&nbsp;

Criar \`.editorconfig\` na raiz:

&nbsp;

\`\`\`ini

root \= true

&nbsp;

\[\*\]

charset \= utf-8

end\_of\_line \= lf

insert\_final\_newline \= true

indent\_style \= space

indent\_size \= 2

trim\_trailing\_whitespace \= true

\`\`\`

&nbsp;

\#\# Ação 0.3 — Criar pasta do projeto

&nbsp;

\`\`\`bash

mkdir freitas-troll-game

cd freitas-troll-game

git init

\`\`\`

&nbsp;

\#\# Ação 0.4 — Criar \`.gitignore\`

&nbsp;

\`\`\`gitignore

node\_modules/

dist/

.env

.env.local

\*.log

.DS\_Store

.vscode/

coverage/

\`\`\`

&nbsp;

\---

&nbsp;

\# SETOR 1 — ESTRUTURA BASE DO PROJETO

&nbsp;

\#\# Ação 1.1 — Inicializar Vite \+ TypeScript

&nbsp;

\`\`\`bash

npm create vite@latest . \-- \--template vanilla-ts

\`\`\`

&nbsp;

Confirmar sobrescrever se a pasta não estiver vazia.

&nbsp;

\#\# Ação 1.2 — Instalar Phaser

&nbsp;

\`\`\`bash

npm install phaser@^4.0.0

\`\`\`

&nbsp;

Verificar versão instalada:

&nbsp;

\`\`\`bash

npm list phaser

\`\`\`

&nbsp;

\#\# Ação 1.3 — Instalar dependências de desenvolvimento

&nbsp;

\`\`\`bash

npm install \-D \\

&nbsp;&nbsp;@types/node \\

&nbsp;&nbsp;typescript \\

&nbsp;&nbsp;vite \\

&nbsp;&nbsp;vitest \\

&nbsp;&nbsp;@vitest/coverage-v8 \\

&nbsp;&nbsp;eslint \\

&nbsp;&nbsp;prettier \\

&nbsp;&nbsp;eslint-config-prettier \\

&nbsp;&nbsp;@typescript-eslint/eslint-plugin \\

&nbsp;&nbsp;@typescript-eslint/parser

\`\`\`

&nbsp;

\#\# Ação 1.4 — Criar estrutura de pastas

&nbsp;

Executar exatamente:

&nbsp;

\`\`\`bash

mkdir \-p src/config

mkdir \-p src/game

mkdir \-p src/scenes

mkdir \-p src/systems

mkdir \-p src/data

mkdir \-p src/ui

mkdir \-p src/utils

mkdir \-p src/types

mkdir \-p public/assets/backgrounds

mkdir \-p public/assets/characters

mkdir \-p public/assets/trolls

mkdir \-p public/assets/props

mkdir \-p public/assets/symbols

mkdir \-p public/assets/audio

mkdir \-p public/assets/music

mkdir \-p tests/unit

mkdir \-p tests/integration

\`\`\`

&nbsp;

A estrutura final deve ser:

&nbsp;

\`\`\`text

freitas-troll-game/

├── src/

│   ├── config/

│   ├── game/

│   ├── scenes/

│   ├── systems/

│   ├── data/

│   ├── ui/

│   ├── utils/

│   ├── types/

│   └── main.ts

├── public/

│   └── assets/

├── tests/

│   ├── unit/

│   └── integration/

├── index.html

├── package.json

├── tsconfig.json

├── vite.config.ts

└── .editorconfig

\`\`\`

&nbsp;

\#\# Ação 1.5 — Configurar \`tsconfig.json\`

&nbsp;

Substituir conteúdo por:

&nbsp;

\`\`\`json

{

&nbsp;&nbsp;"compilerOptions": {

&nbsp;&nbsp;&nbsp;&nbsp;"target": "ES2022",

&nbsp;&nbsp;&nbsp;&nbsp;"module": "ESNext",

&nbsp;&nbsp;&nbsp;&nbsp;"moduleResolution": "Bundler",

&nbsp;&nbsp;&nbsp;&nbsp;"lib": \["ES2022", "DOM", "DOM.Iterable"\],

&nbsp;&nbsp;&nbsp;&nbsp;"strict": true,

&nbsp;&nbsp;&nbsp;&nbsp;"noUnusedLocals": true,

&nbsp;&nbsp;&nbsp;&nbsp;"noUnusedParameters": true,

&nbsp;&nbsp;&nbsp;&nbsp;"noFallthroughCasesInSwitch": true,

&nbsp;&nbsp;&nbsp;&nbsp;"noImplicitReturns": true,

&nbsp;&nbsp;&nbsp;&nbsp;"esModuleInterop": true,

&nbsp;&nbsp;&nbsp;&nbsp;"skipLibCheck": true,

&nbsp;&nbsp;&nbsp;&nbsp;"resolveJsonModule": true,

&nbsp;&nbsp;&nbsp;&nbsp;"isolatedModules": true,

&nbsp;&nbsp;&nbsp;&nbsp;"allowImportingTsExtensions": false,

&nbsp;&nbsp;&nbsp;&nbsp;"baseUrl": ".",

&nbsp;&nbsp;&nbsp;&nbsp;"paths": {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"@/\*": \["src/\*"\]

&nbsp;&nbsp;&nbsp;&nbsp;},

&nbsp;&nbsp;&nbsp;&nbsp;"types": \["vitest/globals", "node"\]

&nbsp;&nbsp;},

&nbsp;&nbsp;"include": \["src", "tests"\],

&nbsp;&nbsp;"exclude": \["node\_modules", "dist"\]

}

\`\`\`

&nbsp;

\#\# Ação 1.6 — Configurar \`vite.config.ts\`

&nbsp;

\`\`\`ts

import { defineConfig } from 'vite';

import { fileURLToPath, URL } from 'node:url';

&nbsp;

export default defineConfig({

&nbsp;&nbsp;resolve: {

&nbsp;&nbsp;&nbsp;&nbsp;alias: {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'@': fileURLToPath(new URL('./src', import.meta.url))

&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;&nbsp;},

&nbsp;&nbsp;build: {

&nbsp;&nbsp;&nbsp;&nbsp;target: 'es2022',

&nbsp;&nbsp;&nbsp;&nbsp;sourcemap: true,

&nbsp;&nbsp;&nbsp;&nbsp;chunkSizeWarningLimit: 1500

&nbsp;&nbsp;},

&nbsp;&nbsp;server: {

&nbsp;&nbsp;&nbsp;&nbsp;port: 5173,

&nbsp;&nbsp;&nbsp;&nbsp;open: true

&nbsp;&nbsp;}

});

\`\`\`

&nbsp;

\#\# Ação 1.7 — Configurar scripts no \`package.json\`

&nbsp;

Adicionar em \`"scripts"\`:

&nbsp;

\`\`\`json

{

&nbsp;&nbsp;"scripts": {

&nbsp;&nbsp;&nbsp;&nbsp;"dev": "vite",

&nbsp;&nbsp;&nbsp;&nbsp;"build": "tsc \--noEmit && vite build",

&nbsp;&nbsp;&nbsp;&nbsp;"preview": "vite preview",

&nbsp;&nbsp;&nbsp;&nbsp;"test": "vitest run",

&nbsp;&nbsp;&nbsp;&nbsp;"test:watch": "vitest",

&nbsp;&nbsp;&nbsp;&nbsp;"test:coverage": "vitest run \--coverage",

&nbsp;&nbsp;&nbsp;&nbsp;"lint": "eslint src \--ext .ts",

&nbsp;&nbsp;&nbsp;&nbsp;"format": "prettier \--write \\"src/\*\*/\*.ts\\""

&nbsp;&nbsp;}

}

\`\`\`

&nbsp;

\#\# Ação 1.8 — Configurar \`vitest.config.ts\`

&nbsp;

\`\`\`ts

import { defineConfig } from 'vitest/config';

import { fileURLToPath, URL } from 'node:url';

&nbsp;

export default defineConfig({

&nbsp;&nbsp;resolve: {

&nbsp;&nbsp;&nbsp;&nbsp;alias: {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'@': fileURLToPath(new URL('./src', import.meta.url))

&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;&nbsp;},

&nbsp;&nbsp;test: {

&nbsp;&nbsp;&nbsp;&nbsp;globals: true,

&nbsp;&nbsp;&nbsp;&nbsp;environment: 'node',

&nbsp;&nbsp;&nbsp;&nbsp;coverage: {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;provider: 'v8',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;reporter: \['text', 'html'\]

&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;&nbsp;}

});

\`\`\`

&nbsp;

\#\# Ação 1.9 — Configurar Prettier

&nbsp;

Criar \`.prettierrc\`:

&nbsp;

\`\`\`json

{

&nbsp;&nbsp;"semi": true,

&nbsp;&nbsp;"singleQuote": true,

&nbsp;&nbsp;"trailingComma": "none",

&nbsp;&nbsp;"printWidth": 100,

&nbsp;&nbsp;"tabWidth": 2

}

\`\`\`

&nbsp;

\#\# Ação 1.10 — Configurar ESLint

&nbsp;

Criar \`.eslintrc.cjs\`:

&nbsp;

\`\`\`js

module.exports \= {

&nbsp;&nbsp;root: true,

&nbsp;&nbsp;parser: '@typescript-eslint/parser',

&nbsp;&nbsp;plugins: \['@typescript-eslint'\],

&nbsp;&nbsp;extends: \[

&nbsp;&nbsp;&nbsp;&nbsp;'eslint:recommended',

&nbsp;&nbsp;&nbsp;&nbsp;'plugin:@typescript-eslint/recommended',

&nbsp;&nbsp;&nbsp;&nbsp;'prettier'

&nbsp;&nbsp;\],

&nbsp;&nbsp;parserOptions: {

&nbsp;&nbsp;&nbsp;&nbsp;ecmaVersion: 2022,

&nbsp;&nbsp;&nbsp;&nbsp;sourceType: 'module'

&nbsp;&nbsp;},

&nbsp;&nbsp;env: {

&nbsp;&nbsp;&nbsp;&nbsp;browser: true,

&nbsp;&nbsp;&nbsp;&nbsp;es2022: true,

&nbsp;&nbsp;&nbsp;&nbsp;node: true

&nbsp;&nbsp;},

&nbsp;&nbsp;rules: {

&nbsp;&nbsp;&nbsp;&nbsp;'@typescript-eslint/no-unused-vars': \['warn', { argsIgnorePattern: '^\_' }\],

&nbsp;&nbsp;&nbsp;&nbsp;'no-console': \['warn', { allow: \['warn', 'error', 'info'\] }\]

&nbsp;&nbsp;}

};

\`\`\`

&nbsp;

\#\# Ação 1.11 — Commit inicial

&nbsp;

\`\`\`bash

git add .

git commit \-m "chore: setup inicial do projeto"

\`\`\`

&nbsp;

\---

&nbsp;

\# SETOR 2 — CONFIGURAÇÃO DO PHASER

&nbsp;

\#\# Ação 2.1 — Criar \`src/config/gameConfig.ts\`

&nbsp;

\`\`\`ts

import Phaser from 'phaser';

&nbsp;

export const GAME\_WIDTH \= 1280;

export const GAME\_HEIGHT \= 720;

&nbsp;

export const gameConfig: Phaser.Types.Core.GameConfig \= {

&nbsp;&nbsp;type: Phaser.AUTO,

&nbsp;&nbsp;width: GAME\_WIDTH,

&nbsp;&nbsp;height: GAME\_HEIGHT,

&nbsp;&nbsp;parent: 'game-container',

&nbsp;&nbsp;backgroundColor: '\#0B0B10',

&nbsp;&nbsp;scale: {

&nbsp;&nbsp;&nbsp;&nbsp;mode: Phaser.Scale.FIT,

&nbsp;&nbsp;&nbsp;&nbsp;autoCenter: Phaser.Scale.CENTER\_BOTH

&nbsp;&nbsp;},

&nbsp;&nbsp;render: {

&nbsp;&nbsp;&nbsp;&nbsp;antialias: true,

&nbsp;&nbsp;&nbsp;&nbsp;pixelArt: false,

&nbsp;&nbsp;&nbsp;&nbsp;roundPixels: true

&nbsp;&nbsp;},

&nbsp;&nbsp;audio: {

&nbsp;&nbsp;&nbsp;&nbsp;disableWebAudio: false

&nbsp;&nbsp;},

&nbsp;&nbsp;physics: undefined,

&nbsp;&nbsp;scene: \[\]

};

\`\`\`

&nbsp;

\*\*Decisão técnica registrada:\*\* não usar física (Arcade, Matter) porque o jogo é narrativo, sem colisão.

&nbsp;

\#\# Ação 2.2 — Criar \`src/main.ts\` (versão inicial)

&nbsp;

\`\`\`ts

import Phaser from 'phaser';

import { gameConfig } from '@/config/gameConfig';

import { BootScene } from '@/scenes/BootScene';

import { PreloadScene } from '@/scenes/PreloadScene';

import { MenuScene } from '@/scenes/MenuScene';

import { IntroScene } from '@/scenes/IntroScene';

import { StoryScene } from '@/scenes/StoryScene';

import { ChoiceScene } from '@/scenes/ChoiceScene';

import { DiaryScene } from '@/scenes/DiaryScene';

import { PuzzleScene } from '@/scenes/PuzzleScene';

import { EndingScene } from '@/scenes/EndingScene';

import { CreditsScene } from '@/scenes/CreditsScene';

&nbsp;

const config: Phaser.Types.Core.GameConfig \= {

&nbsp;&nbsp;...gameConfig,

&nbsp;&nbsp;scene: \[

&nbsp;&nbsp;&nbsp;&nbsp;BootScene,

&nbsp;&nbsp;&nbsp;&nbsp;PreloadScene,

&nbsp;&nbsp;&nbsp;&nbsp;MenuScene,

&nbsp;&nbsp;&nbsp;&nbsp;IntroScene,

&nbsp;&nbsp;&nbsp;&nbsp;StoryScene,

&nbsp;&nbsp;&nbsp;&nbsp;ChoiceScene,

&nbsp;&nbsp;&nbsp;&nbsp;DiaryScene,

&nbsp;&nbsp;&nbsp;&nbsp;PuzzleScene,

&nbsp;&nbsp;&nbsp;&nbsp;EndingScene,

&nbsp;&nbsp;&nbsp;&nbsp;CreditsScene

&nbsp;&nbsp;\]

};

&nbsp;

new Phaser.Game(config);

\`\`\`

&nbsp;

\#\# Ação 2.3 — Ajustar \`index.html\`

&nbsp;

\`\`\`html

\<\!doctype html\>

\<html lang="pt-BR"\>

&nbsp;&nbsp;\<head\>

&nbsp;&nbsp;&nbsp;&nbsp;\<meta charset="UTF-8" /\>

&nbsp;&nbsp;&nbsp;&nbsp;\<meta name="viewport" content="width=device-width, initial-scale=1.0" /\>

&nbsp;&nbsp;&nbsp;&nbsp;\<meta name="theme-color" content="\#0B0B10" /\>

&nbsp;&nbsp;&nbsp;&nbsp;\<title\>O Último Rastro\</title\>

&nbsp;&nbsp;&nbsp;&nbsp;\<style\>

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;html, body {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;margin: 0;

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;padding: 0;

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;background: \#0B0B10;

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;overflow: hidden;

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;height: 100%;

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\#game-container {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;width: 100vw;

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;height: 100vh;

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;display: flex;

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;align-items: center;

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;justify-content: center;

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;canvas {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;display: block;

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;&nbsp;&nbsp;&nbsp;\</style\>

&nbsp;&nbsp;\</head\>

&nbsp;&nbsp;\<body\>

&nbsp;&nbsp;&nbsp;&nbsp;\<div id="game-container"\>\</div\>

&nbsp;&nbsp;&nbsp;&nbsp;\<script type="module" src="/src/main.ts"\>\</script\>

&nbsp;&nbsp;\</body\>

\</html\>

\`\`\`

&nbsp;

\#\# Ação 2.4 — Commit

&nbsp;

\`\`\`bash

git add .

git commit \-m "chore: configuracao do Phaser e estrutura de cenas"

\`\`\`

&nbsp;

\---

&nbsp;

\# SETOR 3 — TIPOS E INTERFACES

&nbsp;

\#\# Ação 3.1 — Criar \`src/types/GameState.ts\`

&nbsp;

\`\`\`ts

export interface CubePuzzleState {

&nbsp;&nbsp;positions: number\[\];

&nbsp;&nbsp;solved: boolean;

&nbsp;&nbsp;attempts: number;

&nbsp;&nbsp;unlockedFace: boolean;

&nbsp;&nbsp;symbolOrder: string\[\];

&nbsp;&nbsp;diarySymbols: string\[\];

}

&nbsp;

export type EndingType \= 'good' | 'bad' | 'secret' | null;

&nbsp;

export interface GameState {

&nbsp;&nbsp;saveVersion: number;

&nbsp;&nbsp;currentPhase: number;

&nbsp;&nbsp;errors: number;

&nbsp;&nbsp;choices: Record\<number, string\>;

&nbsp;&nbsp;clues: string\[\];

&nbsp;&nbsp;symbols: string\[\];

&nbsp;&nbsp;discoveredCharacters: string\[\];

&nbsp;&nbsp;trustPolice: number;

&nbsp;&nbsp;transformationLevel: number;

&nbsp;&nbsp;cube: CubePuzzleState;

&nbsp;&nbsp;ending: EndingType;

}

&nbsp;

export const SAVE\_VERSION \= 2;

&nbsp;

export function createInitialGameState(): GameState {

&nbsp;&nbsp;return {

&nbsp;&nbsp;&nbsp;&nbsp;saveVersion: SAVE\_VERSION,

&nbsp;&nbsp;&nbsp;&nbsp;currentPhase: 1,

&nbsp;&nbsp;&nbsp;&nbsp;errors: 0,

&nbsp;&nbsp;&nbsp;&nbsp;choices: {},

&nbsp;&nbsp;&nbsp;&nbsp;clues: \[\],

&nbsp;&nbsp;&nbsp;&nbsp;symbols: \[\],

&nbsp;&nbsp;&nbsp;&nbsp;discoveredCharacters: \[\],

&nbsp;&nbsp;&nbsp;&nbsp;trustPolice: 50,

&nbsp;&nbsp;&nbsp;&nbsp;transformationLevel: 0,

&nbsp;&nbsp;&nbsp;&nbsp;cube: {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;positions: \[\],

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;solved: false,

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;attempts: 0,

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;unlockedFace: false,

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;symbolOrder: \[\],

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;diarySymbols: \[\]

&nbsp;&nbsp;&nbsp;&nbsp;},

&nbsp;&nbsp;&nbsp;&nbsp;ending: null

&nbsp;&nbsp;};

}

\`\`\`

&nbsp;

\#\# Ação 3.2 — Criar \`src/types/Phase.ts\`

&nbsp;

\`\`\`ts

export interface Choice {

&nbsp;&nbsp;id: string;

&nbsp;&nbsp;text: string;

&nbsp;&nbsp;correct: boolean;

&nbsp;&nbsp;consequence: string;

&nbsp;&nbsp;clueReward?: string;

&nbsp;&nbsp;transformationDelta?: number;

&nbsp;&nbsp;justification: string;

}

&nbsp;

export interface Phase {

&nbsp;&nbsp;id: number;

&nbsp;&nbsp;title: string;

&nbsp;&nbsp;act: number;

&nbsp;&nbsp;intro: string;

&nbsp;&nbsp;scene: string;

&nbsp;&nbsp;objective: string;

&nbsp;&nbsp;image: string;

&nbsp;&nbsp;music?: string;

&nbsp;&nbsp;ambience?: string;

&nbsp;&nbsp;choices: Choice\[\];

&nbsp;&nbsp;clueReward?: string;

&nbsp;&nbsp;symbolReward?: string;

&nbsp;&nbsp;cliffhanger: string;

&nbsp;&nbsp;justification: string;

&nbsp;&nbsp;respiroPhase: boolean;

}

\`\`\`

&nbsp;

\#\# Ação 3.3 — Criar \`src/types/Clue.ts\`

&nbsp;

\`\`\`ts

export type ClueImportance \= 'low' | 'medium' | 'high';

&nbsp;

export type ClueType \=

&nbsp;&nbsp;| 'direct'

&nbsp;&nbsp;| 'environment'

&nbsp;&nbsp;| 'character'

&nbsp;&nbsp;| 'symbol'

&nbsp;&nbsp;| 'retroactive'

&nbsp;&nbsp;| 'false'

&nbsp;&nbsp;| 'final';

&nbsp;

export interface Clue {

&nbsp;&nbsp;id: string;

&nbsp;&nbsp;phase: number;

&nbsp;&nbsp;text: string;

&nbsp;&nbsp;symbol?: string;

&nbsp;&nbsp;unlocks?: string\[\];

&nbsp;&nbsp;importance: ClueImportance;

&nbsp;&nbsp;type: ClueType;

}

\`\`\`

&nbsp;

\#\# Ação 3.4 — Criar \`src/types/Symbol.ts\`

&nbsp;

\`\`\`ts

export type SymbolId \= 'olho' | 'lua' | 'mao' | 'corvo' | 'arvore' | 'rosto';

&nbsp;

export interface SymbolData {

&nbsp;&nbsp;id: SymbolId;

&nbsp;&nbsp;name: string;

&nbsp;&nbsp;phase: number;

&nbsp;&nbsp;assetPath: string;

&nbsp;&nbsp;diaryNote: string;

}

\`\`\`

&nbsp;

\#\# Ação 3.5 — Criar \`src/types/index.ts\`

&nbsp;

\`\`\`ts

export \* from './GameState';

export \* from './Phase';

export \* from './Clue';

export \* from './Symbol';

\`\`\`

&nbsp;

\#\# Ação 3.6 — Commit

&nbsp;

\`\`\`bash

git add .

git commit \-m "feat: tipos e interfaces base do jogo"

\`\`\`

&nbsp;

\---

&nbsp;

\# SETOR 4 — GAME STATE

&nbsp;

\#\# Ação 4.1 — Criar \`src/game/GameState.ts\`

&nbsp;

Este módulo é a \*\*fonte única de verdade\*\* do estado. Nenhuma cena pode alterar o estado diretamente. Tudo passa por aqui.

&nbsp;

\`\`\`ts

import {

&nbsp;&nbsp;GameState,

&nbsp;&nbsp;createInitialGameState,

&nbsp;&nbsp;SAVE\_VERSION

} from '@/types/GameState';

&nbsp;

let state: GameState \= createInitialGameState();

&nbsp;

export function getState(): GameState {

&nbsp;&nbsp;return state;

}

&nbsp;

export function setState(next: GameState): void {

&nbsp;&nbsp;state \= next;

}

&nbsp;

export function resetState(): void {

&nbsp;&nbsp;state \= createInitialGameState();

}

&nbsp;

export function incrementErrors(): void {

&nbsp;&nbsp;state.errors \+= 1;

}

&nbsp;

export function setCurrentPhase(phaseId: number): void {

&nbsp;&nbsp;state.currentPhase \= phaseId;

}

&nbsp;

export function registerChoice(phaseId: number, choiceId: string): void {

&nbsp;&nbsp;state.choices\[phaseId\] \= choiceId;

}

&nbsp;

export function changePoliceTrust(delta: number): void {

&nbsp;&nbsp;state.trustPolice \= Math.max(0, Math.min(100, state.trustPolice \+ delta));

}

&nbsp;

export function getSaveVersion(): number {

&nbsp;&nbsp;return SAVE\_VERSION;

}

\`\`\`

&nbsp;

\*\*Regra:\*\* nenhuma cena pode importar \`state\` diretamente. Só este módulo controla o estado.

&nbsp;

\#\# Ação 4.2 — Escrever teste unitário

&nbsp;

Criar \`tests/unit/GameState.test.ts\`:

&nbsp;

\`\`\`ts

import { describe, it, expect, beforeEach } from 'vitest';

import {

&nbsp;&nbsp;getState,

&nbsp;&nbsp;resetState,

&nbsp;&nbsp;incrementErrors,

&nbsp;&nbsp;registerChoice,

&nbsp;&nbsp;changePoliceTrust

} from '@/game/GameState';

&nbsp;

describe('GameState', () \=\> {

&nbsp;&nbsp;beforeEach(() \=\> resetState());

&nbsp;

&nbsp;&nbsp;it('inicia com valores corretos', () \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;const s \= getState();

&nbsp;&nbsp;&nbsp;&nbsp;expect(s.currentPhase).toBe(1);

&nbsp;&nbsp;&nbsp;&nbsp;expect(s.errors).toBe(0);

&nbsp;&nbsp;&nbsp;&nbsp;expect(s.choices).toEqual({});

&nbsp;&nbsp;&nbsp;&nbsp;expect(s.cube.solved).toBe(false);

&nbsp;&nbsp;});

&nbsp;

&nbsp;&nbsp;it('incrementa erros', () \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;incrementErrors();

&nbsp;&nbsp;&nbsp;&nbsp;incrementErrors();

&nbsp;&nbsp;&nbsp;&nbsp;expect(getState().errors).toBe(2);

&nbsp;&nbsp;});

&nbsp;

&nbsp;&nbsp;it('registra escolha por fase', () \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;registerChoice(1, 'b');

&nbsp;&nbsp;&nbsp;&nbsp;registerChoice(2, 'c');

&nbsp;&nbsp;&nbsp;&nbsp;expect(getState().choices\[1\]).toBe('b');

&nbsp;&nbsp;&nbsp;&nbsp;expect(getState().choices\[2\]).toBe('c');

&nbsp;&nbsp;});

&nbsp;

&nbsp;&nbsp;it('limita trustPolice entre 0 e 100', () \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;changePoliceTrust(-100);

&nbsp;&nbsp;&nbsp;&nbsp;expect(getState().trustPolice).toBe(0);

&nbsp;&nbsp;&nbsp;&nbsp;changePoliceTrust(500);

&nbsp;&nbsp;&nbsp;&nbsp;expect(getState().trustPolice).toBe(100);

&nbsp;&nbsp;});

});

\`\`\`

&nbsp;

Rodar:

&nbsp;

\`\`\`bash

npm run test

\`\`\`

&nbsp;

\#\# Ação 4.3 — Commit

&nbsp;

\`\`\`bash

git add .

git commit \-m "feat: game state centralizado com testes"

\`\`\`

&nbsp;

\---

&nbsp;

\# SETOR 5 — SAVE MANAGER

&nbsp;

\#\# Ação 5.1 — Criar \`src/game/SaveManager.ts\`

&nbsp;

\`\`\`ts

import { GameState, createInitialGameState, SAVE\_VERSION } from '@/types/GameState';

&nbsp;

const DB\_NAME \= 'ultimo\_rastro';

const DB\_VERSION \= 1;

const STORE\_NAME \= 'saves';

const SAVE\_KEY \= 'current';

&nbsp;

function openDB(): Promise\<IDBDatabase\> {

&nbsp;&nbsp;return new Promise((resolve, reject) \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;const req \= indexedDB.open(DB\_NAME, DB\_VERSION);

&nbsp;&nbsp;&nbsp;&nbsp;req.onupgradeneeded \= () \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;const db \= req.result;

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;if (\!db.objectStoreNames.contains(STORE\_NAME)) {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;db.createObjectStore(STORE\_NAME);

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;&nbsp;&nbsp;&nbsp;};

&nbsp;&nbsp;&nbsp;&nbsp;req.onsuccess \= () \=\> resolve(req.result);

&nbsp;&nbsp;&nbsp;&nbsp;req.onerror \= () \=\> reject(req.error);

&nbsp;&nbsp;});

}

&nbsp;

function migrateSave(save: GameState): GameState {

&nbsp;&nbsp;if (save.saveVersion \< 2\) {

&nbsp;&nbsp;&nbsp;&nbsp;save.cube \= {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;positions: \[\],

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;solved: false,

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;attempts: 0,

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;unlockedFace: false,

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;symbolOrder: \[\],

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;diarySymbols: save.symbols ?? \[\]

&nbsp;&nbsp;&nbsp;&nbsp;};

&nbsp;&nbsp;&nbsp;&nbsp;save.saveVersion \= SAVE\_VERSION;

&nbsp;&nbsp;}

&nbsp;&nbsp;return save;

}

&nbsp;

export async function saveGame(state: GameState): Promise\<void\> {

&nbsp;&nbsp;const db \= await openDB();

&nbsp;&nbsp;return new Promise((resolve, reject) \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;const tx \= db.transaction(STORE\_NAME, 'readwrite');

&nbsp;&nbsp;&nbsp;&nbsp;tx.objectStore(STORE\_NAME).put(state, SAVE\_KEY);

&nbsp;&nbsp;&nbsp;&nbsp;tx.oncomplete \= () \=\> resolve();

&nbsp;&nbsp;&nbsp;&nbsp;tx.onerror \= () \=\> reject(tx.error);

&nbsp;&nbsp;});

}

&nbsp;

export async function loadGame(): Promise\<GameState | null\> {

&nbsp;&nbsp;const db \= await openDB();

&nbsp;&nbsp;return new Promise((resolve, reject) \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;const tx \= db.transaction(STORE\_NAME, 'readonly');

&nbsp;&nbsp;&nbsp;&nbsp;const req \= tx.objectStore(STORE\_NAME).get(SAVE\_KEY);

&nbsp;&nbsp;&nbsp;&nbsp;req.onsuccess \= () \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;const data \= req.result as GameState | undefined;

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;if (\!data) {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;resolve(null);

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;return;

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;try {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;resolve(migrateSave(data));

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;} catch (err) {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;console.error('Falha na migração do save:', err);

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;resolve(null);

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;&nbsp;&nbsp;&nbsp;};

&nbsp;&nbsp;&nbsp;&nbsp;req.onerror \= () \=\> reject(req.error);

&nbsp;&nbsp;});

}

&nbsp;

export async function resetSave(): Promise\<void\> {

&nbsp;&nbsp;const db \= await openDB();

&nbsp;&nbsp;return new Promise((resolve, reject) \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;const tx \= db.transaction(STORE\_NAME, 'readwrite');

&nbsp;&nbsp;&nbsp;&nbsp;tx.objectStore(STORE\_NAME).delete(SAVE\_KEY);

&nbsp;&nbsp;&nbsp;&nbsp;tx.oncomplete \= () \=\> resolve();

&nbsp;&nbsp;&nbsp;&nbsp;tx.onerror \= () \=\> reject(tx.error);

&nbsp;&nbsp;});

}

&nbsp;

export async function hasSave(): Promise\<boolean\> {

&nbsp;&nbsp;const save \= await loadGame();

&nbsp;&nbsp;return save \!== null;

}

\`\`\`

&nbsp;

\#\# Ação 5.2 — Escrever teste com fake-indexeddb

&nbsp;

\`\`\`bash

npm install \-D fake-indexeddb

\`\`\`

&nbsp;

Criar \`tests/unit/SaveManager.test.ts\`:

&nbsp;

\`\`\`ts

import 'fake-indexeddb/auto';

import { describe, it, expect, beforeEach } from 'vitest';

import { saveGame, loadGame, resetSave, hasSave } from '@/game/SaveManager';

import { createInitialGameState } from '@/types/GameState';

&nbsp;

describe('SaveManager', () \=\> {

&nbsp;&nbsp;beforeEach(async () \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;await resetSave();

&nbsp;&nbsp;});

&nbsp;

&nbsp;&nbsp;it('salva e carrega estado', async () \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;const state \= createInitialGameState();

&nbsp;&nbsp;&nbsp;&nbsp;state.currentPhase \= 5;

&nbsp;&nbsp;&nbsp;&nbsp;state.errors \= 2;

&nbsp;&nbsp;&nbsp;&nbsp;await saveGame(state);

&nbsp;&nbsp;&nbsp;&nbsp;const loaded \= await loadGame();

&nbsp;&nbsp;&nbsp;&nbsp;expect(loaded?.currentPhase).toBe(5);

&nbsp;&nbsp;&nbsp;&nbsp;expect(loaded?.errors).toBe(2);

&nbsp;&nbsp;});

&nbsp;

&nbsp;&nbsp;it('retorna null quando não há save', async () \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;const loaded \= await loadGame();

&nbsp;&nbsp;&nbsp;&nbsp;expect(loaded).toBeNull();

&nbsp;&nbsp;});

&nbsp;

&nbsp;&nbsp;it('hasSave retorna false sem save', async () \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;expect(await hasSave()).toBe(false);

&nbsp;&nbsp;});

&nbsp;

&nbsp;&nbsp;it('hasSave retorna true após salvar', async () \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;await saveGame(createInitialGameState());

&nbsp;&nbsp;&nbsp;&nbsp;expect(await hasSave()).toBe(true);

&nbsp;&nbsp;});

});

\`\`\`

&nbsp;

\#\# Ação 5.3 — Commit

&nbsp;

\`\`\`bash

git add .

git commit \-m "feat: save manager com IndexedDB e migracao"

\`\`\`

&nbsp;

\---

&nbsp;

\# SETOR 6 — PHASE VALIDATOR

&nbsp;

\#\# Ação 6.1 — Criar \`src/systems/PhaseValidator.ts\`

&nbsp;

\`\`\`ts

import { Phase } from '@/types/Phase';

&nbsp;

export class PhaseValidationError extends Error {

&nbsp;&nbsp;constructor(message: string, public phaseId?: number) {

&nbsp;&nbsp;&nbsp;&nbsp;super(message);

&nbsp;&nbsp;&nbsp;&nbsp;this.name \= 'PhaseValidationError';

&nbsp;&nbsp;}

}

&nbsp;

export function validatePhase(phase: unknown): Phase {

&nbsp;&nbsp;if (typeof phase \!== 'object' || phase \=== null) {

&nbsp;&nbsp;&nbsp;&nbsp;throw new PhaseValidationError('Fase não é um objeto');

&nbsp;&nbsp;}

&nbsp;

&nbsp;&nbsp;const p \= phase as Partial\<Phase\>;

&nbsp;

&nbsp;&nbsp;if (typeof p.id \!== 'number') throw new PhaseValidationError('id inválido');

&nbsp;&nbsp;if (typeof p.title \!== 'string') throw new PhaseValidationError('title inválido', p.id);

&nbsp;&nbsp;if (typeof p.act \!== 'number') throw new PhaseValidationError('act inválido', p.id);

&nbsp;&nbsp;if (typeof p.intro \!== 'string') throw new PhaseValidationError('intro inválido', p.id);

&nbsp;&nbsp;if (typeof p.scene \!== 'string') throw new PhaseValidationError('scene inválido', p.id);

&nbsp;&nbsp;if (typeof p.objective \!== 'string') throw new PhaseValidationError('objective inválido', p.id);

&nbsp;&nbsp;if (typeof p.image \!== 'string') throw new PhaseValidationError('image inválido', p.id);

&nbsp;&nbsp;if (typeof p.cliffhanger \!== 'string') throw new PhaseValidationError('cliffhanger inválido', p.id);

&nbsp;&nbsp;if (typeof p.justification \!== 'string') throw new PhaseValidationError('justification inválido', p.id);

&nbsp;&nbsp;if (typeof p.respiroPhase \!== 'boolean') throw new PhaseValidationError('respiroPhase inválido', p.id);

&nbsp;

&nbsp;&nbsp;if (\!Array.isArray(p.choices)) throw new PhaseValidationError('choices não é array', p.id);

&nbsp;&nbsp;if (p.choices.length \!== 3\) throw new PhaseValidationError('choices deve ter exatamente 3 opções', p.id);

&nbsp;

&nbsp;&nbsp;const correctCount \= p.choices.filter((c) \=\> c.correct).length;

&nbsp;&nbsp;if (correctCount \!== 1\) throw new PhaseValidationError('choices deve ter exatamente 1 correta', p.id);

&nbsp;

&nbsp;&nbsp;for (const choice of p.choices) {

&nbsp;&nbsp;&nbsp;&nbsp;if (typeof choice.id \!== 'string') throw new PhaseValidationError('choice.id inválido', p.id);

&nbsp;&nbsp;&nbsp;&nbsp;if (typeof choice.text \!== 'string') throw new PhaseValidationError('choice.text inválido', p.id);

&nbsp;&nbsp;&nbsp;&nbsp;if (typeof choice.correct \!== 'boolean') throw new PhaseValidationError('choice.correct inválido', p.id);

&nbsp;&nbsp;&nbsp;&nbsp;if (typeof choice.consequence \!== 'string') throw new PhaseValidationError('choice.consequence inválido', p.id);

&nbsp;&nbsp;&nbsp;&nbsp;if (typeof choice.justification \!== 'string') throw new PhaseValidationError('choice.justification inválido', p.id);

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;if (choice.correct && choice.justification.trim() \=== '') {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;throw new PhaseValidationError(\`Escolha correta da fase ${p.id} sem justificativa\`, p.id);

&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;&nbsp;}

&nbsp;

&nbsp;&nbsp;return p as Phase;

}

&nbsp;

export function validateAllPhases(phases: unknown\[\]): Phase\[\] {

&nbsp;&nbsp;return phases.map(validatePhase);

}

\`\`\`

&nbsp;

\#\# Ação 6.2 — Teste

&nbsp;

\`tests/unit/PhaseValidator.test.ts\`:

&nbsp;

\`\`\`ts

import { describe, it, expect } from 'vitest';

import { validatePhase, PhaseValidationError } from '@/systems/PhaseValidator';

&nbsp;

const validPhase \= {

&nbsp;&nbsp;id: 1,

&nbsp;&nbsp;title: 'A Casa Vazia',

&nbsp;&nbsp;act: 1,

&nbsp;&nbsp;intro: 'Theo chega em casa.',

&nbsp;&nbsp;scene: 'A porta está aberta.',

&nbsp;&nbsp;objective: 'Investigar.',

&nbsp;&nbsp;image: '/assets/phases/phase-01.webp',

&nbsp;&nbsp;choices: \[

&nbsp;&nbsp;&nbsp;&nbsp;{ id: 'a', text: 'A', correct: false, consequence: 'x', justification: '' },

&nbsp;&nbsp;&nbsp;&nbsp;{ id: 'b', text: 'B', correct: true, consequence: 'y', justification: 'pista' },

&nbsp;&nbsp;&nbsp;&nbsp;{ id: 'c', text: 'C', correct: false, consequence: 'z', justification: '' }

&nbsp;&nbsp;\],

&nbsp;&nbsp;cliffhanger: 'Algo aconteceu.',

&nbsp;&nbsp;justification: 'O jogador deve olhar a marca.',

&nbsp;&nbsp;respiroPhase: false

};

&nbsp;

describe('PhaseValidator', () \=\> {

&nbsp;&nbsp;it('aceita fase válida', () \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;expect(() \=\> validatePhase(validPhase)).not.toThrow();

&nbsp;&nbsp;});

&nbsp;

&nbsp;&nbsp;it('rejeita fase sem 3 escolhas', () \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;expect(() \=\>

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;validatePhase({ ...validPhase, choices: validPhase.choices.slice(0, 2\) })

&nbsp;&nbsp;&nbsp;&nbsp;).toThrow(PhaseValidationError);

&nbsp;&nbsp;});

&nbsp;

&nbsp;&nbsp;it('rejeita fase sem escolha correta', () \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;const bad \= {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;...validPhase,

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;choices: validPhase.choices.map((c) \=\> ({ ...c, correct: false }))

&nbsp;&nbsp;&nbsp;&nbsp;};

&nbsp;&nbsp;&nbsp;&nbsp;expect(() \=\> validatePhase(bad)).toThrow();

&nbsp;&nbsp;});

&nbsp;

&nbsp;&nbsp;it('rejeita escolha correta sem justificativa', () \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;const bad \= {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;...validPhase,

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;choices: validPhase.choices.map((c) \=\>

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;c.correct ? { ...c, justification: '' } : c

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)

&nbsp;&nbsp;&nbsp;&nbsp;};

&nbsp;&nbsp;&nbsp;&nbsp;expect(() \=\> validatePhase(bad)).toThrow();

&nbsp;&nbsp;});

});

\`\`\`

&nbsp;

\#\# Ação 6.3 — Commit

&nbsp;

\`\`\`bash

git add .

git commit \-m "feat: phase validator com testes"

\`\`\`

&nbsp;

\---

&nbsp;

\# SETOR 7 — PHASE LOADER

&nbsp;

\#\# Ação 7.1 — Criar \`src/data/phases.json\` (fases 1–3 para MVP)

&nbsp;

\`\`\`json

\[

&nbsp;&nbsp;{

&nbsp;&nbsp;&nbsp;&nbsp;"id": 1,

&nbsp;&nbsp;&nbsp;&nbsp;"title": "A Casa Vazia",

&nbsp;&nbsp;&nbsp;&nbsp;"act": 1,

&nbsp;&nbsp;&nbsp;&nbsp;"intro": "Theo chega em casa. A porta está aberta. O relógio da sala está parado às 23:47.",

&nbsp;&nbsp;&nbsp;&nbsp;"scene": "O casaco da mãe está no chão, ainda úmido.",

&nbsp;&nbsp;&nbsp;&nbsp;"objective": "Descobrir o que aconteceu.",

&nbsp;&nbsp;&nbsp;&nbsp;"image": "/assets/backgrounds/phase-01-casa.webp",

&nbsp;&nbsp;&nbsp;&nbsp;"music": "/assets/music/phase01\_casa\_medo.ogg",

&nbsp;&nbsp;&nbsp;&nbsp;"choices": \[

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"id": "a",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"text": "Quarto da mãe",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"correct": false,

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"consequence": "Theo encontra uma gaveta revirada, mas nenhuma pista nova.",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"justification": ""

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;},

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"id": "b",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"text": "Garagem",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"correct": true,

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"consequence": "Theo encontra uma marca de pneu no piso da garagem.",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"clueReward": "tire\_mark",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"justification": "A marca de pneu está visível na cena de entrada da casa."

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;},

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"id": "c",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"text": "Cozinha",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"correct": false,

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"consequence": "Theo encontra uma xícara fria. Nada mais.",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"justification": ""

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;&nbsp;&nbsp;&nbsp;\],

&nbsp;&nbsp;&nbsp;&nbsp;"cliffhanger": "No fundo da garagem existe uma fotografia antiga com um símbolo estranho.",

&nbsp;&nbsp;&nbsp;&nbsp;"justification": "O jogador deve olhar a marca de pneu visível na cena de entrada.",

&nbsp;&nbsp;&nbsp;&nbsp;"respiroPhase": false

&nbsp;&nbsp;},

&nbsp;&nbsp;{

&nbsp;&nbsp;&nbsp;&nbsp;"id": 2,

&nbsp;&nbsp;&nbsp;&nbsp;"title": "A Marca na Parede",

&nbsp;&nbsp;&nbsp;&nbsp;"act": 1,

&nbsp;&nbsp;&nbsp;&nbsp;"intro": "Theo segue a marca e encontra um símbolo desenhado na parede.",

&nbsp;&nbsp;&nbsp;&nbsp;"scene": "O mesmo símbolo aparece no casaco da mãe e no sino da igreja.",

&nbsp;&nbsp;&nbsp;&nbsp;"objective": "Seguir o símbolo.",

&nbsp;&nbsp;&nbsp;&nbsp;"image": "/assets/backgrounds/phase-02-igreja.webp",

&nbsp;&nbsp;&nbsp;&nbsp;"music": "/assets/music/phase02\_igreja\_curiosidade.ogg",

&nbsp;&nbsp;&nbsp;&nbsp;"choices": \[

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"id": "a",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"text": "Floresta",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"correct": false,

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"consequence": "Theo encontra trilhas antigas, mas nenhuma pista nova.",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"justification": ""

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;},

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"id": "b",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"text": "Ponte velha",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"correct": false,

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"consequence": "Theo encontra uma ponte abandonada. Nada mais.",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"justification": ""

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;},

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"id": "c",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"text": "Igreja antiga",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"correct": true,

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"consequence": "A igreja possui o mesmo símbolo no sino.",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"clueReward": "eye\_symbol",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"justification": "O símbolo do olho aparece no casaco da mãe na Fase 1 e no sino da igreja."

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;&nbsp;&nbsp;&nbsp;\],

&nbsp;&nbsp;&nbsp;&nbsp;"symbolReward": "olho",

&nbsp;&nbsp;&nbsp;&nbsp;"cliffhanger": "Quando o sino balança sozinho, Theo ouve uma voz vinda de baixo do chão: 'Eles já estiveram aqui.'",

&nbsp;&nbsp;&nbsp;&nbsp;"justification": "O símbolo do olho estava no casaco da mãe.",

&nbsp;&nbsp;&nbsp;&nbsp;"respiroPhase": false

&nbsp;&nbsp;},

&nbsp;&nbsp;{

&nbsp;&nbsp;&nbsp;&nbsp;"id": 3,

&nbsp;&nbsp;&nbsp;&nbsp;"title": "O Primeiro Troll",

&nbsp;&nbsp;&nbsp;&nbsp;"act": 1,

&nbsp;&nbsp;&nbsp;&nbsp;"intro": "Theo encontra uma criatura escondida. O troll não ataca.",

&nbsp;&nbsp;&nbsp;&nbsp;"scene": "O troll diz: 'Se eu fosse você, não procuraria seus pais aqui.'",

&nbsp;&nbsp;&nbsp;&nbsp;"objective": "Encontrar o caminho certo.",

&nbsp;&nbsp;&nbsp;&nbsp;"image": "/assets/backgrounds/phase-03-tunel.webp",

&nbsp;&nbsp;&nbsp;&nbsp;"music": "/assets/music/phase03\_tunel\_tensao.ogg",

&nbsp;&nbsp;&nbsp;&nbsp;"choices": \[

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"id": "a",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"text": "Seguir o troll",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"correct": false,

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"consequence": "O troll desaparece. Theo se perde por alguns minutos.",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"justification": ""

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;},

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"id": "b",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"text": "Verificar a carroça abandonada",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"correct": false,

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"consequence": "Theo encontra apenas madeira velha.",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"justification": ""

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;},

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"id": "c",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"text": "Entrar no túnel",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"correct": true,

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"consequence": "Theo encontra marcas de arrasto e um pedaço de tecido da camisa de Elias.",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"clueReward": "elias\_shirt",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"justification": "Na Fase 2, o som vinha do subsolo — o túnel é a continuação lógica."

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;&nbsp;&nbsp;&nbsp;\],

&nbsp;&nbsp;&nbsp;&nbsp;"symbolReward": "lua",

&nbsp;&nbsp;&nbsp;&nbsp;"cliffhanger": "Uma grade fecha atrás de Theo.",

&nbsp;&nbsp;&nbsp;&nbsp;"justification": "O som da voz na Fase 2 vinha de baixo do chão.",

&nbsp;&nbsp;&nbsp;&nbsp;"respiroPhase": false

&nbsp;&nbsp;}

\]

\`\`\`

&nbsp;

\#\# Ação 7.2 — Criar \`src/systems/PhaseLoader.ts\`

&nbsp;

\`\`\`ts

import { Phase } from '@/types/Phase';

import { validateAllPhases } from './PhaseValidator';

&nbsp;

let cache: Phase\[\] | null \= null;

&nbsp;

export async function loadAllPhases(): Promise\<Phase\[\]\> {

&nbsp;&nbsp;if (cache) return cache;

&nbsp;

&nbsp;&nbsp;const res \= await fetch('/data/phases.json');

&nbsp;&nbsp;if (\!res.ok) {

&nbsp;&nbsp;&nbsp;&nbsp;throw new Error(\`Falha ao carregar phases.json: ${res.status}\`);

&nbsp;&nbsp;}

&nbsp;

&nbsp;&nbsp;const raw \= await res.json();

&nbsp;&nbsp;if (\!Array.isArray(raw)) {

&nbsp;&nbsp;&nbsp;&nbsp;throw new Error('phases.json não é um array');

&nbsp;&nbsp;}

&nbsp;

&nbsp;&nbsp;cache \= validateAllPhases(raw);

&nbsp;&nbsp;return cache;

}

&nbsp;

export async function getPhase(phaseId: number): Promise\<Phase\> {

&nbsp;&nbsp;const phases \= await loadAllPhases();

&nbsp;&nbsp;const phase \= phases.find((p) \=\> p.id \=== phaseId);

&nbsp;&nbsp;if (\!phase) throw new Error(\`Fase ${phaseId} não encontrada\`);

&nbsp;&nbsp;return phase;

}

&nbsp;

export function clearPhaseCache(): void {

&nbsp;&nbsp;cache \= null;

}

\`\`\`

&nbsp;

\#\# Ação 7.3 — Copiar \`phases.json\` para \`public/data/\`

&nbsp;

\`\`\`bash

mkdir \-p public/data

cp src/data/phases.json public/data/phases.json

\`\`\`

&nbsp;

\*\*Decisão técnica:\*\* o arquivo é servido em runtime pelo Vite via \`public/\`, permitindo editar sem rebuild.

&nbsp;

\#\# Ação 7.4 — Teste

&nbsp;

\`tests/unit/PhaseLoader.test.ts\`:

&nbsp;

\`\`\`ts

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { loadAllPhases, getPhase, clearPhaseCache } from '@/systems/PhaseLoader';

&nbsp;

const mockPhases \= \[

&nbsp;&nbsp;{

&nbsp;&nbsp;&nbsp;&nbsp;id: 1,

&nbsp;&nbsp;&nbsp;&nbsp;title: 'T',

&nbsp;&nbsp;&nbsp;&nbsp;act: 1,

&nbsp;&nbsp;&nbsp;&nbsp;intro: 'i',

&nbsp;&nbsp;&nbsp;&nbsp;scene: 's',

&nbsp;&nbsp;&nbsp;&nbsp;objective: 'o',

&nbsp;&nbsp;&nbsp;&nbsp;image: 'img',

&nbsp;&nbsp;&nbsp;&nbsp;choices: \[

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{ id: 'a', text: 'a', correct: false, consequence: 'c', justification: '' },

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{ id: 'b', text: 'b', correct: true, consequence: 'c', justification: 'j' },

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{ id: 'c', text: 'c', correct: false, consequence: 'c', justification: '' }

&nbsp;&nbsp;&nbsp;&nbsp;\],

&nbsp;&nbsp;&nbsp;&nbsp;cliffhanger: 'cf',

&nbsp;&nbsp;&nbsp;&nbsp;justification: 'j',

&nbsp;&nbsp;&nbsp;&nbsp;respiroPhase: false

&nbsp;&nbsp;}

\];

&nbsp;

beforeEach(() \=\> {

&nbsp;&nbsp;clearPhaseCache();

&nbsp;&nbsp;vi.restoreAllMocks();

});

&nbsp;

describe('PhaseLoader', () \=\> {

&nbsp;&nbsp;it('carrega e valida fases', async () \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;global.fetch \= vi.fn().mockResolvedValue({

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ok: true,

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;json: async () \=\> mockPhases

&nbsp;&nbsp;&nbsp;&nbsp;}) as unknown as typeof fetch;

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;const phases \= await loadAllPhases();

&nbsp;&nbsp;&nbsp;&nbsp;expect(phases).toHaveLength(1);

&nbsp;&nbsp;});

&nbsp;

&nbsp;&nbsp;it('getPhase retorna a fase correta', async () \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;global.fetch \= vi.fn().mockResolvedValue({

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ok: true,

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;json: async () \=\> mockPhases

&nbsp;&nbsp;&nbsp;&nbsp;}) as unknown as typeof fetch;

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;const phase \= await getPhase(1);

&nbsp;&nbsp;&nbsp;&nbsp;expect(phase.id).toBe(1);

&nbsp;&nbsp;});

&nbsp;

&nbsp;&nbsp;it('lança erro quando fase não existe', async () \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;global.fetch \= vi.fn().mockResolvedValue({

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ok: true,

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;json: async () \=\> mockPhases

&nbsp;&nbsp;&nbsp;&nbsp;}) as unknown as typeof fetch;

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;await expect(getPhase(99)).rejects.toThrow();

&nbsp;&nbsp;});

});

\`\`\`

&nbsp;

\#\# Ação 7.5 — Commit

&nbsp;

\`\`\`bash

git add .

git commit \-m "feat: phase loader com validacao e cache"

\`\`\`

&nbsp;

\---

&nbsp;

\# SETOR 8 — CHOICE SYSTEM

&nbsp;

\#\# Ação 8.1 — Criar \`src/game/ChoiceSystem.ts\`

&nbsp;

\`\`\`ts

import { GameState } from '@/types/GameState';

import { Phase, Choice } from '@/types/Phase';

import { registerChoice, incrementErrors, getState } from './GameState';

&nbsp;

export interface ChoiceResult {

&nbsp;&nbsp;correct: boolean;

&nbsp;&nbsp;consequence: string;

&nbsp;&nbsp;clueReward?: string;

&nbsp;&nbsp;symbolReward?: string;

}

&nbsp;

export function resolveChoice(

&nbsp;&nbsp;phase: Phase,

&nbsp;&nbsp;choice: Choice,

&nbsp;&nbsp;state: GameState \= getState()

): ChoiceResult {

&nbsp;&nbsp;registerChoice(phase.id, choice.id);

&nbsp;

&nbsp;&nbsp;if (choice.correct) {

&nbsp;&nbsp;&nbsp;&nbsp;if (choice.clueReward) {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;state.clues.push(choice.clueReward);

&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;&nbsp;&nbsp;&nbsp;if (phase.symbolReward) {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;state.symbols.push(phase.symbolReward);

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;state.cube.diarySymbols.push(phase.symbolReward);

&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;&nbsp;} else {

&nbsp;&nbsp;&nbsp;&nbsp;incrementErrors();

&nbsp;&nbsp;&nbsp;&nbsp;state.transformationLevel \= Math.min(

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;state.transformationLevel \+ (choice.transformationDelta ?? 1),

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;5

&nbsp;&nbsp;&nbsp;&nbsp;);

&nbsp;&nbsp;}

&nbsp;

&nbsp;&nbsp;return {

&nbsp;&nbsp;&nbsp;&nbsp;correct: choice.correct,

&nbsp;&nbsp;&nbsp;&nbsp;consequence: choice.consequence,

&nbsp;&nbsp;&nbsp;&nbsp;clueReward: choice.clueReward,

&nbsp;&nbsp;&nbsp;&nbsp;symbolReward: phase.symbolReward

&nbsp;&nbsp;};

}

\`\`\`

&nbsp;

\#\# Ação 8.2 — Teste

&nbsp;

\`tests/unit/ChoiceSystem.test.ts\`:

&nbsp;

\`\`\`ts

import { describe, it, expect, beforeEach } from 'vitest';

import { resolveChoice } from '@/game/ChoiceSystem';

import { resetState, getState } from '@/game/GameState';

import { Phase, Choice } from '@/types/Phase';

&nbsp;

const phase: Phase \= {

&nbsp;&nbsp;id: 1,

&nbsp;&nbsp;title: 'T',

&nbsp;&nbsp;act: 1,

&nbsp;&nbsp;intro: 'i',

&nbsp;&nbsp;scene: 's',

&nbsp;&nbsp;objective: 'o',

&nbsp;&nbsp;image: 'img',

&nbsp;&nbsp;choices: \[\],

&nbsp;&nbsp;cliffhanger: 'cf',

&nbsp;&nbsp;justification: 'j',

&nbsp;&nbsp;respiroPhase: false

};

&nbsp;

const correctChoice: Choice \= {

&nbsp;&nbsp;id: 'b',

&nbsp;&nbsp;text: 'B',

&nbsp;&nbsp;correct: true,

&nbsp;&nbsp;consequence: 'c',

&nbsp;&nbsp;clueReward: 'clue\_x',

&nbsp;&nbsp;justification: 'j'

};

&nbsp;

const wrongChoice: Choice \= {

&nbsp;&nbsp;id: 'a',

&nbsp;&nbsp;text: 'A',

&nbsp;&nbsp;correct: false,

&nbsp;&nbsp;consequence: 'c',

&nbsp;&nbsp;justification: ''

};

&nbsp;

describe('ChoiceSystem', () \=\> {

&nbsp;&nbsp;beforeEach(() \=\> resetState());

&nbsp;

&nbsp;&nbsp;it('escolha correta adiciona pista e não incrementa erros', () \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;resolveChoice(phase, correctChoice);

&nbsp;&nbsp;&nbsp;&nbsp;expect(getState().errors).toBe(0);

&nbsp;&nbsp;&nbsp;&nbsp;expect(getState().clues).toContain('clue\_x');

&nbsp;&nbsp;});

&nbsp;

&nbsp;&nbsp;it('escolha errada incrementa erro e transformação', () \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;resolveChoice(phase, wrongChoice);

&nbsp;&nbsp;&nbsp;&nbsp;expect(getState().errors).toBe(1);

&nbsp;&nbsp;&nbsp;&nbsp;expect(getState().transformationLevel).toBe(1);

&nbsp;&nbsp;});

&nbsp;

&nbsp;&nbsp;it('registra escolha por fase', () \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;resolveChoice(phase, correctChoice);

&nbsp;&nbsp;&nbsp;&nbsp;expect(getState().choices\[1\]).toBe('b');

&nbsp;&nbsp;});

});

\`\`\`

&nbsp;

\#\# Ação 8.3 — Commit

&nbsp;

\`\`\`bash

git add .

git commit \-m "feat: choice system com testes"

\`\`\`

&nbsp;

\---

&nbsp;

\# SETOR 9 — CLUE SYSTEM

&nbsp;

\#\# Ação 9.1 — Criar \`src/data/clues.json\`

&nbsp;

\`\`\`json

\[

&nbsp;&nbsp;{

&nbsp;&nbsp;&nbsp;&nbsp;"id": "tire\_mark",

&nbsp;&nbsp;&nbsp;&nbsp;"phase": 1,

&nbsp;&nbsp;&nbsp;&nbsp;"text": "Marca de pneu no piso da garagem.",

&nbsp;&nbsp;&nbsp;&nbsp;"importance": "medium",

&nbsp;&nbsp;&nbsp;&nbsp;"type": "environment"

&nbsp;&nbsp;},

&nbsp;&nbsp;{

&nbsp;&nbsp;&nbsp;&nbsp;"id": "eye\_symbol",

&nbsp;&nbsp;&nbsp;&nbsp;"phase": 2,

&nbsp;&nbsp;&nbsp;&nbsp;"text": "Símbolo do olho no sino da igreja.",

&nbsp;&nbsp;&nbsp;&nbsp;"symbol": "olho",

&nbsp;&nbsp;&nbsp;&nbsp;"importance": "high",

&nbsp;&nbsp;&nbsp;&nbsp;"type": "symbol"

&nbsp;&nbsp;},

&nbsp;&nbsp;{

&nbsp;&nbsp;&nbsp;&nbsp;"id": "elias\_shirt",

&nbsp;&nbsp;&nbsp;&nbsp;"phase": 3,

&nbsp;&nbsp;&nbsp;&nbsp;"text": "Tecido da camisa de Elias no túnel.",

&nbsp;&nbsp;&nbsp;&nbsp;"importance": "high",

&nbsp;&nbsp;&nbsp;&nbsp;"type": "direct"

&nbsp;&nbsp;}

\]

\`\`\`

&nbsp;

\#\# Ação 9.2 — Criar \`src/game/ClueSystem.ts\`

&nbsp;

\`\`\`ts

import { Clue } from '@/types/Clue';

import { getState } from './GameState';

&nbsp;

let cache: Clue\[\] | null \= null;

&nbsp;

export async function loadClues(): Promise\<Clue\[\]\> {

&nbsp;&nbsp;if (cache) return cache;

&nbsp;&nbsp;const res \= await fetch('/data/clues.json');

&nbsp;&nbsp;if (\!res.ok) throw new Error('Falha ao carregar clues.json');

&nbsp;&nbsp;cache \= (await res.json()) as Clue\[\];

&nbsp;&nbsp;return cache;

}

&nbsp;

export function hasClue(clueId: string): boolean {

&nbsp;&nbsp;return getState().clues.includes(clueId);

}

&nbsp;

export async function getClue(clueId: string): Promise\<Clue | null\> {

&nbsp;&nbsp;const clues \= await loadClues();

&nbsp;&nbsp;return clues.find((c) \=\> c.id \=== clueId) ?? null;

}

&nbsp;

export async function getDiscoveredClues(): Promise\<Clue\[\]\> {

&nbsp;&nbsp;const all \= await loadClues();

&nbsp;&nbsp;const owned \= new Set(getState().clues);

&nbsp;&nbsp;return all.filter((c) \=\> owned.has(c.id));

}

\`\`\`

&nbsp;

\#\# Ação 9.3 — Copiar para \`public/data/clues.json\`

&nbsp;

\`\`\`bash

cp src/data/clues.json public/data/clues.json

\`\`\`

&nbsp;

\#\# Ação 9.4 — Commit

&nbsp;

\`\`\`bash

git add .

git commit \-m "feat: clue system"

\`\`\`

&nbsp;

\---

&nbsp;

\# SETOR 10 — SYMBOL SYSTEM

&nbsp;

\#\# Ação 10.1 — Criar \`src/data/symbols.json\`

&nbsp;

\`\`\`json

\[

&nbsp;&nbsp;{ "id": "olho",   "name": "Olho",   "phase": 2,  "assetPath": "/assets/symbols/olho.webp",   "diaryNote": "Vi este símbolo no sino da igreja." },

&nbsp;&nbsp;{ "id": "lua",    "name": "Lua",    "phase": 3,  "assetPath": "/assets/symbols/lua.webp",    "diaryNote": "Estava no túnel, perto do tecido do papai." },

&nbsp;&nbsp;{ "id": "mao",    "name": "Mão",    "phase": 5,  "assetPath": "/assets/symbols/mao.webp",    "diaryNote": "No arquivo da delegacia." },

&nbsp;&nbsp;{ "id": "corvo",  "name": "Corvo",  "phase": 9,  "assetPath": "/assets/symbols/corvo.webp",  "diaryNote": "Apareceu no documento que mudou sozinho." },

&nbsp;&nbsp;{ "id": "arvore", "name": "Árvore", "phase": 14, "assetPath": "/assets/symbols/arvore.webp", "diaryNote": "No mapa que forma um troll visto de cima." },

&nbsp;&nbsp;{ "id": "rosto",  "name": "Rosto",  "phase": 20, "assetPath": "/assets/symbols/rosto.webp",  "diaryNote": "Só apareceu no cubo. É o meu rosto." }

\]

\`\`\`

&nbsp;

\#\# Ação 10.2 — Criar \`src/game/SymbolSystem.ts\`

&nbsp;

\`\`\`ts

import { SymbolData, SymbolId } from '@/types/Symbol';

import { getState } from './GameState';

&nbsp;

let cache: SymbolData\[\] | null \= null;

&nbsp;

export async function loadSymbols(): Promise\<SymbolData\[\]\> {

&nbsp;&nbsp;if (cache) return cache;

&nbsp;&nbsp;const res \= await fetch('/data/symbols.json');

&nbsp;&nbsp;if (\!res.ok) throw new Error('Falha ao carregar symbols.json');

&nbsp;&nbsp;cache \= (await res.json()) as SymbolData\[\];

&nbsp;&nbsp;return cache;

}

&nbsp;

export function hasSymbol(id: SymbolId): boolean {

&nbsp;&nbsp;return getState().symbols.includes(id);

}

&nbsp;

export function getCollectedSymbols(): SymbolId\[\] {

&nbsp;&nbsp;return getState().symbols as SymbolId\[\];

}

&nbsp;

export function getDiarySymbols(): SymbolId\[\] {

&nbsp;&nbsp;return getState().cube.diarySymbols as SymbolId\[\];

}

&nbsp;

export async function getSymbolData(id: SymbolId): Promise\<SymbolData | null\> {

&nbsp;&nbsp;const all \= await loadSymbols();

&nbsp;&nbsp;return all.find((s) \=\> s.id \=== id) ?? null;

}

\`\`\`

&nbsp;

\#\# Ação 10.3 — Copiar para \`public/data/symbols.json\`

&nbsp;

\`\`\`bash

cp src/data/symbols.json public/data/symbols.json

\`\`\`

&nbsp;

\#\# Ação 10.4 — Commit

&nbsp;

\`\`\`bash

git add .

git commit \-m "feat: symbol system e diario"

\`\`\`

&nbsp;

\---

&nbsp;

\# SETOR 11 — TRANSFORMATION SYSTEM

&nbsp;

\#\# Ação 11.1 — Criar \`src/game/TransformationSystem.ts\`

&nbsp;

\`\`\`ts

import { getState } from './GameState';

&nbsp;

export type TransformationVisualLevel \= 0 | 1 | 2 | 3 | 4 | 5;

&nbsp;

export function getTransformationLevel(): TransformationVisualLevel {

&nbsp;&nbsp;return getState().transformationLevel as TransformationVisualLevel;

}

&nbsp;

export function shouldShowTransformationEffect(phaseId: number): boolean {

&nbsp;&nbsp;const level \= getTransformationLevel();

&nbsp;&nbsp;if (level \=== 0\) return false;

&nbsp;&nbsp;if (phaseId \>= 7 && level \>= 1\) return true;

&nbsp;&nbsp;if (phaseId \>= 11 && level \>= 2\) return true;

&nbsp;&nbsp;if (phaseId \>= 14 && level \>= 3\) return true;

&nbsp;&nbsp;if (phaseId \>= 17 && level \>= 4\) return true;

&nbsp;&nbsp;if (phaseId \>= 20 && level \>= 5\) return true;

&nbsp;&nbsp;return false;

}

&nbsp;

export function getTransformationHint(phaseId: number): string | null {

&nbsp;&nbsp;const level \= getTransformationLevel();

&nbsp;&nbsp;if (level \=== 0\) return null;

&nbsp;

&nbsp;&nbsp;if (phaseId \=== 7 && level \>= 1\) return 'Theo nota uma pequena marca no braço.';

&nbsp;&nbsp;if (phaseId \=== 11 && level \>= 2\) return 'Por um instante, o reflexo dos olhos de Theo parece diferente.';

&nbsp;&nbsp;if (phaseId \=== 14 && level \>= 3\) return 'A sombra de Theo na parede está ligeiramente deformada.';

&nbsp;&nbsp;if (phaseId \=== 17 && level \>= 4\) return 'A respiração de Theo soa diferente. Mais funda.';

&nbsp;&nbsp;if (phaseId \=== 20 && level \>= 5\) return 'O rosto de Theo aparece no cubo.';

&nbsp;

&nbsp;&nbsp;return null;

}

\`\`\`

&nbsp;

\#\# Ação 11.2 — Teste

&nbsp;

\`tests/unit/TransformationSystem.test.ts\`:

&nbsp;

\`\`\`ts

import { describe, it, expect, beforeEach } from 'vitest';

import { resetState, getState } from '@/game/GameState';

import {

&nbsp;&nbsp;shouldShowTransformationEffect,

&nbsp;&nbsp;getTransformationHint,

&nbsp;&nbsp;getTransformationLevel

} from '@/game/TransformationSystem';

&nbsp;

describe('TransformationSystem', () \=\> {

&nbsp;&nbsp;beforeEach(() \=\> resetState());

&nbsp;

&nbsp;&nbsp;it('nível 0 não mostra efeito', () \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;expect(shouldShowTransformationEffect(7)).toBe(false);

&nbsp;&nbsp;&nbsp;&nbsp;expect(getTransformationLevel()).toBe(0);

&nbsp;&nbsp;});

&nbsp;

&nbsp;&nbsp;it('nível 1 mostra efeito a partir da fase 7', () \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;getState().transformationLevel \= 1;

&nbsp;&nbsp;&nbsp;&nbsp;expect(shouldShowTransformationEffect(7)).toBe(true);

&nbsp;&nbsp;&nbsp;&nbsp;expect(shouldShowTransformationEffect(6)).toBe(false);

&nbsp;&nbsp;});

&nbsp;

&nbsp;&nbsp;it('retorna hint correto por fase', () \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;getState().transformationLevel \= 1;

&nbsp;&nbsp;&nbsp;&nbsp;expect(getTransformationHint(7)).toContain('marca');

&nbsp;&nbsp;});

});

\`\`\`

&nbsp;

\#\# Ação 11.3 — Commit

&nbsp;

\`\`\`bash

git add .

git commit \-m "feat: transformation system"

\`\`\`

&nbsp;

\---

&nbsp;

\# SETOR 12 — ENDING SYSTEM

&nbsp;

\#\# Ação 12.1 — Criar \`src/game/EndingSystem.ts\`

&nbsp;

\`\`\`ts

import { GameState } from '@/types/GameState';

import { getState } from './GameState';

&nbsp;

export type EndingId \= 'good' | 'bad' | 'secret';

&nbsp;

export function calculateEnding(state: GameState \= getState()): EndingId {

&nbsp;&nbsp;if (state.errors \>= 2\) return 'bad';

&nbsp;

&nbsp;&nbsp;const allSymbols \= state.symbols.length \=== 5;

&nbsp;&nbsp;const hasHiddenTruth \= state.clues.includes('hidden\_truth');

&nbsp;

&nbsp;&nbsp;if (state.errors \=== 0 && state.cube.solved && allSymbols && hasHiddenTruth) {

&nbsp;&nbsp;&nbsp;&nbsp;return 'secret';

&nbsp;&nbsp;}

&nbsp;

&nbsp;&nbsp;return 'good';

}

&nbsp;

export function applyEndingToState(ending: EndingId): void {

&nbsp;&nbsp;getState().ending \= ending;

}

\`\`\`

&nbsp;

\#\# Ação 12.2 — Teste

&nbsp;

\`tests/unit/EndingSystem.test.ts\`:

&nbsp;

\`\`\`ts

import { describe, it, expect, beforeEach } from 'vitest';

import { calculateEnding } from '@/game/EndingSystem';

import { resetState, getState } from '@/game/GameState';

&nbsp;

describe('EndingSystem', () \=\> {

&nbsp;&nbsp;beforeEach(() \=\> resetState());

&nbsp;

&nbsp;&nbsp;it('retorna bad com 2+ erros', () \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;getState().errors \= 2;

&nbsp;&nbsp;&nbsp;&nbsp;expect(calculateEnding()).toBe('bad');

&nbsp;&nbsp;});

&nbsp;

&nbsp;&nbsp;it('retorna good com 1 erro', () \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;getState().errors \= 1;

&nbsp;&nbsp;&nbsp;&nbsp;getState().cube.solved \= true;

&nbsp;&nbsp;&nbsp;&nbsp;expect(calculateEnding()).toBe('good');

&nbsp;&nbsp;});

&nbsp;

&nbsp;&nbsp;it('retorna secret com 0 erros e condições completas', () \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;const s \= getState();

&nbsp;&nbsp;&nbsp;&nbsp;s.errors \= 0;

&nbsp;&nbsp;&nbsp;&nbsp;s.cube.solved \= true;

&nbsp;&nbsp;&nbsp;&nbsp;s.symbols \= \['olho', 'lua', 'mao', 'corvo', 'arvore'\];

&nbsp;&nbsp;&nbsp;&nbsp;s.clues.push('hidden\_truth');

&nbsp;&nbsp;&nbsp;&nbsp;expect(calculateEnding()).toBe('secret');

&nbsp;&nbsp;});

&nbsp;

&nbsp;&nbsp;it('retorna good com 0 erros mas sem hidden\_truth', () \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;const s \= getState();

&nbsp;&nbsp;&nbsp;&nbsp;s.errors \= 0;

&nbsp;&nbsp;&nbsp;&nbsp;s.cube.solved \= true;

&nbsp;&nbsp;&nbsp;&nbsp;s.symbols \= \['olho', 'lua', 'mao', 'corvo', 'arvore'\];

&nbsp;&nbsp;&nbsp;&nbsp;expect(calculateEnding()).toBe('good');

&nbsp;&nbsp;});

});

\`\`\`

&nbsp;

\#\# Ação 12.3 — Commit

&nbsp;

\`\`\`bash

git add .

git commit \-m "feat: ending system com tres finais"

\`\`\`

&nbsp;

\---

&nbsp;

\# SETOR 13 — AUDIO MANAGER

&nbsp;

\#\# Ação 13.1 — Criar \`src/game/AudioManager.ts\`

&nbsp;

\`\`\`ts

import Phaser from 'phaser';

&nbsp;

let currentMusic: Phaser.Sound.BaseSound | null \= null;

&nbsp;

export function playMusic(scene: Phaser.Scene, key: string, loop \= true): void {

&nbsp;&nbsp;if (currentMusic) {

&nbsp;&nbsp;&nbsp;&nbsp;currentMusic.stop();

&nbsp;&nbsp;&nbsp;&nbsp;currentMusic.destroy();

&nbsp;&nbsp;&nbsp;&nbsp;currentMusic \= null;

&nbsp;&nbsp;}

&nbsp;

&nbsp;&nbsp;if (\!scene.cache.audio.exists(key)) {

&nbsp;&nbsp;&nbsp;&nbsp;console.warn(\`Áudio ${key} não encontrado no cache.\`);

&nbsp;&nbsp;&nbsp;&nbsp;return;

&nbsp;&nbsp;}

&nbsp;

&nbsp;&nbsp;currentMusic \= scene.sound.add(key, { loop, volume: 0.6 });

&nbsp;&nbsp;currentMusic.play();

}

&nbsp;

export function stopMusic(): void {

&nbsp;&nbsp;if (currentMusic) {

&nbsp;&nbsp;&nbsp;&nbsp;currentMusic.stop();

&nbsp;&nbsp;&nbsp;&nbsp;currentMusic.destroy();

&nbsp;&nbsp;&nbsp;&nbsp;currentMusic \= null;

&nbsp;&nbsp;}

}

&nbsp;

export function playSfx(scene: Phaser.Scene, key: string, volume \= 0.8): void {

&nbsp;&nbsp;if (\!scene.cache.audio.exists(key)) {

&nbsp;&nbsp;&nbsp;&nbsp;console.warn(\`SFX ${key} não encontrado.\`);

&nbsp;&nbsp;&nbsp;&nbsp;return;

&nbsp;&nbsp;}

&nbsp;&nbsp;scene.sound.play(key, { volume });

}

&nbsp;

export function setMusicVolume(scene: Phaser.Scene, volume: number): void {

&nbsp;&nbsp;scene.sound.volume \= Math.max(0, Math.min(1, volume));

}

\`\`\`

&nbsp;

\#\# Ação 13.2 — Commit

&nbsp;

\`\`\`bash

git add .

git commit \-m "feat: audio manager"

\`\`\`

&nbsp;

\---

&nbsp;

\# SETOR 14 — CENA: BOOT

&nbsp;

\#\# Ação 14.1 — Criar \`src/scenes/BootScene.ts\`

&nbsp;

\`\`\`ts

import Phaser from 'phaser';

&nbsp;

export class BootScene extends Phaser.Scene {

&nbsp;&nbsp;constructor() {

&nbsp;&nbsp;&nbsp;&nbsp;super({ key: 'BootScene' });

&nbsp;&nbsp;}

&nbsp;

&nbsp;&nbsp;preload(): void {

&nbsp;&nbsp;&nbsp;&nbsp;this.load.image('placeholder', '/assets/props/placeholder.webp');

&nbsp;&nbsp;}

&nbsp;

&nbsp;&nbsp;create(): void {

&nbsp;&nbsp;&nbsp;&nbsp;this.scene.start('PreloadScene');

&nbsp;&nbsp;}

}

\`\`\`

&nbsp;

\#\# Ação 14.2 — Commit

&nbsp;

\`\`\`bash

git add .

git commit \-m "feat: boot scene"

\`\`\`

&nbsp;

\---

&nbsp;

\# SETOR 15 — CENA: PRELOAD

&nbsp;

\#\# Ação 15.1 — Criar \`src/scenes/PreloadScene.ts\`

&nbsp;

\`\`\`ts

import Phaser from 'phaser';

&nbsp;

export class PreloadScene extends Phaser.Scene {

&nbsp;&nbsp;constructor() {

&nbsp;&nbsp;&nbsp;&nbsp;super({ key: 'PreloadScene' });

&nbsp;&nbsp;}

&nbsp;

&nbsp;&nbsp;preload(): void {

&nbsp;&nbsp;&nbsp;&nbsp;// Barra de progresso

&nbsp;&nbsp;&nbsp;&nbsp;const width \= this.cameras.main.width;

&nbsp;&nbsp;&nbsp;&nbsp;const height \= this.cameras.main.height;

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;const bar \= this.add.rectangle(width / 2, height / 2, 0, 20, 0xffffff);

&nbsp;&nbsp;&nbsp;&nbsp;bar.setOrigin(0, 0.5);

&nbsp;&nbsp;&nbsp;&nbsp;bar.x \= width / 2 \- 200;

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;const text \= this.add.text(width / 2, height / 2 \- 40, 'Carregando...', {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontFamily: 'monospace',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontSize: '18px',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;color: '\#ffffff'

&nbsp;&nbsp;&nbsp;&nbsp;});

&nbsp;&nbsp;&nbsp;&nbsp;text.setOrigin(0.5);

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;this.load.on('progress', (value: number) \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;bar.width \= 400 \* value;

&nbsp;&nbsp;&nbsp;&nbsp;});

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;this.load.on('complete', () \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;bar.destroy();

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;text.destroy();

&nbsp;&nbsp;&nbsp;&nbsp;});

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;// Assets compartilhados

&nbsp;&nbsp;&nbsp;&nbsp;this.load.json('phases', '/data/phases.json');

&nbsp;&nbsp;&nbsp;&nbsp;this.load.json('clues', '/data/clues.json');

&nbsp;&nbsp;&nbsp;&nbsp;this.load.json('symbols', '/data/symbols.json');

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;// Assets de UI

&nbsp;&nbsp;&nbsp;&nbsp;this.load.image('ui-button', '/assets/props/ui-button.webp');

&nbsp;&nbsp;&nbsp;&nbsp;this.load.image('ui-panel', '/assets/props/ui-panel.webp');

&nbsp;&nbsp;}

&nbsp;

&nbsp;&nbsp;create(): void {

&nbsp;&nbsp;&nbsp;&nbsp;this.scene.start('MenuScene');

&nbsp;&nbsp;}

}

\`\`\`

&nbsp;

\#\# Ação 15.2 — Commit

&nbsp;

\`\`\`bash

git add .

git commit \-m "feat: preload scene"

\`\`\`

&nbsp;

\---

&nbsp;

\# SETOR 16 — CENA: MENU

&nbsp;

\#\# Ação 16.1 — Criar \`src/scenes/MenuScene.ts\`

&nbsp;

\`\`\`ts

import Phaser from 'phaser';

import { hasSave, loadGame } from '@/game/SaveManager';

import { setState, resetState } from '@/game/GameState';

&nbsp;

export class MenuScene extends Phaser.Scene {

&nbsp;&nbsp;constructor() {

&nbsp;&nbsp;&nbsp;&nbsp;super({ key: 'MenuScene' });

&nbsp;&nbsp;}

&nbsp;

&nbsp;&nbsp;async create(): Promise\<void\> {

&nbsp;&nbsp;&nbsp;&nbsp;const { width, height } \= this.cameras.main;

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;this.add

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.text(width / 2, 120, 'O ÚLTIMO RASTRO', {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontFamily: 'monospace',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontSize: '48px',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;color: '\#ffffff'

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;})

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.setOrigin(0.5);

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;const canContinue \= await hasSave();

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;this.createButton(width / 2, height / 2 \- 60, 'NOVO JOGO', () \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;resetState();

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;this.scene.start('IntroScene');

&nbsp;&nbsp;&nbsp;&nbsp;});

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;if (canContinue) {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;this.createButton(width / 2, height / 2, 'CONTINUAR', async () \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;const save \= await loadGame();

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;if (save) {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;setState(save);

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;this.scene.start('StoryScene', { phaseId: save.currentPhase });

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;});

&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;this.createButton(width / 2, height / 2 \+ 60, 'DIÁRIO', () \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;this.scene.start('DiaryScene', { from: 'MenuScene' });

&nbsp;&nbsp;&nbsp;&nbsp;});

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;this.createButton(width / 2, height / 2 \+ 120, 'CRÉDITOS', () \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;this.scene.start('CreditsScene', { from: 'MenuScene' });

&nbsp;&nbsp;&nbsp;&nbsp;});

&nbsp;&nbsp;}

&nbsp;

&nbsp;&nbsp;private createButton(x: number, y: number, label: string, onClick: () \=\> void): void {

&nbsp;&nbsp;&nbsp;&nbsp;const btn \= this.add

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.text(x, y, label, {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontFamily: 'monospace',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontSize: '22px',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;color: '\#cccccc',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;backgroundColor: '\#1a1a22',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;padding: { x: 24, y: 12 }

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;})

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.setOrigin(0.5)

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.setInteractive({ useHandCursor: true });

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;btn.on('pointerover', () \=\> btn.setColor('\#ffffff'));

&nbsp;&nbsp;&nbsp;&nbsp;btn.on('pointerout', () \=\> btn.setColor('\#cccccc'));

&nbsp;&nbsp;&nbsp;&nbsp;btn.on('pointerdown', onClick);

&nbsp;&nbsp;}

}

\`\`\`

&nbsp;

\#\# Ação 16.2 — Commit

&nbsp;

\`\`\`bash

git add .

git commit \-m "feat: menu scene"

\`\`\`

&nbsp;

\---

&nbsp;

\# SETOR 17 — CENA: INTRO

&nbsp;

\#\# Ação 17.1 — Criar \`src/scenes/IntroScene.ts\`

&nbsp;

\`\`\`ts

import Phaser from 'phaser';

&nbsp;

export class IntroScene extends Phaser.Scene {

&nbsp;&nbsp;constructor() {

&nbsp;&nbsp;&nbsp;&nbsp;super({ key: 'IntroScene' });

&nbsp;&nbsp;}

&nbsp;

&nbsp;&nbsp;create(): void {

&nbsp;&nbsp;&nbsp;&nbsp;const { width, height } \= this.cameras.main;

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;const text \= this.add

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.text(width / 2, height / 2, 'Theo chega em casa.\\nA porta está aberta.', {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontFamily: 'monospace',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontSize: '28px',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;color: '\#ffffff',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;align: 'center'

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;})

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.setOrigin(0.5)

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.setAlpha(0);

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;this.tweens.add({

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;targets: text,

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;alpha: 1,

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;duration: 1500,

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;onComplete: () \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;this.time.delayedCall(2500, () \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;this.scene.start('StoryScene', { phaseId: 1 });

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;});

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;&nbsp;&nbsp;&nbsp;});

&nbsp;&nbsp;}

}

\`\`\`

&nbsp;

\#\# Ação 17.2 — Commit

&nbsp;

\`\`\`bash

git add .

git commit \-m "feat: intro scene"

\`\`\`

&nbsp;

\---

&nbsp;

\# SETOR 18 — CENA: STORY

&nbsp;

\#\# Ação 18.1 — Criar \`src/scenes/StoryScene.ts\`

&nbsp;

\`\`\`ts

import Phaser from 'phaser';

import { getPhase } from '@/systems/PhaseLoader';

import { setCurrentPhase, getState } from '@/game/GameState';

import { saveGame } from '@/game/SaveManager';

import { getTransformationHint } from '@/game/TransformationSystem';

import { Phase } from '@/types/Phase';

&nbsp;

interface StorySceneData {

&nbsp;&nbsp;phaseId: number;

}

&nbsp;

export class StoryScene extends Phaser.Scene {

&nbsp;&nbsp;private phase\!: Phase;

&nbsp;

&nbsp;&nbsp;constructor() {

&nbsp;&nbsp;&nbsp;&nbsp;super({ key: 'StoryScene' });

&nbsp;&nbsp;}

&nbsp;

&nbsp;&nbsp;async create(data: StorySceneData): Promise\<void\> {

&nbsp;&nbsp;&nbsp;&nbsp;const phaseId \= data.phaseId ?? 1;

&nbsp;&nbsp;&nbsp;&nbsp;setCurrentPhase(phaseId);

&nbsp;&nbsp;&nbsp;&nbsp;this.phase \= await getPhase(phaseId);

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;await saveGame(getState());

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;const { width, height } \= this.cameras.main;

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;// Fundo

&nbsp;&nbsp;&nbsp;&nbsp;if (this.textures.exists(this.phase.image)) {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;this.add.image(width / 2, height / 2, this.phase.image).setDisplaySize(width, height);

&nbsp;&nbsp;&nbsp;&nbsp;} else {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;this.cameras.main.setBackgroundColor('\#0B0B10');

&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;// Título da fase

&nbsp;&nbsp;&nbsp;&nbsp;this.add.text(40, 40, \`FASE ${this.phase.id} — ${this.phase.title}\`, {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontFamily: 'monospace',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontSize: '20px',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;color: '\#ffffff'

&nbsp;&nbsp;&nbsp;&nbsp;});

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;// Cena

&nbsp;&nbsp;&nbsp;&nbsp;this.add.text(40, 100, this.phase.scene, {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontFamily: 'monospace',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontSize: '18px',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;color: '\#dddddd',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;wordWrap: { width: width \- 80 }

&nbsp;&nbsp;&nbsp;&nbsp;});

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;// Hint de transformação

&nbsp;&nbsp;&nbsp;&nbsp;const hint \= getTransformationHint(this.phase.id);

&nbsp;&nbsp;&nbsp;&nbsp;if (hint) {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;this.add.text(40, height \- 80, hint, {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontFamily: 'monospace',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontSize: '16px',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;color: '\#aa88ff'

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;});

&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;// Botão continuar

&nbsp;&nbsp;&nbsp;&nbsp;this.createContinueButton(width / 2, height \- 40);

&nbsp;&nbsp;}

&nbsp;

&nbsp;&nbsp;private createContinueButton(x: number, y: number): void {

&nbsp;&nbsp;&nbsp;&nbsp;const btn \= this.add

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.text(x, y, 'CONTINUAR', {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontFamily: 'monospace',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontSize: '20px',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;color: '\#ffffff',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;backgroundColor: '\#1a1a22',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;padding: { x: 20, y: 10 }

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;})

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.setOrigin(0.5)

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.setInteractive({ useHandCursor: true });

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;btn.on('pointerdown', () \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;this.scene.start('ChoiceScene', { phaseId: this.phase.id });

&nbsp;&nbsp;&nbsp;&nbsp;});

&nbsp;&nbsp;}

}

\`\`\`

&nbsp;

\#\# Ação 18.2 — Commit

&nbsp;

\`\`\`bash

git add .

git commit \-m "feat: story scene"

\`\`\`

&nbsp;

\---

&nbsp;

\# SETOR 19 — CENA: CHOICE

&nbsp;

\#\# Ação 19.1 — Criar \`src/scenes/ChoiceScene.ts\`

&nbsp;

\`\`\`ts

import Phaser from 'phaser';

import { getPhase } from '@/systems/PhaseLoader';

import { resolveChoice } from '@/game/ChoiceSystem';

import { getState } from '@/game/GameState';

import { saveGame } from '@/game/SaveManager';

import { Phase } from '@/types/Phase';

&nbsp;

interface ChoiceSceneData {

&nbsp;&nbsp;phaseId: number;

}

&nbsp;

export class ChoiceScene extends Phaser.Scene {

&nbsp;&nbsp;private phase\!: Phase;

&nbsp;

&nbsp;&nbsp;constructor() {

&nbsp;&nbsp;&nbsp;&nbsp;super({ key: 'ChoiceScene' });

&nbsp;&nbsp;}

&nbsp;

&nbsp;&nbsp;async create(data: ChoiceSceneData): Promise\<void\> {

&nbsp;&nbsp;&nbsp;&nbsp;this.phase \= await getPhase(data.phaseId);

&nbsp;&nbsp;&nbsp;&nbsp;const { width, height } \= this.cameras.main;

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;this.cameras.main.setBackgroundColor('\#0B0B10');

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;this.add

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.text(width / 2, 80, \`FASE ${this.phase.id}\`, {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontFamily: 'monospace',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontSize: '28px',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;color: '\#ffffff'

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;})

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.setOrigin(0.5);

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;const startY \= 200;

&nbsp;&nbsp;&nbsp;&nbsp;const spacing \= 110;

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;this.phase.choices.forEach((choice, index) \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;const y \= startY \+ index \* spacing;

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;this.createChoiceButton(width / 2, y, choice.text, () \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;this.handleChoice(choice.id);

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;});

&nbsp;&nbsp;&nbsp;&nbsp;});

&nbsp;&nbsp;}

&nbsp;

&nbsp;&nbsp;private createChoiceButton(x: number, y: number, label: string, onClick: () \=\> void): void {

&nbsp;&nbsp;&nbsp;&nbsp;const btn \= this.add

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.text(x, y, label, {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontFamily: 'monospace',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontSize: '20px',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;color: '\#dddddd',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;backgroundColor: '\#1a1a22',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;padding: { x: 24, y: 16 },

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fixedWidth: 600,

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;align: 'center'

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;})

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.setOrigin(0.5)

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.setInteractive({ useHandCursor: true });

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;btn.on('pointerover', () \=\> btn.setColor('\#ffffff'));

&nbsp;&nbsp;&nbsp;&nbsp;btn.on('pointerout', () \=\> btn.setColor('\#dddddd'));

&nbsp;&nbsp;&nbsp;&nbsp;btn.on('pointerdown', onClick);

&nbsp;&nbsp;}

&nbsp;

&nbsp;&nbsp;private async handleChoice(choiceId: string): Promise\<void\> {

&nbsp;&nbsp;&nbsp;&nbsp;const choice \= this.phase.choices.find((c) \=\> c.id \=== choiceId);

&nbsp;&nbsp;&nbsp;&nbsp;if (\!choice) return;

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;const result \= resolveChoice(this.phase, choice);

&nbsp;&nbsp;&nbsp;&nbsp;await saveGame(getState());

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;// Mostrar consequência

&nbsp;&nbsp;&nbsp;&nbsp;this.showConsequence(result.consequence, result.correct);

&nbsp;&nbsp;}

&nbsp;

&nbsp;&nbsp;private showConsequence(text: string, \_correct: boolean): void {

&nbsp;&nbsp;&nbsp;&nbsp;const { width, height } \= this.cameras.main;

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;const overlay \= this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;const label \= this.add

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.text(width / 2, height / 2 \- 40, 'Você encontrou algo aqui.', {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontFamily: 'monospace',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontSize: '18px',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;color: '\#aaaaaa'

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;})

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.setOrigin(0.5);

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;const consequence \= this.add

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.text(width / 2, height / 2 \+ 20, text, {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontFamily: 'monospace',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontSize: '22px',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;color: '\#ffffff',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;align: 'center',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;wordWrap: { width: width \- 200 }

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;})

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.setOrigin(0.5);

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;this.time.delayedCall(3000, () \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;overlay.destroy();

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;label.destroy();

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;consequence.destroy();

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;this.showCliffhanger();

&nbsp;&nbsp;&nbsp;&nbsp;});

&nbsp;&nbsp;}

&nbsp;

&nbsp;&nbsp;private showCliffhanger(): void {

&nbsp;&nbsp;&nbsp;&nbsp;const { width, height } \= this.cameras.main;

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;const cliff \= this.add

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.text(width / 2, height / 2, this.phase.cliffhanger, {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontFamily: 'monospace',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontSize: '26px',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;color: '\#ffffff',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;align: 'center',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;wordWrap: { width: width \- 200 }

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;})

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.setOrigin(0.5)

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.setAlpha(0);

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;this.tweens.add({

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;targets: cliff,

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;alpha: 1,

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;duration: 1000

&nbsp;&nbsp;&nbsp;&nbsp;});

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;const btn \= this.add

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.text(width / 2, height \- 80, 'CONTINUAR', {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontFamily: 'monospace',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontSize: '20px',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;color: '\#ffffff',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;backgroundColor: '\#1a1a22',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;padding: { x: 20, y: 10 }

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;})

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.setOrigin(0.5)

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.setInteractive({ useHandCursor: true })

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.setAlpha(0);

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;this.tweens.add({

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;targets: btn,

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;alpha: 1,

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;delay: 1500,

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;duration: 500

&nbsp;&nbsp;&nbsp;&nbsp;});

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;btn.on('pointerdown', () \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;const nextPhase \= this.phase.id \+ 1;

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;if (nextPhase \> 20\) {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;this.scene.start('PuzzleScene');

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;} else {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;this.scene.start('StoryScene', { phaseId: nextPhase });

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;&nbsp;&nbsp;&nbsp;});

&nbsp;&nbsp;}

}

\`\`\`

&nbsp;

\#\# Ação 19.2 — Commit

&nbsp;

\`\`\`bash

git add .

git commit \-m "feat: choice scene com resolucao e cliffhanger"

\`\`\`

&nbsp;

\---

&nbsp;

\# SETOR 20 — CENA: DIARY

&nbsp;

\#\# Ação 20.1 — Criar \`src/scenes/DiaryScene.ts\`

&nbsp;

\`\`\`ts

import Phaser from 'phaser';

import { loadSymbols } from '@/game/SymbolSystem';

import { getDiarySymbols } from '@/game/SymbolSystem';

&nbsp;

interface DiarySceneData {

&nbsp;&nbsp;from: string;

}

&nbsp;

export class DiaryScene extends Phaser.Scene {

&nbsp;&nbsp;private fromScene \= 'MenuScene';

&nbsp;

&nbsp;&nbsp;constructor() {

&nbsp;&nbsp;&nbsp;&nbsp;super({ key: 'DiaryScene' });

&nbsp;&nbsp;}

&nbsp;

&nbsp;&nbsp;async create(data: DiarySceneData): Promise\<void\> {

&nbsp;&nbsp;&nbsp;&nbsp;this.fromScene \= data.from ?? 'MenuScene';

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;const { width, height } \= this.cameras.main;

&nbsp;&nbsp;&nbsp;&nbsp;this.cameras.main.setBackgroundColor('\#0B0B10');

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;this.add

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.text(width / 2, 60, 'DIÁRIO DE THEO', {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontFamily: 'monospace',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontSize: '32px',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;color: '\#ffffff'

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;})

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.setOrigin(0.5);

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;const symbols \= await loadSymbols();

&nbsp;&nbsp;&nbsp;&nbsp;const collected \= getDiarySymbols();

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;let y \= 160;

&nbsp;&nbsp;&nbsp;&nbsp;for (const id of collected) {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;const data \= symbols.find((s) \=\> s.id \=== id);

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;if (\!data) continue;

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;this.add.text(80, y, \`\[${id.toUpperCase()}\] ${data.name}\`, {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontFamily: 'monospace',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontSize: '20px',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;color: '\#ffffff'

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;});

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;this.add.text(80, y \+ 30, data.diaryNote, {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontFamily: 'monospace',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontSize: '16px',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;color: '\#aaaaaa'

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;});

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;y \+= 90;

&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;if (collected.length \=== 0\) {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;this.add

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.text(width / 2, height / 2, 'O diário está vazio.', {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontFamily: 'monospace',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontSize: '20px',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;color: '\#666666'

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;})

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.setOrigin(0.5);

&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;this.createBackButton();

&nbsp;&nbsp;}

&nbsp;

&nbsp;&nbsp;private createBackButton(): void {

&nbsp;&nbsp;&nbsp;&nbsp;const { width, height } \= this.cameras.main;

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;const btn \= this.add

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.text(width / 2, height \- 60, 'VOLTAR', {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontFamily: 'monospace',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontSize: '20px',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;color: '\#ffffff',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;backgroundColor: '\#1a1a22',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;padding: { x: 20, y: 10 }

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;})

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.setOrigin(0.5)

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.setInteractive({ useHandCursor: true });

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;btn.on('pointerdown', () \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;this.scene.start(this.fromScene);

&nbsp;&nbsp;&nbsp;&nbsp;});

&nbsp;&nbsp;}

}

\`\`\`

&nbsp;

\#\# Ação 20.2 — Commit

&nbsp;

\`\`\`bash

git add .

git commit \-m "feat: diary scene"

\`\`\`

&nbsp;

\---

&nbsp;

\# SETOR 21 — CENA: PUZZLE

&nbsp;

\#\# Ação 21.1 — Criar \`src/scenes/PuzzleScene.ts\`

&nbsp;

\`\`\`ts

import Phaser from 'phaser';

import { getState } from '@/game/GameState';

import { calculateEnding, applyEndingToState } from '@/game/EndingSystem';

import { saveGame } from '@/game/SaveManager';

&nbsp;

const CORRECT\_ORDER \= \['olho', 'lua', 'mao', 'corvo', 'arvore'\];

const FACES \= \['olho', 'lua', 'mao', 'corvo', 'arvore', 'rosto'\];

&nbsp;

export class PuzzleScene extends Phaser.Scene {

&nbsp;&nbsp;private selected: string\[\] \= \[\];

&nbsp;&nbsp;private buttons: Phaser.GameObjects.Text\[\] \= \[\];

&nbsp;

&nbsp;&nbsp;constructor() {

&nbsp;&nbsp;&nbsp;&nbsp;super({ key: 'PuzzleScene' });

&nbsp;&nbsp;}

&nbsp;

&nbsp;&nbsp;create(): void {

&nbsp;&nbsp;&nbsp;&nbsp;const { width, height } \= this.cameras.main;

&nbsp;&nbsp;&nbsp;&nbsp;this.cameras.main.setBackgroundColor('\#0B0B10');

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;this.add

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.text(width / 2, 60, 'CUBO DE ORUN', {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontFamily: 'monospace',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontSize: '32px',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;color: '\#ffffff'

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;})

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.setOrigin(0.5);

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;this.add

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.text(

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;width / 2,

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;120,

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'Quem viu primeiro, lembra primeiro.\\nQuem lembrou, girou.\\nQuem girou, encontrou.',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontFamily: 'monospace',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontSize: '16px',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;color: '\#888888',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;align: 'center'

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.setOrigin(0.5);

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;const startY \= 260;

&nbsp;&nbsp;&nbsp;&nbsp;const spacing \= 60;

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;FACES.forEach((face, index) \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;const btn \= this.add

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.text(width / 2, startY \+ index \* spacing, \`\[ ${face.toUpperCase()} \]\`, {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontFamily: 'monospace',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontSize: '22px',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;color: '\#dddddd',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;backgroundColor: '\#1a1a22',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;padding: { x: 20, y: 8 },

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fixedWidth: 300,

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;align: 'center'

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;})

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.setOrigin(0.5)

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.setInteractive({ useHandCursor: true });

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;btn.on('pointerdown', () \=\> this.selectFace(face));

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;this.buttons.push(btn);

&nbsp;&nbsp;&nbsp;&nbsp;});

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;this.add

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.text(width / 2, height \- 40, 'Clique na ordem correta.', {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontFamily: 'monospace',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontSize: '14px',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;color: '\#666666'

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;})

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.setOrigin(0.5);

&nbsp;&nbsp;}

&nbsp;

&nbsp;&nbsp;private async selectFace(face: string): Promise\<void\> {

&nbsp;&nbsp;&nbsp;&nbsp;if (this.selected.includes(face)) return;

&nbsp;&nbsp;&nbsp;&nbsp;this.selected.push(face);

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;const idx \= this.selected.length \- 1;

&nbsp;&nbsp;&nbsp;&nbsp;const isCorrect \= this.selected\[idx\] \=== CORRECT\_ORDER\[idx\];

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;this.buttons\[FACES.indexOf(face)\].setColor(isCorrect ? '\#88ff88' : '\#ff8888');

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;if (\!isCorrect) {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;this.time.delayedCall(800, () \=\> this.resetPuzzle());

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;return;

&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;if (this.selected.length \=== CORRECT\_ORDER.length) {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;this.unlockFinalFace();

&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;&nbsp;}

&nbsp;

&nbsp;&nbsp;private resetPuzzle(): void {

&nbsp;&nbsp;&nbsp;&nbsp;this.selected \= \[\];

&nbsp;&nbsp;&nbsp;&nbsp;this.buttons.forEach((b) \=\> b.setColor('\#dddddd'));

&nbsp;&nbsp;}

&nbsp;

&nbsp;&nbsp;private async unlockFinalFace(): Promise\<void\> {

&nbsp;&nbsp;&nbsp;&nbsp;const { width, height } \= this.cameras.main;

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;this.add

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.text(width / 2, height \- 100, 'A sexta face aparece.', {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontFamily: 'monospace',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontSize: '20px',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;color: '\#ffffff'

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;})

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.setOrigin(0.5);

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;const state \= getState();

&nbsp;&nbsp;&nbsp;&nbsp;state.cube.solved \= true;

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;if (state.errors \=== 0 && state.symbols.length \=== 5\) {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;state.clues.push('hidden\_truth');

&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;const ending \= calculateEnding(state);

&nbsp;&nbsp;&nbsp;&nbsp;applyEndingToState(ending);

&nbsp;&nbsp;&nbsp;&nbsp;await saveGame(state);

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;this.time.delayedCall(2000, () \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;this.scene.start('EndingScene', { ending });

&nbsp;&nbsp;&nbsp;&nbsp;});

&nbsp;&nbsp;}

}

\`\`\`

&nbsp;

\#\# Ação 21.2 — Commit

&nbsp;

\`\`\`bash

git add .

git commit \-m "feat: puzzle scene com validacao de ordem"

\`\`\`

&nbsp;

\---

&nbsp;

\# SETOR 22 — CENA: ENDING

&nbsp;

\#\# Ação 22.1 — Criar \`src/scenes/EndingScene.ts\`

&nbsp;

\`\`\`ts

import Phaser from 'phaser';

import { EndingId } from '@/game/EndingSystem';

&nbsp;

interface EndingSceneData {

&nbsp;&nbsp;ending: EndingId;

}

&nbsp;

const ENDING\_TEXT: Record\<EndingId, { title: string; text: string }\> \= {

&nbsp;&nbsp;secret: {

&nbsp;&nbsp;&nbsp;&nbsp;title: 'FIM SECRETO — O ÚLTIMO RASTRO',

&nbsp;&nbsp;&nbsp;&nbsp;text: 'Você não encontrou apenas o caminho.\\nVocê encontrou a verdade mais antiga.'

&nbsp;&nbsp;},

&nbsp;&nbsp;good: {

&nbsp;&nbsp;&nbsp;&nbsp;title: 'FIM — O ÚLTIMO RASTRO',

&nbsp;&nbsp;&nbsp;&nbsp;text: 'Você não encontrou apenas o caminho.\\nVocê encontrou a verdade.\\nMas uma parte de você ficou pelo caminho.'

&nbsp;&nbsp;},

&nbsp;&nbsp;bad: {

&nbsp;&nbsp;&nbsp;&nbsp;title: 'FIM — O ÚLTIMO RASTRO',

&nbsp;&nbsp;&nbsp;&nbsp;text: 'Toda escolha deixa um rastro.'

&nbsp;&nbsp;}

};

&nbsp;

export class EndingScene extends Phaser.Scene {

&nbsp;&nbsp;constructor() {

&nbsp;&nbsp;&nbsp;&nbsp;super({ key: 'EndingScene' });

&nbsp;&nbsp;}

&nbsp;

&nbsp;&nbsp;create(data: EndingSceneData): void {

&nbsp;&nbsp;&nbsp;&nbsp;const { width, height } \= this.cameras.main;

&nbsp;&nbsp;&nbsp;&nbsp;const info \= ENDING\_TEXT\[data.ending\];

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;this.cameras.main.setBackgroundColor('\#000000');

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;const title \= this.add

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.text(width / 2, height / 2 \- 80, info.title, {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontFamily: 'monospace',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontSize: '28px',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;color: '\#ffffff',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;align: 'center'

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;})

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.setOrigin(0.5)

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.setAlpha(0);

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;const text \= this.add

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.text(width / 2, height / 2 \+ 20, info.text, {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontFamily: 'monospace',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontSize: '20px',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;color: '\#cccccc',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;align: 'center',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;wordWrap: { width: width \- 200 }

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;})

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.setOrigin(0.5)

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.setAlpha(0);

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;this.tweens.add({ targets: title, alpha: 1, duration: 1500 });

&nbsp;&nbsp;&nbsp;&nbsp;this.tweens.add({ targets: text, alpha: 1, delay: 1500, duration: 1500 });

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;this.time.delayedCall(5000, () \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;this.scene.start('CreditsScene', { from: 'EndingScene', ending: data.ending });

&nbsp;&nbsp;&nbsp;&nbsp;});

&nbsp;&nbsp;}

}

\`\`\`

&nbsp;

\#\# Ação 22.2 — Commit

&nbsp;

\`\`\`bash

git add .

git commit \-m "feat: ending scene com tres finais"

\`\`\`

&nbsp;

\---

&nbsp;

\# SETOR 23 — CENA: CREDITS

&nbsp;

\#\# Ação 23.1 — Criar \`src/scenes/CreditsScene.ts\`

&nbsp;

\`\`\`ts

import Phaser from 'phaser';

import { getState } from '@/game/GameState';

import { getPhase } from '@/systems/PhaseLoader';

&nbsp;

interface CreditsSceneData {

&nbsp;&nbsp;from: string;

&nbsp;&nbsp;ending?: string;

}

&nbsp;

export class CreditsScene extends Phaser.Scene {

&nbsp;&nbsp;private fromScene \= 'MenuScene';

&nbsp;&nbsp;private ending?: string;

&nbsp;

&nbsp;&nbsp;constructor() {

&nbsp;&nbsp;&nbsp;&nbsp;super({ key: 'CreditsScene' });

&nbsp;&nbsp;}

&nbsp;

&nbsp;&nbsp;async create(data: CreditsSceneData): Promise\<void\> {

&nbsp;&nbsp;&nbsp;&nbsp;this.fromScene \= data.from ?? 'MenuScene';

&nbsp;&nbsp;&nbsp;&nbsp;this.ending \= data.ending;

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;const { width } \= this.cameras.main;

&nbsp;&nbsp;&nbsp;&nbsp;this.cameras.main.setBackgroundColor('\#000000');

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;this.add

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.text(width / 2, 60, 'CRÉDITOS', {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontFamily: 'monospace',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontSize: '28px',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;color: '\#ffffff'

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;})

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.setOrigin(0.5);

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;// Se for final ruim, mostrar resumo de escolhas

&nbsp;&nbsp;&nbsp;&nbsp;if (this.ending \=== 'bad') {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;await this.showChoiceSummary();

&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;const btn \= this.add

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.text(width / 2, 680, 'VOLTAR AO MENU', {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontFamily: 'monospace',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontSize: '20px',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;color: '\#ffffff',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;backgroundColor: '\#1a1a22',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;padding: { x: 20, y: 10 }

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;})

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.setOrigin(0.5)

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.setInteractive({ useHandCursor: true });

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;btn.on('pointerdown', () \=\> {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;this.scene.start('MenuScene');

&nbsp;&nbsp;&nbsp;&nbsp;});

&nbsp;&nbsp;}

&nbsp;

&nbsp;&nbsp;private async showChoiceSummary(): Promise\<void\> {

&nbsp;&nbsp;&nbsp;&nbsp;const state \= getState();

&nbsp;&nbsp;&nbsp;&nbsp;const { width } \= this.cameras.main;

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;this.add

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.text(width / 2, 120, 'RESUMO DAS ESCOLHAS', {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontFamily: 'monospace',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontSize: '20px',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;color: '\#ffffff'

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;})

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.setOrigin(0.5);

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;let y \= 170;

&nbsp;&nbsp;&nbsp;&nbsp;for (const \[phaseIdStr, choiceId\] of Object.entries(state.choices)) {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;const phaseId \= Number(phaseIdStr);

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;const phase \= await getPhase(phaseId);

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;const choice \= phase.choices.find((c) \=\> c.id \=== choiceId);

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;if (\!choice) continue;

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;const symbol \= choice.correct ? '✓' : '✗';

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;const color \= choice.correct ? '\#88ff88' : '\#ff8888';

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;this.add.text(80, y, \`${symbol} FASE ${phaseId} — ${choice.text}\`, {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontFamily: 'monospace',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontSize: '14px',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;color

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;});

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;if (\!choice.correct) {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;this.add.text(80, y \+ 18, \`   Justificativa: ${phase.justification}\`, {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontFamily: 'monospace',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontSize: '12px',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;color: '\#888888',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;wordWrap: { width: width \- 160 }

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;});

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;y \+= 50;

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;} else {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;y \+= 30;

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;if (y \> 600\) break;

&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;&nbsp;}

}

\`\`\`

&nbsp;

\#\# Ação 23.2 — Commit

&nbsp;

\`\`\`bash

git add .

git commit \-m "feat: credits scene com resumo de escolhas"

\`\`\`

&nbsp;

\---

&nbsp;

\# SETOR 24 — UI COMPONENTS

&nbsp;

\#\# Ação 24.1 — Criar \`src/ui/ChoiceButton.ts\`

&nbsp;

\`\`\`ts

import Phaser from 'phaser';

&nbsp;

export interface ChoiceButtonOptions {

&nbsp;&nbsp;x: number;

&nbsp;&nbsp;y: number;

&nbsp;&nbsp;width: number;

&nbsp;&nbsp;label: string;

&nbsp;&nbsp;onClick: () \=\> void;

}

&nbsp;

export function createChoiceButton(

&nbsp;&nbsp;scene: Phaser.Scene,

&nbsp;&nbsp;options: ChoiceButtonOptions

): Phaser.GameObjects.Text {

&nbsp;&nbsp;const btn \= scene.add

&nbsp;&nbsp;&nbsp;&nbsp;.text(options.x, options.y, options.label, {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontFamily: 'monospace',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fontSize: '20px',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;color: '\#dddddd',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;backgroundColor: '\#1a1a22',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;padding: { x: 24, y: 16 },

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fixedWidth: options.width,

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;align: 'center'

&nbsp;&nbsp;&nbsp;&nbsp;})

&nbsp;&nbsp;&nbsp;&nbsp;.setOrigin(0.5)

&nbsp;&nbsp;&nbsp;&nbsp;.setInteractive({ useHandCursor: true });

&nbsp;

&nbsp;&nbsp;btn.on('pointerover', () \=\> btn.setColor('\#ffffff'));

&nbsp;&nbsp;btn.on('pointerout', () \=\> btn.setColor('\#dddddd'));

&nbsp;&nbsp;btn.on('pointerdown', options.onClick);

&nbsp;

&nbsp;&nbsp;return btn;

}

\`\`\`

&nbsp;

\#\# Ação 24.2 — Criar \`src/ui/DialogueBox.ts\`

&nbsp;

\`\`\`ts

import Phaser from 'phaser';

&nbsp;

export function createDialogueBox(

&nbsp;&nbsp;scene: Phaser.Scene,

&nbsp;&nbsp;x: number,

&nbsp;&nbsp;y: number,

&nbsp;&nbsp;width: number,

&nbsp;&nbsp;text: string

): Phaser.GameObjects.Text {

&nbsp;&nbsp;return scene.add.text(x, y, text, {

&nbsp;&nbsp;&nbsp;&nbsp;fontFamily: 'monospace',

&nbsp;&nbsp;&nbsp;&nbsp;fontSize: '18px',

&nbsp;&nbsp;&nbsp;&nbsp;color: '\#dddddd',

&nbsp;&nbsp;&nbsp;&nbsp;wordWrap: { width }

&nbsp;&nbsp;});

}

\`\`\`

&nbsp;

\#\# Ação 24.3 — Commit

&nbsp;

\`\`\`bash

git add .

git commit \-m "feat: ui components"

\`\`\`

&nbsp;

\---

&nbsp;

\# SETOR 25 — RESPONSIVIDADE

&nbsp;

\#\# Ação 25.1 — Verificar \`gameConfig\`

&nbsp;

O \`gameConfig\` já usa \`Phaser.Scale.FIT\` e \`Phaser.Scale.CENTER\_BOTH\`. Isso garante que o canvas seja redimensionado proporcionalmente.

&nbsp;

\#\# Ação 25.2 — Testar manualmente

&nbsp;

Abrir o jogo em:

&nbsp;

\- 1920×1080

\- 1366×768

\- 1280×720

\- 1024×768

\- 800×600

&nbsp;

Verificar:

&nbsp;

\- canvas centralizado

\- texto legível

\- botões clicáveis

\- sem cortes

&nbsp;

\#\# Ação 25.3 — Commit

&nbsp;

\`\`\`bash

git add .

git commit \-m "chore: validacao de responsividade"

\`\`\`

&nbsp;

\---

&nbsp;

\# SETOR 26 — TESTES

&nbsp;

\#\# Ação 26.1 — Rodar todos os testes

&nbsp;

\`\`\`bash

npm run test

\`\`\`

&nbsp;

Verificar:

&nbsp;

\- \`GameState.test.ts\` passa

\- \`SaveManager.test.ts\` passa

\- \`PhaseValidator.test.ts\` passa

\- \`PhaseLoader.test.ts\` passa

\- \`ChoiceSystem.test.ts\` passa

\- \`TransformationSystem.test.ts\` passa

\- \`EndingSystem.test.ts\` passa

&nbsp;

\#\# Ação 26.2 — Cobertura

&nbsp;

\`\`\`bash

npm run test:coverage

\`\`\`

&nbsp;

Meta: \*\*\>= 70% de cobertura\*\* nos módulos \`src/game/\` e \`src/systems/\`.

&nbsp;

\#\# Ação 26.3 — Commit

&nbsp;

\`\`\`bash

git add .

git commit \-m "test: cobertura de testes do MVP"

\`\`\`

&nbsp;

\---

&nbsp;

\# SETOR 27 — BUILD E DEPLOY

&nbsp;

\#\# Ação 27.1 — Rodar build de produção

&nbsp;

\`\`\`bash

npm run build

\`\`\`

&nbsp;

Verificar:

&nbsp;

\- sem erros de TypeScript

\- pasta \`dist/\` gerada

\- assets copiados

&nbsp;

\#\# Ação 27.2 — Rodar preview

&nbsp;

\`\`\`bash

npm run preview

\`\`\`

&nbsp;

Abrir no navegador e jogar o MVP completo:

&nbsp;

\`\`\`text

Menu → Novo Jogo → Fase 1 → Fase 2 → Fase 3 → Puzzle → Final

\`\`\`

&nbsp;

Verificar:

&nbsp;

\- escolhas corretas registram pistas

\- escolhas erradas incrementam erros

\- save funciona ao recarregar

\- diário registra símbolos

\- finais funcionam

&nbsp;

\#\# Ação 27.3 — Testar em navegadores

&nbsp;

Testar manualmente em:

&nbsp;

\`\`\`text

\[ \] Chrome

\[ \] Edge

\[ \] Firefox

\[ \] Safari (se disponível)

\`\`\`

&nbsp;

\#\# Ação 27.4 — Deploy

&nbsp;

Opções:

&nbsp;

\- \*\*Netlify:\*\* arrastar pasta \`dist/\` para https://app.netlify.com/drop

\- \*\*Vercel:\*\* \`vercel deploy \--prod\`

\- \*\*GitHub Pages:\*\* configurar \`vite.config.ts\` com \`base\` e publicar \`dist/\`

&nbsp;

Recomendado para MVP: \*\*Netlify Drop\*\* (mais rápido, sem configuração).

&nbsp;

\#\# Ação 27.5 — Commit final

&nbsp;

\`\`\`bash

git add .

git commit \-m "release: MVP v0.1.0"

git tag v0.1.0

\`\`\`

&nbsp;

\---

&nbsp;

\# SETOR 28 — PÓS-MVP

&nbsp;

\#\# Ação 28.1 — Expandir fases

&nbsp;

Substituir \`public/data/phases.json\` pelas 20 fases completas (documento de especificação v2.0).

&nbsp;

\#\# Ação 28.2 — Adicionar PWA

&nbsp;

\`\`\`bash

npm install \-D vite-plugin-pwa

\`\`\`

&nbsp;

Configurar em \`vite.config.ts\`:

&nbsp;

\`\`\`ts

import { VitePWA } from 'vite-plugin-pwa';

&nbsp;

export default defineConfig({

&nbsp;&nbsp;plugins: \[

&nbsp;&nbsp;&nbsp;&nbsp;VitePWA({

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;registerType: 'autoUpdate',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;manifest: {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;name: 'O Último Rastro',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;short\_name: 'Rastro',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;theme\_color: '\#0B0B10',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;background\_color: '\#0B0B10',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;display: 'standalone',

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;icons: \[

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{ src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\]

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;&nbsp;&nbsp;&nbsp;})

&nbsp;&nbsp;\]

});

\`\`\`

&nbsp;

\#\# Ação 28.3 — Adicionar assets reais

&nbsp;

Substituir placeholders por arte final em:

&nbsp;

\`\`\`text

public/assets/backgrounds/

public/assets/characters/

public/assets/trolls/

public/assets/props/

public/assets/symbols/

public/assets/audio/

public/assets/music/

\`\`\`

&nbsp;

\#\# Ação 28.4 — Exportar/importar progresso

&nbsp;

Adicionar em \`SaveManager.ts\`:

&nbsp;

\`\`\`ts

export async function exportSave(): Promise\<string\> {

&nbsp;&nbsp;const save \= await loadGame();

&nbsp;&nbsp;return JSON.stringify(save);

}

&nbsp;

export async function importSave(json: string): Promise\<void\> {

&nbsp;&nbsp;const save \= JSON.parse(json) as GameState;

&nbsp;&nbsp;await saveGame(migrateSave(save));

}

\`\`\`

&nbsp;

\#\# Ação 28.5 — Analytics (opcional)

&nbsp;

Se for implementar, usar apenas eventos definidos na Seção 54 do documento de especificação. Nunca coletar dados pessoais.

&nbsp;

\---

&nbsp;

\# CHECKLIST FINAL DE ENTREGA DO MVP

&nbsp;

\`\`\`text

\[ \] SETOR 0  — Ambiente preparado

\[ \] SETOR 1  — Estrutura base criada

\[ \] SETOR 2  — Phaser configurado

\[ \] SETOR 3  — Tipos definidos

\[ \] SETOR 4  — GameState implementado e testado

\[ \] SETOR 5  — SaveManager implementado e testado

\[ \] SETOR 6  — PhaseValidator implementado e testado

\[ \] SETOR 7  — PhaseLoader implementado e testado

\[ \] SETOR 8  — ChoiceSystem implementado e testado

\[ \] SETOR 9  — ClueSystem implementado

\[ \] SETOR 10 — SymbolSystem implementado

\[ \] SETOR 11 — TransformationSystem implementado e testado

\[ \] SETOR 12 — EndingSystem implementado e testado

\[ \] SETOR 13 — AudioManager implementado

\[ \] SETOR 14 — BootScene criada

\[ \] SETOR 15 — PreloadScene criada

\[ \] SETOR 16 — MenuScene criada

\[ \] SETOR 17 — IntroScene criada

\[ \] SETOR 18 — StoryScene criada

\[ \] SETOR 19 — ChoiceScene criada

\[ \] SETOR 20 — DiaryScene criada

\[ \] SETOR 21 — PuzzleScene criada

\[ \] SETOR 22 — EndingScene criada

\[ \] SETOR 23 — CreditsScene criada

\[ \] SETOR 24 — UI components criados

\[ \] SETOR 25 — Responsividade validada

\[ \] SETOR 26 — Testes passando (cobertura \>= 70%)

\[ \] SETOR 27 — Build de produção funcionando

\[ \] SETOR 27 — Deploy publicado

\[ \] SETOR 27 — Testado em Chrome, Edge, Firefox

\[ \] SETOR 27 — Testado em PC fraco

\[ \] Sem erros críticos no console

\[ \] Nenhum dado pessoal coletado

\[ \] Save funciona ao recarregar

\[ \] Migração de save v1 → v2 funciona

\[ \] Diário registra símbolos na ordem

\[ \] Finais (bom, ruim, secreto) funcionam

\[ \] Tela de créditos do Final Ruim mostra resumo

\`\`\`

&nbsp;

\---

&nbsp;

\# REGRAS GERAIS PARA O ENGENHEIRO

&nbsp;

1\. \*\*Nunca alterar o estado diretamente.\*\* Sempre via \`GameState.ts\`.

2\. \*\*Nunca hardcodar texto narrativo.\*\* Sempre via \`phases.json\`.

3\. \*\*Nunca commitar sem rodar \`npm run test\`.\*\*

4\. \*\*Nunca commitar sem rodar \`npm run build\`.\*\*

5\. \*\*Nunca usar \`any\` sem justificativa em comentário.\*\*

6\. \*\*Nunca ignorar erro de asset.\*\* Sempre fallback.

7\. \*\*Sempre validar JSON antes de usar.\*\* Sempre via \`PhaseValidator\`.

8\. \*\*Sempre versionar o save.\*\* Sempre via \`saveVersion\`.

9\. \*\*Sempre testar em máquina fraca antes de considerar pronto.\*\*

10\. \*\*Sempre ler o documento de especificação antes de mudar algo narrativo.\*\*

&nbsp;

\---

&nbsp;

\# COMANDO ÚNICO PARA VERIFICAR TUDO

&nbsp;

Antes de cada commit importante:

&nbsp;

\`\`\`bash

npm run lint && npm run test && npm run build

\`\`\`

&nbsp;

Se os três passarem, o commit é seguro.

&nbsp;

\---

&nbsp;

\*\*Fim do guia de implementação.\*\*

&nbsp;