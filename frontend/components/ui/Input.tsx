import { cn } from '@/lib/cn';

export function Input({
  className,
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-zinc-300">{label}</label>
      )}
      <input
        className={cn(
          'w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500',
          error && 'border-red-500 focus:ring-red-500/50 focus:border-red-500',
          className
        )}
        {...props}
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
