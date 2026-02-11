"use client";

import { useCallback, useEffect, useRef } from "react";

type StylesStore = {
  value: string[];
  listeners: Set<() => void>;
};

export function useStyleStore(initialStyles: string[]) {
  const stylesStoreRef = useRef<StylesStore>({
    value: initialStyles,
    listeners: new Set<() => void>(),
  });

  const getStylesSnapshot = useCallback(
    () => stylesStoreRef.current.value,
    [],
  );

  const subscribeStyles = useCallback((listener: () => void) => {
    const store = stylesStoreRef.current;
    store.listeners.add(listener);
    return () => {
      store.listeners.delete(listener);
    };
  }, []);

  const setStylesSnapshot = useCallback((next: string[]) => {
    stylesStoreRef.current.value = next;
    stylesStoreRef.current.listeners.forEach((listener) => listener());
  }, []);

  useEffect(() => {
    setStylesSnapshot(initialStyles);
  }, [initialStyles, setStylesSnapshot]);

  return {
    getStylesSnapshot,
    subscribeStyles,
    setStylesSnapshot,
  };
}
