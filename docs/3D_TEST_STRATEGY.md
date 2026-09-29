# Estratégia de testes 3D

| Camada | Como | Onde |
|---|---|---|
| Lógica pura (estado, escolha, save, migração, i18n, dados) | headless | `tests/test_core.gd` |
| Câmeras (seleção, histerese, blend, lock) | headless, nós reais sem render | `tests/test_camera.gd` |
| Interação/investigação | headless com física real | `tests/test_interaction.gd` |
| Fase (colisão, portas, câmeras por zona, oclusão do Theo, fluxo completo das 3 escolhas, save/continuar, transição, animação) | headless | `tests/test_phase01.gd` |
| Visual (composição, UI, luz) | Xvfb + llvmpipe (OpenGL 3.3 por software) | `tests/qa_shots.tscn` → PNGs |
| Inicialização do jogo | `--quit-after` sob Xvfb; sem `SCRIPT ERROR` | manual/CI |

Comandos: `npm run godot:test` (headless, exit 1 se falhar) · `npm run godot:shots` (capturas em `/tmp/ur_shots`).
Binário: variável `GODOT` (padrão `godot`); no container `/opt/godot-dl/Godot_v4.4.1-stable_linux.x86_64`.

**Limites:** sem GPU no container, então desempenho real e leitura fina de iluminação devem ser conferidos na máquina do usuário; o export Web ainda
não foi testado (templates não baixados).
