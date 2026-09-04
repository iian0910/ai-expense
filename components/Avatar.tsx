const PALETTE = ["#f97316", "#3b82f6", "#10b981", "#a855f7", "#ec4899", "#eab308"];

function colorFor(source: string) {
  const sum = Array.from(source).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return PALETTE[sum % PALETTE.length];
}

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
}

export function Avatar({ src, name, size = 32, className = "" }: AvatarProps) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        style={{ width: size, height: size }}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  const initial = (name || "?").trim().charAt(0).toUpperCase() || "?";

  return (
    <span
      style={{ width: size, height: size, fontSize: size * 0.42, backgroundColor: colorFor(name) }}
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${className}`}
    >
      {initial}
    </span>
  );
}
