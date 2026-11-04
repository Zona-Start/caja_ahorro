'use client';

import { useToast } from '@repo/shadcn/hooks/use-toast';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@repo/shadcn/toast';
import type { ReactNode } from 'react';

const TOAST_DURATION = 6000;

type ToastVariant = 'default' | 'success' | 'destructive' | 'warning' | 'info';

const iconClassName = 'h-4 w-4';

const iconProps = {
  className: iconClassName,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

const infoIcon = (
  <svg {...iconProps}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5" />
    <path d="M12 8h.01" />
  </svg>
);

const variantIconElements: Record<ToastVariant, ReactNode> = {
  default: infoIcon,
  success: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" />
    </svg>
  ),
  destructive: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6" />
      <path d="m15 9-6 6" />
    </svg>
  ),
  warning: (
    <svg {...iconProps}>
      <path d="M10.3 3.8 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  ),
  info: infoIcon,
};

const variantIconStyles: Record<ToastVariant, string> = {
  default: 'bg-muted text-muted-foreground',
  success:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  destructive: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  warning:
    'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  info: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400',
};

function resolveVariant(
  variant: string | null | undefined,
  title: ReactNode,
  description: ReactNode,
): ToastVariant {
  if (
    variant === 'success' ||
    variant === 'destructive' ||
    variant === 'warning' ||
    variant === 'info'
  ) {
    return variant;
  }

  // Algunos módulos invocan el toast directamente sin variante. Se infiere el
  // tipo por el texto para mantener iconos y colores coherentes.
  const text = `${typeof title === 'string' ? title : ''} ${
    typeof description === 'string' ? description : ''
  }`.toLowerCase();

  if (/(error|fall[oa]|no se pudo|inv[aá]lid|incorrect|problema)/.test(text)) {
    return 'destructive';
  }
  if (
    /(advert|atenci[oó]n|warning|cuidado|supera|bloquead|pendiente)/.test(text)
  ) {
    return 'warning';
  }
  if (
    /([eé]xito|correct|cread|actualiz|guardad|eliminad|aprobad|procesad|sincroniz|pagad|enviad)/.test(
      text,
    )
  ) {
    return 'success';
  }

  return 'info';
}

function ToastIcon({ variant }: { variant: ToastVariant }) {
  return (
    <div
      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${variantIconStyles[variant]}`}
    >
      {variantIconElements[variant]}
    </div>
  );
}

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider duration={TOAST_DURATION}>
      {toasts.map(function ({
        id,
        title,
        description,
        action,
        variant: toastVariant,
        duration,
        ...props
      }) {
        const variant = resolveVariant(toastVariant, title, description);
        const toastDuration = duration ?? TOAST_DURATION;

        return (
          <Toast key={id} {...props} variant={variant} duration={toastDuration}>
            <ToastIcon variant={variant} />

            <div className="grid min-w-0 flex-1 gap-0.5">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>

            {action}
            <ToastClose />

            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden"
            >
              <div
                className="toast-progress h-full w-full origin-left bg-current/30 group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]"
                style={{ animationDuration: `${toastDuration}ms` }}
              />
            </div>
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
