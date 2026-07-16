// src/components/ui/Button.tsx
import { clsx } from 'clsx';
import { LucideIcon } from 'lucide-react';

interface Props {
  children?: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'md';
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  title?: string;
}

const VARIANT = {
  primary:   'bg-brand text-white hover:bg-brand-dark border-brand hover:border-brand-dark shadow-sm',
  secondary: 'bg-white text-text-primary hover:bg-enterprise-50 border-enterprise-200 shadow-sm',
  ghost:     'bg-transparent text-text-secondary hover:bg-enterprise-100 border-transparent',
  danger:    'bg-danger-bg text-danger hover:bg-danger/10 border-danger/20',
  success:   'bg-success-bg text-success hover:bg-success/10 border-success/20',
};

const SIZE = {
  xs: 'h-6 px-2 text-xs gap-1',
  sm: 'h-7 px-3 text-xs gap-1.5',
  md: 'h-8 px-4 text-sm gap-2',
};

export function Button({
  children, onClick, variant = 'secondary', size = 'sm',
  icon: Icon, iconRight: IconRight, disabled, type = 'button', className, title
}: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={clsx(
        'inline-flex items-center justify-center font-medium rounded border',
        'transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand/30',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANT[variant],
        SIZE[size],
        className
      )}
    >
      {Icon && <Icon size={size === 'xs' ? 11 : 13} />}
      {children}
      {IconRight && <IconRight size={size === 'xs' ? 11 : 13} />}
    </button>
  );
}

// Icon-only button
export function IconButton({ icon: Icon, onClick, title, variant = 'ghost', size = 'sm', className }: {
  icon: LucideIcon; onClick?: () => void; title?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; size?: 'xs' | 'sm' | 'md'; className?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={clsx(
        'inline-flex items-center justify-center rounded border transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-brand/30',
        VARIANT[variant],
        size === 'xs' ? 'w-6 h-6' : size === 'sm' ? 'w-7 h-7' : 'w-8 h-8',
        className
      )}
    >
      <Icon size={size === 'xs' ? 12 : 14} />
    </button>
  );
}
