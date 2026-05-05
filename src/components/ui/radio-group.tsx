"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type RadioGroupContextValue = {
  name: string
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null)

const RadioGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: string
    defaultValue?: string
    onValueChange?: (value: string) => void
    disabled?: boolean
  }
>(({ className, value, defaultValue, onValueChange, disabled, ...props }, ref) => {
  const generatedName = React.useId()
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const currentValue = value ?? internalValue

  const handleChange = (nextValue: string) => {
    if (value === undefined) {
      setInternalValue(nextValue)
    }
    onValueChange?.(nextValue)
  }

  return (
    <RadioGroupContext.Provider
      value={{
        name: generatedName,
        value: currentValue,
        onValueChange: handleChange,
        disabled,
      }}
    >
      <div ref={ref} className={cn("grid gap-2", className)} {...props} />
    </RadioGroupContext.Provider>
  )
})

RadioGroup.displayName = "RadioGroup"

const RadioGroupItem = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, value, disabled, ...props }, ref) => {
  const context = React.useContext(RadioGroupContext)
  if (!context) {
    throw new Error("RadioGroupItem must be used within RadioGroup")
  }

  return (
    <input
      ref={ref}
      type="radio"
      className={cn("h-4 w-4 accent-primary", className)}
      name={context.name}
      value={value}
      checked={context.value === value}
      disabled={context.disabled || disabled}
      onChange={(event) => context.onValueChange?.(event.target.value)}
      {...props}
    />
  )
})

RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
