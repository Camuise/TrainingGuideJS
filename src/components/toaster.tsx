import { useEffect, useState } from "react"
import { Toaster as SonnerToaster } from "sonner"

type ThemeOption = "light" | "dark" | "system"

function readStoredTheme(): ThemeOption {
  if (typeof window === "undefined") return "dark"
  try {
    const stored = window.localStorage.getItem("theme")
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored
    }
  } catch {
    // Ignore storage errors and keep the default theme.
  }
  return "dark"
}

export function Toaster() {
  const [theme, setTheme] = useState<ThemeOption>(readStoredTheme)

  useEffect(() => {
    const readTheme = () => setTheme(readStoredTheme())
    readTheme()
    window.addEventListener("themechange", readTheme)
    return () => window.removeEventListener("themechange", readTheme)
  }, [])

  return <SonnerToaster theme={theme} position="bottom-right" />
}
