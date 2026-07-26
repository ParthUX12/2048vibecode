import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { Direction, GameState, Tile } from '@/types';
import {
  applyMerges,
  checkGameOver,
  checkWin,
  initBoard,
  move,
  spawnTile,
  type MergeInfo,
} from '@/utils/gameLogic';
import { useLocalStorage } from './useLocalStorage';

type Action =
  | { type: 'MOVE'; dir: Direction }
  | { type: 'MERGE_PHASE' }
  | { type: 'NEW_GAME' }
  | { type: 'UNDO' }
  | { type: 'CONTINUE' };

interface InternalState extends GameState {
  previous: GameState | null;
  continued: boolean;
  animating: boolean;
  pendingMerges: MergeInfo[];
}

function freshState(best: number): InternalState {
  const tiles = initBoard();
  return {
    tiles,
    score: 0,
    best,
    moves: 0,
    status: 'playing',
    canUndo: false,
    previous: null,
    continued: false,
    animating: false,
    pendingMerges: [],
  };
}

const SLIDE_MS = 180;

function reducer(state: InternalState, action: Action): InternalState {
  switch (action.type) {
    case 'MOVE': {
      if (state.status !== 'playing' || state.animating) return state;
      const result = move(state.tiles, action.dir);
      if (!result.moved) return state;

      const snapshot: GameState = {
        tiles: state.tiles,
        score: state.score,
        best: state.best,
        moves: state.moves,
        status: state.status,
        canUndo: state.canUndo,
      };

      const newScore = state.score + result.scoreDelta;

      return {
        ...state,
        tiles: result.tiles,
        score: newScore,
        best: Math.max(state.best, newScore),
        moves: state.moves + 1,
        canUndo: true,
        previous: snapshot,
        animating: true,
        pendingMerges: result.merges,
      };
    }

    case 'MERGE_PHASE': {
      if (!state.animating) return state;

      const merged = applyMerges(state.tiles, state.pendingMerges);
      const spawned = spawnTile(merged);

      let status: GameState['status'] = 'playing';
      if (!state.continued && checkWin(spawned)) {
        status = 'won';
      } else if (checkGameOver(spawned)) {
        status = 'over';
      }

      return {
        ...state,
        tiles: spawned,
        status,
        animating: false,
        pendingMerges: [],
      };
    }

    case 'NEW_GAME': {
      return freshState(state.best);
    }

    case 'UNDO': {
      if (!state.canUndo || !state.previous || state.animating) return state;
      return {
        ...state.previous,
        previous: null,
        canUndo: false,
        continued: state.continued,
        animating: false,
        pendingMerges: [],
      };
    }

    case 'CONTINUE': {
      if (state.animating) return state;
      return { ...state, status: 'playing', continued: true };
    }

    default:
      return state;
  }
}

export function useGame() {
  const [best, setBest] = useLocalStorage<number>('2048-best', 0);
  const [state, dispatch] = useReducer(reducer, best, freshState);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (state.best > best) setBest(state.best);
  }, [state.best, best, setBest]);

  const handleMove = useCallback((dir: Direction) => {
    dispatch({ type: 'MOVE', dir });
  }, []);

  // After MOVE enters the animating phase, schedule the merge phase so the
  // slide transition (180ms) completes before tiles collapse.
  useEffect(() => {
    if (!state.animating) return;
    timerRef.current = window.setTimeout(() => {
      dispatch({ type: 'MERGE_PHASE' });
      timerRef.current = null;
    }, SLIDE_MS);

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [state.animating]);

  const newGame = useCallback(() => dispatch({ type: 'NEW_GAME' }), []);
  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const continueGame = useCallback(() => dispatch({ type: 'CONTINUE' }), []);

  // Keyboard controls
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        w: 'up',
        s: 'down',
        a: 'left',
        d: 'right',
        W: 'up',
        S: 'down',
        A: 'left',
        D: 'right',
      };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        handleMove(dir);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleMove]);

  // Swipe controls
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;

    let startX = 0;
    let startY = 0;
    let tracking = false;

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      tracking = true;
    };

    const onMove = (e: TouchEvent) => {
      if (!tracking) return;
      // Block the browser's native scroll / pull-to-refresh while the user is
      // swiping on the board so the gesture controls the game instead.
      e.preventDefault();
    };

    const onEnd = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      const threshold = 40;
      if (Math.max(absX, absY) < threshold) return;

      if (absX > absY) {
        handleMove(dx > 0 ? 'right' : 'left');
      } else {
        handleMove(dy > 0 ? 'down' : 'up');
      }
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
    };
  }, [handleMove]);

  const gameState: GameState = {
    tiles: state.tiles,
    score: state.score,
    best: state.best,
    moves: state.moves,
    status: state.status,
    canUndo: state.canUndo,
  };

  return {
    state: gameState,
    boardRef,
    move: handleMove,
    newGame,
    undo,
    continueGame,
  };
}

export type { Tile };
