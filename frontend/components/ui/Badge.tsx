import { cn } from '@/lib/cn';

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: 'default' | 'success' | 'warning' | 'danger';
};

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        variant === 'default' && 'bg-zinc-700 text-zinc-300',
        variant === 'success' && 'bg-emerald-900/50 text-emerald-300',
        variant === 'warning' && 'bg-violet-900/50 text-violet-300',
        variant === 'danger' && 'bg-red-900/50 text-red-300',
        className
      )}
      {...props}
    />
  );
}
