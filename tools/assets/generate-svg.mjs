/**
 * Generate original SVG symbol assets for O Último Rastro.
 * Style: gothic dark, cyan accent #6EC1E4, no localized text.
 * Output: public/assets/symbols/*.webp-named? No — SVG sources + PNG exports optional.
 * We write SVG (definitive vector art) to public/assets/symbols and public/images/symbols.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outA = path.join(root, 'public', 'assets', 'symbols');
const outB = path.join(root, 'public', 'images', 'symbols');
fs.mkdirSync(outA, { recursive: true });
fs.mkdirSync(outB, { recursive: true });

const CYAN = '#6EC1E4';
const DEEP = '#0A0B10';
const PANEL = '#12121A';
const WHITE = '#E8EEF4';
const GOLD = '#B8956A';
const RED = '#C45C48';
const OLIVE = '#4A6B4F';

function wrap(inner, vb = '0 0 256 256') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="256" height="256" fill="none">
  <rect width="256" height="256" rx="18" fill="${PANEL}"/>
  <rect x="6" y="6" width="244" height="244" rx="14" stroke="#2A2A3A" stroke-width="2"/>
  ${inner}
</svg>
`;
}

const symbols = {
  olho: wrap(`
  <ellipse cx="128" cy="128" rx="88" ry="48" stroke="${CYAN}" stroke-width="6"/>
  <circle cx="128" cy="128" r="34" stroke="${WHITE}" stroke-width="5"/>
  <circle cx="128" cy="128" r="16" fill="${CYAN}"/>
  <circle cx="136" cy="120" r="5" fill="${WHITE}"/>
  <path d="M40 128 Q128 40 216 128" stroke="${CYAN}" stroke-width="3" opacity="0.5"/>
  <path d="M40 128 Q128 216 216 128" stroke="${CYAN}" stroke-width="3" opacity="0.5"/>
  <path d="M70 80 L55 55 M128 68 L128 40 M186 80 L201 55" stroke="${CYAN}" stroke-width="4" stroke-linecap="round" opacity="0.7"/>
  `),
  lua: wrap(`
  <path d="M150 48 A88 88 0 1 0 150 208 A70 70 0 1 1 150 48Z" fill="${WHITE}" stroke="${CYAN}" stroke-width="4"/>
  <circle cx="70" cy="100" r="8" fill="${DEEP}" opacity="0.35"/>
  <circle cx="88" cy="150" r="12" fill="${DEEP}" opacity="0.3"/>
  <circle cx="64" cy="170" r="6" fill="${DEEP}" opacity="0.25"/>
  <circle cx="190" cy="70" r="3" fill="${CYAN}"/>
  <circle cx="210" cy="110" r="2" fill="${CYAN}" opacity="0.7"/>
  <circle cx="180" cy="190" r="2.5" fill="${CYAN}" opacity="0.6"/>
  `),
  mao: wrap(`
  <path d="M88 210 V120
           C88 110 78 108 78 98 V70
           C78 60 92 60 92 70 V110
           V60 C60 50 60 80 60 90
           V150 C60 190 90 220 128 220
           C170 220 198 190 198 150
           V70 C198 58 180 58 180 70
           V110 M160 60 V50 C160 40 144 40 144 50 V110
           M126 55 V45 C126 35 110 35 110 45 V115"
        stroke="${GOLD}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <circle cx="128" cy="150" r="18" stroke="${CYAN}" stroke-width="4"/>
  <path d="M128 138 V162 M118 150 H138" stroke="${CYAN}" stroke-width="3"/>
  `),
  corvo: wrap(`
  <path d="M48 160 C70 120 90 90 128 80 C150 74 170 84 178 104
           L210 96 L188 120
           C196 150 180 190 128 200 C80 208 50 190 48 160Z"
        fill="#1A1A22" stroke="${CYAN}" stroke-width="4"/>
  <path d="M70 150 C90 130 110 120 140 118" stroke="${CYAN}" stroke-width="3" opacity="0.6"/>
  <path d="M78 170 C100 155 125 148 155 150" stroke="${CYAN}" stroke-width="2.5" opacity="0.45"/>
  <circle cx="155" cy="112" r="7" fill="${CYAN}"/>
  <circle cx="157" cy="110" r="2.5" fill="${WHITE}"/>
  <path d="M178 104 L214 108 L180 124" fill="${GOLD}" stroke="${GOLD}" stroke-width="2"/>
  <path d="M100 200 L92 230 M128 202 L128 234 M156 200 L164 230" stroke="${WHITE}" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
  `),
  arvore: wrap(`
  <path d="M128 230 V140" stroke="${GOLD}" stroke-width="8" stroke-linecap="round"/>
  <path d="M128 160 L90 120 M128 150 L168 110 M128 175 L96 150 M128 170 L164 145"
        stroke="${GOLD}" stroke-width="5" stroke-linecap="round"/>
  <path d="M60 100 C60 50 100 30 128 40 C156 30 196 50 196 100
           C196 140 160 160 128 155 C96 160 60 140 60 100Z"
        fill="${OLIVE}" stroke="${CYAN}" stroke-width="4" opacity="0.95"/>
  <path d="M80 90 C100 70 120 75 128 90 C140 70 170 75 176 95"
        stroke="${CYAN}" stroke-width="3" fill="none" opacity="0.7"/>
  <path d="M100 55 L96 40 M140 50 L148 34 M160 70 L175 58" stroke="${CYAN}" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
  <ellipse cx="128" cy="232" rx="50" ry="8" fill="${DEEP}" opacity="0.5"/>
  `),
  rosto: wrap(`
  <ellipse cx="128" cy="130" rx="70" ry="86" fill="${DEEP}" stroke="${CYAN}" stroke-width="5"/>
  <path d="M70 110 Q90 70 128 68 Q166 70 186 110" stroke="${WHITE}" stroke-width="4" fill="none" opacity="0.4"/>
  <ellipse cx="100" cy="125" rx="14" ry="18" fill="${WHITE}"/>
  <ellipse cx="156" cy="125" rx="14" ry="18" fill="${WHITE}"/>
  <circle cx="102" cy="128" r="7" fill="${CYAN}"/>
  <circle cx="158" cy="128" r="7" fill="${CYAN}"/>
  <circle cx="104" cy="125" r="2.5" fill="${WHITE}"/>
  <circle cx="160" cy="125" r="2.5" fill="${WHITE}"/>
  <path d="M112 175 Q128 188 144 175" stroke="${WHITE}" stroke-width="4" stroke-linecap="round" fill="none"/>
  <path d="M88 105 Q100 98 112 104 M144 104 Q156 98 168 105" stroke="${CYAN}" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
  <path d="M90 150 L78 165 M166 150 L178 165" stroke="${CYAN}" stroke-width="3" stroke-linecap="round" opacity="0.35"/>
  `)
};

for (const [id, svg] of Object.entries(symbols)) {
  fs.writeFileSync(path.join(outA, `${id}.svg`), svg);
  fs.writeFileSync(path.join(outB, `${id}.svg`), svg);
  // also write as .webp-named copy? No — Phaser can load svg? Phaser loads svg as image in modern browsers via load.image sometimes.
  // symbols.json expects .webp paths. We'll write svg and also a png via sharp if available; else keep svg + update loader.
  console.log('wrote', id);
}

// Cube face variants (darker stone plate with glowing glyph)
const cubeOut = path.join(root, 'public', 'images', 'cube');
fs.mkdirSync(cubeOut, { recursive: true });
for (const [id, body] of Object.entries({
  olho: `<ellipse cx="128" cy="128" rx="70" ry="38" stroke="${CYAN}" stroke-width="5"/><circle cx="128" cy="128" r="24" stroke="${WHITE}" stroke-width="4"/><circle cx="128" cy="128" r="10" fill="${CYAN}"/>`,
  lua: `<path d="M150 60 A70 70 0 1 0 150 196 A55 55 0 1 1 150 60Z" fill="${CYAN}" opacity="0.9"/>`,
  mao: `<path d="M96 200 V120 C96 110 84 110 84 98 V72 C84 62 98 62 98 72 V112 M128 60 V48 C128 38 112 38 112 48 V115 M160 64 V54 C160 44 144 44 144 54 V112 M184 80 V70 C184 60 168 60 168 70 V140 C168 185 150 210 128 210 C100 210 88 190 88 160" stroke="${CYAN}" stroke-width="6" fill="none" stroke-linecap="round"/>`,
  corvo: `<path d="M60 150 C80 110 110 90 140 92 C165 94 178 112 172 132 L200 124 L176 148 C180 175 155 195 120 196 C80 197 60 175 60 150Z" fill="${CYAN}" opacity="0.92"/><circle cx="155" cy="120" r="6" fill="${DEEP}"/>`,
  arvore: `<path d="M128 220 V130" stroke="${CYAN}" stroke-width="7" stroke-linecap="round"/><path d="M70 110 C70 60 110 40 128 52 C146 40 186 60 186 110 C186 145 155 160 128 156 C101 160 70 145 70 110Z" fill="${CYAN}" opacity="0.9"/>`,
  rosto: `<ellipse cx="128" cy="128" rx="55" ry="70" stroke="${RED}" stroke-width="5"/><circle cx="108" cy="120" r="8" fill="${RED}"/><circle cx="148" cy="120" r="8" fill="${RED}"/><path d="M110 165 Q128 150 146 165" stroke="${RED}" stroke-width="4" fill="none"/>`
})) {
  const svg = wrap(`<rect x="16" y="16" width="224" height="224" rx="12" fill="#0E0E16" stroke="#3A3F4C" stroke-width="3"/>${body}`);
  fs.writeFileSync(path.join(cubeOut, `face_${id}.svg`), svg);
  console.log('cube face', id);
}

// Ending key art (original vector posters)
const endOut = path.join(root, 'public', 'images', 'endings');
fs.mkdirSync(endOut, { recursive: true });
const endings = {
  ending_good: `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1A2A3A"/><stop offset="100%" stop-color="#0A0B10"/></linearGradient></defs>
    <rect width="256" height="256" fill="url(#g)"/>
    <circle cx="128" cy="100" r="48" stroke="${CYAN}" stroke-width="4" fill="none" opacity="0.8"/>
    <path d="M128 60 V140 M90 100 H166" stroke="${CYAN}" stroke-width="3" opacity="0.5"/>
    <path d="M70 200 Q128 160 186 200" stroke="${WHITE}" stroke-width="4" fill="none" opacity="0.7"/>
    <circle cx="128" cy="200" r="6" fill="${CYAN}"/>`,
  ending_bad: `<defs><linearGradient id="r" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2A1218"/><stop offset="100%" stop-color="#0A0B10"/></linearGradient></defs>
    <rect width="256" height="256" fill="url(#r)"/>
    <path d="M40 40 L216 216 M216 40 L40 216" stroke="${RED}" stroke-width="6" opacity="0.7"/>
    <ellipse cx="128" cy="128" rx="70" ry="70" stroke="${RED}" stroke-width="4" fill="none"/>
    <path d="M90 128 H166" stroke="${RED}" stroke-width="5"/>`,
  ending_secret: `<defs><radialGradient id="s" cx="50%" cy="40%"><stop offset="0%" stop-color="#1A3A4A"/><stop offset="100%" stop-color="#0A0B10"/></radialGradient></defs>
    <rect width="256" height="256" fill="url(#s)"/>
    <circle cx="128" cy="110" r="40" stroke="${CYAN}" stroke-width="5" fill="none"/>
    <circle cx="128" cy="110" r="14" fill="${CYAN}"/>
    <path d="M60 200 C90 170 166 170 196 200" stroke="${CYAN}" stroke-width="3" fill="none" opacity="0.6"/>
    <path d="M80 70 L100 90 M176 70 L156 90" stroke="${WHITE}" stroke-width="3" opacity="0.5"/>`
};
for (const [id, body] of Object.entries(endings)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="640" height="640">${body}</svg>`;
  fs.writeFileSync(path.join(endOut, `${id}.svg`), svg);
  fs.writeFileSync(path.join(endOut, `${id}.png.txt`), `original vector source: ${id}.svg\n`);
  console.log('ending', id);
}

// Character portrait busts (original, style-guide compliant)
const charOut = path.join(root, 'public', 'images', 'portraits');
fs.mkdirSync(charOut, { recursive: true });
function portrait(id, body) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="512" height="512">
  <rect width="256" height="256" fill="${PANEL}"/>
  <rect x="4" y="4" width="248" height="248" rx="10" stroke="#2A2A3A" stroke-width="2" fill="none"/>
  ${body}
</svg>`;
  fs.writeFileSync(path.join(charOut, `${id}.svg`), svg);
  console.log('portrait', id);
}

portrait('theo', `
  <ellipse cx="128" cy="230" rx="70" ry="40" fill="#1E2430"/>
  <path d="M78 200 Q70 140 88 110 Q100 88 128 84 Q156 88 168 110 Q186 140 178 200 Z" fill="#3A4558"/>
  <ellipse cx="128" cy="118" rx="46" ry="52" fill="#C4A484"/>
  <path d="M82 110 Q90 70 128 64 Q166 70 174 110 Q160 88 128 86 Q96 88 82 110Z" fill="#1A1A22"/>
  <path d="M90 78 Q110 60 128 62 Q150 60 168 80" stroke="#1A1A22" stroke-width="10" fill="none" stroke-linecap="round"/>
  <ellipse cx="110" cy="120" rx="10" ry="12" fill="#FFF"/>
  <ellipse cx="146" cy="120" rx="10" ry="12" fill="#FFF"/>
  <circle cx="112" cy="122" r="5" fill="#5A4634"/>
  <circle cx="148" cy="122" r="5" fill="#5A4634"/>
  <path d="M118 148 Q128 154 138 148" stroke="#8A6A52" stroke-width="3" fill="none"/>
  <path d="M96 108 Q110 102 122 108 M134 108 Q146 102 160 108" stroke="#1A1A22" stroke-width="3" fill="none"/>
  <path d="M70 210 L88 170 M186 210 L168 170" stroke="${CYAN}" stroke-width="2" opacity="0.3"/>
`);

portrait('clara', `
  <ellipse cx="128" cy="235" rx="80" ry="42" fill="#2A2434"/>
  <path d="M70 200 Q60 130 90 100 Q110 78 128 76 Q146 78 166 100 Q196 130 186 200 Z" fill="#3A2A3A"/>
  <ellipse cx="128" cy="118" rx="44" ry="52" fill="#C4A484"/>
  <path d="M80 120 Q78 60 128 52 Q178 60 176 120 L176 200 Q170 140 160 120 Q150 90 128 88 Q106 90 96 120 Q86 140 80 200 Z" fill="#1A1A22"/>
  <ellipse cx="110" cy="118" rx="9" ry="11" fill="#FFF"/>
  <ellipse cx="146" cy="118" rx="9" ry="11" fill="#FFF"/>
  <circle cx="111" cy="120" r="4.5" fill="#3A2A20"/>
  <circle cx="147" cy="120" r="4.5" fill="#3A2A20"/>
  <path d="M118 146 Q128 152 138 146" stroke="#8A6A52" stroke-width="3" fill="none"/>
  <path d="M98 104 Q110 98 120 104 M136 104 Q148 98 158 104" stroke="#1A1A22" stroke-width="2.5" fill="none"/>
`);

portrait('elias', `
  <ellipse cx="128" cy="236" rx="82" ry="42" fill="#1E2430"/>
  <path d="M72 205 Q65 135 92 105 Q110 82 128 80 Q146 82 164 105 Q191 135 184 205 Z" fill="#2A3040"/>
  <ellipse cx="128" cy="118" rx="46" ry="54" fill="#B89878"/>
  <path d="M84 105 Q92 68 128 62 Q164 68 172 105 Q155 88 128 86 Q101 88 84 105Z" fill="#1A1A22"/>
  <ellipse cx="110" cy="120" rx="9" ry="10" fill="#FFF"/>
  <ellipse cx="146" cy="120" rx="9" ry="10" fill="#FFF"/>
  <circle cx="112" cy="122" r="4.5" fill="#2A2018"/>
  <circle cx="148" cy="122" r="4.5" fill="#2A2018"/>
  <path d="M98 104 L120 108 M136 108 L158 104" stroke="#1A1A22" stroke-width="5" stroke-linecap="round"/>
  <path d="M116 150 Q128 156 140 150" stroke="#8A6A52" stroke-width="3" fill="none"/>
`);

portrait('silas', `
  <ellipse cx="128" cy="238" rx="88" ry="44" fill="#14141C"/>
  <path d="M60 210 Q55 130 90 100 Q110 78 128 76 Q146 78 166 100 Q201 130 196 210 Z" fill="#1A1A28"/>
  <ellipse cx="128" cy="116" rx="48" ry="56" fill="#9A8A78"/>
  <path d="M82 108 Q88 60 128 54 Q168 60 174 108 Q160 90 128 88 Q96 90 82 108Z" fill="#2A2A32"/>
  <path d="M90 70 L70 90 M166 70 L186 90" stroke="#2A2A32" stroke-width="8" stroke-linecap="round"/>
  <ellipse cx="108" cy="118" rx="10" ry="9" fill="#E8FFE0"/>
  <ellipse cx="148" cy="118" rx="10" ry="9" fill="#E8FFE0"/>
  <ellipse cx="108" cy="118" rx="3" ry="7" fill="#1A2A1A"/>
  <ellipse cx="148" cy="118" rx="3" ry="7" fill="#1A2A1A"/>
  <path d="M108 150 Q128 162 148 150" stroke="#3A2A2A" stroke-width="4" fill="none"/>
  <path d="M112 152 L118 158 M138 158 L144 152" stroke="#E8E0D0" stroke-width="2"/>
  <path d="M96 100 Q108 94 118 100 M138 100 Q150 94 162 100" stroke="#1A1A1A" stroke-width="4" fill="none"/>
`);

portrait('troll', `
  <ellipse cx="128" cy="240" rx="90" ry="40" fill="#0E1210"/>
  <path d="M70 215 Q60 140 88 105 Q108 78 128 74 Q148 78 168 105 Q196 140 186 215 Z" fill="${OLIVE}" opacity="0.9"/>
  <path d="M90 78 L78 40 L100 70 M166 78 L178 40 L156 70" fill="${OLIVE}" stroke="#2A3A2A" stroke-width="3"/>
  <ellipse cx="128" cy="120" rx="50" ry="55" fill="${OLIVE}"/>
  <path d="M80 100 Q95 85 110 95 M146 95 Q161 85 176 100" stroke="#2A3A2A" stroke-width="4" fill="none"/>
  <ellipse cx="106" cy="122" rx="14" ry="12" fill="#FFE890"/>
  <ellipse cx="150" cy="122" rx="14" ry="12" fill="#FFE890"/>
  <ellipse cx="106" cy="122" rx="4" ry="10" fill="#1A1A10"/>
  <ellipse cx="150" cy="122" rx="4" ry="10" fill="#1A1A10"/>
  <path d="M100 160 Q128 178 156 160" stroke="#1A2A1A" stroke-width="5" fill="none"/>
  <path d="M110 164 L114 174 L120 166 M136 166 L142 174 L146 164" fill="#D0E0C0"/>
  <path d="M70 140 Q60 170 75 200 M186 140 Q196 170 181 200" stroke="#2A3A2A" stroke-width="4" fill="none" opacity="0.6"/>
`);

// Clue icons (original, one per clue id used in plan)
const clueOut = path.join(root, 'public', 'images', 'clues');
fs.mkdirSync(clueOut, { recursive: true });
const clueIcons = {
  tire_mark: `<path d="M40 160 Q80 120 128 140 Q176 160 216 120" stroke="${WHITE}" stroke-width="10" stroke-linecap="round" opacity="0.8"/><path d="M50 190 Q90 150 128 170 Q170 190 210 150" stroke="${WHITE}" stroke-width="6" stroke-linecap="round" opacity="0.4"/>`,
  eye_symbol: `<ellipse cx="128" cy="128" rx="80" ry="42" stroke="${CYAN}" stroke-width="5"/><circle cx="128" cy="128" r="28" stroke="${WHITE}" stroke-width="4"/><circle cx="128" cy="128" r="12" fill="${CYAN}"/>`,
  elias_shirt: `<path d="M70 80 L110 70 L128 95 L146 70 L186 80 L200 140 L170 150 L170 210 L86 210 L86 150 L56 140 Z" fill="#4A5A7A" stroke="${WHITE}" stroke-width="3"/><path d="M110 70 L128 95 L146 70" stroke="${WHITE}" stroke-width="3" fill="none"/>`,
  police_car_footage: `<rect x="40" y="70" width="176" height="110" rx="8" stroke="${WHITE}" stroke-width="4"/><circle cx="128" cy="125" r="30" stroke="${CYAN}" stroke-width="4"/><path d="M118 110 L148 125 L118 140 Z" fill="${CYAN}"/><rect x="70" y="190" width="116" height="16" rx="4" fill="${WHITE}" opacity="0.4"/>`,
  thirteen_days: `<text x="128" y="150" text-anchor="middle" font-size="96" font-family="monospace" fill="${RED}" font-weight="bold">13</text>`,
  unused_ticket: `<rect x="40" y="90" width="176" height="80" rx="6" stroke="${GOLD}" stroke-width="4" fill="none"/><path d="M70 90 V170 M186 90 V170" stroke="${GOLD}" stroke-width="2" stroke-dasharray="6 4"/><path d="M90 120 H166 M90 140 H150" stroke="${WHITE}" stroke-width="4" opacity="0.7"/>`,
  sixth_mark_note: `<rect x="60" y="50" width="136" height="160" rx="4" stroke="${GOLD}" stroke-width="3" fill="none"/><path d="M80 90 H176 M80 115 H176 M80 140 H160 M80 165 H140" stroke="${WHITE}" stroke-width="3" opacity="0.6"/><circle cx="170" cy="170" r="22" stroke="${CYAN}" stroke-width="3"/>`,
  restricted_area_camera: `<rect x="48" y="80" width="160" height="100" rx="10" stroke="${WHITE}" stroke-width="4"/><circle cx="128" cy="130" r="36" stroke="${CYAN}" stroke-width="4"/><circle cx="128" cy="130" r="14" fill="${CYAN}"/><rect x="170" y="60" width="30" height="24" rx="4" fill="${WHITE}" opacity="0.5"/>`,
  ghost_identity: `<ellipse cx="128" cy="120" rx="50" ry="60" stroke="${WHITE}" stroke-width="4" fill="none" opacity="0.8"/><path d="M78 120 Q78 190 100 175 Q115 200 128 175 Q141 200 156 175 Q178 190 178 120" stroke="${WHITE}" stroke-width="4" fill="none" opacity="0.8"/><circle cx="110" cy="115" r="8" fill="${CYAN}"/><circle cx="146" cy="115" r="8" fill="${CYAN}"/>`,
  orun_tool_symbol: `<path d="M80 70 L128 200 L176 70" stroke="${CYAN}" stroke-width="6" fill="none"/><circle cx="128" cy="80" r="24" stroke="${GOLD}" stroke-width="5"/><path d="M128 60 V100 M108 80 H148" stroke="${GOLD}" stroke-width="3"/>`,
  prisoner_warning: `<rect x="70" y="50" width="116" height="160" rx="8" stroke="${WHITE}" stroke-width="4"/><path d="M95 50 V210 M128 50 V210 M161 50 V210" stroke="${WHITE}" stroke-width="5"/><circle cx="128" cy="130" r="20" stroke="${RED}" stroke-width="4"/>`,
  silas_underground: `<path d="M40 200 Q80 140 128 160 Q176 180 216 120" stroke="${OLIVE}" stroke-width="6" fill="none"/><path d="M100 90 L128 50 L156 90 L148 140 H108 Z" fill="${OLIVE}" opacity="0.7"/><circle cx="128" cy="95" r="10" fill="#FFE890"/>`,
  organized: `<rect x="50" y="60" width="70" height="50" rx="4" stroke="${WHITE}" stroke-width="3"/><rect x="136" y="60" width="70" height="50" rx="4" stroke="${WHITE}" stroke-width="3"/><rect x="50" y="130" width="70" height="50" rx="4" stroke="${WHITE}" stroke-width="3"/><rect x="136" y="130" width="70" height="50" rx="4" stroke="${CYAN}" stroke-width="3"/><path d="M120 85 H136 M85 110 V130 M171 110 V130" stroke="${CYAN}" stroke-width="3"/>`,
  map_shape: `<path d="M60 80 L110 60 L160 80 L200 60 V180 L160 200 L110 180 L60 200 Z" stroke="${GOLD}" stroke-width="4" fill="none"/><path d="M110 60 V180 M160 80 V200" stroke="${GOLD}" stroke-width="2"/><circle cx="130" cy="120" r="16" fill="${OLIVE}" opacity="0.7"/>`,
  dark_well: `<ellipse cx="128" cy="140" rx="70" ry="30" stroke="${WHITE}" stroke-width="4"/><ellipse cx="128" cy="140" rx="40" ry="16" fill="#000"/><path d="M58 140 V180 Q58 210 128 210 Q198 210 198 180 V140" stroke="${WHITE}" stroke-width="4" fill="none"/>`,
  illusion: `<circle cx="100" cy="128" r="50" stroke="${CYAN}" stroke-width="4"/><circle cx="156" cy="128" r="50" stroke="${RED}" stroke-width="4" opacity="0.7"/>`,
  clara_instructions: `<rect x="55" y="45" width="146" height="166" rx="4" stroke="${GOLD}" stroke-width="3"/><path d="M75 80 H180 M75 110 H180 M75 140 H160 M75 170 H140" stroke="${WHITE}" stroke-width="3" opacity="0.55"/><path d="M150 160 Q170 140 190 165" stroke="${CYAN}" stroke-width="3" fill="none"/>`,
  doorless: `<rect x="70" y="50" width="116" height="170" stroke="${WHITE}" stroke-width="5" fill="none"/><path d="M70 50 L186 220 M186 50 L70 220" stroke="${RED}" stroke-width="3" opacity="0.5"/><circle cx="160" cy="140" r="6" fill="${WHITE}"/>`,
  photo_false: `<rect x="50" y="60" width="156" height="130" rx="4" stroke="${WHITE}" stroke-width="4"/><rect x="65" y="75" width="126" height="90" fill="#2A2A3A"/><circle cx="100" cy="115" r="16" fill="${CYAN}" opacity="0.5"/><circle cx="156" cy="115" r="16" fill="${RED}" opacity="0.5"/><path d="M70 175 H186" stroke="${WHITE}" stroke-width="3" opacity="0.4"/>`,
  inscription: `<rect x="48" y="88" width="160" height="80" rx="6" stroke="${GOLD}" stroke-width="4"/><path d="M70 118 H186 M70 140 H160" stroke="${CYAN}" stroke-width="3" opacity="0.8"/><circle cx="64" cy="100" r="5" fill="${GOLD}"/><circle cx="192" cy="156" r="5" fill="${GOLD}"/>`,
  hidden_truth: `<circle cx="128" cy="128" r="80" stroke="${CYAN}" stroke-width="4" opacity="0.5"/><path d="M128 60 V196 M60 128 H196" stroke="${CYAN}" stroke-width="3" opacity="0.4"/><path d="M80 80 L176 176 M176 80 L80 176" stroke="${RED}" stroke-width="3" opacity="0.5"/><circle cx="128" cy="128" r="20" fill="${CYAN}" opacity="0.8"/>`
};

for (const [id, body] of Object.entries(clueIcons)) {
  const svg = wrap(body);
  fs.writeFileSync(path.join(clueOut, `${id}.svg`), svg);
}
console.log('clues', Object.keys(clueIcons).length);

// Transformation stages (Theo progressive)
const trOut = path.join(root, 'public', 'images', 'transformation');
fs.mkdirSync(trOut, { recursive: true });
for (let stage = 0; stage <= 4; stage++) {
  const pale = stage === 0 ? '#C4A484' : stage === 1 ? '#C0A090' : stage === 2 ? '#B0A098' : stage === 3 ? '#A09898' : OLIVE;
  const eye = stage >= 3 ? (stage === 4 ? '#FFE890' : '#C0E0FF') : '#5A4634';
  const jaw = stage >= 3 ? 54 : 48;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="512" height="512">
  <rect width="256" height="256" fill="${PANEL}"/>
  <ellipse cx="128" cy="230" rx="70" ry="40" fill="#1E2430"/>
  <path d="M78 200 Q70 140 88 110 Q100 88 128 84 Q156 88 168 110 Q186 140 178 200 Z" fill="#3A4558"/>
  <ellipse cx="128" cy="118" rx="${jaw}" ry="52" fill="${pale}"/>
  <path d="M82 110 Q90 70 128 64 Q166 70 174 110 Q160 88 128 86 Q96 88 82 110Z" fill="#1A1A22"/>
  ${stage >= 2 ? `<path d="M95 130 Q100 150 95 170 M161 130 Q156 150 161 170" stroke="#4A5A6A" stroke-width="2" opacity="0.7"/>
  <path d="M80 160 Q70 190 65 220" stroke="#4A5A6A" stroke-width="2" opacity="0.4"/>` : ''}
  ${stage >= 1 ? `<ellipse cx="110" cy="132" rx="12" ry="5" fill="#3A2A2A" opacity="0.5"/><ellipse cx="146" cy="132" rx="12" ry="5" fill="#3A2A2A" opacity="0.5"/>` : ''}
  <ellipse cx="110" cy="120" rx="10" ry="12" fill="#FFF"/>
  <ellipse cx="146" cy="120" rx="10" ry="12" fill="#FFF"/>
  <circle cx="112" cy="122" r="5" fill="${eye}"/>
  <circle cx="148" cy="122" r="5" fill="${eye}"/>
  ${stage === 4 ? `<path d="M84 95 L70 70 L95 88 M172 95 L186 70 L161 88" fill="${OLIVE}" stroke="#2A3A2A" stroke-width="2"/>
  <path d="M108 155 L114 168 L122 156 M134 156 L142 168 L148 155" fill="#D0E0C0"/>` : ''}
  <path d="M118 148 Q128 ${stage>=3?160:154} 138 148" stroke="#8A6A52" stroke-width="3" fill="none"/>
  </svg>`;
  fs.writeFileSync(path.join(trOut, `theo_t${stage}.svg`), svg);
}

// Meta for all SVG assets
const meta = {
  generatedAt: new Date().toISOString(),
  method: 'original-vector-svg',
  style: 'gothic-dark-cinematic',
  styleGuide: 'docs/VISUAL_STYLE_GUIDE.md',
  assets: []
};
function walk(dir, prefix) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p, prefix);
    else if (f.endsWith('.svg')) {
      meta.assets.push({ path: ('/' + path.relative(root, p).replace(/\\/g, '/')).replace('/public', ''), bytes: fs.statSync(p).size });
    }
  }
}
walk(path.join(root, 'public'), 'public');
fs.writeFileSync(path.join(root, 'comfyui', 'meta', 'svg_assets.json'), JSON.stringify(meta, null, 2));
console.log('SVG assets:', meta.assets.length);
