"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type SelectOption = {
  value: string
  label: React.ReactNode
}

type SelectContextValue = {
  value?: string
  placeholder?: React.ReactNode
  disabled?: boolean
  onValueChange?: (value: string) => void
  options: SelectOption[]
}

const SelectContext = React.createContext<SelectContextValue | null>(null)

function Select({
  children,
  onValueChange,
  defaultValue,
  value,
  disabled,
}: {
  children: React.ReactNode
  onValueChange?: (value: string) => void
  defaultValue?: string
  value?: string
  disabled?: boolean
}) {
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const currentValue = value ?? internalValue

  const options: SelectOption[] = []
  let placeholder: React.ReactNode

  const visit = (node: React.ReactNode): void => {
    React.Children.forEach(node, (child) => {
      if (!React.isValidElement(child)) {
        return
      }

      if ((child.type as { displayName?: string }).displayName === "SelectItem") {
        options.push({
          value: String((child.props as { value: string }).value),
          label: (child.props as { children: React.ReactNode }).children,
        })
      }

      if ((child.type as { displayName?: string }).displayName === "SelectValue") {
        placeholder = (child.props as { placeholder?: React.ReactNode }).placeholder
      }

      if ((child.props as { children?: React.ReactNode }).children) {
        visit((child.props as { children?: React.ReactNode }).children)
      }
    })
  }

  visit(children)

  return (
    <SelectContext.Provider
      value={{
        value: currentValue,
        placeholder,
        disabled,
        options,
        onValueChange: (nextValue) => {
          if (value === undefined) {
            setInternalValue(nextValue)
          }
          onValueChange?.(nextValue)
        },
      }}
    >
      {children}
    </SelectContext.Provider>
  )
}

const SelectTrigger = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => {
  const context = React.useContext(SelectContext)
  if (!context) {
    throw new Error("SelectTrigger must be used within Select")
  }

  return (
    <select
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
        className
      )}
      value={context.value ?? ""}
      disabled={context.disabled}
      onChange={(event) => context.onValueChange?.(event.target.value)}
      {...props}
    >
      <option value="" disabled>
        {context.placeholder ?? "Pilih opsi"}
      </option>
      {context.options.map((option) => (
        <option key={option.value} value={option.value}>
          {typeof option.label === "string" ? option.label : option.value}
        </option>
      ))}
    </select>
  )
})

SelectTrigger.displayName = "SelectTrigger"

function SelectContent({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

function SelectValue(_: { placeholder?: React.ReactNode }) {
  return null
}

function SelectItem(_: { value: string; children: React.ReactNode }) {
  return null
}

SelectValue.displayName = "SelectValue"
SelectItem.displayName = "SelectItem"

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }
