import { useState } from "react"

import { cn } from "@/lib/utils"

interface CharacterIconProps {
  src: string
  fallbackSrcs: string[]
  alt: string
  className?: string
}

export function CharacterIcon({
  src,
  fallbackSrcs,
  alt,
  className,
}: CharacterIconProps) {
  const sources = [src, ...fallbackSrcs].filter(Boolean)
  const [index, setIndex] = useState(0)
  const currentSrc = sources[index]

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading="lazy"
      onError={() => {
        if (index < sources.length - 1) setIndex(index + 1)
      }}
      className={cn("object-contain", className)}
    />
  )
}
