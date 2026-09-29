extends SceneTree
## Gera a biblioteca de animações humanoide (res://assets/animations/humanoid_library.res) a partir das fórmulas de ciclo.
## Uso: godot --headless --path godot -s res://tools/build_animations.gd
## Só as animações que as fases prontas exigem (Fase 1: idle, walk, run, talk, interact). Acrescentar por fase.
## Trilhas de rotação absolutas (o repouso dos ossos tem rotação identidade): caminho "Skeleton3D:<osso>" relativo ao nó-pai do esqueleto.

const PATH := "res://assets/animations/humanoid_library.res"
var _anim: Animation
var _tracks: Dictionary = {}


func _init() -> void:
	var lib := AnimationLibrary.new()
	lib.add_animation("idle", _build("idle", 4.0, 24, _idle))
	lib.add_animation("walk", _build("walk", 1.05, 24, _walk))
	lib.add_animation("run", _build("run", 0.64, 24, _run))
	lib.add_animation("talk", _build("talk", 3.2, 32, _talk))
	lib.add_animation("interact", _build("interact", 1.0, 16, _interact, false))
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path("res://assets/animations"))
	var err := ResourceSaver.save(lib, PATH)
	print("humanoid_library: ", "OK" if err == OK else "ERRO %d" % err, " (", lib.get_animation_list(), ")")
	quit(0 if err == OK else 1)


func _build(_name: String, length: float, keys: int, pose_fn: Callable, loop: bool = true) -> Animation:
	_anim = Animation.new()
	_anim.length = length
	_anim.loop_mode = Animation.LOOP_LINEAR if loop else Animation.LOOP_NONE
	_tracks.clear()
	var steps := keys if not loop else keys  # inclui o quadro final igual ao inicial para fechar o laço
	for i in range(steps + 1):
		var t := length * float(i) / float(steps)
		var ph := float(i) / float(steps) * TAU
		var pose: Dictionary = pose_fn.call(ph, float(i) / float(steps))
		for bone in pose:
			var e: Vector3 = pose[bone]
			_key(bone, t, Quaternion.from_euler(e))
	return _anim


func _key(bone: String, t: float, q: Quaternion) -> void:
	if not _tracks.has(bone):
		var idx := _anim.add_track(Animation.TYPE_ROTATION_3D)
		_anim.track_set_path(idx, NodePath("Skeleton3D:%s" % bone))
		_anim.track_set_interpolation_type(idx, Animation.INTERPOLATION_LINEAR)
		_tracks[bone] = idx
	_anim.rotation_track_insert_key(_tracks[bone], t, q)


func _walk(ph: float, _u: float) -> Dictionary:
	var s := sin(ph)
	var c := cos(ph)
	return {
		"thigh_L": Vector3(-s * 0.52, 0, 0), "thigh_R": Vector3(s * 0.52, 0, 0),
		"shin_L": Vector3((0.08 + 0.95 * maxf(0.0, c)) * 0.7, 0, 0), "shin_R": Vector3((0.08 + 0.95 * maxf(0.0, -c)) * 0.7, 0, 0),
		"foot_L": Vector3(s * 0.2, 0, 0), "foot_R": Vector3(-s * 0.2, 0, 0),
		"upperarm_L": Vector3(s * 0.5, 0, 0), "upperarm_R": Vector3(-s * 0.5, 0, 0),
		"forearm_L": Vector3(-(0.15 + 0.3 * maxf(0.0, -s)) - 0.05, 0, 0), "forearm_R": Vector3(-(0.15 + 0.3 * maxf(0.0, s)) - 0.05, 0, 0),
		"hips": Vector3(0, s * 0.06, s * 0.02), "spine": Vector3(0.04, -s * 0.05, 0), "chest": Vector3(0, -s * 0.03, 0),
		"head": Vector3(-0.03, s * 0.03, 0),
	}


func _run(ph: float, _u: float) -> Dictionary:
	var s := sin(ph)
	var c := cos(ph)
	return {
		"thigh_L": Vector3(-s * 0.85, 0, 0), "thigh_R": Vector3(s * 0.85, 0, 0),
		"shin_L": Vector3((0.15 + 1.5 * maxf(0.0, c)) * 0.75, 0, 0), "shin_R": Vector3((0.15 + 1.5 * maxf(0.0, -c)) * 0.75, 0, 0),
		"foot_L": Vector3(s * 0.3, 0, 0), "foot_R": Vector3(-s * 0.3, 0, 0),
		"upperarm_L": Vector3(s * 0.85, 0, 0), "upperarm_R": Vector3(-s * 0.85, 0, 0),
		"forearm_L": Vector3(-(0.7 + 0.45 * maxf(0.0, -s)), 0, 0), "forearm_R": Vector3(-(0.7 + 0.45 * maxf(0.0, s)), 0, 0),
		"hips": Vector3(0, s * 0.1, s * 0.03), "spine": Vector3(0.16, -s * 0.09, 0), "chest": Vector3(0.03, -s * 0.05, 0),
		"head": Vector3(-0.1, s * 0.05, 0),
	}


func _idle(ph: float, _u: float) -> Dictionary:
	var b := sin(ph)  # 1 ciclo = 4 s
	return {
		"chest": Vector3(b * 0.014, 0, 0), "spine": Vector3(b * 0.006, 0, 0),
		"head": Vector3(-b * 0.01, sin(ph) * 0.12, 0), "hips": Vector3(0, 0, sin(ph) * 0.02),
		"upperarm_L": Vector3(0.02, 0, 0.02), "upperarm_R": Vector3(0.02, 0, -0.02),
		"forearm_L": Vector3(-0.05, 0, 0), "forearm_R": Vector3(-0.05, 0, 0),
	}


func _talk(ph: float, u: float) -> Dictionary:
	var d := _idle(ph, u)
	var g := maxf(0.0, sin(ph * 2.0))  # dois gestos por ciclo
	var n := sin(ph * 3.0)
	d["upperarm_R"] = Vector3(-0.35 * g, 0, -0.1 * g)
	d["forearm_R"] = Vector3(-0.35 - 0.45 * g, 0, 0)
	d["head"] = Vector3(0.05 * n, sin(ph * 0.5) * 0.1, 0)
	d["spine"] = Vector3(0.02 * g, 0, 0)
	return d


func _interact(_ph: float, u: float) -> Dictionary:
	var k := sin(PI * u)
	return {
		"upperarm_R": Vector3(-1.15 * k, 0, -0.1 * k), "forearm_R": Vector3(-0.5 * k, 0, 0),
		"spine": Vector3(0.16 * k, 0, 0), "head": Vector3(0.08 * k, 0, 0), "chest": Vector3(0.05 * k, 0, 0),
	}
