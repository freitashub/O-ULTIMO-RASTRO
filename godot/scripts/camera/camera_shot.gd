class_name CameraShot
extends RefCounted
## Um enquadramento fixo: posição, alvo do olhar, FOV, volume de ativação e prioridade.
## Declarado em dados (layout JSON): camera_zone / camera_position / camera_rotation / transition / priority / look_target.

var id := ""
var position := Vector3.ZERO
## "follow": olha para o alvo (jogador) com amortecimento · "point": olha para `look_point` · "fixed": usa `rotation_deg`
var look_mode := "follow"
var look_point := Vector3.ZERO
var rotation_deg := Vector3.ZERO
var look_offset := Vector3(0, 0.9, 0)
var fov := 55.0
var priority := 0
var transition := 0.55  # segundos; 0 = corte seco
var zone := AABB()
var has_zone := true
var follow_damping := 6.0  # 0 = rígido


static func from_dict(d: Dictionary) -> CameraShot:
	var s := CameraShot.new()
	s.id = String(d["id"])
	s.position = _v3(d["camera_position"])
	s.fov = float(d.get("fov", 55.0))
	s.priority = int(d.get("priority", 0))
	s.transition = float(d.get("transition", 0.55))
	s.follow_damping = float(d.get("follow_damping", 6.0))
	if d.has("look_offset"):
		s.look_offset = _v3(d["look_offset"])
	if d.has("camera_rotation"):
		s.look_mode = "fixed"
		s.rotation_deg = _v3(d["camera_rotation"])
	elif d.has("look_target") and typeof(d["look_target"]) == TYPE_ARRAY:
		s.look_mode = "point"
		s.look_point = _v3(d["look_target"])
	else:
		s.look_mode = "follow"
	if d.has("camera_zone"):
		var z: Dictionary = d["camera_zone"]
		var mn := _v3(z["min"])
		var mx := _v3(z["max"])
		s.zone = AABB(mn, mx - mn)
	else:
		s.has_zone = false
	return s


func contains(p: Vector3, margin: float = 0.0) -> bool:
	if not has_zone:
		return false
	return zone.grow(margin).has_point(p)


static func _v3(a: Variant) -> Vector3:
	return Vector3(float(a[0]), float(a[1]), float(a[2]))
