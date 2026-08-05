import { useState, useCallback, useEffect, useRef } from "react";
import type { Clip, TextOverlay, MusicSelection, StudioMode } from "@/lib/studio/types";
import type { MixerState } from "@/components/studio/AudioHub";

interface StudioState {
  mode: StudioMode;
  clips: Clip[];
  overlays: TextOverlay[];
  music: MusicSelection | null;
  mixer: MixerState;
  voiceoverUrl: string | null;
  caption: string;
  textValue: string;
  textBg: number;
}

const STORAGE_KEY = "javan_studio_autosave";
const MAX_HISTORY = 50;

export function useStudioHistory(initialState: StudioState) {
  const [state, setState] = useState<StudioState>(initialState);
  const [history, setHistory] = useState<StudioState[]>([]);
  const [pointer, setPointer] = useState(-1);
  const isInternalUpdate = useRef(false);

  // Load from Auto-Save on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Note: Blobs in clips won't survive JSON.stringify/parse. 
        // In a real app, we'd store them in IndexedDB. 
        // For now, we'll restore what we can.
        setState(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Failed to restore studio state", e);
      }
    }
  }, []);

  // Auto-Save to localStorage
  useEffect(() => {
    const { clips, ...rest } = state;
    // We don't save the actual blobs to localStorage (too big/fails)
    // but we save the rest of the metadata.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  }, [state]);

  const pushState = useCallback((newState: StudioState | ((prev: StudioState) => StudioState)) => {
    setState(prev => {
      const next = typeof newState === "function" ? newState(prev) : newState;
      
      // Don't push to history if it's an internal undo/redo update
      if (!isInternalUpdate.current) {
        setHistory(prevHist => {
          const newHist = prevHist.slice(0, pointer + 1);
          newHist.push(next);
          if (newHist.length > MAX_HISTORY) newHist.shift();
          setPointer(newHist.length - 1);
          return newHist;
        });
      }
      isInternalUpdate.current = false;
      return next;
    });
  }, [pointer]);

  const undo = useCallback(() => {
    if (pointer > 0) {
      isInternalUpdate.current = true;
      const nextPointer = pointer - 1;
      setPointer(nextPointer);
      setState(history[nextPointer]);
    }
  }, [pointer, history]);

  const redo = useCallback(() => {
    if (pointer < history.length - 1) {
      isInternalUpdate.current = true;
      const nextPointer = pointer + 1;
      setPointer(nextPointer);
      setState(history[nextPointer]);
    }
  }, [pointer, history]);

  const canUndo = pointer > 0;
  const canRedo = pointer < history.length - 1 && history.length > 0;

  return {
    state,
    setState: pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory: () => {
      setHistory([]);
      setPointer(-1);
      localStorage.removeItem(STORAGE_KEY);
    }
  };
}
