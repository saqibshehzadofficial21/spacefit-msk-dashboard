import { Loader2 } from 'lucide-react';

const VARIANTS = { primary: 'btn-primary', secondary: 'btn-secondary', ghost: 'btn-ghost', danger: 'btn-danger' };
const SIZES = { sm: 'px-2.5 py-1.5 text-xs', md: '', lg: 'px-5 py-2.5 text-base' };

export default function Button({ variant = 'primary', size = 'md', icon: Icon, loading = false, className = '', children, type = 'button', ...props }) {
  return (
    <button type={type} className={`${VARIANTS[variant]} ${SIZES[size]} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
