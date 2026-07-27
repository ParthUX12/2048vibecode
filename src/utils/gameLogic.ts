import type { Direction, Tile } from '@/types';

export const SIZE = 4;

export function createTile(
  value: number,
  row: number,
  col: number,
  isNew = false
): Tile {
  return {
    id: crypto.randomUUID(),
    value,
    row,
    col,
    isNew,
    isMerged: false,
    isRemoving: false,
  };
}

export function emptyCells(tiles: Tile[]): Array<{ row: number; col: number }> {
  const occupied = new Set(tiles.map((t) => `${t.row},${t.col}`));
  const cells: Array<{ row: number; col: number }> = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!occupied.has(`${r},${c}`)) cells.push({ row: r, col: c });
    }
  }
  return cells;
}

export function spawnTile(tiles: Tile[]): Tile[] {
  const cells = emptyCells(tiles);
  if (cells.length === 0) return tiles;
  const cell = cells[Math.floor(Math.random() * cells.length)];
  const value = Math.random() < 0.9 ? 2 : 4;
  return [...tiles, createTile(value, cell.row, cell.col, true)];
}

export function initBoard(): Tile[] {
  let tiles: Tile[] = [];
  tiles = spawnTile(tiles);
  tiles = spawnTile(tiles);
  return tiles;
}

export interface MoveResult {
  tiles: Tile[];
  scoreDelta: number;
  moved: boolean;
}

/**
 * Compute the result of a move in a single pass. The stationary merge partner
 * keeps its id and gets a value bump + isMerged flash; the moving tile slides
 * onto the partner's cell with isRemoving (lower z-index, fades out after the
 * slide). This keeps the displayed value correct throughout the animation.
 */
export function move(tiles: Tile[], dir: Direction): MoveResult {
  // Work on copies with flags cleared; preserve original ids.
  const working = tiles.map((t) => ({
    ...t,
    isNew: false,
    isMerged: false,
    isRemoving: false,
  }));

  const order = traversalOrder(dir);
  const vector = vectorFor(dir);

  const grid: (Tile | null)[][] = Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => null)
  );
  for (const t of working) grid[t.row][t.col] = t;

  let scoreDelta = 0;
  let moved = false;
  const result: Tile[] = [];

  for (const { r, c } of order) {
    const tile = grid[r][c];
    if (!tile) continue;

    const { farthest, next } = findFarthest(grid, r, c, vector);
    const inBounds =
      next.row >= 0 && next.row < SIZE && next.col >= 0 && next.col < SIZE;
    const nextTile = inBounds ? grid[next.row][next.col] : null;

    if (nextTile && nextTile.value === tile.value && !nextTile.isMerged) {
      // Merge: the partner (nextTile) stays put and flashes; the moving tile
      // slides onto the same cell, sits underneath, and is removed after.
      moved = true;
      scoreDelta += tile.value * 2;

      grid[r][c] = null;
      // Mark partner as the merged (surviving) tile with doubled value.
      nextTile.value = tile.value * 2;
      nextTile.isMerged = true;
      // Moving tile slides to the partner's cell and is flagged for removal.
      const moving = { ...tile, row: next.row, col: next.col, isRemoving: true };
      result.push(moving);
      // Partner already in result if it was processed earlier; ensure present.
      if (!result.includes(nextTile)) result.push(nextTile);
    } else {
      if (farthest.row !== r || farthest.col !== c) moved = true;
      grid[r][c] = null;
      grid[farthest.row][farthest.col] = tile;
      tile.row = farthest.row;
      tile.col = farthest.col;
      if (!result.includes(tile)) result.push(tile);
    }
  }

  return { tiles: result, scoreDelta, moved };
}

/**
 * After the slide animation finishes, drop the removing tiles. The merged
 * partners (isMerged) are already in the array with their new values.
 */
export function finalize(tiles: Tile[]): Tile[] {
  return tiles
    .filter((t) => !t.isRemoving)
    .map((t) => ({ ...t, isMerged: false }));
}

function traversalOrder(dir: Direction): Array<{ r: number; c: number }> {
  const order: Array<{ r: number; c: number }> = [];
  const rows = [0, 1, 2, 3];
  const cols = [0, 1, 2, 3];
  // Process tiles starting from the edge they're moving toward, so the
  // edge-most tile settles first and later tiles stack/merge behind it.
  if (dir === 'up') {
    for (const r of rows) for (const c of cols) order.push({ r, c });
  } else if (dir === 'down') {
    for (const r of [...rows].reverse()) for (const c of cols) order.push({ r, c });
  } else if (dir === 'left') {
    for (const c of cols) for (const r of rows) order.push({ r, c });
  } else {
    for (const c of [...cols].reverse()) for (const r of rows) order.push({ r, c });
  }
  return order;
}

function vectorFor(dir: Direction): { row: number; col: number } {
  switch (dir) {
    case 'up':
      return { row: -1, col: 0 };
    case 'down':
      return { row: 1, col: 0 };
    case 'left':
      return { row: 0, col: -1 };
    case 'right':
      return { row: 0, col: 1 };
  }
}

function findFarthest(
  grid: (Tile | null)[][],
  row: number,
  col: number,
  vector: { row: number; col: number }
): { farthest: { row: number; col: number }; next: { row: number; col: number } } {
  let prev = { row, col };
  let curr = { row: row + vector.row, col: col + vector.col };

  while (
    curr.row >= 0 &&
    curr.row < SIZE &&
    curr.col >= 0 &&
    curr.col < SIZE &&
    grid[curr.row][curr.col] === null
  ) {
    prev = curr;
    curr = { row: curr.row + vector.row, col: curr.col + vector.col };
  }

  return { farthest: prev, next: curr };
}

export function checkWin(tiles: Tile[]): boolean {
  return tiles.some((t) => t.value === 2048);
}

export function checkGameOver(tiles: Tile[]): boolean {
  const active = tiles.filter((t) => !t.isRemoving);
  if (emptyCells(active).length > 0) return false;

  const grid: number[][] = Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => 0)
  );
  for (const t of active) grid[t.row][t.col] = t.value;

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = grid[r][c];
      if (c + 1 < SIZE && grid[r][c + 1] === v) return false;
      if (r + 1 < SIZE && grid[r + 1][c] === v) return false;
    }
  }
  return true;
}
