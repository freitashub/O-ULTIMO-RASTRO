class_name PlayerTheo
extends CharacterBody3D
## Theo jogável. Locomoção com colisão real (CharacterBody3D), controles relativos à câmera fixa com base
## "congelada" enquanto a tecla é mantida (padrão survival horror: trocar de câmera não inverte o comando).
## Sem combate. Estados: idle / walk / run / interact / talk / cinematic.

signal state_changed(new_state: String)
signal footstep

enum State { IDLE, WALK, RUN, INTERACT, TALK, CINEMATIC }

const WALK_SPEED := 1.9
const RUN_SPEED := 3.5
const ACCEL := 14.0
const DECEL := 18.0
const TURN_RATE := 11.0
const RADIUS := 0.26
const HEIGHT := 1.45

var state: State = State.IDLE
var camera_manager: CinematicCameraManager
var controllable := true
var rig: CharacterRig
var _basis_yaw := 0.0
var _facing_yaw := 0.0  # yaw do visual: 0 → olha para -Z
var _auto_target: Variant = null
var _interact_t := 0.0
var _gravity := 9.8


func _init() -> void:
	collision_layer = 2
	collision_mask = 1


func _ready() -> void:
	var shape := CollisionShape3D.new()
	var cap := CapsuleShape3D.new()
	cap.radius = RADIUS
	cap.height = HEIGHT
	shape.shape = cap
	shape.position.y = HEIGHT / 2.0
	add_child(shape)
	rig = CharacterRig.new()
	rig.name = "Visual"
	rig.character_id = Transformation.theo_variant(int(GameState.state.get("currentPhase", 1)), int(GameState.state.get("transformationLevel", 0)))
	add_child(rig)
	rig.footstep.connect(func() -> void: footstep.emit())
	# luz de personagem (sem sombra): mantém o Theo legível contra cenários escuros, como o rim light de cinema
	var key := OmniLight3D.new()
	key.name = "CharacterLight"
	key.light_color = Color(0.92, 0.9, 0.86)
	key.light_energy = 0.8
	key.omni_range = 2.8
	key.position = Vector3(0.4, 1.9, 1.0)
	add_child(key)
	floor_snap_length = 0.3
	motion_mode = CharacterBody3D.MOTION_MODE_GROUNDED


func facing() -> Vector3:
	return Vector3(-sin(_facing_yaw), 0, -cos(_facing_yaw))


func set_facing_yaw(yaw: float) -> void:
	_facing_yaw = yaw
	rig.rotation.y = yaw


func face_point(p: Vector3) -> void:
	var d := p - global_position
	set_facing_yaw(atan2(-d.x, -d.z))


func teleport(p: Vector3, yaw: float = NAN) -> void:
	global_position = p
	velocity = Vector3.ZERO
	if not is_nan(yaw):
		set_facing_yaw(yaw)


func set_controllable(v: bool) -> void:
	controllable = v
	if not v:
		_set_state(State.CINEMATIC)
	else:
		_set_state(State.IDLE)


func enter_talk() -> void:
	controllable = false
	velocity = Vector3(0, velocity.y, 0)
	_set_state(State.TALK)


## Fala/diálogo: gesto de fala enquanto durar (o HUD chama com true/false).
func set_talking(on: bool) -> void:
	rig.set_talking(on)


func play_interact() -> void:
	_interact_t = 0.7
	rig.play_interact()
	_set_state(State.INTERACT)


## Caminhada automática (cutscenes/travessia de porta). Retorna via sinal `auto_walk_done`.
signal auto_walk_done
func walk_to(p: Vector3) -> void:
	_auto_target = p
	controllable = false
	_set_state(State.CINEMATIC)


func _physics_process(dt: float) -> void:
	var input := Vector2.ZERO
	var running := false
	if controllable and _auto_target == null:
		input = Input.get_vector("move_left", "move_right", "move_forward", "move_back")
		running = Input.is_action_pressed("run")
	elif _auto_target != null:
		var to: Vector3 = _auto_target - global_position
		to.y = 0
		if to.length() < 0.12:
			_auto_target = null
			velocity.x = 0
			velocity.z = 0
			auto_walk_done.emit()
		else:
			var dir := to.normalized()
			_move_horizontal(dir, WALK_SPEED, dt)
	if _auto_target == null and controllable:
		_apply_input(input, running, dt)
	elif _auto_target == null:
		_decelerate(dt)
	# gravidade / chão
	if not is_on_floor():
		velocity.y -= _gravity * dt
	else:
		velocity.y = 0
	move_and_slide()
	# estado e animação
	var hspeed := Vector2(velocity.x, velocity.z).length()
	rig.set_locomotion(hspeed / RUN_SPEED if hspeed > 0.05 else 0.0, running)
	_interact_t = maxf(0.0, _interact_t - dt)
	if _interact_t > 0.0:
		_set_state(State.INTERACT)
	elif state == State.INTERACT or (controllable and state in [State.IDLE, State.WALK, State.RUN]):
		_set_state(State.RUN if hspeed > WALK_SPEED + 0.6 else (State.WALK if hspeed > 0.15 else State.IDLE))


func _apply_input(input: Vector2, running: bool, dt: float) -> void:
	if input == Vector2.ZERO:
		# sem tecla: captura a base da câmera atual (será mantida enquanto a tecla for mantida)
		_basis_yaw = _camera_yaw()
		_decelerate(dt)
		return
	var b := Basis(Vector3.UP, _basis_yaw)
	var dir := (b * Vector3(input.x, 0, input.y)).normalized()
	_move_horizontal(dir, RUN_SPEED if running else WALK_SPEED, dt)


func _move_horizontal(dir: Vector3, speed: float, dt: float) -> void:
	var want := dir * speed
	velocity.x = move_toward(velocity.x, want.x, ACCEL * dt)
	velocity.z = move_toward(velocity.z, want.z, ACCEL * dt)
	var target_yaw := atan2(-dir.x, -dir.z)
	_facing_yaw = lerp_angle(_facing_yaw, target_yaw, clampf(TURN_RATE * dt, 0.0, 1.0))
	rig.rotation.y = _facing_yaw


func _decelerate(dt: float) -> void:
	velocity.x = move_toward(velocity.x, 0.0, DECEL * dt)
	velocity.z = move_toward(velocity.z, 0.0, DECEL * dt)


func _camera_yaw() -> float:
	if camera_manager == null or camera_manager.camera == null:
		return 0.0
	var f := -camera_manager.camera.global_transform.basis.z
	f.y = 0
	if f.length_squared() < 1e-6:
		return 0.0
	f = f.normalized()
	return atan2(-f.x, -f.z)


func state_name() -> String:
	return State.keys()[state].to_lower()


func _set_state(s: State) -> void:
	if s != state:
		state = s
		state_changed.emit(state_name())
