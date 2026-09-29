shader_type spatial;
render_mode unshaded, cull_front;
// Contorno de nanquim por casco invertido (next_pass do material do personagem).
uniform float width : hint_range(0.0, 0.05) = 0.006;
uniform vec4 ink : source_color = vec4(0.02, 0.02, 0.03, 1.0);

void vertex() {
	VERTEX += NORMAL * width * UV2.x;
}

void fragment() {
	ALBEDO = ink.rgb;
}
