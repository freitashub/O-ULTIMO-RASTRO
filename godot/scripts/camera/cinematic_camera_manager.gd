class_name CinematicCameraManager
extends Node
## Sistema reutilizável de câmeras cinematográficas fixas (survival horror).
## - Cada fase registra `CameraShot`s (dados); o manager escolhe o shot ativo pela posição do alvo.
## - Prioridade: entre zonas que contêm o alvo, vence a de maior prioridade; empate → mantém o atual (histerese).
## - Blend suave entre shots (ou corte seco com transition = 0), lock temporário para cutscenes.
## - Emite `shot_changed` (o jogador congela a base de controles enquanto mantém a tecla pressionada).

signal shot_changed(old_id: String, new_id: String)
signal blend_finished(shot_id: String)

@export var hysteresis := 0.5

var camera: Camera3D
var target: Node3D
var shots: Array[CameraShot] = []

var _current: CameraShot
var _locked: CameraShot
var _blend_from := Transform3D.IDENTITY
var _blend_fov_from := 55.0
var _blend_t := 1.0
var _blend_dur := 0.0
var _smooth_basis := Basis.IDENTITY
var _smooth_ready := false


func setup(cam: Camera3D, follow_target: Node3D) -> void:
	camera = cam
	target = follow_target


func add_shot(shot: CameraShot) -> void:
	shots.append(shot)


func add_shots_from_data(list: Array) -> void:
	for d in list:
		add_shot(CameraShot.from_dict(d))


func get_shot(id: String) -> CameraShot:
	for s in shots:
		if s.id == id:
			return s
	return null


func current_id() -> String:
	return _current.id if _current else ""


func is_blending() -> bool:
	return _blend_t < 1.0


func is_locked() -> bool:
	return _locked != null


## Seleção pura (sem estado do manager): usada pelo jogo e pelos testes.
static func select(list: Array[CameraShot], p: Vector3, current: CameraShot, margin: float) -> CameraShot:
	var best: CameraShot = null
	for s in list:
		if s.contains(p) and (best == null or s.priority > best.priority):
			best = s
	if current and current.contains(p, margin):
		# histerese: só troca se o candidato tem prioridade estritamente maior
		if best == null or best.priority <= current.priority:
			return current
	if best:
		return best
	return current if current else (list[0] if not list.is_empty() else null)


func lock_to(shot_id: String) -> void:
	var s := get_shot(shot_id)
	if s:
		_locked = s
		_activate(s)


func unlock() -> void:
	_locked = null


func snap(p: Vector3 = Vector3.INF) -> void:
	## Posiciona a câmera imediatamente (sem blend) no shot que cobre `p` (ou o alvo).
	var pos := p if p != Vector3.INF else (target.global_position if target else Vector3.ZERO)
	var s := select(shots, pos, null, 0.0)
	_current = null
	_activate(s, true)
	update(0.0)


func update(dt: float) -> void:
	if camera == null or shots.is_empty():
		return
	if _locked == null and target != null:
		var s := select(shots, target.global_position, _current, hysteresis)
		if s != _current:
			_activate(s)
	if _current == null:
		return
	_blend_t = minf(1.0, _blend_t + (dt / _blend_dur if _blend_dur > 0.0 else 1.0))
	var want := _desired_transform(_current, dt)
	if _blend_t < 1.0:
		var k := _ease(_blend_t)
		var xf := Transform3D(_blend_from.basis.slerp(want.basis, k), _blend_from.origin.lerp(want.origin, k))
		camera.global_transform = xf
		camera.fov = lerpf(_blend_fov_from, _current.fov, k)
	else:
		camera.global_transform = want
		camera.fov = _current.fov
		if _blend_dur >= 0.0:
			_blend_dur = -1.0
			blend_finished.emit(_current.id)


func _process(delta: float) -> void:
	update(delta)


func _activate(s: CameraShot, force_cut: bool = false) -> void:
	if s == null or s == _current:
		return
	var old := _current.id if _current else ""
	if _current != null and camera != null:
		_blend_from = camera.global_transform
		_blend_fov_from = camera.fov
	_current = s
	_smooth_ready = false
	if force_cut or old == "" or s.transition <= 0.0:
		_blend_t = 1.0
		_blend_dur = 0.0
	else:
		_blend_t = 0.0
		_blend_dur = s.transition
	shot_changed.emit(old, s.id)


func _desired_transform(s: CameraShot, dt: float) -> Transform3D:
	var basis: Basis
	match s.look_mode:
		"fixed":
			basis = Basis.from_euler(Vector3(deg_to_rad(s.rotation_deg.x), deg_to_rad(s.rotation_deg.y), deg_to_rad(s.rotation_deg.z)))
		"point":
			basis = _look(s.position, s.look_point)
		_:
			var focus := (target.global_position + s.look_offset) if target else s.look_point
			var wanted := _look(s.position, focus)
			if not _smooth_ready or s.follow_damping <= 0.0:
				_smooth_basis = wanted
				_smooth_ready = true
			else:
				_smooth_basis = _smooth_basis.slerp(wanted, 1.0 - exp(-s.follow_damping * dt))
			basis = _smooth_basis
	return Transform3D(basis, s.position)


static func _look(from: Vector3, to: Vector3) -> Basis:
	var dir := to - from
	if dir.length_squared() < 1e-8:
		return Basis.IDENTITY
	return Basis.looking_at(dir.normalized(), Vector3.UP)


static func _ease(t: float) -> float:
	return t * t * (3.0 - 2.0 * t)
