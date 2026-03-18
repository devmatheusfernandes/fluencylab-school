import { twMerge } from "tailwind-merge";
type KeyState = "correct" | "present" | "absent" | "empty" | "unknown";

type KeyboardProps = {
  onLetter: (ch: string) => void;
  onEnter: () => void;
  onBackspace: () => void;
  letterStates?: Record<string, KeyState>;
  disabled?: boolean;
  className?: string;
};

const rows = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["enter", "z", "x", "c", "v", "b", "n", "m", "backspace"],
];

function keyClass(state: KeyState) {
  if (state === "correct")
    return "bg-emerald-500 text-white border-transparent";
  if (state === "present") return "bg-amber-500 text-white border-transparent";
  if (state === "absent")
    return "bg-neutral-400 dark:bg-neutral-600 text-white border-transparent opacity-60";
  return "bg-neutral-200 dark:bg-neutral-800 text-foreground border-transparent";
}

export function Keyboard({
  onLetter,
  onEnter,
  onBackspace,
  letterStates = {},
  disabled,
  className,
}: KeyboardProps) {
  return (
    <div
      className={twMerge("flex flex-col gap-1.5 sm:gap-2 w-full", className)}
    >
      {rows.map((row, idx) => (
        <div
          key={idx}
          className="flex items-center justify-center gap-1 sm:gap-1.5 w-full"
        >
          {idx === 1 && <div className="flex-[0.5]"></div>}

          {row.map((key) => {
            const state = letterStates[key] || "unknown";
            const isAction = key === "enter" || key === "backspace";
            const content =
              key === "enter"
                ? "ENTER"
                : key === "backspace"
                  ? "⌫"
                  : key.toUpperCase();

            const flexWidth = isAction ? "flex-[1.5]" : "flex-1";

            const base = `h-12 sm:h-14 ${flexWidth} rounded font-semibold text-xs sm:text-sm flex items-center justify-center select-none transition-colors duration-200 shadow-sm active:scale-95`;
            const cls = twMerge(base, keyClass(state));

            const handler =
              key === "enter"
                ? onEnter
                : key === "backspace"
                  ? onBackspace
                  : () => onLetter(key);

            const ariaLabel =
              key === "enter"
                ? "Enter"
                : key === "backspace"
                  ? "Apagar letra"
                  : `Letra ${key.toUpperCase()}`;

            return (
              <button
                key={key}
                className={cls}
                type="button"
                onClick={disabled ? undefined : handler}
                disabled={disabled}
                aria-label={ariaLabel}
              >
                {content}
              </button>
            );
          })}

          {idx === 1 && <div className="flex-[0.5]"></div>}
        </div>
      ))}
    </div>
  );
}
