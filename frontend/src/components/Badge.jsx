/**
 * Badge.jsx — Small status indicators
 * Used for frozen/active account status, transaction types, etc.
 */
function Badge({ label, variant = 'default', size = 'sm' }) {
  const baseClasses = 'inline-flex items-center font-medium rounded-md whitespace-nowrap';
 
  const variantClasses = {
    default: 'bg-surface-100 text-surface-900',
    success: 'bg-credit-50 text-credit-700',
    error: 'bg-debit-50 text-debit-700',
    warning: 'bg-amber-50 text-amber-700',
    info: 'bg-primary-50 text-primary-700',
    frozen: 'bg-red-100 text-red-800',
    active: 'bg-green-100 text-green-800',
  };

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}>
      {label}
    </span>
  );
}

export default Badge;
