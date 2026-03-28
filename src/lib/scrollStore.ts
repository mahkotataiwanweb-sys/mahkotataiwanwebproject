// Lightweight module-level scroll data store
// Zero React overhead — read directly in animation loops (RAF)
// No re-renders, no context, no subscriptions

let _velocity = 0;
let _direction = 1;
let _progress = 0;

export function setScrollData(velocity: number, direction: number, progress: number) {
  _velocity = velocity;
  _direction = direction;
  _progress = progress;
}

export function getScrollVelocity(): number {
  return _velocity;
}

export function getScrollDirection(): number {
  return _direction;
}

export function getScrollProgress(): number {
  return _progress;
}
