type Listener = (value: boolean) => void;

function createSignal(initial: boolean) {
  let value = initial;
  const listeners = new Set<Listener>();

  return {
    get: () => value,
    set(next: boolean) {
      if (next === value) return;
      value = next;
      listeners.forEach((listener) => listener(next));
    },
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/** True once the first hero card has scrolled into its place. */
export const heroFirstCardSettled = createSignal(false);

/** True while the hero animation has fully played and the cards rest in the grid. */
export const heroGridReady = createSignal(false);
