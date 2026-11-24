import Link from "next/link";

export function PageHeader({ title, subtitle, actions, eyebrow }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-wider text-plum-700">{eyebrow}</p>}
        <h1 className="font-display text-3xl text-stone-900">{title}</h1>
        {subtitle && <p className="mt-1 text-stone-600">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, description, actions, children, className = "" }) {
  return (
    <section className={`min-w-0 rounded-xl border border-stone-200 bg-white shadow-sm ${className}`}>
      {(title || actions) && (
        <header className="flex flex-col gap-2 border-b border-stone-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && <h2 className="font-semibold text-stone-900">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-stone-500">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

export function Field({ label, hint, children, className = "" }) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-sm font-medium text-stone-700">{label}</span>
      {children}
      {hint && <span className="text-xs text-stone-500">{hint}</span>}
    </label>
  );
}

const inputClass =
  "w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-plum-500 focus:outline-none focus:ring-2 focus:ring-plum-200";

export function Input(props) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function Textarea(props) {
  return <textarea rows={4} {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function Select({ children, ...props }) {
  return (
    <select {...props} className={`${inputClass} ${props.className ?? ""}`}>
      {children}
    </select>
  );
}

export function Checkbox({ label, ...props }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-stone-700">
      <input type="checkbox" {...props} className="h-4 w-4 rounded border-stone-300 text-plum-700 focus:ring-plum-300" />
      {label}
    </label>
  );
}

const BADGE_TONES = {
  neutral: "bg-stone-100 text-stone-700",
  plum: "bg-plum-100 text-plum-800",
  green: "bg-emerald-100 text-emerald-800",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-800",
};

export function Badge({ children, tone = "neutral" }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_TONES[tone]}`}>
      {children}
    </span>
  );
}

const STATUS_TONES = { SETUP: "neutral", REGISTRATION: "plum", JUDGING: "amber", COMPLETE: "green" };
const STATUS_LABELS = { SETUP: "Setup", REGISTRATION: "Registration open", JUDGING: "Judging", COMPLETE: "Complete" };

export function StatusBadge({ status }) {
  return <Badge tone={STATUS_TONES[status]}>{STATUS_LABELS[status] ?? status}</Badge>;
}

const LINK_VARIANTS = {
  primary: "bg-plum-700 text-white hover:bg-plum-800",
  secondary: "bg-white text-stone-800 border border-stone-300 hover:bg-stone-50",
};

export function ButtonLink({ href, children, variant = "primary", className = "" }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-md px-3.5 py-2 text-sm font-medium transition-colors ${LINK_VARIANTS[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}

export function EmptyState({ title, children }) {
  return (
    <div className="rounded-lg border border-dashed border-stone-300 px-6 py-8 text-center">
      <p className="font-medium text-stone-700">{title}</p>
      {children && <div className="mt-1 text-sm text-stone-500">{children}</div>}
    </div>
  );
}

export function Notice({ children, tone = "plum" }) {
  const tones = {
    plum: "border-plum-200 bg-plum-50 text-plum-900",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    green: "border-emerald-200 bg-emerald-50 text-emerald-900",
  };
  return <div className={`rounded-lg border px-4 py-3 text-sm ${tones[tone]}`}>{children}</div>;
}
