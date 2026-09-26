import { cn } from "cn"

// The shared parts of the statement and trial-balance tables, which had the same
// frame, the same header-cell classes nine times between them, and their own
// identical copy of Blank. The frame scrolls horizontally rather than collapsing
// into a second mobile layout that would have to be kept in step.
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

// A header cell, left aligned unless a figure column asks for right.
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

// An em dash for a column this row does not sit in: empty, not zero. Hidden from
// screen readers, which should hear the cell as blank rather than as a dash.
function Blank() {
  return (
    <span className="text-muted-foreground" aria-hidden="true">
      —
    </span>
  )
}

export { Blank, TableFrame, Th }
