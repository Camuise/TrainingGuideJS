import { useEffect, useMemo, useState } from "react"
import { SquareOff, Trash2 } from "lucide-react"

import { CharacterIcon } from "@/components/character-icon"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog"
import { Empty, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import {
  dispatchTrainingClose,
  dispatchTrainingOpen,
  onTrainingClose,
  onTrainingOpen,
} from "@/lib/events"
import { accentFor } from "@/lib/element-accent"
import type { PlayableCharacter } from "@/lib/playable-characters"
import { cn } from "@/lib/utils"

interface CharacterGridProps {
  characters: PlayableCharacter[]
  added: string[]
  onRemove: (name: string) => void
}

export function CharacterGrid({
  characters,
  added,
  onRemove,
}: CharacterGridProps) {
  const characterByName = useMemo(
    () => new Map(characters.map((character) => [character.name, character])),
    [characters]
  )
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [displayDeleteName, setDisplayDeleteName] = useState<string | null>(
    null
  )
  const [activeName, setActiveName] = useState<string | null>(null)

  useEffect(() => onTrainingOpen((name) => setActiveName(name)), [])
  useEffect(() => onTrainingClose(() => setActiveName(null)), [])

  const requestDelete = (name: string) => {
    setDisplayDeleteName(name)
    setPendingDelete(name)
  }

  const closeDeleteDialog = () => setPendingDelete(null)

  const confirmDelete = () => {
    if (pendingDelete) onRemove(pendingDelete)
    setPendingDelete(null)
  }

  return (
    <>
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
              <Card
                key={name}
                size="sm"
                className={cn(
                  "group relative items-center gap-2 transition-colors ring-inset hover:bg-muted dark:hover:bg-foreground/15",
                  character.name === activeName && [
                    "bg-muted ring-2 dark:bg-foreground/15",
                    accentFor(character.element).ring,
                  ]
                )}
              >
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    if (character.name === activeName) {
                      dispatchTrainingClose()
                    } else {
                      dispatchTrainingOpen(character.name)
                    }
                  }}
                  className="flex h-auto w-full flex-col items-center gap-2 p-0 whitespace-normal hover:bg-transparent focus-visible:ring-2 focus-visible:ring-ring/50 dark:hover:bg-transparent"
                >
                  <CharacterIcon
                    src={character.icon}
                    fallbackSrcs={[character.fallbackIcon, character.assetIcon]}
                    alt={character.name}
                    className="size-28"
                  />
                  <span className="flex items-center gap-1.5 text-center text-xs font-medium">
                    {character.elementIcon && (
                      <img
                        src={character.elementIcon}
                        alt=""
                        className="size-4 shrink-0 object-contain"
                      />
                    )}
                    {character.name}
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-lg"
                  className="absolute top-1 right-1 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                  aria-label={`Remove ${character.name}`}
                  onClick={() => requestDelete(name)}
                >
                  <Trash2 className="size-5" />
                </Button>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setPendingDelete(null)
        }}
      >
        <DialogPopup className="w-full max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Remove &quot;{pendingDelete ?? displayDeleteName ?? "character"}
              &quot;?
            </DialogTitle>
            <DialogDescription>
              This will remove the character from your training guide. Your
              saved progress for it will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDeleteDialog}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>
              <Trash2 className="size-4" />
              Remove
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </>
  )
}
