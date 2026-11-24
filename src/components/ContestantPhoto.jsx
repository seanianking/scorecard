// Contestant headshot with an initials placeholder. `url` comes from photoUrl() in src/lib/photos.js.
const SIZES = {
  sm: "h-9 w-9 text-xs",
  md: "h-14 w-14 text-base",
  lg: "h-32 w-32 text-3xl",
  xl: "h-56 w-56 text-5xl sm:h-64 sm:w-64",
};

export default function ContestantPhoto({ url, name, size = "md", className = "" }) {
  const initials = (name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
  const base = `${SIZES[size]} flex-none overflow-hidden rounded-lg ${size === "sm" ? "rounded-full" : ""} ${className}`;

  if (!url) {
    return (
      <div
        className={`${base} flex items-center justify-center bg-plum-100 font-display text-plum-700`}
        aria-label={`No photo for ${name}`}
        role="img"
      >
        {initials}
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element -- served by an authenticated route, not optimizable
  return <img src={url} alt={`Photo of ${name}`} className={`${base} bg-stone-100 object-cover`} />;
}
