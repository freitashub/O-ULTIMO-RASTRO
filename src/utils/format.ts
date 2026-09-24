export function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

export function phaseLabel(id: number): string {
  return `FASE ${pad2(id)}`;
}
