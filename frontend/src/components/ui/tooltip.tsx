import * as React from "react"

interface TooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  side?: "top" | "bottom" | "left" | "right"
  className?: string
}

// 简化的Tooltip组件，结合trigger和content
const SimpleTooltip: React.FC<TooltipProps> = ({ 
  children, 
  content, 
  side = "top", 
  className 
}) => {
  const getPositionClasses = () => {
    switch (side) {
      case "bottom":
        return "top-full left-1/2 transform -translate-x-1/2 mt-2";
      case "left":
        return "right-full top-1/2 transform -translate-y-1/2 mr-2";
      case "right":
        return "left-full top-1/2 transform -translate-y-1/2 ml-2";
      default: // top
        return "bottom-full left-1/2 transform -translate-x-1/2 mb-2";
    }
  };

  return (
    <div className="relative inline-block group">
      {children}
      <div
        className={`absolute z-50 px-3 py-1.5 text-sm text-white bg-gray-900 rounded-md shadow-lg opacity-0 invisible transition-all duration-200 pointer-events-none whitespace-nowrap group-hover:opacity-100 group-hover:visible ${getPositionClasses()} ${className || ''}`}
      >
        {content}
      </div>
    </div>
  )
}

export { SimpleTooltip } 