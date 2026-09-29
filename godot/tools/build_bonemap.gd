extends SceneTree
## Gera o BoneMap (nossos 19 ossos → SkeletonProfileHumanoid) em res://assets/characters/humanoid_bone_map.tres.
## Uso: godot --headless --path godot -s res://tools/build_bonemap.gd

const MAP := {
	"Hips": "hips", "Spine": "spine", "Chest": "chest", "Neck": "neck", "Head": "head",
	"LeftShoulder": "shoulder_L", "LeftUpperArm": "upperarm_L", "LeftLowerArm": "forearm_L", "LeftHand": "hand_L",
	"RightShoulder": "shoulder_R", "RightUpperArm": "upperarm_R", "RightLowerArm": "forearm_R", "RightHand": "hand_R",
	"LeftUpperLeg": "thigh_L", "LeftLowerLeg": "shin_L", "LeftFoot": "foot_L",
	"RightUpperLeg": "thigh_R", "RightLowerLeg": "shin_R", "RightFoot": "foot_R",
}


func _init() -> void:
	var bm := BoneMap.new()
	bm.profile = SkeletonProfileHumanoid.new()
	for k in MAP:
		bm.set_skeleton_bone_name(k, MAP[k])
	var err := ResourceSaver.save(bm, "res://assets/characters/humanoid_bone_map.tres")
	print("humanoid_bone_map: ", "OK" if err == OK else "ERRO %d" % err)
	quit(0 if err == OK else 1)
