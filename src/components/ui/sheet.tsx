"use client"

import * as React from "react"

import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"

const Sheet = Dialog
const SheetTrigger = DialogTrigger

const SheetContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof DialogContent> & {
    side?: "left" | "right" | "top" | "bottom"
  }
>(({ side = "right", className, ...props }, ref) => (
  <DialogContent
    ref={ref}
    className={[
      side === "left" ? "ml-0 mr-auto h-full max-w-sm rounded-none" : "",
      side === "right" ? "ml-auto mr-0 h-full max-w-sm rounded-none" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ")}
    {...props}
  />
))

SheetContent.displayName = "SheetContent"

export { Sheet, SheetContent, SheetTrigger }
