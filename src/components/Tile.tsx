import type { Tile as TileType } from '@/types';

interface TileProps {
  tile: TileType;
}

export function Tile({ tile }: TileProps) {
  const style: React.CSSProperties = {
    top: `calc(var(--gap) + ${tile.row} * (var(--tile-size) + var(--gap)))`,
    left: `calc(var(--gap) + ${tile.col} * (var(--tile-size) + var(--gap)))`,
    background: `var(--tile-${tile.value})`,
    color: `var(--tile-text-${tile.value})`,
    zIndex: tile.isRemoving ? 1 : 2,
  };

  const className = [
    'tile',
    tile.isNew ? 'tile--new' : '',
    tile.isMerged ? 'tile--merged' : '',
    tile.isRemoving ? 'tile--removing' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={className}
      style={style}
      role="gridcell"
      aria-label={`Tile ${tile.value}`}
    >
      {tile.value}
    </div>
  );
}
