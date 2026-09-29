class_name Transformation
extends RefCounted
## Port de src/game/TransformationSystem.ts: quando a transformação de Theo é visível e qual variante do modelo usar.
## Progressão sutil e por fase: 7 marca no braço · 11 olhos · 14 sombra · 17 respiração · 20 sexto símbolo.


static func effect_visible(phase_id: int, level: int) -> bool:
	if level <= 0:
		return false
	return (phase_id >= 7 and level >= 1) or (phase_id >= 11 and level >= 2) or (phase_id >= 14 and level >= 3) \
		or (phase_id >= 17 and level >= 4) or (phase_id >= 20 and level >= 5)


## id do modelo do Theo: theo (normal) → theo_t1…theo_t4 (transformacao_theo_01..04). Nunca antes da fase 7.
static func theo_variant(phase_id: int, level: int) -> String:
	var stage := 0
	if phase_id >= 7 and level >= 1:
		stage = 1
	if phase_id >= 11 and level >= 2:
		stage = 2
	if phase_id >= 14 and level >= 3:
		stage = 3
	if phase_id >= 17 and level >= 4:
		stage = 4
	return "theo" if stage == 0 else "theo_t%d" % stage
