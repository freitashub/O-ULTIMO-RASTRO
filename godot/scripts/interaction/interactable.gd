class_name Interactable
extends Node3D
## Ponto interativo do mundo. Posicionado no piso, sob o objeto; `height` é o ponto de interesse (linha de visão).
## `data` vem do layout JSON (`on_interact`): tipo, texto, flag, pista, escolha...

@export var id := ""
@export var kind := "detail"  # detail | examine | choice | exit
@export var label := ""
@export var radius := 1.4
@export var height := 1.0
@export var enabled := true
var data: Dictionary = {}


func _ready() -> void:
	add_to_group("interactables")


func focus_point() -> Vector3:
	return global_position + Vector3(0, height, 0)
