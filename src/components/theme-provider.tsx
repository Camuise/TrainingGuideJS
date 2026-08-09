import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react"

type ThemeOption = "light" | "dark" | "system"

const THEME_OPTIONS: readonly ThemeOption[] = ["light", "dark", "system"]

interface ThemeContextValue {
  theme: ThemeOption
  setTheme: (theme: ThemeOption) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function isThemeOption(value: unknown): value is ThemeOption {
  return (
    typeof value === "string" &&
    (THEME_OPTIONS as readonly string[]).includes(value)
  )
}

function readStoredTheme(): ThemeOption {
  if (typeof window === "undefined") return "dark"
  try {
    const stored = window.localStorage.getItem("theme")
    return isThemeOption(stored) ? stored : "dark"
  } catch {
    return "dark"
  }
}

let themeValue: ThemeOption = "dark"
const themeListeners = new Set<() => void>()

const SERVER_THEME_SNAPSHOT: ThemeOption = "dark"

function getThemeSnapshot(): ThemeOption {
  return themeValue
}

function getServerThemeSnapshot(): ThemeOption {
  return SERVER_THEME_SNAPSHOT
}

function setThemeValue(next: ThemeOption): void {
  themeValue = next
  for (const listener of themeListeners) listener()
}

function subscribeTheme(listener: () => void): () => void {
  themeListeners.add(listener)
  return () => themeListeners.delete(listener)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getServerThemeSnapshot
  )

  const setTheme = useCallback((next: ThemeOption) => {
    window.setTheme(next)
    setThemeValue(next)
  }, [])

  useEffect(() => {
    setThemeValue(readStoredTheme())
    const readTheme = () => setThemeValue(readStoredTheme())
    window.addEventListener("themechange", readTheme)
    return () => window.removeEventListener("themechange", readTheme)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return
      }
      if (
        event.key === "d" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.shiftKey
      ) {
        event.preventDefault()
        setTheme(theme === "dark" ? "light" : "dark")
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [setTheme, theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getServerThemeSnapshot
  )
  const context = useContext(ThemeContext)
  const setTheme = useCallback(
    (next: ThemeOption) => {
      if (context) {
        context.setTheme(next)
      } else {
        window.setTheme(next)
        setThemeValue(next)
      }
    },
    [context]
  )
  return { theme, setTheme }
}
