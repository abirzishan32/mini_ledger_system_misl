import * as React from "react"
import { cn } from "cn"

/**
 * A styled native <select>, not a listbox rebuilt out of divs.
 *
 * The platform control is already keyboard operable, already announces itself
 * to a screen reader, and already opens as a wheel on iOS and a dialog on
 * Android. Restyling it is the whole job; rebuilding it would mean owning
 * focus management and typeahead to arrive back where we started.
 */
function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="native-select"
      className={cn(
        "h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm dark:bg-input/30",
        className
      )}
      {...props}
    />
  )
}

export { NativeSelect }
