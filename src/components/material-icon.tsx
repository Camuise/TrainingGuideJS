import { useState, type ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { materialIcons } from "@/lib/playable-characters"
import { cn } from "@/lib/utils"

export function MaterialIcon({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const src = materialIcons[name]
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <Badge
        aria-hidden
        variant="outline"
        className={cn(
          "justify-center bg-muted p-0 text-muted-foreground",
          className
        )}
      >
        {name.slice(0, 1)}
      </Badge>
    )
  }

  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("object-contain", className)}
    />
  )
}

export function MaterialTooltip({
  name,
  children,
}: {
  name: string
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>
        {children}
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={6}>
        <span className="truncate">{name}</span>
      </TooltipContent>
    </Tooltip>
  )
}
