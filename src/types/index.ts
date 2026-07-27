export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Tile {
  id: string;
  value: number;
  row: number;
  col: number;
  isNew: boolean;
  isMerged: boolean;
  isRemoving: boolean;
}

export interface GameState {
  tiles: Tile[];
  score: number;
  best: number;
  moves: number;
  status: 'playing' | 'won' | 'over';
  canUndo: boolean;
}
