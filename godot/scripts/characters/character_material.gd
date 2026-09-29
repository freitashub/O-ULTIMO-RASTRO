class_name CharacterMaterial
extends RefCounted
## Aplica aos GLBs de personagem o material de projeção da arte (shader) + contorno de nanquim.
## O GLB traz: UV de projeção frontal, COLOR_0 (rgb = cor chapada, a = peso de frente) e a arte como textura base.

const SHADER := preload("res://shaders/character_projection.gdshader")
const OUTLINE := preload("res://shaders/character_outline.gdshader")


static func apply(root: Node, outline: bool = true, outline_width: float = 0.006) -> void:
	for mi in _meshes(root):
		var src := mi.get_active_material(0)
		var tex: Texture2D = null
		if src is BaseMaterial3D:
			tex = (src as BaseMaterial3D).albedo_texture
		if tex == null:
			continue
		var mat := ShaderMaterial.new()
		mat.shader = SHADER
		mat.set_shader_parameter("art", tex)
		if outline:
			var om := ShaderMaterial.new()
			om.shader = OUTLINE
			om.set_shader_parameter("width", outline_width)
			mat.next_pass = om
		mi.material_override = mat
		# skinned mesh: garante que o culling use a caixa do modelo em repouso com folga para animação
		mi.extra_cull_margin = 1.0


static func _meshes(n: Node) -> Array[MeshInstance3D]:
	var out: Array[MeshInstance3D] = []
	if n is MeshInstance3D:
		out.append(n)
	for c in n.get_children():
		out.append_array(_meshes(c))
	return out
