extends TestCase
## Núcleo: estado, escolhas, pistas, save/migração, dados, i18n.

func _phase1() -> Dictionary:
	return Data.phase(1)


func _choice(phase: Dictionary, id: String) -> Dictionary:
	for c in phase["choices"]:
		if c["id"] == id:
			return c
	return {}


func test_dados_20_fases_e_pistas() -> void:
	check_eq(Data.phases.size(), 20, "20 fases carregadas")
	check_eq(Data.clues.size(), 21, "21 pistas carregadas")
	for p in Data.phases:
		check_eq(p["choices"].size(), 3, "fase %d tem 3 escolhas" % int(p["id"]))


func test_estado_inicial_schema_v3() -> void:
	var s := GameStateModel.create_initial()
	check_eq(s["saveVersion"], 3, "versão do save")
	check_eq(s["currentPhase"], 1, "fase inicial")
	check_eq(s["trustPolice"], 50, "confiança da polícia")
	for k in ["errors", "choices", "clues", "symbols", "discoveredCharacters", "transformationLevel", "cube", "ending", "flags", "unlockedEndings", "language", "audioSettings", "subtitleSettings", "accessibilitySettings"]:
		check(s.has(k), "campo %s presente" % k)


func test_escolha_correta_fase1() -> void:
	var s := GameStateModel.create_initial()
	var phase := _phase1()
	var r := ChoiceSystem.resolve(phase, _choice(phase, "b"), s)
	check(r["correct"], "garagem é a escolha correta")
	check("tire_mark" in s["clues"], "pista tire_mark registrada")
	check(s["flags"].get("clue_tire_mark", false), "flag clue_tire_mark")
	check(s["flags"].get("phase_1_correct", false), "flag phase_1_correct")
	check_eq(s["choices"]["1"], "b", "escolha registrada")
	check_eq(s["errors"], 0, "sem erros")
	check_eq(s["transformationLevel"], 0, "sem transformação")


func test_escolhas_erradas_fase1() -> void:
	for cid in ["a", "c"]:
		var s := GameStateModel.create_initial()
		var phase := _phase1()
		var r := ChoiceSystem.resolve(phase, _choice(phase, cid), s)
		check(not r["correct"], "%s é errada" % cid)
		check_eq(s["errors"], 1, "erro registrado (%s)" % cid)
		check_eq(s["transformationLevel"], 1, "transformação +1 como no Phaser (%s)" % cid)
		check(s["flags"].get("phase_1_wrong", false), "flag phase_1_wrong (%s)" % cid)
		check(s["clues"].is_empty(), "nenhuma pista (%s)" % cid)


func test_transformacao_limitada_a_5() -> void:
	var s := GameStateModel.create_initial()
	s["transformationLevel"] = 5
	var phase := _phase1()
	ChoiceSystem.resolve(phase, _choice(phase, "a"), s)
	check_eq(s["transformationLevel"], 5, "teto 5")


func test_pista_duplicada_nao_repete() -> void:
	var s := GameStateModel.create_initial()
	check(GameStateModel.add_clue(s, "tire_mark"), "primeira vez é nova")
	check(not GameStateModel.add_clue(s, "tire_mark"), "segunda não")
	check_eq(s["clues"].size(), 1, "uma entrada")


func test_confianca_da_policia_limitada() -> void:
	var s := GameStateModel.create_initial()
	GameStateModel.change_police_trust(s, 500)
	check_eq(s["trustPolice"], 100, "teto 100")
	GameStateModel.change_police_trust(s, -500)
	check_eq(s["trustPolice"], 0, "piso 0")


func test_save_roundtrip_e_migracao() -> void:
	var s := GameStateModel.create_initial()
	ChoiceSystem.resolve(_phase1(), _choice(_phase1(), "b"), s)
	var back := SaveCodec.decode(SaveCodec.encode(s))
	check_eq(back["clues"], ["tire_mark"], "pistas sobrevivem ao save")
	check_eq(back["choices"]["1"], "b", "escolhas sobrevivem")
	check(SaveCodec.decode("lixo").is_empty(), "texto inválido → vazio")
	var old := {"saveVersion": 1, "currentPhase": 4, "choices": {}, "clues": ["x"], "symbols": ["olho"], "ending": "good"}
	var mig := SaveCodec.decode(JSON.stringify(old))
	check_eq(mig["saveVersion"], 3, "v1 migra para v3")
	check_eq(mig["cube"]["diarySymbols"], ["olho"], "símbolos vão para o diário")
	check_eq(mig["unlockedEndings"], ["good"], "final desbloqueado migrado")


func test_save_em_disco() -> void:
	SaveSystem.path_override = "user://test_save.json"
	SaveSystem.delete_save()
	check(not SaveSystem.has_save(), "sem save no início")
	GameState.reset()
	GameState.add_clue("tire_mark")
	GameState.set_current_phase(2)
	check(SaveSystem.save_game(), "gravou")
	GameState.reset()
	check(SaveSystem.continue_game(), "carregou")
	check_eq(GameState.state["currentPhase"], 2, "fase restaurada")
	check(GameState.has_clue("tire_mark"), "pista restaurada")
	SaveSystem.delete_save()
	SaveSystem.path_override = ""
	GameState.reset()


func test_i18n() -> void:
	GameState.reset()
	check_eq(I18n.t("menu.newGame"), "NOVO JOGO", "pt-BR")
	GameState.state["language"] = "en-US"
	check(I18n.t("menu.newGame") != "NOVO JOGO", "en-US traduzido")
	check_eq(I18n.t("chave.inexistente"), "chave.inexistente", "chave ausente devolve a chave")
	GameState.reset()
