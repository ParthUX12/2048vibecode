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

function resetFlags(tiles: Tile[]): Tile[] {
  return tiles.map((t) => ({ ...t, isNew: false, isMerged: false }));
}

export interface MergeInfo {
  newId: string;
  value: number;
  row: number;
  col: number;
  sourceIds: [string, string];
}

export interface MoveResult {
  tiles: Tile[];
  merges: MergeInfo[];
  scoreDelta: number;
  moved: boolean;
}

export function move(tiles: Tile[], dir: Direction): MoveResult {
  const cleared = resetFlags(tiles);

  const traversals = buildTraversals(dir);
  const vector = vectorFor(dir);

  // Grid holds the source tile currently occupying each cell during traversal.
  const grid: (Tile | null)[][] = Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => null)
  );
  for (const t of cleared) grid[t.row][t.col] = t;

  let scoreDelta = 0;
  let moved = false;
  const merges: MergeInfo[] = [];
  // Cells that have already received a merge target.
  const mergedAt: Set<string> = new Set();
  // Slide phase tiles: source tiles repositioned to their final cell.
  const slideTiles: Tile[] = [];

  for (const r of traversals.rows) {
    for (const c of traversals.cols) {
      const tile = grid[r][c];
      if (!tile) continue;

      const { farthest, next } = findFarthest(grid, r, c, vector);
      const nextKey = `${next.row},${next.col}`;
      const farKey = `${farthest.row},${farthest.col}`;

      const inBounds =
        next.row >= 0 && next.row < SIZE && next.col >= 0 && next.col < SIZE;
      const nextTile = inBounds ? grid[next.row][next.col] : null;

      if (
        nextTile &&
        nextTile.value === tile.value &&
        !mergedAt.has(nextKey)
      ) {
        // Merge: current tile slides onto the next tile's cell, both then
        // collapse into a new merged tile after the slide animation.
        mergedAt.add(nextKey);
        scoreDelta += tile.value * 2;
        moved = true;

        grid[r][c] = null;

        slideTiles.push({ ...tile, row: next.row, col: next.col });
        // nextTile stays in place (already at merge cell); keep it in slideTiles.
        slideTiles.push({ ...nextTile, row: next.row, col: next.col });

        merges.push({
          newId: crypto.randomUUID(),
          value: tile.value * 2,
          row: next.row,
          col: next.col,
          sourceIds: [tile.id, nextTile.id],
        });
      } else {
        if (farKey !== `${r},${c}`) moved = true;
        grid[r][c] = null;
        grid[farthest.row][farthest.col] = tile;
        slideTiles.push({ ...tile, row: farthest.row, col: farthest.col });
      }
    }
  }

  return { tiles: slideTiles, merges, scoreDelta, moved };
}

/**
 * Apply pending merges to the slid tiles: remove the two source tiles for each
 * merge and insert the merged tile (flagged isMerged) in their place.
 */
export function applyMerges(tiles: Tile[], merges: MergeInfo[]): Tile[] {
  if (merges.length === 0) return tiles;
  const removeIds = new Set(merges.flatMap((m) => m.sourceIds));
  const mergedTiles: Tile[] = merges.map((m) => ({
    id: m.newId,
    value: m.value,
    row: m.row,
    col: m.col,
    isNew: false,
    isMerged: true,
  }));
  return [...tiles.filter((t) => !removeIds.has(t.id)), ...mergedTiles];
}

function buildTraversals(dir: Direction): {
  rows: number[];
  cols: number[];
} {
  const rows = [0, 1, 2, 3];
  const cols = [0, 1, 2, 3];
  if (dir === 'down') rows.reverse();
  if (dir === 'right') cols.reverse();
  return { rows, cols };
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
  if (emptyCells(tiles).length > 0) return false;

  const grid: number[][] = Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => 0)
  );
  for (const t of tiles) grid[t.row][t.col] = t.value;

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = grid[r][c];
      if (c + 1 < SIZE && grid[r][c + 1] === v) return false;
      if (r + 1 < SIZE && grid[r + 1][c] === v) return false;
    }
  }
  return true;
}
