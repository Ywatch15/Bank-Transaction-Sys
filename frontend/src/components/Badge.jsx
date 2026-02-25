/**
 * Badge.jsx — Small status indicators
 * Used for frozen/active account status, transaction types, etc.
 */
function Badge({ label, variant = "default", size = "sm" }) {
  const baseClasses =
    "inline-flex items-center font-medium rounded-md whitespace-nowrap";

  const variantClasses = {
    default: "bg-gray-800 text-gray-300",
    success: "bg-emerald-900/50 text-emerald-400",
    error: "bg-red-900/50 text-red-400",
    warning: "bg-amber-900/50 text-amber-400",
    info: "bg-brand-900/50 text-brand-300",
    frozen: "bg-red-900/50 text-red-400",
    active: "bg-emerald-900/50 text-emerald-400",
  };

  const sizeClasses = {
    xs: "px-2 py-0.5 text-xs",
    sm: "px-2.5 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
  };

  return (
    <span
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
    >
      {label}
    </span>
  );
}

export default Badge;
