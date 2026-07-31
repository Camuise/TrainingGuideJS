import { useEffect, useMemo, useRef, useState } from "react"
import { Check, Search } from "lucide-react"

import { CharacterIcon } from "@/components/character-icon"
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
import { loadAddedCharacters } from "@/lib/added-characters"
import { dispatchCharactersAdded, onAddDialogOpen } from "@/lib/events"
import { cn } from "@/lib/utils"
import type { PlayableCharacter } from "@/lib/playable-characters"

interface AddCharacterDialogProps {
  characters: PlayableCharacter[]
}

export function AddCharacterDialog({ characters }: AddCharacterDialogProps) {
  const validNames = useMemo(
    () => new Set(characters.map((character) => character.name)),
    [characters]
  )
  const [open, setOpen] = useState(false)
  const [added, setAdded] = useState<string[]>([])
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [query, setQuery] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(
    () =>
      onAddDialogOpen(() => {
        setAdded(loadAddedCharacters(validNames))
        setSelected(new Set())
        setQuery("")
        setOpen(true)
      }),
    [validNames]
  )

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
    dispatchCharactersAdded([...selected])
    setSelected(new Set())
    setOpen(false)
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
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
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
    </Dialog>
  )
}
