"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type DropdownMenuContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(
  null
)

function useDropdownMenu() {
  const context = React.useContext(DropdownMenuContext)
  if (!context) {
    throw new Error("DropdownMenu components must be used within DropdownMenu")
  }
  return context
}

function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative">{children}</div>
    </DropdownMenuContext.Provider>
  )
}

function DropdownMenuTrigger({
  asChild,
  children,
}: {
  asChild?: boolean
  children: React.ReactNode
}) {
  const { open, setOpen } = useDropdownMenu()

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

function DropdownMenuContent({
  className,
  align = "start",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  align?: "start" | "end"
}) {
  const { open } = useDropdownMenu()
  if (!open) {
    return null
  }

  return (
    <div
      className={cn(
        "absolute right-0 z-50 mt-2 min-w-48 rounded-md border bg-background p-1 shadow-md",
        align === "start" && "left-0 right-auto",
        className
      )}
      {...props}
    />
  )
}

const DropdownMenuItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, onClick, ...props }, ref) => {
  const { setOpen } = useDropdownMenu()

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground",
        className
      )}
      onClick={(event) => {
        onClick?.(event)
        setOpen(false)
      }}
      {...props}
    />
  )
})

DropdownMenuItem.displayName = "DropdownMenuItem"

const DropdownMenuLabel = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("px-2 py-1.5 text-sm font-semibold", className)} {...props} />
)

const DropdownMenuSeparator = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("my-1 h-px bg-border", className)} {...props} />
)

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
}
