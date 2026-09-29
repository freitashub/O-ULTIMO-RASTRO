extends Node
## Visualizador de personagem para QA (precisa de render): captura frente, 3/4, perfil e costas.
## Uso: xvfb-run -a godot --path godot --rendering-driver opengl3 --resolution 720x960 res://tests/char_view.tscn -- --id=theo --out=/tmp/cv
## `--pose=walk` aplica um quadro de caminhada nos ossos (verifica a deformação).

var out_dir := "/tmp/ur_char"
var id := "theo"
var pose := "rest"


func _ready() -> void:
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--out="): out_dir = a.substr(6)
		elif a.begins_with("--id="): id = a.substr(5)
		elif a.begins_with("--pose="): pose = a.substr(7)
	DirAccess.make_dir_recursive_absolute(out_dir)
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color(0.16, 0.17, 0.2)
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color(0.55, 0.57, 0.65)
	env.ambient_light_energy = 0.7
	var we := WorldEnvironment.new()
	we.environment = env
	add_child(we)
	var key := DirectionalLight3D.new()
	key.rotation_degrees = Vector3(-30, -25, 0)
	key.light_energy = 1.0
	add_child(key)
	var fill := DirectionalLight3D.new()
	fill.rotation_degrees = Vector3(-10, 150, 0)
	fill.light_energy = 0.35
	add_child(fill)
	var vp := SubViewport.new()
	vp.size = Vector2i(720, 960)
	vp.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	vp.msaa_3d = Viewport.MSAA_4X
	add_child(vp)
	for n in [we, key, fill]:
		remove_child(n)
		vp.add_child(n)
	var pivot := Node3D.new()
	vp.add_child(pivot)
	var path := "res://assets/characters/%s/%s.glb" % [id, id]
	var scene: Node3D = (load(path) as PackedScene).instantiate()
	pivot.add_child(scene)
	CharacterMaterial.apply(scene)
	var sk := _skeleton(scene)
	if pose == "walk" and sk:
		_walk_pose(sk)
	await get_tree().process_frame
	var aabb := _aabb(scene)
	var h := maxf(aabb.size.y, 0.5)
	var cam := Camera3D.new()
	cam.fov = 28
	vp.add_child(cam)
	cam.current = true
	cam.global_position = Vector3(0, aabb.position.y + h * 0.52, h * 1.95 + 0.4)
	cam.look_at(Vector3(0, aabb.position.y + h * 0.5, 0))
	for view in [["front", 0.0], ["three_quarter", 38.0], ["side", 90.0], ["back", 180.0]]:
		pivot.rotation_degrees.y = view[1]
		for i in 4:
			await get_tree().process_frame
		var img := vp.get_texture().get_image()
		img.save_png("%s/%s_%s_%s.png" % [out_dir, id, pose, view[0]])
	print("char_view ", id, " aabb ", aabb.size, " bones ", sk.get_bone_count() if sk else -1)
	get_tree().quit(0)


func _skeleton(n: Node) -> Skeleton3D:
	if n is Skeleton3D:
		return n
	for c in n.get_children():
		var r := _skeleton(c)
		if r:
			return r
	return null


func _aabb(n: Node) -> AABB:
	var box := AABB()
	var first := true
	for m in CharacterMaterial._meshes(n):
		var b := m.global_transform * m.get_aabb()
		box = b if first else box.merge(b)
		first = false
	return box


func _rot(sk: Skeleton3D, bone: String, x: float, y: float = 0.0, z: float = 0.0) -> void:
	var i := sk.find_bone(bone)
	if i >= 0:
		sk.set_bone_pose_rotation(i, Quaternion.from_euler(Vector3(x, y, z)))


func _walk_pose(sk: Skeleton3D) -> void:
	_rot(sk, "thigh_L", -0.55)
	_rot(sk, "shin_L", 0.2)
	_rot(sk, "thigh_R", 0.5)
	_rot(sk, "shin_R", 0.85)
	_rot(sk, "upperarm_L", 0.5)
	_rot(sk, "forearm_L", -0.35)
	_rot(sk, "upperarm_R", -0.5)
	_rot(sk, "forearm_R", -0.6)
	_rot(sk, "spine", 0.05, -0.08)
