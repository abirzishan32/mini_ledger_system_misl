import { cn } from "cn"

/**
 * The shared parts of the statement and trial-balance tables. Both had the
 * same frame, the same header-cell classes repeated nine times between them,
 * and their own identical copy of Blank.
 */
function TableFrame({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10",
        className
      )}
      {...props}
    />
  )
}

function Th({
  align = "left",
  className,
  ...props
}: React.ComponentProps<"th"> & { align?: "left" | "right" }) {
  return (
    <th
      scope="col"
      className={cn(
        "px-4 py-2.5 font-medium",
        align === "right" ? "text-right" : "text-left",
        className
      )}
      {...props}
    />
  )
}

/** An em dash for a column this row does not sit in — empty, not zero. */
function Blank() {
  return (
    <span className="text-muted-foreground" aria-hidden="true">
      —
    </span>
  )
}

export { Blank, TableFrame, Th }
