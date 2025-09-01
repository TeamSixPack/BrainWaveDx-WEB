import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<"button">,
  React.ComponentPropsWithoutRef<"button"> & { checked?: boolean; onCheckedChange?: (checked: boolean) => void }
>(({ className, checked = false, onCheckedChange, ...props }, ref) => {
  const handleClick = () => {
    if (onCheckedChange) {
      onCheckedChange(!checked)
    }
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      className={cn(
        "w-5 h-5 border-2 border-gray-800 bg-white rounded transition-all duration-200 flex items-center justify-center",
        className
      )}
      style={{
        border: '2px solid #1f2937',
        backgroundColor: '#ffffff',
        width: '20px',
        height: '20px',
        borderRadius: '4px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      {...props}
    >
      {checked && (
        <Check className="h-3 w-3 text-gray-800" style={{ color: '#1f2937' }} />
      )}
    </button>
  )
})
Checkbox.displayName = "Checkbox"

export { Checkbox }
