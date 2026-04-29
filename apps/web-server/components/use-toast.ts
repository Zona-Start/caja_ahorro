'use client';

// Inspired by react-hot-toast library
import * as React from 'react';
import { toast as sonnerToast } from 'sonner';

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

interface ToasterToast {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

const listeners: Array<(state: State) => void> = [];

interface State {
  toasts: ToasterToast[];
}

let memoryState: State = { toasts: [] };

type Action = { type: 'DISMISS_TOAST'; toastId?: string };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

const toast = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  const id = genId();

  const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id });

  sonnerToast(title, {
    description,
    onDismiss: dismiss,
  });

  return {
    id,
    dismiss,
  };
};

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: 'DISMISS_TOAST', toastId }),
  };
}

export { toast, useToast };
function reducer(
  memoryState: State,
  action: { type: 'DISMISS_TOAST'; toastId?: string },
): State {
  switch (action.type) {
    case 'DISMISS_TOAST':
      return {
        ...memoryState,
        toasts: action.toastId
          ? memoryState.toasts.filter((toast) => toast.id !== action.toastId)
          : [],
      };
    default:
      return memoryState;
  }
}
