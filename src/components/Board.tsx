import type { RefObject } from 'react';
import type { Tile as TileType } from '@/types';
import { SIZE } from '@/utils/gameLogic';
import { Tile } from './Tile';

interface BoardProps {
  tiles: TileType[];
  boardRef: RefObject<HTMLDivElement | null>;
  children?: React.ReactNode;
}

export function Board({ tiles, boardRef, children }: BoardProps) {
  const cells = Array.from({ length: SIZE * SIZE });

  return (
    <div className="board-wrapper">
      <div
        className="board"
        ref={boardRef as React.RefObject<HTMLDivElement>}
        role="grid"
        aria-label="2048 game board"
        tabIndex={-1}
      >
        {cells.map((_, i) => (
          <div key={i} className="cell" role="gridcell" aria-hidden="true" />
        ))}
      </div>
      <div className="tile-layer">
        {tiles.map((tile) => (
          <Tile key={tile.id} tile={tile} />
        ))}
      </div>
      {children}
    </div>
  );
}
