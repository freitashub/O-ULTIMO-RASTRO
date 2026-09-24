# ASSET_PRODUCTION_PLAN — O Último Rastro

Data: 2026-09-23  
Status: produção em execução  
Identidade visual: **GÓTICO + SOMBRIO + EMOCIONAL + CINEMATOGRÁFICO + ESTRANHO + NARRATIVO**

---

## 1. Inventário completo (faltantes)

### CHARACTERS
| ID | Descrição | Prioridade | Estados |
|---|---|---|---|
| `char_theo` | Protagonista, ~10–12 anos | P1 | idle, investigando, assustado, triste, determinado, t01, t02, t03, troll |
| `char_clara` | Mãe | P1 | normal, preocupada, assustada, desespero |
| `char_elias` | Pai | P1 | normal, preocupado, assustado |
| `char_silas` | Chefe de polícia / chefe troll | P1 | disfarçado, revelado, ameaçador |
| `char_troll_base` | Troll base | P1 | base + variações (mensageiro, condutor, copista, ferreiro, guardião) |
| `char_prisoner` | Prisioneiro humano (fase 11–12) | P2 | normal, sussurro |
| `char_false_parents` | Ilusão dos pais (fase 16) | P3 | ilusão |
| `char_child_silas` | Criança em fotos falsas | P3 | still |

### ENVIRONMENTS (20 fases)
| Phase | Ambiente | ID sugerido | Prioridade |
|---|---|---|---|
| 1 | Casa vazia + garagem | `env_casa` | P1 |
| 2 | Igreja antiga | `env_igreja` | P1 |
| 3 | Túnel | `env_tunel` | P1 |
| 4 | Delegacia | `env_delegacia` | P1 |
| 5 | Arquivo morto | `env_arquivo` | P1 |
| 6 | Estação de trem | `env_estacao` | P1 |
| 7 | Biblioteca | `env_biblioteca` | P1 |
| 8 | Porto seco | `env_porto` | P1 |
| 9 | Centro de registros | `env_registros` | P2 |
| 10 | Oficina do ferreiro | `env_oficina` | P2 |
| 11 | Cidade subterrânea | `env_cidade` | P1 |
| 12 | Arquivo subterrâneo | `env_arquivo_sub` | P2 |
| 13 | Sala de confronto Silas | `env_silas` | P2 |
| 14 | Mapa / overview | `env_mapa` | P2 |
| 15 | Montanha / poço | `env_montanha` | P1 |
| 16 | Sala da ilusão | `env_sala_ilusao` | P1 |
| 17 | Última cidade | `env_ultima_cidade` | P2 |
| 18 | Registros / verdade | `env_verdade` | P2 |
| 19 | Entrada aviso | `env_aviso` | P2 |
| 20 | Caverna + Cubo | `env_caverna` | P1 |

Grupos de estilo: **casa/urbano**, **institucional**, **subterrâneo/troll**, **natureza/montanha**, **místico/cubo**.

### PROPS
- Relógio 23:47 (`prop_clock`)
- Casaco da mãe (`prop_coat`)
- Fotografia antiga (`prop_photo_old`)
- Carta falsa (`prop_letter`)
- Bilhete de trem (`prop_ticket`)
- Chave com inscrição (`prop_key`)
- Mapa (`prop_map`)
- Lista de desaparecidos (`prop_list`)
- Ferramenta do ferreiro (`prop_tool`)
- Cubo de Orun (`cube_*`)

### CLUES (21 — ícones/painéis)
`clue_tire_mark`, `clue_eye_symbol`, `clue_elias_shirt`, `clue_police_car_footage`, `clue_thirteen_days`, `clue_unused_ticket`, `clue_sixth_mark_note`, `clue_restricted_area_camera`, `clue_ghost_identity`, `clue_orun_tool_symbol`, `clue_prisoner_warning`, `clue_silas_underground`, `clue_organized`, `clue_map_shape`, `clue_dark_well`, `clue_illusion`, `clue_clara_instructions`, `clue_doorless`, `clue_photo_false`, `clue_inscription`, `clue_hidden_truth`

### UI
- Botões, painéis, HUD — **SVG/CSS do jogo** (já existe estilo monospace); enriquecimento opcional P3
- Fonte display gótica opcional

### ORUN
6 faces: olho, lua, mao, corvo, arvore, rosto  
Estados: fechado, ativado, erro, corretos, brilho, partículas

### TRANSFORMATION
0 normal → 1 inicial → 2 perceptível → 3 avançada → 4 troll  
(Sprites/estados do Theo)

### VOICE (TTS)
| Personagem | Registros | Idioma principal |
|---|---|---|
| theo | várias falas | pt-BR |
| clara | falas f6/f7/f16/f17 | pt-BR |
| elias | falas raras | pt-BR |
| silas | f4/f13/f16/f19 | pt-BR |
| troll | f3/f10 | pt-BR |
| narrator | falas de cena | pt-BR |

### MUSIC (loops)
menu, investigação, suspense, descoberta, perseguição, troll, caverna, cubo, final bom/ruim/secreto, transformação

### SFX
passos, porta, vento, chuva, papel, objeto, impacto, suspense, ambiente, criatura, transformação, cubo, UI

### AMBIENCE
sala, rua, túnel, igreja, delegacia, estação, cidade sub, caverna

### CUTSCENES (WebM pré-render)
abertura, desaparecimento, troll reveal, verdade, chefe, transformação, cubo, 3 finais

### TRANSITIONS
fade, glitch, static entre atos

---

## 2. Ordem de produção

1. Style guide + referências (Theo master)
2. Personagens P1 (estados base)
3. Cenários P1
4. Cubo + símbolos
5. Pistas/props P1
6. Transformation 0→4
7. UI polish
8. Áudio (após detecção de TTS/music models)
9. Cutscenes
10. Finais

---

## 3. Regras

- Sem texto localizado dentro de imagem/vídeo
- PT-BR nos dados; legendas renderizadas pelo jogo
- ComfyUI só em `tools/` e `comfyui/`
- Assets reais = arquivo existe + registro no `assetRegistry.json` + metadata
- Nunca marcar inexistente como produzido
