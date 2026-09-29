class_name CharacterRig
extends Node3D
## Visual de personagem: GLB (esqueleto de 19 ossos + marcador `nose`) + material de projeção da arte + contorno,
## animado por AnimationPlayer/AnimationTree (biblioteca humanoide compartilhada: idle, walk, run, talk, interact).
##
## Convenção: o glTF olha para +Z; este nó gira o modelo 180° para que a frente do personagem seja −Z (convenção Godot).
## O contrato de uso pelo jogo é `set_locomotion`, `play_interact`, `set_talking`, sinal `footstep`, `head_global_position`.

signal footstep

const LIBRARY: AnimationLibrary = preload("res://assets/animations/humanoid_library.res")
const WALK_BLEND := 0.54  # velocidade de caminhada / velocidade de corrida (1,9 / 3,5)

var character_id := ""
var skeleton: Skeleton3D
var loaded := false
var player: AnimationPlayer
var tree: AnimationTree
var _model_root: Node3D
var _bones: Dictionary = {}
var _last_sign := 1
var _speed := 0.0


func _ready() -> void:
	if character_id != "":
		set_character(character_id)


## Troca o modelo (ex.: variantes de transformação do Theo). Mantém o estado de animação em locomoção.
func set_character(id: String) -> void:
	character_id = id
	_clear()
	_model_root = Node3D.new()
	_model_root.name = "Model"
	_model_root.rotation.y = PI
	add_child(_model_root)
	var path := "res://assets/characters/%s/%s.glb" % [id, id]
	if not ResourceLoader.exists(path):
		push_error("CharacterRig: modelo ausente %s" % path)
		_fallback()
		return
	var inst: Node3D = (load(path) as PackedScene).instantiate()
	_model_root.add_child(inst)
	CharacterMaterial.apply(inst)
	skeleton = _find_skeleton(inst)
	if skeleton == null:
		_fallback()
		return
	for n in ["hips", "spine", "chest", "neck", "head", "nose", "thigh_L", "thigh_R", "shin_L", "shin_R", "foot_L", "foot_R", "upperarm_L", "upperarm_R", "forearm_L", "forearm_R"]:
		var i := skeleton.find_bone(n)
		if i >= 0:
			_bones[n] = i
	loaded = _bones.has("thigh_L") and _bones.has("upperarm_L") and _bones.has("head")
	if loaded:
		_build_animation(skeleton.get_parent())


func _clear() -> void:
	loaded = false
	_bones.clear()
	if tree:
		tree.queue_free()
		tree = null
	if player:
		player.queue_free()
		player = null
	if _model_root:
		_model_root.queue_free()
		_model_root = null
	skeleton = null


func _fallback() -> void:
	var m := MeshInstance3D.new()
	var cap := CapsuleMesh.new()
	cap.radius = 0.22
	cap.height = 1.4
	m.mesh = cap
	m.position.y = 0.7
	_model_root.add_child(m)


func _build_animation(skeleton_parent: Node) -> void:
	player = AnimationPlayer.new()
	player.name = "AnimationPlayer"
	add_child(player)
	player.root_node = player.get_path_to(skeleton_parent)  # trilhas "Skeleton3D:<osso>" valem para todos os personagens
	player.add_animation_library("", LIBRARY)
	tree = AnimationTree.new()
	tree.name = "AnimationTree"
	add_child(tree)
	tree.anim_player = tree.get_path_to(player)
	tree.tree_root = _make_state_machine()
	tree.active = true
	var pb: AnimationNodeStateMachinePlayback = tree.get("parameters/playback")
	pb.start("Locomotion")


func _anim(name: StringName) -> AnimationNodeAnimation:
	var n := AnimationNodeAnimation.new()
	n.animation = name
	return n


func _make_state_machine() -> AnimationNodeStateMachine:
	var sm := AnimationNodeStateMachine.new()
	var loco := AnimationNodeBlendSpace1D.new()
	loco.min_space = 0.0
	loco.max_space = 1.0
	loco.add_blend_point(_anim(&"idle"), 0.0)
	loco.add_blend_point(_anim(&"walk"), WALK_BLEND)
	loco.add_blend_point(_anim(&"run"), 1.0)
	sm.add_node("Locomotion", loco, Vector2(200, 100))
	sm.add_node("Talk", _anim(&"talk"), Vector2(400, 0))
	sm.add_node("Interact", _anim(&"interact"), Vector2(400, 200))
	sm.add_transition("Start", "Locomotion", AnimationNodeStateMachineTransition.new())
	for pair in [["Locomotion", "Talk"], ["Talk", "Locomotion"], ["Locomotion", "Interact"], ["Talk", "Interact"]]:
		var t := AnimationNodeStateMachineTransition.new()
		t.xfade_time = 0.2
		t.switch_mode = AnimationNodeStateMachineTransition.SWITCH_MODE_IMMEDIATE
		sm.add_transition(pair[0], pair[1], t)
	var back := AnimationNodeStateMachineTransition.new()  # Interact → Locomotion ao terminar
	back.xfade_time = 0.25
	back.switch_mode = AnimationNodeStateMachineTransition.SWITCH_MODE_AT_END
	back.advance_mode = AnimationNodeStateMachineTransition.ADVANCE_MODE_AUTO
	sm.add_transition("Interact", "Locomotion", back)
	return sm


func _playback() -> AnimationNodeStateMachinePlayback:
	return tree.get("parameters/playback") if tree else null


func set_locomotion(speed_norm: float, _running: bool) -> void:
	_speed = clampf(speed_norm, 0.0, 1.0)
	if tree:
		tree.set("parameters/Locomotion/blend_position", _speed)


func play_interact() -> void:
	var pb := _playback()
	if pb and pb.get_current_node() != "Interact":
		pb.start("Interact")


func set_talking(on: bool) -> void:
	var pb := _playback()
	if pb == null:
		return
	if on and pb.get_current_node() != "Talk":
		pb.travel("Talk")
	elif not on and pb.get_current_node() == "Talk":
		pb.travel("Locomotion")


func current_state() -> String:
	var pb := _playback()
	return String(pb.get_current_node()) if pb else ""


func _process(_dt: float) -> void:
	if not loaded:
		return
	# passos: troca de sinal da coxa esquerda durante a locomoção
	var s := 1 if bone_pose_x("thigh_L") >= 0.0 else -1
	if s != _last_sign and _speed > 0.3 and current_state() == "Locomotion":
		footstep.emit()
	_last_sign = s


func bone_pose_x(bone: String) -> float:
	if not _bones.has(bone):
		return 0.0
	return skeleton.get_bone_pose_rotation(_bones[bone]).get_euler().x


func head_global_position() -> Vector3:
	if loaded:
		return skeleton.global_transform * skeleton.get_bone_global_pose(_bones["head"]).origin
	return global_position + Vector3(0, 1.3, 0)


## O importador da Godot transforma o marcador "nose" do GLB em osso.
func nose_global_position() -> Vector3:
	if loaded and _bones.has("nose"):
		return skeleton.global_transform * skeleton.get_bone_global_pose(_bones["nose"]).origin
	return head_global_position()


func _find_skeleton(n: Node) -> Skeleton3D:
	if n is Skeleton3D:
		return n
	for c in n.get_children():
		var r := _find_skeleton(c)
		if r:
			return r
	return null
