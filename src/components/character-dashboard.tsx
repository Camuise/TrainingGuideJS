import { useMemo, useRef, useState } from "react"
import { Check, Plus, Search, SquareOff, X } from "lucide-react"

import { ThemeSelector } from "@/components/theme-selector"
import { CharacterIcon } from "@/components/character-icon"
import { CharacterTrainingDialog } from "@/components/character-training-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
  DialogViewport,
} from "@/components/ui/dialog"
import { Empty, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { cn } from "@/lib/utils"
import type { PlayableCharacter } from "@/lib/playable-characters"

const STORAGE_KEY = "added-characters"

interface CharacterDashboardProps {
  title: string
  characters: PlayableCharacter[]
}

function loadAddedCharacters(validNames: Set<string>): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
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

function persistAddedCharacters(names: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(names))
  } catch {
    // Ignore storage errors and keep the current session state.
  }
}

export function CharacterDashboard({
  title,
  characters,
}: CharacterDashboardProps) {
  const characterByName = useMemo(
    () => new Map(characters.map((character) => [character.name, character])),
    [characters]
  )
  const [added, setAdded] = useState<string[]>(() =>
    loadAddedCharacters(new Set(characterByName.keys()))
  )
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [query, setQuery] = useState("")
  const [training, setTraining] = useState<PlayableCharacter | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const normalizedQuery = query.trim().toLowerCase()
  const filteredCharacters =
    normalizedQuery === ""
      ? characters
      : characters.filter((character) =>
          character.name.toLowerCase().includes(normalizedQuery)
        )

  const toggleCharacter = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }

  const addSelected = () => {
    const next = [...added]
    for (const name of selected) {
      if (!next.includes(name)) next.push(name)
    }
    setAdded(next)
    persistAddedCharacters(next)
    setSelected(new Set())
    setOpen(false)
  }

  const removeCharacter = (name: string) => {
    const next = added.filter((addedName) => addedName !== name)
    setAdded(next)
    persistAddedCharacters(next)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          setSelected(new Set())
          setQuery("")
        }
      }}
    >
      <div className="flex w-full flex-col gap-4 text-sm leading-loose">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-4xl font-bold">{title}</h1>
          <div className="flex items-center gap-2">
            <ThemeSelector />
            <Button
              type="button"
              variant="default"
              size="icon-lg"
              aria-label="Add character"
              onClick={() => setOpen(true)}
            >
              <Plus className="size-8" />
            </Button>
          </div>
        </header>

        {added.length === 0 ? (
          <Empty className="rounded-lg border border-border">
            <EmptyMedia>
              <SquareOff className="size-12 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle className="text-muted-foreground">
              No characters added
            </EmptyTitle>
          </Empty>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {added.map((name) => {
              const character = characterByName.get(name)
              if (!character) return null
              return (
                <div
                  key={name}
                  className="group relative flex flex-col items-center gap-2 border border-border bg-card p-3"
                >
                  <button
                    type="button"
                    onClick={() => setTraining(character)}
                    className="flex flex-col items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    <CharacterIcon
                      src={character.icon}
                      fallbackSrcs={[
                        character.fallbackIcon,
                        character.assetIcon,
                      ]}
                      alt={character.name}
                      className="size-28"
                    />
                    <span className="text-center text-xs font-medium">
                      {character.name}
                    </span>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="absolute top-1 right-1 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                    aria-label={`Remove ${character.name}`}
                    onClick={() => removeCharacter(name)}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              )
            })}
          </div>
        )}

        <DialogPopup
          initialFocus={searchInputRef}
          className="max-h-[90svh] w-full max-w-4xl"
        >
          <DialogHeader>
            <DialogTitle>Add Characters</DialogTitle>
            <DialogDescription>
              Select the characters you want to add to your training guide.
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchInputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search characters..."
              className="h-9 w-full border border-border bg-background pr-2.5 pl-8 text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring/50 focus:outline-none"
            />
          </div>
          <DialogViewport className="h-[50vh] min-h-40 pr-1">
            {filteredCharacters.length === 0 ? (
              <p className="flex h-full min-h-40 items-center justify-center text-xs text-muted-foreground">
                No characters match &quot;{query.trim()}&quot;
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                {filteredCharacters.map((character) => {
                  const isAdded = added.includes(character.name)
                  const isSelected = selected.has(character.name)
                  return (
                    <button
                      key={character.name}
                      type="button"
                      disabled={isAdded}
                      aria-pressed={isSelected}
                      onClick={() => toggleCharacter(character.name)}
                      className={cn(
                        "group relative flex flex-col items-center gap-1 border border-border bg-background p-2 transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40",
                        isSelected && "border-primary bg-muted"
                      )}
                    >
                      <CharacterIcon
                        src={character.icon}
                        fallbackSrcs={[
                          character.fallbackIcon,
                          character.assetIcon,
                        ]}
                        alt={character.name}
                        className="size-24"
                      />
                      <span className="line-clamp-2 w-full text-center text-xs leading-tight">
                        {character.name}
                      </span>
                      {isSelected && (
                        <span className="absolute top-1 right-1 flex size-4 items-center justify-center bg-primary text-primary-foreground">
                          <Check className="size-3" />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </DialogViewport>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={selected.size === 0}
              onClick={addSelected}
            >
              Add Selected ({selected.size})
            </Button>
          </DialogFooter>
        </DialogPopup>
      </div>
      <CharacterTrainingDialog
        key={training?.name ?? "none"}
        character={training}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setTraining(null)
        }}
      />
    </Dialog>
  )
}
