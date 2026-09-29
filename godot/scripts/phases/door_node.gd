class_name DoorNode
extends Node3D
## Porta com dobradiça: gira em torno da borda; o colisor é desligado ao abrir. Estado persistente via `is_open`.

signal opened(door_id: String)

var door_id := ""
var is_open := false
var pivot: Node3D
var body: StaticBody3D
var _swing := 0.0  # radianos ao abrir


static func create(spec: Dictionary, mat: Material) -> DoorNode:
	var d := DoorNode.new()
	d.door_id = String(spec["id"])
	var p: Array = spec["pos"]
	var width := float(spec["width"])
	var height := float(spec["height"])
	var axis: String = spec["axis"]
	var hinge_min: bool = spec.get("hinge", "min") == "min"
	var origin := Vector3(float(p[0]), float(p[1]), float(p[2]))
	var along := Vector3.RIGHT if axis == "x" else Vector3.BACK
	d.position = origin + along * (-width / 2.0 if hinge_min else width / 2.0)
	d.pivot = Node3D.new()
	d.add_child(d.pivot)
	d.body = StaticBody3D.new()
	d.body.collision_layer = 1
	d.pivot.add_child(d.body)
	var leaf_center := along * (width / 2.0 if hinge_min else -width / 2.0) + Vector3(0, height / 2.0, 0)
	var size := Vector3(width, height, 0.06) if axis == "x" else Vector3(0.06, height, width)
	var mesh := MeshInstance3D.new()
	var bm := BoxMesh.new()
	bm.size = size
	mesh.mesh = bm
	mesh.material_override = mat
	mesh.position = leaf_center
	d.body.add_child(mesh)
	var shape := CollisionShape3D.new()
	var bs := BoxShape3D.new()
	bs.size = size
	shape.shape = bs
	shape.position = leaf_center
	d.body.add_child(shape)
	# maçaneta
	var knob := MeshInstance3D.new()
	var sm := SphereMesh.new()
	sm.radius = 0.035
	sm.height = 0.07
	knob.mesh = sm
	var km := StandardMaterial3D.new()
	km.albedo_color = Color(0.72, 0.6, 0.35)
	km.metallic = 0.6
	km.roughness = 0.4
	knob.material_override = km
	var knob_off := along * (width * 0.42 if not hinge_min else width * 0.58) * (1.0 if hinge_min else -1.0)
	knob.position = Vector3(0, 1.0, 0) + (along * (width * 0.88) if hinge_min else along * (-width * 0.88)) + (Vector3(0, 0, 0.05) if axis == "x" else Vector3(0.05, 0, 0))
	d.body.add_child(knob)
	var sign := 1.0
	if axis == "x":
		sign = -1.0 if hinge_min else 1.0
	else:
		sign = 1.0 if hinge_min else -1.0
	d._swing = sign * deg_to_rad(100.0)
	return d


func open(instant: bool = false) -> void:
	if is_open:
		return
	is_open = true
	for c in body.get_children():
		if c is CollisionShape3D:
			(c as CollisionShape3D).set_deferred("disabled", true)
	if instant or not is_inside_tree():
		pivot.rotation.y = _swing
		opened.emit(door_id)
		return
	var tw := create_tween()
	tw.tween_property(pivot, "rotation:y", _swing, 0.7).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	tw.finished.connect(func() -> void: opened.emit(door_id))
