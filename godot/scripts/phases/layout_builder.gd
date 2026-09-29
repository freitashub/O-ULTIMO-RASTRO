class_name LayoutBuilder
extends RefCounted
## Constrói o mundo a partir do layout JSON (godot/data/layouts/*.json, gerado por tools/godot/build-layout-*.mjs):
## caixas com colisão, decalques, portas, luzes, ambiente, interativos e planos de câmera. Blockout → arte depois.

static var _grain: ImageTexture


static func build(layout: Dictionary, parent: Node3D) -> Dictionary:
	var world := Node3D.new()
	world.name = "World"
	parent.add_child(world)
	var refs := {"world": world, "doors": {}, "interactables": {}, "lights": {}, "meshes": {}}
	var mats: Dictionary = {}
	for b in layout["boxes"]:
		_add_box(world, b, mats, refs)
	for d in layout.get("decals", []):
		_add_decal(world, d)
	for d in layout.get("doors", []):
		var door := DoorNode.create(d, _material("wood", _c(d.get("color", [0.16, 0.12, 0.09])), mats))
		world.add_child(door)
		refs["doors"][d["id"]] = door
	_add_environment(world, layout.get("environment", {}))
	_add_lights(world, layout.get("lights", []), refs)
	for it in layout.get("interactables", []):
		var node := Interactable.new()
		node.name = "Interact_%s" % it["id"]
		node.id = it["id"]
		node.kind = it["kind"]
		node.label = it["label"]
		node.radius = float(it.get("radius", 1.4))
		node.height = float(it.get("height", 1.0))
		node.enabled = it.get("enabled", true)
		node.data = it.get("on_interact", {}).duplicate()
		if it.has("door"):
			node.data["door"] = it["door"]
		world.add_child(node)
		var p: Array = it["pos"]
		node.position = Vector3(p[0], p[1], p[2])
		refs["interactables"][it["id"]] = node
	return refs


static func _c(a: Array) -> Color:
	return Color(a[0], a[1], a[2])


static func grain() -> ImageTexture:
	if _grain != null:
		return _grain
	var size := 128
	var img := Image.create(size, size, false, Image.FORMAT_RGB8)
	for y in size:
		for x in size:
			var v := 0.0
			var amp := 0.5
			var f := 8.0
			for o in 3:
				v += _vnoise(x / float(size) * f, y / float(size) * f, int(f)) * amp
				amp *= 0.5
				f *= 2.0
			var g := clampf(0.80 + (v - 0.55) * 0.42, 0.0, 1.0)
			img.set_pixel(x, y, Color(g, g, g))
	_grain = ImageTexture.create_from_image(img)
	return _grain


static func _hash(x: int, y: int) -> float:
	var h := (x * 374761393 + y * 668265263) & 0x7fffffff
	h = ((h ^ (h >> 13)) * 1274126177) & 0x7fffffff
	return float(h & 0xffff) / 65535.0


static func _vnoise(x: float, y: float, period: int) -> float:
	var xi := int(floor(x))
	var yi := int(floor(y))
	var fx := x - xi
	var fy := y - yi
	fx = fx * fx * (3.0 - 2.0 * fx)
	fy = fy * fy * (3.0 - 2.0 * fy)
	var p := maxi(period, 1)
	var a := _hash(posmod(xi, p), posmod(yi, p))
	var b := _hash(posmod(xi + 1, p), posmod(yi, p))
	var c := _hash(posmod(xi, p), posmod(yi + 1, p))
	var d := _hash(posmod(xi + 1, p), posmod(yi + 1, p))
	return lerpf(lerpf(a, b, fx), lerpf(c, d, fx), fy)


static func _material(kind: String, color: Color, cache: Dictionary) -> StandardMaterial3D:
	var key := "%s_%s" % [kind, color.to_html()]
	if cache.has(key):
		return cache[key]
	var m := StandardMaterial3D.new()
	m.albedo_color = color
	m.albedo_texture = grain()
	m.uv1_triplanar = true
	m.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	match kind:
		"wood", "floor":
			m.roughness = 0.75
			m.uv1_scale = Vector3(0.7, 2.2, 0.7)
		"metal":
			m.roughness = 0.45
			m.metallic = 0.35
			m.uv1_scale = Vector3(1.5, 1.5, 1.5)
		"fabric":
			m.roughness = 0.95
			m.uv1_scale = Vector3(2.5, 2.5, 2.5)
		"concrete":
			m.roughness = 0.92
			m.uv1_scale = Vector3(0.45, 0.45, 0.45)
		_:
			m.roughness = 0.9
			m.uv1_scale = Vector3(0.6, 0.6, 0.6)
	cache[key] = m
	return m


static func _add_box(world: Node3D, b: Dictionary, mats: Dictionary, refs: Dictionary) -> void:
	var p: Array = b["pos"]
	var s: Array = b["size"]
	var body := StaticBody3D.new()
	body.name = String(b["id"])
	body.collision_layer = 1
	body.position = Vector3(p[0], p[1], p[2])
	body.rotation.y = float(b.get("rot_y", 0.0))
	world.add_child(body)
	var mesh := MeshInstance3D.new()
	var bm := BoxMesh.new()
	bm.size = Vector3(s[0], s[1], s[2])
	mesh.mesh = bm
	mesh.material_override = _material(String(b.get("mat", "plaster")), _c(b["color"]), mats)
	body.add_child(mesh)
	refs["meshes"][b["id"]] = mesh
	if b.get("collider", true):
		var cs := CollisionShape3D.new()
		var bs := BoxShape3D.new()
		bs.size = bm.size
		cs.shape = bs
		body.add_child(cs)
	else:
		body.collision_layer = 0


static var _decal_cache: Dictionary = {}


## Máscara de alfa suave: trilhos de pneu (duas faixas com sulcos) ou mancha orgânica.
static func _decal_texture(tracks: bool) -> ImageTexture:
	if _decal_cache.has(tracks):
		return _decal_cache[tracks]
	var w := 128
	var h := 256
	var img := Image.create(w, h, false, Image.FORMAT_LA8)
	for y in h:
		for x in w:
			var u := x / float(w - 1)
			var v := y / float(h - 1)
			var a := 0.0
			var n := _vnoise(u * 9.0, v * 14.0, 9)
			if tracks:
				var band := 0.0
				for c in [0.28, 0.72]:
					band = maxf(band, 1.0 - smoothstep(0.05, 0.11, absf(u - c) + (n - 0.5) * 0.05))
				var treads := 0.72 + 0.28 * sin(v * 130.0 + n * 4.0)
				var ends := smoothstep(0.0, 0.14, v) * (1.0 - smoothstep(0.82, 1.0, v))
				a = band * treads * ends * (0.75 + 0.25 * n)
			else:
				var d := Vector2((u - 0.5) * 2.0, (v - 0.5) * 2.0).length() + (n - 0.5) * 0.45
				a = 1.0 - smoothstep(0.35, 0.95, d)
			img.set_pixel(x, y, Color(1, 1, 1, a))
	var t := ImageTexture.create_from_image(img)
	_decal_cache[tracks] = t
	return t


static func _add_decal(world: Node3D, d: Dictionary) -> void:
	var mesh := MeshInstance3D.new()
	var q := QuadMesh.new()
	q.size = Vector2(d["size"][0], d["size"][1])
	mesh.mesh = q
	var m := StandardMaterial3D.new()
	var col := _c(d["color"])
	col.a = float(d["alpha"])
	m.albedo_color = col
	m.albedo_texture = _decal_texture(String(d["id"]).begins_with("tire"))
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.roughness = 0.12 if d.get("shine", false) else 0.6
	m.metallic_specular = 0.9 if d.get("shine", false) else 0.3
	m.cull_mode = BaseMaterial3D.CULL_DISABLED
	m.render_priority = 1
	mesh.material_override = m
	mesh.name = String(d["id"])
	mesh.rotation = Vector3(-PI / 2.0, float(d.get("rot_y", 0.0)), 0)
	var p: Array = d["pos"]
	mesh.position = Vector3(p[0], p[1] + 0.004, p[2])
	mesh.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	world.add_child(mesh)


static func _add_environment(world: Node3D, e: Dictionary) -> void:
	var we := WorldEnvironment.new()
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color(0.02, 0.025, 0.035)
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	var amb: Array = e.get("ambient", [0.2, 0.22, 0.3])
	env.ambient_light_color = Color(amb[0], amb[1], amb[2])
	env.ambient_light_energy = float(e.get("ambient_energy", 0.8))
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	env.tonemap_exposure = 1.0
	if e.has("fog_density"):
		env.fog_enabled = true
		env.fog_density = float(e["fog_density"])
		var fc: Array = e.get("fog_color", [0.07, 0.08, 0.11])
		env.fog_light_color = Color(fc[0], fc[1], fc[2])
	we.environment = env
	world.add_child(we)


static func _add_lights(world: Node3D, list: Array, refs: Dictionary) -> void:
	var shadow_budget := Quality.max_shadow_lights()
	for l in list:
		if l["id"].ends_with("_fill") and not Quality.fill_lights_enabled():
			continue
		var light: Light3D
		if l["kind"] == "spot":
			var sp := SpotLight3D.new()
			sp.spot_angle = float(l.get("angle", 70.0))
			sp.spot_range = float(l.get("range", 10.0))
			sp.rotation_degrees = Vector3(-90, 0, 0)
			light = sp
		else:
			var om := OmniLight3D.new()
			om.omni_range = float(l.get("range", 8.0))
			light = om
		light.name = String(l["id"])
		var c := _c(l["color"])
		light.light_color = c
		light.light_energy = float(l.get("energy", 1.0))
		var p: Array = l["pos"]
		light.position = Vector3(p[0], p[1], p[2])
		if l.get("shadow", false) and Quality.shadows_enabled() and shadow_budget > 0:
			light.shadow_enabled = true
			light.shadow_bias = 0.05
			shadow_budget -= 1
		world.add_child(light)
		refs["lights"][l["id"]] = light
