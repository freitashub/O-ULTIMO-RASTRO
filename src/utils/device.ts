export function isDesktop(): boolean {
  return window.matchMedia('(pointer: fine)').matches;
}

export function supportsFullscreen(): boolean {
  return document.fullscreenEnabled !== false;
}
