export const ADDED_CHARACTERS_KEY = "added-characters"

export function loadAddedCharacters(validNames: Set<string>): string[] {
  try {
    const raw = window.localStorage.getItem(ADDED_CHARACTERS_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const seen = new Set<string>()
    const result: string[] = []
    for (const name of parsed) {
      if (typeof name === "string" && validNames.has(name) && !seen.has(name)) {
        seen.add(name)
        result.push(name)
      }
    }
    return result
  } catch {
    return []
  }
}

export function persistAddedCharacters(names: string[]) {
  try {
    window.localStorage.setItem(ADDED_CHARACTERS_KEY, JSON.stringify(names))
  } catch {
    // Ignore storage errors and keep the current session state.
  }
}
