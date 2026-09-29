#!/usr/bin/env bash
# Renderiza frente/3-4/perfil/costas de um ou mais personagens (Xvfb + llvmpipe). Uso: tools/godot/char-view.sh theo [clara ...] [--pose=walk]
GODOT="${GODOT:-godot}"
OUT="${OUT:-/tmp/ur_char}"
POSE="rest"; IDS=()
for a in "$@"; do case "$a" in --pose=*) POSE="${a#--pose=}";; *) IDS+=("$a");; esac; done
"$GODOT" --headless --path godot --import >/dev/null 2>&1
for id in "${IDS[@]}"; do
  xvfb-run -a -s "-screen 0 1280x1024x24" "$GODOT" --path godot --rendering-driver opengl3 --resolution 720x960 res://tests/char_view.tscn -- --id="$id" --out="$OUT" --pose="$POSE" 2>&1 | grep -E "char_view|SCRIPT ERROR|Parse Error"
done
