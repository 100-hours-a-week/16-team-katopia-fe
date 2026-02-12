"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";

type CommentCountStore = {
  get: () => number;
  set: (value: number) => void;
  increment: (delta: number) => void;
  subscribe: (listener: () => void) => () => void;
};

function createCommentCountStore(initialValue: number): CommentCountStore {
  let value = initialValue;
  const listeners = new Set<() => void>();
  const emit = () => {
    listeners.forEach((listener) => listener());
  };

  return {
    get: () => value,
    set: (next) => {
      if (next === value) return;
      value = Math.max(0, next);
      emit();
    },
    increment: (delta) => {
      if (delta === 0) return;
      value = Math.max(0, value + delta);
      emit();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

const CommentCountContext = createContext<CommentCountStore | null>(null);

export function CommentCountProvider({
  value,
  children,
}: {
  value: CommentCountStore;
  children: ReactNode;
}) {
  return (
    <CommentCountContext.Provider value={value}>
      {children}
    </CommentCountContext.Provider>
  );
}

export function useCommentCountStore(
  initialValue: number,
  resetKey?: string | number,
) {
  const storeRef = useRef<CommentCountStore | null>(null);

  // eslint-disable-next-line react-hooks/refs
  if (!storeRef.current) {
    storeRef.current = createCommentCountStore(initialValue);
  }

  useEffect(() => {
    storeRef.current?.set(initialValue);
  }, [initialValue, resetKey]);

  // eslint-disable-next-line react-hooks/refs
  return storeRef.current;
}

export function useCommentCount() {
  const store = useContext(CommentCountContext);
  if (!store) {
    throw new Error("useCommentCount must be used within CommentCountProvider");
  }
  const count = useSyncExternalStore(store.subscribe, store.get, store.get);
  return { count, increment: store.increment, set: store.set };
}
