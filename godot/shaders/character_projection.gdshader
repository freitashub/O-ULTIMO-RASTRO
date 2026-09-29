shader_type spatial;
render_mode cull_disabled;
// Personagem projetado da arte: COLOR.rgb = cor chapada amostrada da arte (sRGB), COLOR.a = peso de frente.
// Frente (peso alto) mostra a própria arte via UV de projeção; laterais/costas usam a cor chapada.
uniform sampler2D art : source_color, filter_linear_mipmap, repeat_disable;
uniform float roughness : hint_range(0.0, 1.0) = 0.92;
uniform float art_strength : hint_range(0.0, 1.0) = 1.0;
uniform vec3 tint : source_color = vec3(1.0);
uniform float emission_strength : hint_range(0.0, 0.5) = 0.14; // legibilidade em cenário escuro (como o emissivo do vertical slice)
uniform float rim : hint_range(0.0, 1.0) = 0.35;

varying vec3 flat_col;
varying float front_w;

vec3 srgb_to_linear(vec3 c) {
	return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c));
}

void vertex() {
	flat_col = srgb_to_linear(COLOR.rgb);
	front_w = COLOR.a;
}

void fragment() {
	vec3 t = texture(art, UV).rgb;
	ALBEDO = mix(flat_col, t, front_w * art_strength) * tint;
	EMISSION = ALBEDO * emission_strength;
	RIM = rim;
	RIM_TINT = 0.4;
	ROUGHNESS = roughness;
	SPECULAR = 0.15;
}
