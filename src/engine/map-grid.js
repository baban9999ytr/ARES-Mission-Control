/** Convert between the displayed raster and grid cells under zoom and pan. */
export function clientPointToCell(
  clientX,
  clientY,
  rect,
  gridWidth,
  gridHeight,
  zoom = 1,
  panX = 0,
  panY = 0,
) {
  const x =
    (clientX - rect.left - rect.width / 2 - panX) / zoom + rect.width / 2;
  const y =
    (clientY - rect.top - rect.height / 2 - panY) / zoom + rect.height / 2;
  if (x < 0 || y < 0 || x >= rect.width || y >= rect.height) return null;
  return {
    x: Math.floor((x / rect.width) * gridWidth),
    y: Math.floor((y / rect.height) * gridHeight),
  };
}

export function clampPan(pan, zoom, extent) {
  const limit = Math.max(0, ((zoom - 1) * extent) / 2);
  return Math.max(-limit, Math.min(limit, pan));
}

export function cellToSvg(point, gridWidth, gridHeight) {
  return {
    x: ((point.x + 0.5) / gridWidth) * 1000,
    y: ((point.y + 0.5) / gridHeight) * 750,
  };
}

export function stepKeyboardCell(cell, key, gridWidth, gridHeight) {
  const delta = {
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
  }[key];
  if (!delta) return cell;
  return {
    x: Math.max(0, Math.min(gridWidth - 1, cell.x + delta[0])),
    y: Math.max(0, Math.min(gridHeight - 1, cell.y + delta[1])),
  };
}
