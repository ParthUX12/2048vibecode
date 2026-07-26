interface ScoreBoardProps {
  score: number;
  best: number;
  moves: number;
}

export function ScoreBoard({ score, best, moves }: ScoreBoardProps) {
  return (
    <div
      className="stats"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="stat-card">
        <span className="stat-card__caption">Score</span>
        <span className="stat-card__value">{score}</span>
      </div>
      <div className="stat-card">
        <span className="stat-card__caption">Best</span>
        <span className="stat-card__value">{best}</span>
      </div>
      <div className="stat-card">
        <span className="stat-card__caption">Moves</span>
        <span className="stat-card__value">{moves}</span>
      </div>
    </div>
  );
}
