import { AddCharacterButton } from "@/components/add-character-button"
import { AddCharacterDialog } from "@/components/add-character-dialog"
import { Button } from "@/components/ui/button"
import { CharacterGrid } from "@/components/character-grid"
import { cn } from "@/lib/utils"
import { ErrorBoundary } from "@/components/error-boundary"
import { removeTrainingState } from "@/lib/training-state"
import { Search } from "lucide-react"
import { Summary } from "@/components/summary"
import { ThemeSelector } from "@/components/theme-selector"
import { TrainingDialog } from "@/components/training-dialog"
import { useEffect, useMemo, useState } from "react"

import {
  loadAddedCharacters,
  persistAddedCharacters,
} from "@/lib/added-characters"
import {
  dispatchCommandMenuOpen,
  onCharactersAdded,
  onViewChange,
} from "@/lib/events"
import type { PlayableCharacter } from "@/lib/playable-characters"

interface AppShellProps {
  characters: PlayableCharacter[]
}

type View = "characters" | "summary"

const VIEWS: View[] = ["characters", "summary"]

export function AppShell({ characters }: AppShellProps) {
  const validNames = useMemo(
    () => new Set(characters.map((character) => character.name)),
    [characters]
  )
  const [view, setView] = useState<View>("characters")
  const [added, setAdded] = useState<string[]>(() =>
    loadAddedCharacters(validNames)
  )

  useEffect(() => {
    persistAddedCharacters(added)
  }, [added])

  useEffect(() => onViewChange(setView), [])

  useEffect(
    () =>
      onCharactersAdded((names) => {
        setAdded((prev) => {
          const next = [...prev]
          for (const name of names) {
            if (validNames.has(name) && !next.includes(name)) next.push(name)
          }
          return next
        })
      }),
    [validNames]
  )

  const handleRemove = (name: string) => {
    setAdded((prev) => prev.filter((addedName) => addedName !== name))
    removeTrainingState(name)
  }

  return (
    <ErrorBoundary>
      <div className="flex h-svh overflow-hidden p-6">
        <div className="flex min-h-0 w-full flex-col gap-4 text-sm leading-loose">
          <header className="flex shrink-0 flex-wrap items-center justify-between gap-3">
            <h1 className="text-4xl font-bold">Training Guide Dashboard</h1>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon-lg"
                aria-label="Search and navigate"
                onClick={() => dispatchCommandMenuOpen()}
              >
                <Search className="size-5" />
              </Button>
              <div className="flex h-11 items-center gap-1 border border-border bg-muted px-1">
                {VIEWS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    aria-label={`Switch to ${item} view`}
                    aria-pressed={view === item}
                    onClick={() => setView(item)}
                    className={cn(
                      "h-9 px-3 text-xs font-medium capitalize transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                      view === item
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-background hover:text-foreground"
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <ThemeSelector />
              <AddCharacterButton />
            </div>
          </header>

          <div className="flex min-h-0 flex-1 items-stretch">
            <div
              className={cn(
                "min-h-0 min-w-0 flex-1 overflow-y-auto",
                view !== "characters" && "hidden"
              )}
            >
              <CharacterGrid
                characters={characters}
                added={added}
                onRemove={handleRemove}
              />
            </div>
            <div className={cn(view !== "characters" && "hidden")}>
              <TrainingDialog characters={characters} />
            </div>
            <div
              className={cn(
                "min-h-0 min-w-0 flex-1 overflow-y-auto",
                view !== "summary" && "hidden"
              )}
            >
              <Summary characters={characters} added={added} />
            </div>
          </div>

          <AddCharacterDialog characters={characters} />
        </div>
      </div>
    </ErrorBoundary>
  )
}
