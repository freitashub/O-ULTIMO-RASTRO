class_name Quality
extends RefCounted
## Perfis de qualidade (0 baixa · 1 média · 2 alta). Compatibility renderer: luzes/sombras dinâmicas são o custo principal.

static var level := 1


static func shadows_enabled() -> bool:
	return level >= 1


static func max_shadow_lights() -> int:
	return 2 if level >= 2 else (1 if level == 1 else 0)


static func fill_lights_enabled() -> bool:
	return level >= 1


static func shadow_atlas_size() -> int:
	return 4096 if level >= 2 else 2048
