import * as React from "react"

import { cn } from "@/lib/utils"

const Label = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <label
      ref={ref}
      className={cn(
        "flex items-center space-between rounded-md border border-transparent px-2 py-1 text-sm font-medium transition-colors focus-within:relative focus-within:outline-ring focus-within:outline-2 focus-within:outline-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
})

Label.displayName = "Label"

export { Label }
