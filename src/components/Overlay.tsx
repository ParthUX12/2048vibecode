interface OverlayProps {
  status: 'won' | 'over';
  score: number;
  onContinue: () => void;
  onNewGame: () => void;
}

export function Overlay({ status, score, onContinue, onNewGame }: OverlayProps) {
  const isWin = status === 'won';

  return (
    <div className="overlay" role="dialog" aria-modal="true">
      <h2 className="overlay__heading">{isWin ? 'You Win!' : 'Game Over'}</h2>
      {!isWin && (
        <p className="overlay__body">
          Final score: <span style={{ fontWeight: 'var(--weight-bold)' }}>{score}</span>
        </p>
      )}
      <div className="overlay__actions">
        {isWin && (
          <button
            type="button"
            className="btn"
            onClick={onContinue}
            aria-label="Continue playing"
          >
            Continue
          </button>
        )}
        <button
          type="button"
          className="btn btn--primary"
          onClick={onNewGame}
          aria-label="Start new game"
        >
          New Game
        </button>
      </div>
    </div>
  );
}
