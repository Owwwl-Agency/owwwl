export type ProjectDialogRequest = {
  /** The control that opened the dialog: the opening animation grows out of it. */
  origin?: Element | null;
};

type Listener = (request: ProjectDialogRequest) => void;

const listeners = new Set<Listener>();

export function openProjectDialog(request: ProjectDialogRequest = {}) {
  listeners.forEach((listener) => listener(request));
}

export function subscribeProjectDialog(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
