interface HeaderProps {
  onNewGame: () => void;
  onUndo: () => void;
  canUndo: boolean;
}

export function Header({ onNewGame, onUndo, canUndo }: HeaderProps) {
  return (
    <header className="header">
      <h1 className="header__title">2048</h1>
      <div className="header__actions">
        <button
          type="button"
          className="btn"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo last move"
        >
          Undo
        </button>
        <button
          type="button"
          className="btn btn--primary"
          onClick={onNewGame}
          aria-label="Start new game"
        >
          New Game
        </button>
      </div>
    </header>
  );
}
