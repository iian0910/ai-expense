function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.82-.07-1.42-.22-2.04H12v3.71h6.5c-.13 1.03-.85 2.6-2.44 3.65l-.02.15 3.55 2.72.25.02c2.26-2.06 3.65-5.1 3.65-8.21Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.06 7.94-2.87l-3.78-2.9c-1.01.68-2.37 1.16-4.16 1.16-3.18 0-5.87-2.09-6.83-4.96l-.14.01-3.72 2.85-.05.13C3.24 21.3 7.28 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.17 14.43a7.24 7.24 0 0 1-.4-2.43c0-.85.15-1.67.39-2.43l-.01-.16-3.77-2.9-.12.06A11.96 11.96 0 0 0 0 12c0 1.93.47 3.76 1.27 5.43l3.9-3Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c2.26 0 3.79.97 4.66 1.79l3.4-3.3C17.94 1.24 15.24 0 12 0 7.28 0 3.24 2.7 1.27 6.57l3.9 3.02C6.13 6.84 8.82 4.75 12 4.75Z"
      />
    </svg>
  );
}

interface OAuthButtonsProps {
  disabled?: boolean;
  label?: string;
}

export function OAuthButtons({ disabled = false, label = "or continue with" }: OAuthButtonsProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full items-center gap-3 text-xs text-zinc-400 dark:text-zinc-500">
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        {label}
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <a
        href={disabled ? undefined : "/api/auth/google"}
        aria-disabled={disabled}
        aria-label="使用 Google 繼續"
        className={`flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm transition active:scale-95 dark:border-zinc-700 dark:bg-zinc-900 ${
          disabled ? "pointer-events-none opacity-50" : ""
        }`}
      >
        <GoogleIcon />
      </a>
    </div>
  );
}
