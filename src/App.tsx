import { Board } from '@/components/Board';
import { Header } from '@/components/Header';
import { Overlay } from '@/components/Overlay';
import { ScoreBoard } from '@/components/ScoreBoard';
import { useGame } from '@/hooks/useGame';

function App() {
  const { state, boardRef, newGame, undo, continueGame } = useGame();

  return (
    <main className="container">
      <Header onNewGame={newGame} onUndo={undo} canUndo={state.canUndo} />
      <ScoreBoard score={state.score} best={state.best} moves={state.moves} />
      <Board tiles={state.tiles} boardRef={boardRef}>
        {(state.status === 'won' || state.status === 'over') && (
          <Overlay
            status={state.status}
            score={state.score}
            onContinue={continueGame}
            onNewGame={newGame}
          />
        )}
      </Board>
      <p className="hint">
        Use arrow keys or WASD to move. For mobile or touch screen devices, swipe on board to move.
      </p>
    </main>
  );
}

export default App;
