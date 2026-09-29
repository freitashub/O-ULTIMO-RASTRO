class_name TheoPlaceholderRig
extends Node3D
## PLACEHOLDER (registrado em docs/PLACEHOLDERS.md): corpo do Theo v3 gerado por script (glTF com 19 ossos),
## animado proceduralmente. Será substituído pelo modelo 3D real quando for fornecido; nenhuma lógica de jogo depende daqui.
##
## Convenção: o modelo glTF olha para +Z; este nó gira 180° para que a frente do jogador seja -Z (convenção Godot).

signal footstep

const MODEL_PATH := "res://assets/characters/placeholder/theo_v3_placeholder.glb"

var skeleton: Skeleton3D
var loaded := false
var _bones: Dictionary = {}
var _phase := 0.0
var _speed := 0.0  # 0..1 normalizado
var _sprint := false
var _t := 0.0
var _interact := 0.0
var _last_sign := 1


func _ready() -> void:
	var model_root := Node3D.new()
	model_root.name = "Model"
	model_root.rotation.y = PI
	add_child(model_root)
	if ResourceLoader.exists(MODEL_PATH):
		var packed: PackedScene = load(MODEL_PATH)
		var inst := packed.instantiate()
		model_root.add_child(inst)
		skeleton = _find_skeleton(inst)
	if skeleton != null:
		for n in ["hips", "spine", "chest", "neck", "head", "nose", "thigh_L", "thigh_R", "shin_L", "shin_R", "foot_L", "foot_R",
				"upperarm_L", "upperarm_R", "forearm_L", "forearm_R"]:
			var i := skeleton.find_bone(n)
			if i >= 0:
				_bones[n] = i
		loaded = _bones.has("thigh_L") and _bones.has("upperarm_L")
	if not loaded:
		var m := MeshInstance3D.new()
		var cap := CapsuleMesh.new()
		cap.radius = 0.22
		cap.height = 1.4
		m.mesh = cap
		m.position.y = 0.7
		model_root.add_child(m)


func set_locomotion(speed_norm: float, running: bool) -> void:
	_speed = clampf(speed_norm, 0.0, 1.0)
	_sprint = running


func play_interact() -> void:
	_interact = 1.0


func _process(dt: float) -> void:
	_t += dt
	_interact = maxf(0.0, _interact - dt / 0.9)
	if not loaded:
		return
	var k := _speed
	_phase += dt * (5.2 + 3.6 * k) * (1.0 if k > 0.05 else 0.0)
	var s := sin(_phase)
	var c := cos(_phase)
	# pernas: coxas alternadas, joelho dobra na fase de balanço, pé compensa
	_rot("thigh_L", -s * 0.52 * k)
	_rot("thigh_R", s * 0.52 * k)
	_rot("shin_L", (0.08 + 0.95 * maxf(0.0, c)) * 0.7 * k)
	_rot("shin_R", (0.08 + 0.95 * maxf(0.0, -c)) * 0.7 * k)
	_rot("foot_L", s * 0.2 * k)
	_rot("foot_R", -s * 0.2 * k)
	# braços opostos às pernas, cotovelo dobra
	var reach := 0.0
	_rot("upperarm_L", s * 0.5 * k)
	_rot("upperarm_R", -s * 0.5 * k - _interact * 1.1 * sin(_interact * PI * 0.5 + 0.4))
	_rot("forearm_L", -(0.15 + 0.3 * maxf(0.0, -s)) * k - 0.05)
	_rot("forearm_R", -(0.15 + 0.3 * maxf(0.0, s)) * k - 0.05 - _interact * 0.5)
	# tronco e cabeça
	_rot("hips", 0.0, sin(_phase) * 0.06 * k, 0.0)
	_rot("spine", 0.04 * k + _interact * 0.15, -sin(_phase) * 0.05 * k, 0.0)
	_rot("head", -0.03 * k, sin(_t * 0.4) * 0.12 * (1.0 - k), 0.0)
	# respiração/ociosidade
	var breath := sin(_t * 1.6) * 0.012 * (1.0 - k)
	_rot("chest", breath)
	var sign_now := 1 if s >= 0.0 else -1
	if sign_now != _last_sign and k > 0.3:
		footstep.emit()
	_last_sign = sign_now
	reach = 0.0


func _rot(bone: String, x: float, y: float = 0.0, z: float = 0.0) -> void:
	if not _bones.has(bone):
		return
	skeleton.set_bone_pose_rotation(_bones[bone], Quaternion.from_euler(Vector3(x, y, z)))


func bone_pose_x(bone: String) -> float:
	if not _bones.has(bone):
		return 0.0
	return skeleton.get_bone_pose_rotation(_bones[bone]).get_euler().x


func nose_global_position() -> Vector3:
	## O importador da Godot transforma o marcador "nose" do GLB em osso.
	if loaded and _bones.has("nose"):
		return skeleton.global_transform * skeleton.get_bone_global_pose(_bones["nose"]).origin
	return head_global_position()


func head_global_position() -> Vector3:
	if loaded:
		return skeleton.global_transform * skeleton.get_bone_global_pose(_bones["head"]).origin
	return global_position + Vector3(0, 1.3, 0)


func _find_skeleton(n: Node) -> Skeleton3D:
	if n is Skeleton3D:
		return n
	for c in n.get_children():
		var r := _find_skeleton(c)
		if r:
			return r
	return null
