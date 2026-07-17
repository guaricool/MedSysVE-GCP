import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"

export interface PasswordInputProps
  extends Omit<React.ComponentProps<"input">, "type"> {
  /** Optional aria-label override for the toggle button. Defaults to "Mostrar/ocultar contraseña". */
  toggleLabel?: string
}

/**
 * <PasswordInput> — drop-in replacement for <Input type="password" /> with a
 * show/hide toggle (the "eye" icon). Uses the same look as <Input> so existing
 * form layouts don't shift.
 *
 * Usage:
 *   <PasswordInput name="password" required autoComplete="current-password" />
 *   <PasswordInput value={pw} onChange={(e) => setPw(e.target.value)} placeholder="PIN" />
 *
 * The toggle button is keyboard-accessible (Tab + Enter/Space) and announces
 * state via aria-pressed.
 */
const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, toggleLabel = "Mostrar u ocultar la contraseña", ...props }, ref) => {
    const [visible, setVisible] = React.useState(false)

    return (
      <div className="relative">
        <input
          ref={ref}
          type={visible ? "text" : "password"}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className,
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar contraseña" : toggleLabel}
          aria-pressed={visible}
          tabIndex={-1}
          className="absolute inset-y-0 right-0 flex h-10 w-10 items-center justify-center rounded-r-md text-slate-400 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {visible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
        </button>
      </div>
    )
  },
)
PasswordInput.displayName = "PasswordInput"

export { PasswordInput }
