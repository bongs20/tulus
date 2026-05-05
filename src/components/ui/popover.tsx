"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type PopoverContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
}

const PopoverContext = React.createContext<PopoverContextValue | null>(null)

function usePopover() {
  const context = React.useContext(PopoverContext)
  if (!context) {
    throw new Error("Popover components must be used within Popover")
  }
  return context
}

function Popover({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </PopoverContext.Provider>
  )
}

function PopoverTrigger({
  asChild,
  children,
}: {
  asChild?: boolean
  children: React.ReactNode
}) {
  const { open, setOpen } = usePopover()

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(
      children as React.ReactElement<{ onClick?: (event: React.MouseEvent) => void }>,
      {
      onClick: (event: React.MouseEvent) => {
        ;(children.props as { onClick?: (event: React.MouseEvent) => void }).onClick?.(
          event
        )
        setOpen(!open)
      },
    })
  }

  return <button onClick={() => setOpen(!open)}>{children}</button>
}

function PopoverContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { open } = usePopover()
  if (!open) {
    return null
  }

  return (
    <div
      className={cn(
        "absolute z-50 mt-2 rounded-md border bg-background p-2 shadow-md",
        className
      )}
      {...props}
    />
  )
}

export { Popover, PopoverContent, PopoverTrigger }
