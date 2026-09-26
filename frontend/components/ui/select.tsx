"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "cn"

// A listbox built from Base UI's Select, used only by the account type picker.
// The native <select> in native-select.tsx is still the better control for a
// plain list of words and stays in use elsewhere. This exists for the one case
// it cannot cover: options carrying an icon and a colour, which a browser will
// not render inside an <option> at all.
// Root takes a name, so it posts its value with the surrounding form exactly as
// the native element would, and the server reads it the same way.
function Select(props: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        "flex h-10 w-full select-none items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-[disabled]:pointer-events-none data-[disabled]:cursor-not-allowed data-[disabled]:bg-input/50 data-[disabled]:opacity-50 md:text-sm dark:bg-input/30",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon className="shrink-0 text-muted-foreground">
        <ChevronsUpDown className="size-4" aria-hidden="true" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Popup>) {
  return (
    <SelectPrimitive.Portal>
      {/* alignItemWithTrigger={false} keeps the list under the field rather
          than overlaying it, which is what a form field wants. */}
      <SelectPrimitive.Positioner
        sideOffset={6}
        alignItemWithTrigger={false}
        className="z-50 outline-none"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          className={cn(
            "max-h-72 w-[var(--anchor-width)] origin-[var(--transform-origin)] overflow-y-auto rounded-xl bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10 transition-[transform,scale,opacity] data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
            className
          )}
          {...props}
        >
          {children}
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "flex cursor-default select-none items-center gap-2.5 rounded-lg py-2 pl-2.5 pr-2 text-sm outline-none data-[highlighted]:bg-muted",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.ItemIndicator className="ml-auto text-muted-foreground">
        <Check className="size-4" aria-hidden="true" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

const SelectValue = SelectPrimitive.Value
const SelectItemText = SelectPrimitive.ItemText

export {
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  SelectValue,
}
