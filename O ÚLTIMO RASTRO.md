\# O ÚLTIMO RASTRO

\#\# Documento de especificação narrativa, técnica e de produto

\#\#\# Jogo web 2D de investigação narrativa em 20 fases

&nbsp;

\*\*Versão:\*\* 2.0

\*\*Status:\*\* Documento-base revisado após análise sênior

\*\*Objetivo:\*\* servir como briefing mestre para roteirista, game designer, desenvolvedor, designer, sound designer, QA e pessoa sênior responsável pela validação final.

&nbsp;

\*\*Changelog da versão 2.0:\*\*

\- Adicionada Seção 34 expandida (Documento de Justificativa de Escolhas) como anexo obrigatório

\- Corrigida a curva emocional (Seção 10\) com fases de respiro real

\- Redefinida a revelação de Silas (movida da Fase 12/13 para a Fase 16\)

\- Codificada a ordem do Cubo de Orun nas pistas das fases (Seções 13, 14 e 20\)

\- Adicionados Copista e Mensageiro com cenas próprias (Seções 6.5 e 11\)

\- Plantada pista falsa de longa duração (Fase 9 → revelada na Fase 19\)

\- Expandidos micro-sinais narrativos da transformação (Seção 15\)

\- Adicionado \`saveVersion\` e migração (Seção 19\)

\- Adicionado \`PhaseValidator.ts\` (Seções 25 e 55\)

\- Definida duração-alvo e escopo por fase (Seções 4.4 e 4.5)

\- Adicionados Riscos 8–11 (Seção 51\)

\- Adicionado \`GameState.cube\` aninhado (Seção 19\)

\- Corrigido "Clara Vale" → "Clara V." (Fase 6\)

\- Revisados finais com margem (errors ≤ 1 → bom; ≥ 2 → ruim; 0 \+ secreto)

\- Padronizados nomes de assets de áudio (Seção 28\)

\- Inserida Seção 4.3 (Regra de ancoragem realista)

&nbsp;

\---

&nbsp;

\# 1\. RESUMO EXECUTIVO

&nbsp;

\*\*O Último Rastro\*\* é um jogo web 2D de investigação narrativa em que uma criança procura os pais desaparecidos enquanto descobre uma rede de trolls sequestradores infiltrada na cidade.

&nbsp;

O jogador recebe \*\*3 opções por fase\*\*. Cada opção corresponde a um esconderijo, caminho, investigação ou interpretação possível. Uma opção é a rota correta. As outras duas continuam a história, mas registram um erro oculto.

&nbsp;

O diferencial do jogo é que \*\*errar não gera game over imediato\*\*. O jogo continua e o jogador só entende o peso de determinadas escolhas muito mais tarde.

&nbsp;

A estrutura emocional desejada é:

&nbsp;

\`\`\`text

CURIOSIDADE

&nbsp;&nbsp;&nbsp;&nbsp;↓

DESCOBERTA

&nbsp;&nbsp;&nbsp;&nbsp;↓

ESPERANÇA

&nbsp;&nbsp;&nbsp;&nbsp;↓

DÚVIDA

&nbsp;&nbsp;&nbsp;&nbsp;↓

TENSÃO

&nbsp;&nbsp;&nbsp;&nbsp;↓

ESCOLHA

&nbsp;&nbsp;&nbsp;&nbsp;↓

CONSEQUÊNCIA

&nbsp;&nbsp;&nbsp;&nbsp;↓

REVELAÇÃO

&nbsp;&nbsp;&nbsp;&nbsp;↓

CLIFFHANGER

&nbsp;&nbsp;&nbsp;&nbsp;↓

"PRECISO VER A PRÓXIMA FASE"

\`\`\`

&nbsp;

A campanha possui \*\*20 fases\*\*, divididas em 5 atos.

&nbsp;

No final:

&nbsp;

\`\`\`text

ERROS \= 0

&nbsp;&nbsp;&nbsp;&nbsp;↓

PAIS ENCONTRADOS

&nbsp;&nbsp;&nbsp;&nbsp;↓

FINAL SECRETO (condição adicional)

&nbsp;

ERROS \= 1

&nbsp;&nbsp;&nbsp;&nbsp;↓

PAIS ENCONTRADOS COM CUSTO

&nbsp;&nbsp;&nbsp;&nbsp;↓

FINAL BOM (com marca permanente)

&nbsp;

ERROS \>= 2

&nbsp;&nbsp;&nbsp;&nbsp;↓

PAIS NÃO ENCONTRADOS

&nbsp;&nbsp;&nbsp;&nbsp;↓

TRANSFORMAÇÃO

&nbsp;&nbsp;&nbsp;&nbsp;↓

A CRIANÇA SE TORNA UM TROLL

\`\`\`

&nbsp;

A transformação não deve parecer uma punição arbitrária. Ela precisa ser preparada desde as primeiras fases e funcionar como uma consequência narrativa do contato da criança com o sistema dos trolls.

&nbsp;

\*\*Nota da v2.0:\*\* A margem de 1 erro para o Final Bom foi introduzida para reduzir o risco de o jogador se sentir punido por uma única escolha mal interpretada. O Final Secreto recompensa a perfeição absoluta.

&nbsp;

\---

&nbsp;

\# 2\. PRINCÍPIO CENTRAL DE DESIGN

&nbsp;

O jogo não deve parecer um quiz de múltipla escolha.

&nbsp;

O jogador precisa sentir que está \*\*investigando um caso\*\*.

&nbsp;

A pergunta de cada fase deve ser concreta:

&nbsp;

\> Onde procurar agora?

&nbsp;

Mas a pergunta profunda deve evoluir:

&nbsp;

\`\`\`text

FASES 1-4

Onde estão meus pais?

&nbsp;

FASES 5-8

Eles foram abandonados ou sequestrados?

&nbsp;

FASES 9-12

Quem está mentindo?

&nbsp;

FASES 13-16

Quem controla os desaparecimentos?

&nbsp;

FASES 17-19

Por que meus pais sabiam dos trolls?

&nbsp;

FASE 20

Quem é o verdadeiro sexto troll?

\`\`\`

&nbsp;

Cada fase deve responder \*\*uma pergunta\*\* e criar \*\*pelo menos duas novas perguntas\*\*.

&nbsp;

\---

&nbsp;

\# 3\. PÚBLICO E EXPERIÊNCIA DESEJADA

&nbsp;

\#\# 3.1 Público principal

&nbsp;

Jogadores que gostam de:

&nbsp;

\- mistério

\- investigação

\- fantasia sombria

\- histórias com reviravolta

\- jogos de escolha

\- puzzles leves

\- narrativas episódicas

&nbsp;

\#\# 3.2 Experiência desejada

&nbsp;

O jogador deve sentir:

&nbsp;

\- urgência para encontrar os pais

\- dúvida sobre personagens

\- medo do desconhecido

\- raiva quando perceber manipulações

\- alívio quando encontra uma pista real

\- esperança de que os pais estejam vivos

\- arrependimento quando perceber que uma escolha antiga alterou o futuro

\- satisfação ao conectar pistas antigas

\- vontade de rejogar para descobrir outro caminho

&nbsp;

\---

&nbsp;

\# 4\. TOM E IDENTIDADE

&nbsp;

\#\# 4.1 Tom

&nbsp;

Suspense, fantasia sombria, mistério e aventura.

&nbsp;

A violência deve ser sugerida, não gráfica.

&nbsp;

Não mostrar mutilações, sangue explícito ou violência contra a criança. A tensão será gerada por som, ambiente, silêncio, texto, sombras e informação incompleta.

&nbsp;

\#\# 4.2 Regra de originalidade

&nbsp;

O projeto pode ter a ideia geral de uma aventura com trolls, mas precisa construir identidade própria: personagens, mitologia, símbolos, cidades, regras, aparência, nomes, arte, diálogos e narrativa originais.

&nbsp;

Não reproduzir personagens, cenários, diálogos ou identidade visual de obras existentes.

&nbsp;

\#\# 4.3 Regra de ancoragem realista

&nbsp;

A fantasia sombria só funciona se o início for realista. Os primeiros 3 minutos devem parecer um desaparecimento real, sem trolls, sem símbolos, sem sobrenatural. A fantasia entra devagar, começando pelo símbolo do olho na Fase 2\.

&nbsp;

\#\# 4.4 Regra de duração por fase

&nbsp;

Cada fase deve ter entre \*\*2 e 4 minutos\*\* de duração média. O jogo completo deve ter entre \*\*60 e 90 minutos\*\* na primeira jogada.

&nbsp;

\#\# 4.5 Regra de escopo por fase

&nbsp;

Cada fase tem:

&nbsp;

\- 1 cena principal (com 1–2 sub-cenas)

\- 1 pista principal

\- 3 escolhas

\- 1 cliffhanger

\- Duração-alvo: 2–4 min

&nbsp;

Uma fase não deve ter mais do que 3 cenas separadas. Se tiver, deve ser dividida em duas fases.

&nbsp;

\---

&nbsp;

\# 5\. LORE DO UNIVERSO

&nbsp;

\#\# 5.1 Os Trolls

&nbsp;

Os trolls são criaturas antigas que vivem escondidas em estruturas subterrâneas próximas à cidade.

&nbsp;

Eles não são simplesmente monstros físicos. Eles trabalham com:

&nbsp;

\- manipulação de informação

\- desaparecimentos

\- falsificação de registros

\- criação de pistas falsas

\- infiltração em instituições

\- observação das pessoas

\- controle de rotas de passagem

&nbsp;

Todos os trolls da história fazem parte da estrutura antagonista.

&nbsp;

Alguns são agressivos.

&nbsp;

Outros são simpáticos, educados ou aparentemente protetores.

&nbsp;

Isso não significa que sejam bons.

&nbsp;

A aparência de bondade é uma ferramenta de manipulação.

&nbsp;

\#\# 5.2 Mitologia

&nbsp;

Existe um artefato chamado \*\*Cubo de Orun\*\*.

&nbsp;

Segundo a lenda dos trolls, Orun foi o primeiro troll capaz de atravessar o mundo humano sem ser reconhecido.

&nbsp;

O cubo guarda a sequência necessária para abrir a entrada do esconderijo central.

&nbsp;

A sequência é formada por símbolos distribuídos ao longo da história, \*\*e a ordem em que aparecem nas fases é a ordem correta de solução\*\*.

&nbsp;

\---

&nbsp;

\# 6\. PERSONAGENS PRINCIPAIS

&nbsp;

\#\# 6.1 Theo

&nbsp;

Criança protagonista.

&nbsp;

Idade narrativa sugerida: 11 anos.

&nbsp;

Características:

&nbsp;

\- curioso

\- observador

\- persistente

\- inicialmente confia em adultos

\- aprende a questionar informações

\- fica mais corajoso ao longo das fases

\- começa inocente e termina marcado pela investigação

&nbsp;

Theo não deve agir como um adulto de 35 anos. Suas falas precisam permanecer coerentes com uma criança inteligente.

&nbsp;

\#\# 6.2 Clara

&nbsp;

Mãe de Theo.

&nbsp;

Deixou pistas para que o filho pudesse encontrá-la caso desaparecesse.

&nbsp;

\#\# 6.3 Elias

&nbsp;

Pai de Theo.

&nbsp;

Investigava os registros antigos da cidade antes de desaparecer.

&nbsp;

Ele descobriu evidências da existência dos trolls.

&nbsp;

\#\# 6.4 Chefe Silas Vale

&nbsp;

Chefe da polícia.

&nbsp;

Aparece inicialmente como um aliado.

&nbsp;

Sempre fala com calma.

&nbsp;

Tem respostas para tudo.

&nbsp;

É, na realidade, o principal troll infiltrado na polícia.

&nbsp;

\*\*Nota da v2.0:\*\* A revelação visual de Silas como troll foi movida da Fase 12 para a Fase 16\. Nas Fases 4–14, ele deve gerar \*\*suspeita por contradição\*\*, não por evidência direta. O jogador deve desconfiar, não saber.

&nbsp;

\#\# 6.5 Os trolls

&nbsp;

Sugestões de classes narrativas:

&nbsp;

| Troll | Função | Cena própria | Fase |

|---|---|---|---|

| Vigia | observa e acompanha Theo | troll escondido | 3 |

| Mensageiro | cria pistas falsas | entrega a carta falsa e some | 6 |

| Condutor | transporta pessoas entre esconderijos | veículo passa com pessoas | 8 |

| Copista | falsifica documentos | documento muda enquanto Theo olha | 9 |

| Ferreiro | fabrica ferramentas com símbolos | oficina | 10 |

| Guardião | protege entradas subterrâneas | guarda da cidade subterrânea | 11 |

| Silas | chefe da operação infiltrado na polícia | delegacia, confronto, aviso final | 4, 13, 19 |

&nbsp;

Cada troll tem \*\*uma cena própria\*\* que demonstra seu método. Nenhum troll é apenas "monstro genérico".

&nbsp;

\---

&nbsp;

\# 7\. ARCO GERAL DA HISTÓRIA

&nbsp;

\`\`\`text

ATO 1

O DESAPARECIMENTO

&nbsp;

Theo percebe que os pais desapareceram.

Encontra os primeiros rastros.

Descobre a existência dos trolls.

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

&nbsp;

ATO 2

A DÚVIDA

&nbsp;

Surge a hipótese de abandono.

Documentos contradizem testemunhas.

A polícia começa a parecer estranha.

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

&nbsp;

ATO 3

A CONSPIRAÇÃO

&nbsp;

Theo encontra a cidade subterrânea.

Descobre que os desaparecimentos são organizados.

A polícia está ligada aos trolls.

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

&nbsp;

ATO 4

A VERDADE

&nbsp;

Os pais estavam investigando os trolls.

Theo encontra provas de que seus pais estavam vivos depois do desaparecimento.

Silas é revelado como troll (Fase 16).

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

&nbsp;

ATO 5

O ÚLTIMO RASTRO

&nbsp;

Theo chega ao esconderijo central.

Resolve o Cubo de Orun.

Chega ao último ponto.

Seu histórico de escolhas define o desfecho.

\`\`\`

&nbsp;

\---

&nbsp;

\# 8\. FLUXO GERAL DO JOGO

&nbsp;

\`\`\`text

┌──────────────────────┐

│       ABERTURA       │

│ Casa dos pais vazia  │

└──────────┬───────────┘

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

┌──────────────────────┐

│        MENU          │

└──────────┬───────────┘

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

┌──────────────────────┐

│      FASE 1          │

│ Cena \+ pista         │

└──────────┬───────────┘

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

┌──────────────────────┐

│ 3 escolhas possíveis │

└──────────┬───────────┘

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;┌────┴────┐

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓         ↓

&nbsp;&nbsp;&nbsp;&nbsp;CERTA     ERRADA

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓         ↓

Adicionar    marcar erro

&nbsp;&nbsp;&nbsp;pista          ↓

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│       continuar

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└────┬────┘

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

┌──────────────────────┐

│  CONSEQUÊNCIA DA     │

│      ESCOLHA         │

└──────────┬───────────┘

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

┌──────────────────────┐

│    REVELAÇÃO         │

│    \+ GANCHO          │

└──────────┬───────────┘

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;PRÓXIMA FASE

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;...

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

┌──────────────────────┐

│       FASE 20        │

│    Cubo de Orun      │

└──────────┬───────────┘

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓

&nbsp;&nbsp;&nbsp;&nbsp;┌──────┴───────┐

&nbsp;&nbsp;&nbsp;&nbsp;↓              ↓

&nbsp;ERROS \<= 1     ERROS \>= 2

&nbsp;&nbsp;&nbsp;&nbsp;↓              ↓

&nbsp;FINAL BOM      FINAL RUIM

&nbsp;&nbsp;&nbsp;&nbsp;↓              ↓

&nbsp;Pais juntos    Transformação

&nbsp;(com marca)    (troll)

\`\`\`

&nbsp;

\---

&nbsp;

\# 9\. LOOP DE UMA FASE

&nbsp;

Cada fase deve obedecer preferencialmente a esta sequência:

&nbsp;

\`\`\`text

1\. ENTRADA VISUAL

2\. FRASE OU EVENTO DE IMPACTO

3\. OBJETIVO IMEDIATO

4\. EXPLORAÇÃO CURTA

5\. PISTA

6\. 3 ESCOLHAS

7\. RESOLUÇÃO DA ESCOLHA

8\. ATUALIZAÇÃO INVISÍVEL DO ESTADO

9\. MICRO-REVELAÇÃO

10\. CLIFFHANGER

11\. BOTÃO CONTINUAR

\`\`\`

&nbsp;

\#\# 9.1 Regra

&nbsp;

A fase não deve terminar com a frase:

&nbsp;

\> Parabéns, você completou a fase.

&nbsp;

Preferir:

&nbsp;

\> A porta abriu.

&nbsp;

ou

&nbsp;

\> O arquivo estava vazio.

&nbsp;

ou

&nbsp;

\> A fotografia tinha uma data impossível.

&nbsp;

ou

&nbsp;

\> Alguém estava observando Theo.

&nbsp;

\---

&nbsp;

\# 10\. MODELO DE EMOÇÃO POR FASE (REVISADO)

&nbsp;

A curva original tinha tensão em 9 das 20 fases, o que causa saturação. A v2.0 introduz \*\*fases de respiro\*\* e redistribui as emoções.

&nbsp;

| Fase | Emoção predominante | Emoção secundária | Função narrativa |

|---|---|---|---|

| 1 | medo | curiosidade | impacto inicial |

| 2 | curiosidade | esperança | descoberta |

| 3 | tensão | surpresa | primeiro troll |

| 4 | alívio | desconfiança | \*\*RESPIRO\*\* |

| 5 | confusão | medo | arquivo morto |

| 6 | melancolia | tristeza | \*\*RESPIRO LENTO\*\* |

| 7 | raiva | curiosidade | descoberta da falsificação |

| 8 | confusão | humor leve | \*\*RESPIRO CÔMICO\*\* |

| 9 | urgência | tensão | documento vivo |

| 10 | confiança | curiosidade | \*\*PAUSA INVESTIGATIVA\*\* |

| 11 | descoberta | medo | cidade subterrânea |

| 12 | paranoia | raiva | prisão |

| 13 | esperança | desconfiança | confronto com Silas |

| 14 | choque | curiosidade | mapa |

| 15 | tensão | urgência | armadilha |

| 16 | felicidade | choque | \*\*PICO\*\* |

| 17 | medo | descoberta | última cidade |

| 18 | raiva | determinação | verdade dos pais |

| 19 | choque | urgência | último aviso |

| 20 | tensão máxima | catarse | cubo |

&nbsp;

\*\*Regra:\*\* entre dois picos de tensão, deve haver pelo menos uma fase de respiro. As fases 4, 6, 8 e 10 funcionam como respiros reais.

&nbsp;

\---

&nbsp;

\# 11\. AS 20 FASES COMPLETAS (REVISADAS)

&nbsp;

\#\# FASE 1 — A CASA VAZIA

&nbsp;

\*\*Objetivo:\*\* estabelecer o desaparecimento.

&nbsp;

\*\*Cena:\*\* Theo chega em casa. A porta está aberta. O relógio da sala está parado às 23:47.

&nbsp;

\*\*Pista principal:\*\* um casaco da mãe está no chão, ainda úmido.

&nbsp;

\*\*Escolhas:\*\*

&nbsp;

A. Quarto da mãe

B. Garagem

C. Cozinha

&nbsp;

\*\*Correta:\*\* B. Garagem.

&nbsp;

\*\*Por quê:\*\* existe uma pequena marca de pneu na lateral do piso, visível na cena inicial se o jogador observar.

&nbsp;

\*\*Erro:\*\* não mostrar imediatamente como erro. Theo encontra uma informação secundária e continua.

&nbsp;

\*\*Gancho:\*\* no fundo da garagem existe uma fotografia antiga com um símbolo estranho.

&nbsp;

\*\*Emoção:\*\* medo \+ curiosidade.

&nbsp;

\*\*Justificativa observável:\*\* a marca de pneu está visível na cena de entrada (âncora visual).

&nbsp;

\---

&nbsp;

\#\# FASE 2 — A MARCA NA PAREDE

&nbsp;

Theo segue a marca e encontra um símbolo desenhado na parede.

&nbsp;

\*\*Pista nova:\*\* na Fase 1, a fotografia antiga tinha o mesmo símbolo ao fundo. O jogador atento reconhece.

&nbsp;

\*\*Escolhas:\*\*

&nbsp;

A. Floresta

B. Ponte velha

C. Igreja antiga

&nbsp;

\*\*Correta:\*\* C. Igreja antiga.

&nbsp;

\*\*Por quê:\*\* o símbolo do olho aparece no casaco da mãe (Fase 1\) e no sino da igreja (imagem da cena). O jogador pode deduzir.

&nbsp;

\*\*Pista:\*\* a igreja possui o mesmo símbolo no sino.

&nbsp;

\*\*Símbolo coletado:\*\* OLHO.

&nbsp;

\*\*Gancho:\*\* quando o sino balança sozinho, Theo ouve uma voz:

&nbsp;

\> “Eles já estiveram aqui.”

&nbsp;

\*\*Planta para Fase 3:\*\* o som da voz vem \*\*debaixo do chão da igreja\*\* — isso sugere subsolo/túnel.

&nbsp;

\*\*Emoção:\*\* curiosidade \+ esperança.

&nbsp;

\---

&nbsp;

\#\# FASE 3 — O PRIMEIRO TROLL

&nbsp;

Theo encontra uma criatura escondida.

&nbsp;

O troll não ataca.

&nbsp;

Ele diz:

&nbsp;

\> “Se eu fosse você, não procuraria seus pais aqui.”

&nbsp;

\*\*Escolhas:\*\*

&nbsp;

A. Seguir o troll

B. Verificar a carroça abandonada

C. Entrar no túnel

&nbsp;

\*\*Correta:\*\* C. Túnel.

&nbsp;

\*\*Por quê:\*\* na Fase 2, o som vinha do subsolo. O túnel é a continuação lógica.

&nbsp;

\*\*Pista:\*\* marcas de arrasto e um pedaço de tecido da camisa de Elias.

&nbsp;

\*\*Símbolo:\*\* LUA.

&nbsp;

\*\*Gancho:\*\* uma grade fecha atrás de Theo.

&nbsp;

\*\*Emoção:\*\* tensão \+ surpresa.

&nbsp;

\---

&nbsp;

\#\# FASE 4 — O POLICIAL

&nbsp;

Theo consegue sair e procura a polícia.

&nbsp;

Chefe Silas aparece e é extremamente cordial.

&nbsp;

Ele afirma:

&nbsp;

\> “Seus pais podem ter decidido ir embora.”

&nbsp;

\*\*Escolhas:\*\*

&nbsp;

A. Arquivo da delegacia

B. Sala de câmeras

C. Gabinete de Silas

&nbsp;

\*\*Correta:\*\* B. Sala de câmeras.

&nbsp;

\*\*Por quê:\*\* Silas menciona que "as câmeras registraram tudo" — mas com um tom evasivo. O jogador atento percebe que ele não quer que Theo veja as câmeras.

&nbsp;

\*\*Pista:\*\* uma gravação mostra os pais entrando em um carro.

&nbsp;

\*\*Gancho:\*\* o carro é da própria polícia.

&nbsp;

\*\*Emoção:\*\* alívio \+ desconfiança.

&nbsp;

\*\*Nota:\*\* Fase de respiro. Silas parece aliado. Nenhuma evidência direta contra ele.

&nbsp;

\---

&nbsp;

\#\# FASE 5 — O ARQUIVO MORTO

&nbsp;

Theo invade o arquivo.

&nbsp;

Existem dezenas de nomes riscados.

&nbsp;

\*\*Escolhas:\*\*

&nbsp;

A. Arquivo de desaparecidos

B. Registros de veículos

C. Sala de objetos apreendidos

&nbsp;

\*\*Correta:\*\* A. Arquivo de desaparecidos.

&nbsp;

\*\*Por quê:\*\* o carro da Fase 4 era da polícia, então o arquivo de desaparecidos é o próximo passo lógico.

&nbsp;

\*\*Pista:\*\* vários desaparecimentos ocorreram sempre em intervalos de 13 dias.

&nbsp;

\*\*Símbolo:\*\* MÃO.

&nbsp;

\*\*Gancho:\*\* o último nome da lista é o de Theo.

&nbsp;

\*\*Emoção:\*\* confusão \+ medo.

&nbsp;

\---

&nbsp;

\#\# FASE 6 — ELES FORAM EMBORA?

&nbsp;

Uma carta aparentemente escrita por Clara aparece.

&nbsp;

\> “Filho, talvez tenhamos que partir.”

&nbsp;

\*\*Cena do Mensageiro:\*\* um troll entrega a carta e some antes de Theo reagir. A carta é falsa, mas Theo não sabe.

&nbsp;

\*\*Escolhas:\*\*

&nbsp;

A. Estação de trem

B. Rodoviária

C. Fazenda da família

&nbsp;

\*\*Correta:\*\* A. Estação.

&nbsp;

\*\*Por quê:\*\* a carta menciona "partir" e "não me procure", e na Fase 5 o arquivo mostrou que a família viajava de trem frequentemente.

&nbsp;

\*\*Pista:\*\* há um bilhete comprado, mas nunca utilizado.

&nbsp;

\*\*Gancho:\*\* o comprador do bilhete foi registrado como “Clara V.”

&nbsp;

O sobrenome é ambíguo, mas próximo de Silas Vale.

&nbsp;

\*\*Emoção:\*\* melancolia \+ tristeza. Fase de respiro lento.

&nbsp;

\---

&nbsp;

\#\# FASE 7 — A LETRA

&nbsp;

Theo compara a carta com outra carta antiga da mãe.

&nbsp;

A letra é diferente.

&nbsp;

\*\*Escolhas:\*\*

&nbsp;

A. Biblioteca

B. Escola antiga

C. Casa do vizinho

&nbsp;

\*\*Correta:\*\* A. Biblioteca.

&nbsp;

\*\*Por quê:\*\* na Fase 6, o bilhete tinha um selo da biblioteca municipal. Pista visual.

&nbsp;

\*\*Pista:\*\* um livro possui a assinatura de Clara e uma anotação:

&nbsp;

\> “Se eu desaparecer, procure a sexta marca.”

&nbsp;

\*\*Gancho:\*\* nenhuma das pistas anteriores mostrou uma sexta marca.

&nbsp;

\*\*Emoção:\*\* raiva \+ curiosidade.

&nbsp;

\---

&nbsp;

\#\# FASE 8 — OUTRO PAÍS

&nbsp;

Surge a hipótese de que um grupo estrangeiro sequestrou os pais.

&nbsp;

Há documentos de viagem falsificados.

&nbsp;

\*\*Cena do Condutor:\*\* Theo vê um veículo passar com pessoas dentro, mas não consegue alcançar. O veículo entra em uma área restrita.

&nbsp;

\*\*Escolhas:\*\*

&nbsp;

A. Aeroporto

B. Porto seco

C. Hotel antigo

&nbsp;

\*\*Correta:\*\* B. Porto seco.

&nbsp;

\*\*Por quê:\*\* o veículo da cena inicial entrou em uma área restrita que, no mapa da cidade, fica ao lado do porto seco.

&nbsp;

\*\*Pista:\*\* uma câmera mostra um veículo entrando em uma área restrita.

&nbsp;

\*\*Gancho:\*\* dentro do veículo não há ninguém.

&nbsp;

A câmera registra apenas sombras.

&nbsp;

\*\*Emoção:\*\* confusão \+ humor leve (o troll condutor é atrapalhado). Fase de respiro cômico.

&nbsp;

\---

&nbsp;

\#\# FASE 9 — O HOMEM QUE NÃO EXISTE

&nbsp;

Theo encontra um nome em registros internacionais.

&nbsp;

O nome pertence a uma pessoa que não existe.

&nbsp;

\*\*Cena do Copista:\*\* enquanto Theo olha um documento, ele muda sozinho. Theo pisca e o texto é outro.

&nbsp;

\*\*Escolhas:\*\*

&nbsp;

A. Centro de registros

B. Antigo consulado

C. Biblioteca municipal

&nbsp;

\*\*Correta:\*\* A. Centro de registros.

&nbsp;

\*\*Por quê:\*\* o documento que mudou tinha um carimbo do centro de registros.

&nbsp;

\*\*Pista:\*\* a identidade foi criada para esconder movimentações dos trolls.

&nbsp;

\*\*Símbolo:\*\* CORVO.

&nbsp;

\*\*Gancho:\*\* alguém fecha o computador de Theo remotamente.

&nbsp;

\*\*Pista falsa plantada:\*\* uma foto antiga (Clara, Elias e uma criança desconhecida) aparece entre os documentos. Theo a guarda. Ela só será revelada falsa na Fase 19\.

&nbsp;

\*\*Emoção:\*\* urgência \+ tensão.

&nbsp;

\---

&nbsp;

\#\# FASE 10 — O FERREIRO

&nbsp;

Theo encontra um troll que fabrica ferramentas.

&nbsp;

Ele diz conhecer os pais.

&nbsp;

Sua atitude é calma.

&nbsp;

\*\*Escolhas:\*\*

&nbsp;

A. Oficina

B. Ponte subterrânea

C. Torre de observação

&nbsp;

\*\*Correta:\*\* A. Oficina.

&nbsp;

\*\*Por quê:\*\* o ferreiro é visto trabalhando na oficina na cena inicial. Pista visual.

&nbsp;

\*\*Pista:\*\* uma ferramenta possui o mesmo símbolo do Cubo de Orun.

&nbsp;

\*\*Gancho:\*\* o troll pergunta:

&nbsp;

\> “Quantas marcas você já encontrou?”

&nbsp;

Isso revela que os trolls sabem que Theo está investigando.

&nbsp;

\*\*Emoção:\*\* confiança \+ curiosidade. Fase de pausa investigativa.

&nbsp;

\---

&nbsp;

\#\# FASE 11 — A CIDADE DEBAIXO

&nbsp;

Theo encontra uma passagem para uma cidade subterrânea.

&nbsp;

Há casas, ruas, placas e oficinas.

&nbsp;

Tudo foi construído por trolls.

&nbsp;

\*\*Cena do Guardião:\*\* um troll guarda a entrada da cidade. Ele não ataca, mas observa.

&nbsp;

\*\*Escolhas:\*\*

&nbsp;

A. Mercado

B. Prisão

C. Casa abandonada

&nbsp;

\*\*Correta:\*\* B. Prisão.

&nbsp;

\*\*Por quê:\*\* na Fase 5, o nome de Theo estava riscado na lista de desaparecidos. A lista era de prisioneiros.

&nbsp;

\*\*Pista:\*\* um humano está preso e diz:

&nbsp;

\> “A polícia trabalha para eles.”

&nbsp;

\*\*Gancho:\*\* o prisioneiro conhece o nome de Theo.

&nbsp;

\*\*Emoção:\*\* descoberta \+ medo.

&nbsp;

\---

&nbsp;

\#\# FASE 12 — O PRISIONEIRO

&nbsp;

O prisioneiro entrega uma chave.

&nbsp;

Ele afirma que a chave abre um arquivo subterrâneo.

&nbsp;

\*\*Escolhas:\*\*

&nbsp;

A. Torre

B. Arquivo subterrâneo

C. Casa do guarda

&nbsp;

\*\*Correta:\*\* B. Arquivo subterrâneo.

&nbsp;

\*\*Por quê:\*\* a chave tem uma inscrição que corresponde ao arquivo subterrâneo. Pista visual.

&nbsp;

\*\*Pista:\*\* registros mostram que o chefe da polícia visita o subterrâneo há anos.

&nbsp;

\*\*Gancho:\*\* o prisioneiro sussurra:

&nbsp;

\> “Silas não é o que parece. Mas também não é o que você imagina.”

&nbsp;

\*\*Nota da v2.0:\*\* A revelação visual de Silas como troll NÃO ocorre mais aqui. O jogador apenas desconfia.

&nbsp;

\*\*Emoção:\*\* paranoia \+ raiva.

&nbsp;

\---

&nbsp;

\#\# FASE 13 — O CHEFE

&nbsp;

Theo confronta Silas.

&nbsp;

Silas não nega nada, mas também não confirma.

&nbsp;

Ele diz:

&nbsp;

\> “Você está procurando uma resposta que seus pais tentaram esconder de você.”

&nbsp;

\*\*Escolhas:\*\*

&nbsp;

A. Perguntar sobre Clara

B. Perguntar sobre Elias

C. Perguntar sobre os desaparecimentos

&nbsp;

\*\*Correta:\*\* C. Perguntar sobre os desaparecimentos.

&nbsp;

\*\*Por quê:\*\* na Fase 5, o intervalo de 13 dias entre desaparecimentos foi descoberto. Perguntar sobre o padrão é a pergunta que Silas não quer responder.

&nbsp;

\*\*Pista:\*\* os desaparecimentos são organizados para retirar pessoas que descobrem a existência dos trolls.

&nbsp;

\*\*Gancho:\*\* Silas revela que Clara e Elias descobriram o caminho para o esconderijo central.

&nbsp;

\*\*Emoção:\*\* esperança \+ desconfiança.

&nbsp;

\*\*Nota:\*\* Silas age de forma ambígua. Não há revelação visual.

&nbsp;

\---

&nbsp;

\#\# FASE 14 — O MAPA

&nbsp;

Theo encontra um mapa com todos os lugares das fases anteriores.

&nbsp;

Isso cria o grande momento de conexão.

&nbsp;

\*\*Escolhas:\*\*

&nbsp;

A. Seguir o mapa para a montanha

B. Voltar para a delegacia

C. Seguir o símbolo do olho

&nbsp;

\*\*Correta:\*\* A. Seguir o mapa para a montanha.

&nbsp;

\*\*Por quê:\*\* o mapa mostra todos os locais visitados. O único não visitado é a montanha. Dedução lógica.

&nbsp;

\*\*Pista:\*\* todos os locais formam um desenho visto do alto.

&nbsp;

O desenho é a estrutura de um troll.

&nbsp;

\*\*Símbolo:\*\* ÁRVORE.

&nbsp;

\*\*Gancho:\*\* no centro do desenho está a casa de Theo.

&nbsp;

\*\*Emoção:\*\* choque \+ curiosidade.

&nbsp;

\---

&nbsp;

\#\# FASE 15 — A ARMADILHA

&nbsp;

Theo percebe que a investigação inteira foi conduzida para que ele chegasse à montanha.

&nbsp;

Isso significa que talvez os trolls queiram que ele esteja ali.

&nbsp;

\*\*Escolhas:\*\*

&nbsp;

A. Entrar pela passagem iluminada

B. Seguir a trilha de pegadas

C. Descer pelo poço sem iluminação

&nbsp;

\*\*Correta:\*\* C. Descer pelo poço sem iluminação.

&nbsp;

\*\*Por quê:\*\* as duas entradas visíveis são iluminadas demais para uma caverna abandonada. A iluminação é artificial. O poço sem iluminação é a entrada real.

&nbsp;

\*\*Pista:\*\* as duas entradas visíveis são iscas.

&nbsp;

\*\*Gancho:\*\* o poço leva à mesma porta mostrada na fotografia da Fase 1\.

&nbsp;

\*\*Emoção:\*\* tensão \+ urgência.

&nbsp;

\---

&nbsp;

\#\# FASE 16 — OS PAIS

&nbsp;

Theo encontra duas pessoas em uma sala.

&nbsp;

Eles parecem ser Clara e Elias.

&nbsp;

Momento de felicidade.

&nbsp;

Theo abraça os pais.

&nbsp;

A música sobe.

&nbsp;

Então Clara pergunta:

&nbsp;

\> “Qual era o apelido que eu te dava quando você era pequeno?”

&nbsp;

Theo não sabe responder.

&nbsp;

Os pais não são os pais.

&nbsp;

São trolls usando uma ilusão.

&nbsp;

\*\*Revelação de Silas:\*\* durante a ilusão, a imagem de Silas aparece refletida no espelho da sala. Seus olhos são de troll. Theo percebe.

&nbsp;

\*\*Escolhas:\*\*

&nbsp;

A. Ficar

B. Correr

C. Tentar conversar

&nbsp;

\*\*Correta:\*\* C. Tentar conversar.

&nbsp;

\*\*Por quê:\*\* na Fase 7, Clara deixou escrito: "Não confie no que estiver escrito. Confie no que você viu." A ilusão falha quando confrontada com memória real.

&nbsp;

\*\*Pista:\*\* a ilusão começa a falhar quando Theo pergunta por uma memória verdadeira.

&nbsp;

\*\*Gancho:\*\* antes de desaparecer, a criatura diz:

&nbsp;

\> “Eles estão na última caverna.”

&nbsp;

\*\*Emoção:\*\* felicidade \+ choque. PICO emocional.

&nbsp;

\---

&nbsp;

\#\# FASE 17 — A ÚLTIMA CIDADE

&nbsp;

Theo chega à parte mais profunda do subterrâneo.

&nbsp;

Há marcas feitas por humanos.

&nbsp;

Isso confirma que os pais estiveram ali.

&nbsp;

\*\*Escolhas:\*\*

&nbsp;

A. Seguir as marcas de Clara

B. Seguir as marcas de Elias

C. Seguir os símbolos dos trolls

&nbsp;

\*\*Correta:\*\* A. Seguir as marcas de Clara.

&nbsp;

\*\*Por quê:\*\* na Fase 14, o mapa mostrava que Clara passou por último pela região. Pista visual.

&nbsp;

\*\*Pista:\*\* Clara deixou instruções para o filho.

&nbsp;

\*\*Gancho:\*\* a última instrução diz:

&nbsp;

\> “Não confie no que estiver escrito. Confie no que você viu.”

&nbsp;

\*\*Emoção:\*\* medo \+ descoberta.

&nbsp;

\---

&nbsp;

\#\# FASE 18 — A VERDADE DOS PAIS

&nbsp;

Theo descobre a razão do desaparecimento.

&nbsp;

Clara e Elias descobriram o sistema de sequestros e tentaram destruir os registros.

&nbsp;

\*\*Escolhas:\*\*

&nbsp;

A. Destruir os registros

B. Procurar o esconderijo principal

C. Voltar para a cidade

&nbsp;

\*\*Correta:\*\* B. Procurar o esconderijo principal.

&nbsp;

\*\*Por quê:\*\* destruir os registros não salva os pais. Voltar é abandonar. Procurar o esconderijo é a única ação coerente com o objetivo.

&nbsp;

\*\*Pista:\*\* o esconderijo principal está atrás de uma entrada sem porta.

&nbsp;

\*\*Gancho:\*\* um desenho mostra um cubo com seis símbolos.

&nbsp;

\*\*Emoção:\*\* raiva \+ determinação.

&nbsp;

\---

&nbsp;

\#\# FASE 19 — O ÚLTIMO AVISO

&nbsp;

Theo chega diante da montanha.

&nbsp;

Silas aparece uma última vez.

&nbsp;

\> “Você chegou até aqui porque seus pais queriam que você chegasse. Mas talvez eles não tenham contado tudo.”

&nbsp;

Silas mostra uma foto antiga.

&nbsp;

Na foto estão Clara, Elias e uma criança desconhecida.

&nbsp;

\*\*Revelação:\*\* esta é a mesma foto plantada na Fase 9\. Ela é falsa. Theo percebe porque a criança na foto tem o rosto de Silas quando jovem.

&nbsp;

\*\*Escolhas:\*\*

&nbsp;

A. Perguntar quem é a criança

B. Seguir Silas

C. Ignorar Silas e procurar a entrada

&nbsp;

\*\*Correta:\*\* C. Ignorar Silas e procurar a entrada.

&nbsp;

\*\*Por quê:\*\* a foto é uma distração. Theo já viu a verdade na Fase 16 (olhos de Silas). A entrada é o objetivo.

&nbsp;

\*\*Pista:\*\* a foto é uma distração.

&nbsp;

\*\*Gancho final:\*\* a entrada da caverna possui o Cubo de Orun.

&nbsp;

\*\*Emoção:\*\* choque \+ urgência.

&nbsp;

\---

&nbsp;

\# 12\. FASE 20 — O ÚLTIMO ESCONDERIJO

&nbsp;

\#\# 12.1 Objetivo

&nbsp;

Resolver o mecanismo da entrada da caverna.

&nbsp;

\#\# 12.2 Ambientação

&nbsp;

A tela fica mais silenciosa.

&nbsp;

Sem música durante os primeiros segundos.

&nbsp;

Som de vento.

&nbsp;

Pedras.

&nbsp;

Respiração de Theo.

&nbsp;

A câmera mostra a entrada.

&nbsp;

Não existe porta.

&nbsp;

Existe uma pedra circular e um pedestal com o Cubo de Orun.

&nbsp;

\---

&nbsp;

\# 13\. CUBO DE ORUN

&nbsp;

\#\# 13.1 Estrutura

&nbsp;

O cubo possui seis símbolos:

&nbsp;

\`\`\`text

┌───────────────┐

│     OLHO      │

├───────────────┤

│      LUA      │

├───────────────┤

│      MÃO      │

├───────────────┤

│     CORVO     │

├───────────────┤

│    ÁRVORE     │

├───────────────┤

│  ROSTO/SELO   │

└───────────────┘

\`\`\`

&nbsp;

O sexto símbolo inicialmente fica escondido.

&nbsp;

O jogador precisa manipular as faces.

&nbsp;

\#\# 13.2 Correspondência fase → símbolo

&nbsp;

| Símbolo | Fase em que aparece |

|---|---|

| OLHO | 2 |

| LUA | 3 |

| MÃO | 5 |

| CORVO | 9 |

| ÁRVORE | 14 |

| ROSTO | 20 (revelado) |

&nbsp;

A ordem em que aparecem nas fases \*\*é\*\* a ordem correta de solução. O jogador atento percebe.

&nbsp;

\---

&nbsp;

\# 14\. PISTA DO CUBO (REVISADA)

&nbsp;

Na parede existe uma inscrição:

&nbsp;

\> “Quem viu primeiro, lembra primeiro.

\> Quem lembrou, girou.

\> Quem girou, encontrou.”

&nbsp;

A frase é funcional e poética ao mesmo tempo.

&nbsp;

\*\*A ordem dos símbolos é a ordem em que apareceram nas fases.\*\* O jogador atento que coletou os símbolos nas fases 2, 3, 5, 9 e 14 tem a sequência completa:

&nbsp;

\`\`\`text

OLHO    (Fase 2\)

↓

LUA     (Fase 3\)

↓

MÃO     (Fase 5\)

↓

CORVO   (Fase 9\)

↓

ÁRVORE  (Fase 14\)

↓

ROSTO   (Fase 20 — revelado)

\`\`\`

&nbsp;

O símbolo do rosto só aparece quando as cinco faces anteriores estão alinhadas.

&nbsp;

O rosto representa Theo.

&nbsp;

\#\# 14.1 Diário de Theo

&nbsp;

Para reforçar a memorização, o jogo inclui um \*\*Diário de Theo\*\* acessível pelo menu de pausa. O diário registra automaticamente os símbolos na ordem em que foram encontrados, junto com uma anotação curta de Theo.

&nbsp;

Isso resolve o problema de o jogador esquecer a ordem entre as fases.

&nbsp;

\---

&nbsp;

\# 15\. SIGNIFICADO DO SEXTO SÍMBOLO

&nbsp;

O grande segredo é:

&nbsp;

\*\*Theo é o sexto símbolo.\*\*

&nbsp;

Os trolls já conheciam a existência dele antes do desaparecimento dos pais.

&nbsp;

A transformação final não nasceu na Fase 20\.

&nbsp;

Ela começou no primeiro erro.

&nbsp;

\#\# 15.1 Sinais visuais discretos

&nbsp;

\`\`\`text

FASE 1

Nenhuma alteração.

&nbsp;

FASE 7

Pequena marca no braço.

&nbsp;

FASE 11

Reflexo dos olhos diferente por um instante.

&nbsp;

FASE 14

Sombra de Theo ligeiramente deformada.

&nbsp;

FASE 17

Som de respiração diferente.

&nbsp;

FASE 20

O rosto aparece no cubo.

\`\`\`

&nbsp;

\#\# 15.2 Micro-sinais narrativos (novos na v2.0)

&nbsp;

Além dos sinais visuais, a v2.0 adiciona sinais narrativos que o jogador percebe em diálogo e ambiente:

&nbsp;

\`\`\`text

FASE 3

Um troll hesita antes de atacar Theo. Não ataca.

&nbsp;

FASE 5

O nome de Theo na lista tem uma anotação ilegível ao lado.

&nbsp;

FASE 8

O troll condutor olha para Theo com estranheza, como se o reconhecesse.

&nbsp;

FASE 10

O ferreiro pergunta "quantas marcas você já encontrou?" — como se soubesse que Theo já tem marcas.

&nbsp;

FASE 12

O prisioneiro diz "você não devia estar aqui" — não como ameaça, mas como aviso.

&nbsp;

FASE 16

Antes da ilusão falhar, os falsos pais olham para Theo com algo parecido com pena.

&nbsp;

FASE 19

Silas diz "você sempre chegou a um lugar depois da hora certa" — repetido no Final B.

\`\`\`

&nbsp;

\#\# 15.3 Comentários de Silas

&nbsp;

Silas faz três comentários ambíguos sobre Theo ao longo do jogo:

&nbsp;

\- \*\*Fase 4:\*\* "Você tem os olhos do seu pai. E algo mais."

\- \*\*Fase 13:\*\* "Crianças como você não deveriam investigar sozinhas. Mas você não é como as outras."

\- \*\*Fase 19:\*\* "Você sempre chegou a um lugar depois da hora certa."

&nbsp;

Esses comentários não revelam nada, mas plantam a ideia de que Theo é diferente.

&nbsp;

\#\# 15.4 Sexto símbolo escondido

&nbsp;

O rosto de Theo aparece \*\*escondido\*\* em pelo menos 3 fases antes da 20:

&nbsp;

\- \*\*Fase 8:\*\* reflexo no vidro do veículo

\- \*\*Fase 11:\*\* sombra na parede da cidade subterrânea

\- \*\*Fase 14:\*\* desenho no canto do mapa

&nbsp;

Esses elementos devem ser discretos e não comentados pela narrativa. O jogador só percebe no replay.

&nbsp;

\---

&nbsp;

\# 16\. PUZZLE FINAL: REGRAS DE IMPLEMENTAÇÃO

&nbsp;

\#\# 16.1 Estado do puzzle

&nbsp;

\`\`\`ts

interface CubePuzzleState {

&nbsp;&nbsp;positions: number\[\];

&nbsp;&nbsp;solved: boolean;

&nbsp;&nbsp;attempts: number;

&nbsp;&nbsp;unlockedFace: boolean;

&nbsp;&nbsp;symbolOrder: string\[\];

&nbsp;&nbsp;diarySymbols: string\[\];

}

\`\`\`

&nbsp;

\#\# 16.2 Regras

&nbsp;

1\. O cubo inicia embaralhado.

2\. Cada ação gira uma face ou camada.

3\. Cada movimento gera feedback visual e sonoro.

4\. O jogador pode desfazer movimentos.

5\. O sistema não deve punir excesso de tentativas.

6\. O jogo verifica a posição em tempo real.

7\. Ao atingir a configuração correta, o cubo trava.

8\. O sexto símbolo aparece.

9\. O mecanismo abre.

10\. Começa o trecho final.

&nbsp;

\#\# 16.3 Regra importante

&nbsp;

O puzzle deve ser \*\*solucionável sem tentativa aleatória\*\* por quem prestou atenção às pistas anteriores. O Diário de Theo (Seção 14.1) garante que o jogador tem acesso à ordem mesmo se esqueceu.

&nbsp;

A pessoa sênior deve validar isso.

&nbsp;

\---

&nbsp;

\# 17\. FINAIS

&nbsp;

\#\# 17.1 FINAL SECRETO — A VERDADE MAIS ANTIGA

&nbsp;

Condição:

&nbsp;

\`\`\`ts

errors \=== 0 && cubeSolved && allSymbolsFound && clues.length \>= X

\`\`\`

&nbsp;

Theo abre a passagem.

&nbsp;

Encontra Clara e Elias.

&nbsp;

Os pais explicam que estavam presos há semanas.

&nbsp;

Silas é derrotado narrativamente pela exposição dos registros.

&nbsp;

A transformação não acontece.

&nbsp;

\*\*Revelação extra:\*\* Theo encontra uma sala muito mais antiga atrás da caverna. Existe uma parede com dezenas de desenhos. Entre eles:

&nbsp;

\- o símbolo do olho

\- a lua

\- a mão

\- o corvo

\- a árvore

\- \*\*o rosto de Theo\*\*

&nbsp;

A pergunta final fica:

&nbsp;

\> “E se seus pais não tiverem sido as primeiras vítimas?”

&nbsp;

Tela:

&nbsp;

\*\*FIM SECRETO — O ÚLTIMO RASTRO\*\*

&nbsp;

\---

&nbsp;

\#\# 17.2 FINAL BOM — VERDADEIRA VITÓRIA

&nbsp;

Condição:

&nbsp;

\`\`\`ts

errors \=== 1 && cubeSolved

\`\`\`

&nbsp;

Theo abre a passagem.

&nbsp;

Encontra Clara e Elias.

&nbsp;

Os pais explicam que estavam presos há semanas.

&nbsp;

Silas é derrotado narrativamente pela exposição dos registros.

&nbsp;

\*\*Marca permanente:\*\* Theo tem uma pequena marca no braço — a mesma da Fase 7\. A transformação parou, mas não foi revertida.

&nbsp;

Última frase:

&nbsp;

\> “Você não encontrou apenas o caminho. Você encontrou a verdade. Mas uma parte de você ficou pelo caminho.”

&nbsp;

Tela:

&nbsp;

\*\*FIM — O ÚLTIMO RASTRO\*\*

&nbsp;

\---

&nbsp;

\#\# 17.3 FINAL RUIM — TRANSFORMAÇÃO

&nbsp;

Condição:

&nbsp;

\`\`\`ts

errors \>= 2

\`\`\`

&nbsp;

A passagem abre parcialmente.

&nbsp;

Theo chega tarde.

&nbsp;

A caverna está vazia.

&nbsp;

Silas aparece.

&nbsp;

\> “Você sempre chegou a um lugar depois da hora certa.”

&nbsp;

A sombra de Theo muda.

&nbsp;

As mãos começam a se transformar.

&nbsp;

Os olhos refletem a luz de forma diferente.

&nbsp;

Silas diz:

&nbsp;

\> “Agora você entende por que nunca encontrou seus pais.”

&nbsp;

Tela preta.

&nbsp;

Quando a luz volta:

&nbsp;

Theo já é um troll.

&nbsp;

Última frase:

&nbsp;

\> “Toda escolha deixa um rastro.”

&nbsp;

Tela:

&nbsp;

\*\*FIM — O ÚLTIMO RASTRO\*\*

&nbsp;

\---

&nbsp;

\#\# 17.4 Tela de créditos do Final Ruim

&nbsp;

Para reduzir a sensação de injustiça, a tela de créditos do Final Ruim mostra um \*\*resumo das escolhas\*\* do jogador, destacando as corretas em verde e as erradas em vermelho, com a pista que justificava cada uma. Não como punição, mas como "o que você deixou passar".

&nbsp;

Exemplo de linha:

&nbsp;

\`\`\`text

FASE 6 — Estação de trem ✓

Justificativa: a carta mencionava "partir" e o arquivo da Fase 5

mostrava que a família viajava de trem frequentemente.

\`\`\`

&nbsp;

\---

&nbsp;

\# 18\. REJOGABILIDADE

&nbsp;

O jogador deve descobrir que determinados erros alteram:

&nbsp;

\- diálogo

\- pistas disponíveis

\- pequenas animações

\- ordem de descobertas

\- desenho do mapa

\- aparência de Theo

\- comentários de Silas

\- texto da fase 20

\- tela de créditos

&nbsp;

Não é necessário construir 20 histórias completamente diferentes.

&nbsp;

A estrutura recomendada é:

&nbsp;

\`\`\`text

CORE STORY

\+

BRANCHES CURTAS

\+

PONTOS DE VARIAÇÃO

\+

FINAL DETERMINADO PELO ESTADO

\`\`\`

&nbsp;

Isso reduz custo de produção.

&nbsp;

\---

&nbsp;

\# 19\. SISTEMA DE ESTADO DO JOGO

&nbsp;

\`\`\`ts

interface GameState {

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

&nbsp;&nbsp;ending: 'good' | 'bad' | 'secret' | null;

}

&nbsp;

interface CubePuzzleState {

&nbsp;&nbsp;positions: number\[\];

&nbsp;&nbsp;solved: boolean;

&nbsp;&nbsp;attempts: number;

&nbsp;&nbsp;unlockedFace: boolean;

&nbsp;&nbsp;symbolOrder: string\[\];

&nbsp;&nbsp;diarySymbols: string\[\];

}

\`\`\`

&nbsp;

\#\# 19.1 Exemplo

&nbsp;

\`\`\`ts

const initialGameState: GameState \= {

&nbsp;&nbsp;saveVersion: 2,

&nbsp;&nbsp;currentPhase: 1,

&nbsp;&nbsp;errors: 0,

&nbsp;&nbsp;choices: {},

&nbsp;&nbsp;clues: \[\],

&nbsp;&nbsp;symbols: \[\],

&nbsp;&nbsp;discoveredCharacters: \[\],

&nbsp;&nbsp;trustPolice: 50,

&nbsp;&nbsp;transformationLevel: 0,

&nbsp;&nbsp;cube: {

&nbsp;&nbsp;&nbsp;&nbsp;positions: \[\],

&nbsp;&nbsp;&nbsp;&nbsp;solved: false,

&nbsp;&nbsp;&nbsp;&nbsp;attempts: 0,

&nbsp;&nbsp;&nbsp;&nbsp;unlockedFace: false,

&nbsp;&nbsp;&nbsp;&nbsp;symbolOrder: \[\],

&nbsp;&nbsp;&nbsp;&nbsp;diarySymbols: \[\]

&nbsp;&nbsp;},

&nbsp;&nbsp;ending: null

};

\`\`\`

&nbsp;

\#\# 19.2 Migração de save

&nbsp;

Se \`saveVersion\` for menor que a versão atual do jogo, aplicar função de migração antes de carregar. Se a migração falhar, avisar o jogador e oferecer recomeçar.

&nbsp;

\`\`\`ts

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

&nbsp;&nbsp;&nbsp;&nbsp;save.saveVersion \= 2;

&nbsp;&nbsp;}

&nbsp;&nbsp;return save;

}

\`\`\`

&nbsp;

\---

&nbsp;

\# 20\. FUNÇÕES PRINCIPAIS

&nbsp;

\#\# 20.1 Game lifecycle

&nbsp;

\`\`\`ts

startGame(): void

loadGame(): Promise\<void\>

saveGame(): Promise\<void\>

resetGame(): Promise\<void\>

continueGame(): void

pauseGame(): void

resumeGame(): void

\`\`\`

&nbsp;

\#\# 20.2 Fases

&nbsp;

\`\`\`ts

loadPhase(phaseId: number): Promise\<void\>

startPhase(phaseId: number): void

showPhaseIntro(phaseId: number): void

showChoices(phaseId: number): void

resolveChoice(phaseId: number, choiceId: string): void

completePhase(phaseId: number): void

advanceToNextPhase(): void

\`\`\`

&nbsp;

\#\# 20.3 Escolhas

&nbsp;

\`\`\`ts

isCorrectChoice(phaseId: number, choiceId: string): boolean

registerChoice(phaseId: number, choiceId: string): void

registerError(phaseId: number, choiceId: string): void

applyChoiceEffects(phaseId: number, choiceId: string): void

\`\`\`

&nbsp;

\#\# 20.4 Pistas

&nbsp;

\`\`\`ts

addClue(clueId: string): void

hasClue(clueId: string): boolean

getClue(clueId: string): Clue | null

unlockClue(clueId: string): void

\`\`\`

&nbsp;

\#\# 20.5 Símbolos

&nbsp;

\`\`\`ts

addSymbol(symbolId: string): void

hasSymbol(symbolId: string): boolean

getCollectedSymbols(): string\[\]

addSymbolToDiary(symbolId: string): void

\`\`\`

&nbsp;

\#\# 20.6 Transformação

&nbsp;

\`\`\`ts

increaseTransformation(amount: number): void

getTransformationLevel(): number

shouldShowTransformationEffect(): boolean

playTransformationHint(): void

playFinalTransformation(): void

\`\`\`

&nbsp;

\#\# 20.7 Polícia e confiança

&nbsp;

\`\`\`ts

changePoliceTrust(amount: number): void

getPoliceTrust(): number

isPoliceTrusted(): boolean

\`\`\`

&nbsp;

\#\# 20.8 Finais

&nbsp;

\`\`\`ts

calculateEnding(): 'good' | 'bad' | 'secret'

startEnding(endingId: string): void

showEnding(endingId: string): void

showEndingCredits(endingId: string): void

\`\`\`

&nbsp;

\#\# 20.9 Puzzle

&nbsp;

\`\`\`ts

initializeCube(): void

rotateCube(face: string, direction: 1 | \-1): void

isCubeSolved(): boolean

unlockHiddenFace(): void

openCave(): void

\`\`\`

&nbsp;

\---

&nbsp;

\# 21\. MODELO DE DADOS DAS FASES

&nbsp;

Recomendação: armazenar o conteúdo narrativo fora do código.

&nbsp;

\`\`\`ts

interface Phase {

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

&nbsp;

interface Choice {

&nbsp;&nbsp;id: string;

&nbsp;&nbsp;text: string;

&nbsp;&nbsp;correct: boolean;

&nbsp;&nbsp;consequence: string;

&nbsp;&nbsp;clueReward?: string;

&nbsp;&nbsp;transformationDelta?: number;

&nbsp;&nbsp;justification: string;

}

\`\`\`

&nbsp;

O campo \`justification\` é novo na v2.0 e obrigatório. Ele documenta a pista que justifica a escolha correta.

&nbsp;

\---

&nbsp;

\# 22\. EXEMPLO JSON

&nbsp;

\`\`\`json

{

&nbsp;&nbsp;"id": 4,

&nbsp;&nbsp;"title": "O Policial",

&nbsp;&nbsp;"act": 1,

&nbsp;&nbsp;"intro": "Theo entra na delegacia procurando ajuda.",

&nbsp;&nbsp;"scene": "O chefe Silas aparece e fala calmamente sobre os pais.",

&nbsp;&nbsp;"objective": "Descobrir o que a polícia sabe.",

&nbsp;&nbsp;"image": "/assets/phases/phase-04.webp",

&nbsp;&nbsp;"music": "/assets/audio/phase04\_delegacia\_respiro.ogg",

&nbsp;&nbsp;"choices": \[

&nbsp;&nbsp;&nbsp;&nbsp;{

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"id": "a",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"text": "Arquivo da delegacia",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"correct": false,

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"consequence": "Theo encontra registros antigos, mas perde uma pista importante.",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"justification": ""

&nbsp;&nbsp;&nbsp;&nbsp;},

&nbsp;&nbsp;&nbsp;&nbsp;{

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"id": "b",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"text": "Sala de câmeras",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"correct": true,

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"consequence": "Theo encontra uma gravação dos pais entrando em um carro da polícia.",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"clueReward": "police\_vehicle",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"justification": "Silas menciona que as câmeras registraram tudo, mas com tom evasivo."

&nbsp;&nbsp;&nbsp;&nbsp;},

&nbsp;&nbsp;&nbsp;&nbsp;{

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"id": "c",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"text": "Gabinete de Silas",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"correct": false,

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"consequence": "Theo quase é descoberto.",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"justification": ""

&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;&nbsp;\],

&nbsp;&nbsp;"cliffhanger": "O carro da gravação pertence à própria polícia.",

&nbsp;&nbsp;"justification": "O jogador deve escolher a sala de câmeras porque Silas evita o assunto.",

&nbsp;&nbsp;"respiroPhase": true

}

\`\`\`

&nbsp;

\---

&nbsp;

\# 23\. MÁQUINA DE ESTADOS

&nbsp;

\`\`\`text

BOOT

&nbsp;&nbsp;↓

MENU

&nbsp;&nbsp;↓

INTRO

&nbsp;&nbsp;↓

PLAYING

&nbsp;&nbsp;↓

CHOOSING

&nbsp;&nbsp;↓

RESOLVING

&nbsp;&nbsp;↓

CLUE\_REVEAL

&nbsp;&nbsp;↓

CLIFFHANGER

&nbsp;&nbsp;↓

PHASE\_COMPLETE

&nbsp;&nbsp;↓

NEXT\_PHASE

\`\`\`

&nbsp;

Estados especiais:

&nbsp;

\`\`\`text

PAUSED

LOADING

SAVE\_ERROR

ASSET\_ERROR

PUZZLE

ENDING

CREDITS

\`\`\`

&nbsp;

\#\# 23.1 Tratamento de ASSET\_ERROR

&nbsp;

Se um asset essencial não carregar:

&nbsp;

1\. Logar o erro no console.

2\. Usar placeholder visual.

3\. Continuar a fase.

4\. Marcar a fase como "asset\_parcial" no save.

5\. Ao final do jogo, avisar o jogador que houve erro de carregamento.

&nbsp;

Nunca travar o jogo por asset faltante.

&nbsp;

\---

&nbsp;

\# 24\. ARQUITETURA TÉCNICA RECOMENDADA

&nbsp;

\#\# 24.1 Stack principal

&nbsp;

\`\`\`text

TypeScript

Phaser 4.x

Vite

HTML5

CSS

Web Audio / áudio gerenciado pelo jogo

IndexedDB para save estruturado

Service Worker/PWA em uma etapa posterior

\`\`\`

&nbsp;

O Phaser é um framework HTML5 voltado a jogos web e oferece renderização WebGL e Canvas. A documentação oficial recomenda o modo \`AUTO\` para tentar WebGL e recorrer a Canvas quando necessário.

&nbsp;

A documentação atual do Phaser mostra a linha 4.x, incluindo a API 4.1.0.

&nbsp;

O Vite gera um bundle de produção apropriado para hospedagem estática. No alvo padrão consultado, a documentação lista Chrome 111+, Edge 111+, Firefox 114+ e Safari 16.4+.

&nbsp;

IndexedDB é apropriado para persistir dados estruturados no navegador e também permite aplicações que funcionem offline quando a estratégia de cache foi implementada corretamente.

&nbsp;

\#\# 24.2 Carregamento de fases

&nbsp;

As fases são carregadas via \`fetch\` em runtime, não importadas no bundle. Isso permite editar \`phases.json\` sem rebuild.

&nbsp;

O \`PhaseLoader\` busca \`/data/phases.json\`, valida com \`PhaseValidator\` e monta o objeto \`Phase\`.

&nbsp;

\---

&nbsp;

\# 25\. ESTRUTURA DO PROJETO

&nbsp;

\`\`\`text

freitas-troll-game/

│

├── src/

│   ├── main.ts

│   ├── config/

│   │   └── gameConfig.ts

│   │

│   ├── game/

│   │   ├── Game.ts

│   │   ├── GameState.ts

│   │   ├── SaveManager.ts

│   │   ├── ChoiceSystem.ts

│   │   ├── ClueSystem.ts

│   │   ├── SymbolSystem.ts

│   │   ├── TransformationSystem.ts

│   │   ├── EndingSystem.ts

│   │   └── AudioManager.ts

│   │

│   ├── scenes/

│   │   ├── BootScene.ts

│   │   ├── PreloadScene.ts

│   │   ├── MenuScene.ts

│   │   ├── IntroScene.ts

│   │   ├── StoryScene.ts

│   │   ├── ChoiceScene.ts

│   │   ├── DiaryScene.ts

│   │   ├── PuzzleScene.ts

│   │   ├── EndingScene.ts

│   │   └── CreditsScene.ts

│   │

│   ├── systems/

│   │   ├── PhaseLoader.ts

│   │   ├── PhaseValidator.ts

│   │   ├── NarrativeEngine.ts

│   │   ├── TriggerSystem.ts

│   │   └── PerformanceMonitor.ts

│   │

│   ├── data/

│   │   ├── phases.json

│   │   ├── clues.json

│   │   ├── symbols.json

│   │   └── endings.json

│   │

│   ├── ui/

│   │   ├── ChoiceButton.ts

│   │   ├── DialogueBox.ts

│   │   ├── PhaseHeader.ts

│   │   ├── CluePanel.ts

│   │   └── DiaryPanel.ts

│   │

│   └── utils/

│       ├── random.ts

│       ├── format.ts

│       └── device.ts

│

├── public/

│   ├── assets/

│   │   ├── backgrounds/

│   │   ├── characters/

│   │   ├── trolls/

│   │   ├── props/

│   │   ├── symbols/

│   │   ├── audio/

│   │   └── music/

│   ├── favicon.ico

│   └── manifest.webmanifest

│

├── tests/

├── index.html

├── package.json

├── tsconfig.json

└── vite.config.ts

\`\`\`

&nbsp;

\---

&nbsp;

\# 26\. RESPONSIVIDADE E COMPATIBILIDADE

&nbsp;

\#\# 26.1 Resolução lógica

&nbsp;

Recomendação inicial:

&nbsp;

\`\`\`text

1280 x 720

\`\`\`

&nbsp;

O jogo deve ser escalado proporcionalmente.

&nbsp;

Não construir a lógica dependendo de coordenadas absolutas do monitor.

&nbsp;

\#\# 26.2 Regras

&nbsp;

\- aceitar tela cheia

\- preservar proporção

\- manter área de clique confortável

\- não depender de hover para funções críticas

\- suportar mouse

\- suportar teclado onde fizer sentido

\- usar fontes locais ou fontes web com fallback

\- comprimir imagens

\- usar WebP/AVIF quando compatível com a pipeline

\- manter uma alternativa para assets essenciais

\- evitar texturas gigantes

\- evitar vídeo em loop como fundo da maioria das fases

&nbsp;

\#\# 26.3 Limite de compatibilidade

&nbsp;

Não existe promessa realista de funcionar em “qualquer PC” sem definir navegador, sistema e capacidade gráfica.

&nbsp;

O requisito correto é estabelecer uma matriz de suporte.

&nbsp;

\#\#\# Mínimo recomendado para MVP

&nbsp;

\`\`\`text

Windows 10/11

Chrome moderno

Edge moderno

Firefox moderno

macOS recente com navegador moderno

\`\`\`

&nbsp;

A equipe deve executar um teste real em máquinas fracas, medianas e fortes.

&nbsp;

\---

&nbsp;

\# 27\. RENDERIZAÇÃO

&nbsp;

Usar:

&nbsp;

\`\`\`ts

const config \= {

&nbsp;&nbsp;type: Phaser.AUTO,

&nbsp;&nbsp;width: 1280,

&nbsp;&nbsp;height: 720,

&nbsp;&nbsp;parent: 'game-container',

&nbsp;&nbsp;backgroundColor: '\#0B0B10'

};

\`\`\`

&nbsp;

A documentação do Phaser descreve \`Phaser.AUTO\` como o modo que tenta WebGL e faz fallback para Canvas quando o suporte adequado não está disponível.

&nbsp;

O Phaser 4 possui melhorias no renderer WebGL, mas o projeto não deve depender de shaders pesados para sua experiência principal.

&nbsp;

\---

&nbsp;

\# 28\. ÁUDIO

&nbsp;

O áudio é parte da narrativa.

&nbsp;

\#\# 28.1 Categorias

&nbsp;

\`\`\`text

ambiente

passos

vento

madeira

pedra

porta

mecanismo

respiração

tensão

revelação

transformação

\`\`\`

&nbsp;

\#\# 28.2 Regra de mixagem narrativa

&nbsp;

Quando uma revelação importante acontecer:

&nbsp;

\`\`\`text

música ↓

som ambiente ↓

silêncio

↓

efeito sonoro

↓

fala

\`\`\`

&nbsp;

O silêncio é um recurso narrativo.

&nbsp;

\#\# 28.3 Nomenclatura de assets

&nbsp;

Padronizar nomes no formato:

&nbsp;

\`\`\`text

phase\#\#\_\[cenario\]\_\[emocao\].ogg

\`\`\`

&nbsp;

Exemplos:

&nbsp;

\`\`\`text

phase01\_casa\_medo.ogg

phase04\_delegacia\_respiro.ogg

phase16\_sala\_ilusao\_pico.ogg

phase20\_caverna\_silencio.ogg

\`\`\`

&nbsp;

Evitar nomes genéricos como \`tension-01.ogg\`.

&nbsp;

\---

&nbsp;

\# 29\. SISTEMA DE CÂMERA

&nbsp;

A câmera deve funcionar em camadas.

&nbsp;

\`\`\`text

BACKGROUND

&nbsp;&nbsp;&nbsp;&nbsp;↓

MIDGROUND

&nbsp;&nbsp;&nbsp;&nbsp;↓

CHARACTER

&nbsp;&nbsp;&nbsp;&nbsp;↓

FOREGROUND

&nbsp;&nbsp;&nbsp;&nbsp;↓

TEXT/UI

\`\`\`

&nbsp;

Usar pequenos movimentos de câmera apenas em momentos-chave.

&nbsp;

Exemplo:

&nbsp;

\`\`\`ts

camera.shake(200, 0.004);

\`\`\`

&nbsp;

Não usar tremor em excesso.

&nbsp;

\---

&nbsp;

\# 30\. SISTEMA DE PISTAS

&nbsp;

As pistas precisam ser classificadas.

&nbsp;

\`\`\`ts

interface Clue {

&nbsp;&nbsp;id: string;

&nbsp;&nbsp;phase: number;

&nbsp;&nbsp;text: string;

&nbsp;&nbsp;symbol?: string;

&nbsp;&nbsp;unlocks?: string\[\];

&nbsp;&nbsp;importance: 'low' | 'medium' | 'high';

}

\`\`\`

&nbsp;

\#\# 30.1 Tipos

&nbsp;

\`\`\`text

PISTA DIRETA

PISTA DE AMBIENTE

PISTA DE PERSONAGEM

PISTA DE SÍMBOLO

PISTA RETROATIVA

PISTA FALSA

PISTA FINAL

\`\`\`

&nbsp;

\#\# 30.2 Pista falsa de longa duração (novo na v2.0)

&nbsp;

A foto plantada na Fase 9 é o exemplo canônico de pista falsa de longa duração. Ela:

&nbsp;

\- aparece como pista verdadeira na Fase 9

\- é guardada no diário de Theo

\- é referenciada na Fase 19 por Silas

\- é revelada falsa na Fase 19 (a criança na foto tem o rosto de Silas jovem)

&nbsp;

Isso cria o "momento de raiva" que a Seção 3 pede.

&nbsp;

\---

&nbsp;

\# 31\. PRINCÍPIO DAS PISTAS RETROATIVAS

&nbsp;

Uma pista antiga deve adquirir novo significado depois.

&nbsp;

Exemplo:

&nbsp;

\`\`\`text

FASE 2

Símbolo do olho

&nbsp;

FASE 10

Mesmo símbolo em ferramenta

&nbsp;

FASE 14

Símbolo no mapa

&nbsp;

FASE 20

Símbolo no cubo

\`\`\`

&nbsp;

A pessoa sênior deve revisar se cada símbolo aparece o suficiente para ser reconhecível, mas não tantas vezes a ponto de ficar óbvio.

&nbsp;

\---

&nbsp;

\# 32\. COMO FUNCIONA O ERRO OCULTO

&nbsp;

Não informar:

&nbsp;

\> Você errou.

&nbsp;

Informar apenas:

&nbsp;

\> Você encontrou algo aqui.

&nbsp;

Mas internamente:

&nbsp;

\`\`\`ts

if (\!choice.correct) {

&nbsp;&nbsp;state.errors \+= 1;

&nbsp;&nbsp;state.transformationLevel \+= 1;

}

\`\`\`

&nbsp;

Isso só deve ser usado se a equipe aceitar a possibilidade de o jogador se sentir frustrado ao descobrir o final.

&nbsp;

Para reduzir frustração:

&nbsp;

\- todas as escolhas erradas devem gerar algum conteúdo útil

\- jamais bloquear completamente a campanha

\- mostrar pistas suficientes para permitir compreensão no replay

\- permitir reinício rápido

\- mostrar resumo das escolhas na tela de créditos do Final Ruim

&nbsp;

\---

&nbsp;

\# 33\. TRANSFORMAÇÃO PROGRESSIVA

&nbsp;

\#\# 33.1 Sugestão

&nbsp;

\`\`\`text

errors \= 0

transformação \= 0

&nbsp;

1 erro

marca visual discreta

&nbsp;

1-3 erros

alterações de sombra e olhos

&nbsp;

3+ erros

alterações visuais mais perceptíveis

&nbsp;

fase 20

transformação completa

\`\`\`

&nbsp;

Importante: o jogador não deve receber uma “barra de corrupção” explícita.

&nbsp;

O sistema deve ser descoberto pela narrativa.

&nbsp;

\#\# 33.2 Micro-sinais narrativos

&nbsp;

Ver Seção 15.2 e 15.3.

&nbsp;

\---

&nbsp;

\# 34\. DOCUMENTO DE JUSTIFICATIVA DE ESCOLHAS (NOVO — OBRIGATÓRIO)

&nbsp;

Este documento é \*\*anexo obrigatório\*\* ao briefing. Ele lista, para cada fase:

&nbsp;

\`\`\`text

FASE

ESCOLHA CORRETA

PISTA QUE JUSTIFICA

ONDE O JOGADOR VÊ

QUANTO TEMPO ANTES

\`\`\`

&nbsp;

Sem esse documento, o jogo não pode entrar em produção.

&nbsp;

\#\# 34.1 Exemplo

&nbsp;

| Fase | Correta | Justificativa | Onde apareceu | Tempo antes |

|---|---|---|---|---|

| 1 | B. Garagem | Marca de pneu visível na cena | Cena de entrada | imediato |

| 2 | C. Igreja antiga | Símbolo do olho no casaco da mãe | Fase 1 | 1 fase |

| 3 | C. Túnel | Som vindo do subsolo | Fase 2 | 1 fase |

| 4 | B. Sala de câmeras | Silas evita o assunto | Fase 4 | imediato |

| 5 | A. Arquivo de desaparecidos | Carro da Fase 4 é da polícia | Fase 4 | 1 fase |

| 6 | A. Estação | Carta menciona "partir" \+ família viaja de trem | Fase 5 | 1 fase |

| 7 | A. Biblioteca | Selo da biblioteca no bilhete | Fase 6 | 1 fase |

| 8 | B. Porto seco | Veículo entrou em área restrita ao lado do porto | Fase 8 | imediato |

| 9 | A. Centro de registros | Carimbo no documento que mudou | Fase 9 | imediato |

| 10 | A. Oficina | Ferreiro visto trabalhando na oficina | Fase 10 | imediato |

| 11 | B. Prisão | Nome de Theo riscado na lista | Fase 5 | 6 fases |

| 12 | B. Arquivo subterrâneo | Inscrição na chave | Fase 12 | imediato |

| 13 | C. Desaparecimentos | Intervalo de 13 dias descoberto | Fase 5 | 8 fases |

| 14 | A. Montanha | Único local não visitado | Fase 14 | imediato |

| 15 | C. Poço sem iluminação | Entradas visíveis são iluminadas artificialmente | Fase 15 | imediato |

| 16 | C. Tentar conversar | Instrução de Clara na Fase 7 | Fase 7 | 9 fases |

| 17 | A. Marcas de Clara | Mapa mostra Clara passou por último | Fase 14 | 3 fases |

| 18 | B. Esconderijo principal | Destruir registros não salva os pais | Fase 18 | imediato |

| 19 | C. Procurar a entrada | Foto é distração; Theo já viu a verdade | Fase 16 | 3 fases |

| 20 | Ordem dos símbolos | Símbolos apareceram nas fases 2, 3, 5, 9, 14 | múltiplas | múltiplas |

&nbsp;

A pessoa sênior deve revisar se cada linha está correta e se o "tempo antes" é razoável. Se um jogador não puder lembrar da pista, ela deve ser reforçada no Diário de Theo.

&nbsp;

\---

&nbsp;

\# 35\. BALANCEAMENTO DAS TRÊS OPÇÕES

&nbsp;

As três respostas devem possuir funções diferentes:

&nbsp;

\*\*Opção 1:\*\* plausível pela lógica imediata.

&nbsp;

\*\*Opção 2:\*\* plausível pela emoção.

&nbsp;

\*\*Opção 3:\*\* plausível pela observação.

&nbsp;

Assim o jogador não resolve apenas pela aparência.

&nbsp;

\---

&nbsp;

\# 36\. SISTEMA DE CLIFFHANGER

&nbsp;

Todo final de fase deve cumprir pelo menos uma das funções:

&nbsp;

\`\`\`text

REVELAR

CONTRADIZER

AMEAÇAR

PROMETER

QUESTIONAR

\`\`\`

&nbsp;

\#\# 36.1 Exemplos

&nbsp;

\#\#\# Revelar

\> “O carro era da polícia.”

&nbsp;

\#\#\# Contradizer

\> “A carta foi escrita depois do desaparecimento.”

&nbsp;

\#\#\# Ameaçar

\> “Alguém está atrás de você.”

&nbsp;

\#\#\# Prometer

\> “Seu pai ainda está vivo.”

&nbsp;

\#\#\# Questionar

\> “Quem é a sexta criança?”

&nbsp;

\---

&nbsp;

\# 37\. MENU PRINCIPAL

&nbsp;

Elementos:

&nbsp;

\`\`\`text

O ÚLTIMO RASTRO

&nbsp;

\[NOVO JOGO\]

\[CONTINUAR\]

\[DIÁRIO\]

\[PISTAS\]

\[CONFIGURAÇÕES\]

\[CRÉDITOS\]

\`\`\`

&nbsp;

Não colocar excessos.

&nbsp;

O foco é iniciar a história.

&nbsp;

\---

&nbsp;

\# 38\. TELA DE PISTAS

&nbsp;

O jogador deve poder consultar pistas já descobertas.

&nbsp;

Formato:

&nbsp;

\`\`\`text

ARQUIVO DE INVESTIGAÇÃO

&nbsp;

\[01\] Símbolo do olho

\[02\] Carta de Clara

\[03\] Bilhete de trem

\[04\] Foto da polícia

...

&nbsp;

\[DESENHO DO MAPA\]

\`\`\`

&nbsp;

Não mostrar automaticamente a resposta correta.

&nbsp;

\---

&nbsp;

\# 39\. SISTEMA DE SAVE

&nbsp;

O jogo deve salvar:

&nbsp;

\- saveVersion

\- fase atual

\- escolhas

\- erros

\- pistas

\- símbolos

\- diário de símbolos

\- nível de transformação

\- posição do puzzle

\- final desbloqueado

&nbsp;

IndexedDB é uma opção apropriada para dados estruturados persistentes no navegador.

&nbsp;

\#\# 39.1 Backup opcional

&nbsp;

Em versão futura:

&nbsp;

\`\`\`text

EXPORTAR PROGRESSO

IMPORTAR PROGRESSO

\`\`\`

&nbsp;

\#\# 39.2 Migração

&nbsp;

Ver Seção 19.2.

&nbsp;

\---

&nbsp;

\# 40\. PWA

&nbsp;

Depois do MVP:

&nbsp;

\`\`\`text

manifest.webmanifest

service-worker

cache de assets essenciais

ícones

splash

\`\`\`

&nbsp;

Objetivo:

&nbsp;

\`\`\`text

ABRIR NO NAVEGADOR

↓

ADICIONAR À ÁREA DE TRABALHO

↓

EXECUTAR COMO APP

\`\`\`

&nbsp;

Não fazer PWA antes de estabilizar o jogo base.

&nbsp;

\---

&nbsp;

\# 41\. PERFORMANCE

&nbsp;

\#\# 41.1 Metas sugeridas

&nbsp;

\`\`\`text

carregamento inicial rápido

baixo uso de RAM

sem congelamentos entre fases

troca de cena suave

assets carregados sob demanda

\`\`\`

&nbsp;

\#\# 41.2 Estratégia

&nbsp;

Não carregar as 20 fases completas de uma vez.

&nbsp;

Usar:

&nbsp;

\`\`\`text

boot

↓

menu

↓

assets compartilhados

↓

fase atual

↓

assets da próxima fase pré-carregados opcionalmente

\`\`\`

&nbsp;

\---

&nbsp;

\# 42\. ASSETS

&nbsp;

\#\# 42.1 Cenários necessários

&nbsp;

Mínimo inicial:

&nbsp;

\`\`\`text

Casa

Garagem

Igreja

Delegacia

Arquivo

Estação

Porto seco

Biblioteca

Cidade subterrânea

Prisão

Oficina

Torre

Montanha

Caverna

Sala do Cubo

\`\`\`

&nbsp;

\#\# 42.2 Personagens

&nbsp;

\`\`\`text

Theo

Clara

Elias

Silas humano

Silas troll

Troll vigia

Troll mensageiro

Troll condutor

Troll copista

Troll ferreiro

Troll guardião

Prisioneiro

\`\`\`

&nbsp;

\---

&nbsp;

\# 43\. DESIGN VISUAL

&nbsp;

Direção sugerida:

&nbsp;

\`\`\`text

fantasia sombria

2D ilustrado

alto contraste

ambientes detalhados

personagens simples

sombras fortes

paleta fria

acentos quentes apenas para pistas importantes

\`\`\`

&nbsp;

As pistas devem ter elementos visuais repetidos para ensinar o jogador a reconhecê-las.

&nbsp;

\#\# 43.1 Acessibilidade visual

&nbsp;

Cada símbolo do cubo tem \*\*forma única\*\* (olho, lua, mão, corvo, árvore, rosto). Nunca depender apenas de cor para distinguir símbolos.

&nbsp;

\---

&nbsp;

\# 44\. TEXTOS

&nbsp;

Regra de escrita:

&nbsp;

Frases curtas.

&nbsp;

Nada de longos blocos de exposição.

&nbsp;

Preferir:

&nbsp;

\> “A porta estava aberta.”

&nbsp;

\> “Mas ninguém estava em casa.”

&nbsp;

Em vez de:

&nbsp;

\> “Ao chegar em casa, Theo percebeu que havia algo muito estranho...”

&nbsp;

A narrativa visual deve complementar o texto.

&nbsp;

\---

&nbsp;

\# 45\. DESIGN DE INTERAÇÃO

&nbsp;

Cada escolha deve responder com três camadas:

&nbsp;

\`\`\`text

AÇÃO

↓

ANIMAÇÃO

↓

RESULTADO

\`\`\`

&nbsp;

Exemplo:

&nbsp;

\`\`\`text

Clique em "Sala de câmeras"

↓

Botão afunda

↓

Som de clique

↓

Tela escurece levemente

↓

Câmeras aparecem

↓

A gravação roda

↓

Pista encontrada

\`\`\`

&nbsp;

\---

&nbsp;

\# 46\. SISTEMA DE ACESSIBILIDADE

&nbsp;

Implementar desde o MVP:

&nbsp;

\- ajuste de volume

\- botão de silenciar música

\- texto legível

\- contraste suficiente

\- não depender apenas de cor para indicar estados

\- opção de reduzir efeitos de movimento em versão futura

\- suporte básico ao teclado

\- símbolos com forma única (não apenas cor)

&nbsp;

\---

&nbsp;

\# 47\. SEGURANÇA E PRIVACIDADE

&nbsp;

MVP deve ser quase totalmente client-side.

&nbsp;

Não pedir:

&nbsp;

\- nome real

\- CPF

\- e-mail

\- localização

\- microfone

\- câmera

&nbsp;

A menos que exista uma função futura que realmente necessite disso.

&nbsp;

\---

&nbsp;

\# 48\. ESTRUTURA DE TESTES

&nbsp;

\#\# 48.1 Testes unitários

&nbsp;

\`\`\`text

ChoiceSystem

SaveManager

EndingSystem

TransformationSystem

CubePuzzle

PhaseLoader

PhaseValidator

SymbolSystem

\`\`\`

&nbsp;

\#\# 48.2 Testes de integração

&nbsp;

\`\`\`text

Fase 1 → Fase 2

Fase 19 → Fase 20

Puzzle → final

Save → reload

Migração de save v1 → v2

\`\`\`

&nbsp;

\#\# 48.3 Teste de narrativa

&nbsp;

Para cada fase:

&nbsp;

\`\`\`text

A correta funciona?

B errada continua?

C errada continua?

A pista aparece?

O cliffhanger aparece?

A fase seguinte recebe o estado esperado?

A justificativa observável está presente?

\`\`\`

&nbsp;

\---

&nbsp;

\# 49\. MATRIZ CRÍTICA DE QA

&nbsp;

| Critério | Deve passar |

|---|---|

| carregar jogo | sim |

| iniciar novo jogo | sim |

| salvar | sim |

| recarregar página | mantém progresso |

| escolha correta | registra pista |

| escolha errada | registra erro e continua |

| fase 20 | acessível |

| cubo | solucionável |

| final secreto | somente sem erro \+ todas as pistas |

| final bom | errors \<= 1 |

| final ruim | errors \>= 2 |

| áudio | ativável/desativável |

| tela cheia | funcional |

| PC fraco | jogável |

| teclado | funções básicas |

| mouse | todas as escolhas |

| diário | registra símbolos na ordem |

| migração de save | funciona |

&nbsp;

\---

&nbsp;

\# 50\. CRITÉRIOS DE ACEITAÇÃO NARRATIVOS

&nbsp;

O jogo só deve ser considerado pronto quando a pessoa que nunca viu o projeto conseguir responder:

&nbsp;

1\. Quero descobrir o que aconteceu com os pais?

2\. Desconfio da polícia?

3\. Consigo lembrar de algumas pistas antigas?

4\. Percebo que os trolls estavam manipulando a investigação?

5\. Entendo o sentido do cubo?

6\. Sinto que o final dependeu das minhas decisões?

7\. Tenho vontade de jogar novamente depois de um final ruim?

&nbsp;

Se a maioria dessas respostas for “não”, o problema provavelmente não está na programação. Está na narrativa ou no ritmo.

&nbsp;

\---

&nbsp;

\# 51\. RISCOS E PONTOS CEGOS PARA UMA ANÁLISE SÊNIOR

&nbsp;

\#\# Risco 1: o sistema de erro parecer injusto

&nbsp;

Problema: O jogador não sabe qual opção era correta.

&nbsp;

Correção: Cada escolha precisa ser justificável por uma pista anterior. Ver Seção 34\.

&nbsp;

\#\# Risco 2: a história ficar previsível

&nbsp;

Problema: O jogador descobre o chefe troll cedo demais.

&nbsp;

Correção: Silas precisa ter ações que também pareçam coerentes com um policial. Revelação movida para Fase 16\.

&nbsp;

\#\# Risco 3: os trolls virarem repetitivos

&nbsp;

Problema: Todo encontro termina com “troll mau”.

&nbsp;

Correção: Alterar função narrativa. Cada troll tem cena própria (Seção 6.5).

&nbsp;

\#\# Risco 4: 20 fases parecerem longas

&nbsp;

Problema: A história demora para avançar.

&nbsp;

Correção: Cada fase introduz uma informação relevante. Duração-alvo de 2–4 min por fase.

&nbsp;

\#\# Risco 5: excesso de texto

&nbsp;

Problema: O jogo vira leitura.

&nbsp;

Correção: Usar imagem, som, animação, silêncio e interação.

&nbsp;

\#\# Risco 6: o final ruim parecer “pegadinha”

&nbsp;

Problema: O jogador pensa que perdeu por causa de algo escondido.

&nbsp;

Correção: Preparar visualmente e narrativamente a transformação desde o início. Seção 15\.

&nbsp;

\#\# Risco 7: puzzle final frustrante

&nbsp;

Problema: O jogador não entende a lógica do cubo.

&nbsp;

Correção: A sequência é ensinada pelas pistas anteriores \+ Diário de Theo. Seção 14\.

&nbsp;

\#\# Risco 8: o jogador não percebe que errou

&nbsp;

Problema: Como o erro é oculto, o jogador pode chegar ao Final Ruim sem entender por quê.

&nbsp;

Correção: Na tela de créditos do Final Ruim, mostrar resumo das escolhas com as corretas destacadas. Seção 17.4.

&nbsp;

\#\# Risco 9: o jogo é muito curto para 20 fases

&nbsp;

Problema: Se cada fase tem 1 cena \+ 1 pista \+ 3 escolhas, o jogo todo dura \~40 min.

&nbsp;

Correção: Cada fase deve ter 2–4 min. Jogo completo: 60–90 min. Seções 4.4 e 4.5.

&nbsp;

\#\# Risco 10: o tom fantasia sombria pode afastar o público de investigação

&nbsp;

Problema: Fantasia sombria \+ criança protagonista \+ trolls sem âncora realista vira conto de fadas.

&nbsp;

Correção: Os primeiros 3 minutos devem parecer um desaparecimento real. Seção 4.3.

&nbsp;

\#\# Risco 11: acessibilidade para daltônicos

&nbsp;

Problema: Símbolos do cubo podem depender de cor.

&nbsp;

Correção: Cada símbolo tem forma única (olho, lua, mão, corvo, árvore, rosto). Seção 43.1.

&nbsp;

\---

&nbsp;

\# 52\. RECOMENDAÇÃO PARA O MVP

&nbsp;

Não construir as 20 fases com arte final imediatamente.

&nbsp;

Fazer primeiro um vertical slice:

&nbsp;

\`\`\`text

MENU

↓

FASE 1

↓

FASE 2

↓

FASE 3

↓

FASE 20 simplificada

↓

PUZZLE

↓

FINAL BOM / FINAL RUIM / FINAL SECRETO

\`\`\`

&nbsp;

Objetivo:

&nbsp;

Validar o loop completo.

&nbsp;

Depois produzir as fases 4–19.

&nbsp;

\---

&nbsp;

\# 53\. ORDEM DE PRODUÇÃO

&nbsp;

\#\# Etapa 1 — Game Design

&nbsp;

Produzir:

&nbsp;

\- documento de fases

\- mapa de pistas

\- \*\*documento de justificativa de escolhas (Seção 34)\*\*

\- árvore de escolhas

\- regras de estado

\- puzzle final

&nbsp;

\#\# Etapa 2 — Protótipo

&nbsp;

Produzir:

&nbsp;

\- tela

\- botão

\- escolha

\- estado

\- save

\- final

&nbsp;

\#\# Etapa 3 — Vertical slice

&nbsp;

Produzir 3 fases completas com arte e áudio.

&nbsp;

\#\# Etapa 4 — Teste com jogadores

&nbsp;

Observar sem explicar.

&nbsp;

Anotar:

&nbsp;

\`\`\`text

onde travou

onde perdeu interesse

qual personagem causou desconfiança

qual pista foi esquecida

qual escolha pareceu óbvia

qual escolha pareceu injusta

quando quis continuar

\`\`\`

&nbsp;

\#\# Etapa 5 — Produção das 20 fases

&nbsp;

Só depois da validação.

&nbsp;

\---

&nbsp;

\# 54\. MÉTRICAS DE JOGO

&nbsp;

Se houver analytics em versão futura, monitorar apenas dados necessários e respeitando privacidade.

&nbsp;

Eventos úteis:

&nbsp;

\`\`\`text

game\_started

phase\_started

choice\_selected

phase\_completed

clue\_found

symbol\_found

diary\_opened

puzzle\_started

puzzle\_solved

ending\_secret

ending\_good

ending\_bad

restart\_game

\`\`\`

&nbsp;

Métricas narrativas especialmente importantes:

&nbsp;

\`\`\`text

fase média alcançada

abandono por fase

tempo médio por fase

quantidade de recomeços

quantidade de jogadores que chegam à fase 20

quantidade de jogadores que repetem o jogo

quantidade de jogadores que abrem o diário

\`\`\`

&nbsp;

Não criar analytics antes de a equipe definir o objetivo de cada dado.

&nbsp;

\---

&nbsp;

\# 55\. FLUXO DE PRODUÇÃO PARA O ENGENHEIRO

&nbsp;

\`\`\`text

1\. Inicializar Vite \+ TypeScript \+ Phaser

2\. Criar GameState (com saveVersion)

3\. Criar PhaseLoader e PhaseValidator

4\. Criar StoryScene

5\. Criar ChoiceSystem

6\. Criar SaveManager (com migração)

7\. Criar ClueSystem

8\. Criar SymbolSystem

9\. Criar DiaryScene

10\. Criar TransformationSystem

11\. Criar PuzzleScene

12\. Criar EndingSystem

13\. Criar CreditsScene (com resumo de escolhas)

14\. Criar menu

15\. Integrar áudio

16\. Integrar assets

17\. Criar responsividade

18\. Criar testes

19\. Fazer build

20\. Testar navegadores

21\. Publicar MVP

\`\`\`

&nbsp;

\---

&nbsp;

\# 56\. EXEMPLO DE CHOICE SYSTEM

&nbsp;

\`\`\`ts

export function resolveChoice(

&nbsp;&nbsp;state: GameState,

&nbsp;&nbsp;phase: Phase,

&nbsp;&nbsp;choice: Choice

): GameState {

&nbsp;&nbsp;state.choices\[phase.id\] \= choice.id;

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

&nbsp;&nbsp;&nbsp;&nbsp;state.errors \+= 1;

&nbsp;&nbsp;&nbsp;&nbsp;state.transformationLevel \+= choice.transformationDelta ?? 1;

&nbsp;&nbsp;}

&nbsp;

&nbsp;&nbsp;return state;

}

\`\`\`

&nbsp;

O estado deve possuir fonte única de verdade.

&nbsp;

Não espalhar \`errors++\` em dezenas de cenas.

&nbsp;

\---

&nbsp;

\# 57\. EXEMPLO DE FINAL SYSTEM

&nbsp;

\`\`\`ts

export function calculateEnding(state: GameState): 'good' | 'bad' | 'secret' {

&nbsp;&nbsp;if (state.errors \>= 2\) {

&nbsp;&nbsp;&nbsp;&nbsp;return 'bad';

&nbsp;&nbsp;}

&nbsp;

&nbsp;&nbsp;if (

&nbsp;&nbsp;&nbsp;&nbsp;state.errors \=== 0 &&

&nbsp;&nbsp;&nbsp;&nbsp;state.cube.solved &&

&nbsp;&nbsp;&nbsp;&nbsp;state.symbols.length \=== 5 &&

&nbsp;&nbsp;&nbsp;&nbsp;state.clues.includes('hidden\_truth')

&nbsp;&nbsp;) {

&nbsp;&nbsp;&nbsp;&nbsp;return 'secret';

&nbsp;&nbsp;}

&nbsp;

&nbsp;&nbsp;return 'good';

}

\`\`\`

&nbsp;

\---

&nbsp;

\# 58\. EXEMPLO DE TRANSFORMAÇÃO

&nbsp;

\`\`\`ts

function updateTransformation(state: GameState) {

&nbsp;&nbsp;if (state.errors \>= 1\) {

&nbsp;&nbsp;&nbsp;&nbsp;state.transformationLevel \= Math.min(

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;state.transformationLevel \+ 1,

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;5

&nbsp;&nbsp;&nbsp;&nbsp;);

&nbsp;&nbsp;}

}

\`\`\`

&nbsp;

A lógica narrativa deve ser independente da animação visual.

&nbsp;

\---

&nbsp;

\# 59\. ESTRUTURA DA FASE 20 NO CÓDIGO

&nbsp;

\`\`\`text

PuzzleScene

&nbsp;&nbsp;&nbsp;↓

CubeController

&nbsp;&nbsp;&nbsp;↓

CubeState

&nbsp;&nbsp;&nbsp;↓

isSolved()

&nbsp;&nbsp;&nbsp;↓

unlockHiddenFace()

&nbsp;&nbsp;&nbsp;↓

showTheoSymbol()

&nbsp;&nbsp;&nbsp;↓

openCave()

&nbsp;&nbsp;&nbsp;↓

EndingScene

&nbsp;&nbsp;&nbsp;↓

CreditsScene (com resumo de escolhas)

\`\`\`

&nbsp;

\---

&nbsp;

\# 60\. O QUE UMA PESSOA SÊNIOR DEVE ANALISAR ANTES DO DESENVOLVIMENTO

&nbsp;

\#\# 60.1 Narrativa

&nbsp;

\- O protagonista é convincente?

\- Os pais possuem personalidade própria?

\- Silas é previsível?

\- Os trolls possuem funções narrativas diferentes?

\- A revelação final é preparada?

\- O documento de justificativa de escolhas (Seção 34\) está completo?

&nbsp;

\#\# 60.2 Game design

&nbsp;

\- Cada escolha possui justificativa?

\- O erro é compreensível no replay?

\- O jogador sente progresso?

\- Existe variedade suficiente entre fases?

\- O puzzle final é justo?

\- A curva emocional tem respiros?

&nbsp;

\#\# 60.3 Tecnologia

&nbsp;

\- O estado está centralizado?

\- O conteúdo está separado do código?

\- Save funciona offline?

\- Save tem migração?

\- Os assets estão otimizados?

\- Existe fallback de renderer?

\- Existe tratamento de erro?

&nbsp;

\#\# 60.4 UX

&nbsp;

\- O jogador sabe o que fazer?

\- Os botões são claros?

\- O texto é legível?

\- Há feedback após cada ação?

\- O loading é perceptível?

\- O diário é acessível?

&nbsp;

\#\# 60.5 Performance

&nbsp;

\- Qual o tamanho do bundle?

\- Qual o tamanho dos assets?

\- Quanto RAM o jogo usa?

\- Existem vazamentos entre cenas?

\- O áudio é descarregado quando necessário?

&nbsp;

\---

&nbsp;

\# 61\. DECISÕES QUE NÃO DEVEM SER TOMADAS CEDO DEMAIS

&nbsp;

Não fechar antes de prototipar:

&nbsp;

\- arte definitiva

\- quantidade final de efeitos

\- duração exata de cada fase

\- quantidade definitiva de finais

\- backend

\- login

\- ranking online

\- multiplayer

&nbsp;

O primeiro objetivo é validar \*\*história \+ escolhas \+ pistas \+ estado \+ final\*\*.

&nbsp;

\---

&nbsp;

\# 62\. DEFINIÇÃO DE PRONTO DO MVP

&nbsp;

O MVP está pronto quando:

&nbsp;

\`\`\`text

\[ \] Menu funcionando

\[ \] Novo jogo funcionando

\[ \] Continuar funcionando

\[ \] Diário funcionando

\[ \] 3 fases completamente jogáveis

\[ \] Sistema de erro funcionando

\[ \] Sistema de pistas funcionando

\[ \] Sistema de símbolos funcionando

\[ \] Save funcionando

\[ \] Migração de save funcionando

\[ \] Fase 20 funcional

\[ \] Cubo solucionável

\[ \] Final secreto funcional

\[ \] Final bom funcional

\[ \] Final ruim funcional

\[ \] Tela de créditos com resumo de escolhas

\[ \] Transformação funcional

\[ \] Build de produção funcionando

\[ \] Teste Chrome

\[ \] Teste Edge

\[ \] Teste Firefox

\[ \] Teste em PC fraco

\[ \] Sem erros críticos no console

\`\`\`

&nbsp;

\---

&nbsp;

\# 63\. MELHORIA FUTURA: SEGUNDA TEMPORADA

&nbsp;

O Final Secreto (Seção 17.1) já abre a porta para uma segunda temporada.

&nbsp;

A pergunta final:

&nbsp;

\> “E se seus pais não tiverem sido as primeiras vítimas?”

&nbsp;

A parede com dezenas de desenhos sugere que outras crianças passaram pelo mesmo caminho. Isso pode ser explorado em uma continuação.

&nbsp;

\---

&nbsp;

\# 64\. CONCLUSÃO E RECOMENDAÇÃO SÊNIOR

&nbsp;

A ideia tem potencial de funcionar muito bem como narrativa interativa se o foco for colocado em \*\*mistério, memória, consequência e descoberta\*\*, e não apenas em dificuldade.

&nbsp;

A parte mais arriscada do projeto é o sistema “qualquer erro gera final ruim”. Ele pode ser excelente para replay, mas também pode causar sensação de injustiça. A v2.0 corrige isso com:

&nbsp;

\- margem de 1 erro para o Final Bom

\- Final Secreto para perfeição

\- documento de justificativa de escolhas (Seção 34\)

\- resumo de escolhas na tela de créditos do Final Ruim

&nbsp;

A segunda área que merece atenção é o puzzle do Cubo de Orun. Ele precisa parecer misterioso durante a campanha, mas solucionável para quem observou as pistas. A v2.0 corrige isso com:

&nbsp;

\- ordem dos símbolos \= ordem das fases

\- Diário de Theo

\- frase da parede funcional

&nbsp;

A terceira área é o ritmo. A v2.0 introduz fases de respiro (4, 6, 8, 10\) e redistribui a curva emocional.

&nbsp;

A estrutura proposta é deliberadamente modular para que um roteirista possa mudar textos e escolhas sem reescrever a lógica do jogo e para que o engenheiro consiga testar cada sistema separadamente.

&nbsp;

\---

&nbsp;

\# 65\. REFERÊNCIAS TÉCNICAS

&nbsp;

\- Phaser Docs: https://docs.phaser.io/

\- Phaser 4 WebGL / API: https://docs.phaser.io/api-documentation/4.0.0/class/renderer-webgl-webglrenderer

\- Vite Guide: https://vite.dev/guide/

\- Vite Build: https://vite.dev/guide/build

\- MDN IndexedDB: https://developer.mozilla.org/pt-BR/docs/Web/API/IndexedDB\_API

&nbsp;

As recomendações técnicas deste documento foram conferidas nas documentações oficiais consultadas em setembro de 2026\. O Phaser disponibiliza renderização WebGL e Canvas e suporte a JavaScript/TypeScript; a configuração \`AUTO\` permite seleção automática de renderer; Vite produz bundle de produção para hospedagem estática; e IndexedDB é uma API de armazenamento estruturado no navegador.

&nbsp;

\---

&nbsp;

\# 66\. CHECKLIST FINAL PARA A REUNIÃO COM A PESSOA SÊNIOR

&nbsp;

\`\`\`text

\[ \] O conceito central está claro?

\[ \] A história é original o suficiente?

\[ \] As 20 fases possuem progressão?

\[ \] O jogador entende a missão?

\[ \] As escolhas parecem plausíveis?

\[ \] O sistema de erro é justo?

\[ \] O documento de justificativa de escolhas (Seção 34\) está completo?

\[ \] As pistas antigas voltam a ter significado?

\[ \] Silas funciona como antagonista?

\[ \] Os trolls têm funções diferentes?

\[ \] A transformação foi preparada (visual e narrativamente)?

\[ \] O Cubo de Orun é solucionável?

\[ \] O Diário de Theo está implementado?

\[ \] A fase 20 é forte o suficiente?

\[ \] O final secreto é satisfatório?

\[ \] O final bom é satisfatório?

\[ \] O final ruim gera vontade de rejogar?

\[ \] A tela de créditos do Final Ruim mostra o resumo das escolhas?

\[ \] A curva emocional tem respiros?

\[ \] O jogo funciona em máquina fraca?

\[ \] O código está modular?

\[ \] Os textos estão separados do código?

\[ \] Existe save confiável com migração?

\[ \] A equipe consegue produzir o projeto com o orçamento e prazo previstos?

\[ \] O MVP está claramente definido?

\[ \] O que deve ser removido antes de começar?

\`\`\`

&nbsp;

\---

&nbsp;

\#\# APÊNDICE A — PRINCÍPIO DE DESIGN EM UMA FRASE

&nbsp;

\> \*\*O jogador deve acreditar que está descobrindo o desaparecimento dos pais, até perceber que também estava sendo investigado pelos trolls.\*\*

&nbsp;

\#\# APÊNDICE B — PRINCÍPIO DE PRODUÇÃO EM UMA FRASE

&nbsp;

\> \*\*Primeiro validar o loop, depois produzir as 20 fases.\*\*

&nbsp;

\#\# APÊNDICE C — PRINCÍPIO DO FINAL

&nbsp;

\> \*\*A melhor revelação da fase 20 é aquela que faz o jogador lembrar das primeiras fases.\*\*

&nbsp;

\#\# APÊNDICE D — PRINCÍPIO DA JUSTIÇA

&nbsp;

\> \*\*Toda escolha correta deve ter uma pista observável. Se não tem, a escolha está errada — não o jogador.\*\*

&nbsp;

\#\# APÊNDICE E — PRINCÍPIO DO RESPIRO

&nbsp;

\> \*\*Entre dois picos de tensão, deve haver silêncio. Sem silêncio, não há tensão.\*\*

&nbsp;