import { useEffect, useState } from "react"
import { Monitor, Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type ThemeOption = "light" | "dark" | "system"

const themeOptions: Array<{
  value: ThemeOption
  label: string
  icon: typeof Sun
}> = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
]

export function ThemeSelector() {
  const [theme, setTheme] = useState<ThemeOption>("dark")

  useEffect(() => {
    const readTheme = () => {
      const currentTheme = window.localStorage.getItem("theme")
      if (
        currentTheme === "light" ||
        currentTheme === "dark" ||
        currentTheme === "system"
      ) {
        setTheme(currentTheme)
      } else {
        setTheme("dark")
      }
    }

    readTheme()
    window.addEventListener("themechange", readTheme)

    return () => window.removeEventListener("themechange", readTheme)
  }, [])

  const ActiveIcon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="icon-lg"
            aria-label="Open theme selector"
          />
        }
      >
        <ActiveIcon className="size-5" />
      </PopoverTrigger>
      <PopoverContent className="w-44 p-2" align="end">
        <div className="flex flex-col gap-1">
          {themeOptions.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              type="button"
              variant="ghost"
              className="justify-start gap-2"
              data-theme-option={value}
              aria-label={`Switch to ${label.toLowerCase()} theme`}
              onClick={() => {
                window.setTheme(value)
                setTheme(value)
              }}
            >
              <Icon className="size-4" data-icon="inline-start" />
              {label}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
