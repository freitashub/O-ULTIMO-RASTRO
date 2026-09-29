class_name InteractionSystem
extends Node
## Detecta o interativo em foco (raio + linha de visão + orientação) e emite `activated`.
## A lógica de cada interação fica nos dados (`Interactable.data`) e nos handlers da fase — não em scripts por objeto.

signal focus_changed(item: Interactable)
signal activated(item: Interactable)

var player: Node3D
var enabled := true
var focus: Interactable
const EYE_HEIGHT := 1.1
const LOS_TOLERANCE := 0.45


func setup(p: Node3D) -> void:
	player = p


func _physics_process(_dt: float) -> void:
	refresh()


func refresh() -> void:
	var best: Interactable = find_best() if enabled else null
	if best != focus:
		focus = best
		focus_changed.emit(focus)


func find_best() -> Interactable:
	if player == null:
		return null
	var pp := player.global_position
	var fwd := Vector3(0, 0, -1)
	if player.has_method("facing"):
		fwd = player.facing()
	var best: Interactable = null
	var best_score := INF
	for node in get_tree().get_nodes_in_group("interactables"):
		var it := node as Interactable
		if it == null or not it.enabled or not it.is_visible_in_tree():
			continue
		var to := Vector3(it.global_position.x - pp.x, 0, it.global_position.z - pp.z)
		var d := to.length()
		if d > it.radius:
			continue
		var dir := to / maxf(d, 0.001)
		var score := d - 0.6 * fwd.dot(dir)
		if score >= best_score:
			continue
		if not has_line_of_sight(it):
			continue
		best = it
		best_score = score
	return best


func has_line_of_sight(it: Interactable) -> bool:
	var space := player.get_world_3d().direct_space_state
	var from := player.global_position + Vector3(0, EYE_HEIGHT, 0)
	var to := it.focus_point()
	var q := PhysicsRayQueryParameters3D.create(from, to)
	q.exclude = [player.get_rid()]
	q.collision_mask = 1  # só o mundo
	var hit := space.intersect_ray(q)
	if hit.is_empty():
		return true
	return from.distance_to(hit["position"]) >= from.distance_to(to) - LOS_TOLERANCE


func activate() -> bool:
	if not enabled or focus == null:
		return false
	activated.emit(focus)
	return true
