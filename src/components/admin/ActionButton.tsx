import { ButtonHTMLAttributes, forwardRef } from 'react';
import { VariantProps, cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const actionButtonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // Vermelho sólido - ação principal
        primary: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',

        // Contorno vermelho - ação secundária
        outlineRed: 'border border-red-600 text-red-400 hover:bg-red-600/10 hover:text-red-300 active:bg-red-600/20',

        // Contorno branco - ação neutra
        outlineWhite: 'border border-white text-white hover:bg-red-600 hover:border-red-600 active:bg-red-700',

        // Vermelho escuro - ação destrutiva
        danger: 'bg-red-700 text-white hover:bg-red-800 active:bg-red-900',

        // Verde - ação de sucesso/aprovação
        success: 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800',

        // Cinza - ação desabilitada ou neutra
        ghost: 'text-zinc-300 hover:bg-zinc-800 hover:text-white active:bg-zinc-700',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export interface ActionButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof actionButtonVariants> {
  asChild?: boolean;
}

const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(actionButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

ActionButton.displayName = 'ActionButton';

export { ActionButton, actionButtonVariants };
