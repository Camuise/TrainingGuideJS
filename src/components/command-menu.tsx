import { useEffect, useMemo, useState } from "react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "cmdk"
import { Moon, Plus, Sun, Users } from "lucide-react"

import { CharacterIcon } from "@/components/character-icon"
import { Dialog, DialogPopup } from "@/components/ui/dialog"
import { useTheme } from "@/components/theme-provider"
import {
  dispatchAddDialogOpen,
  dispatchTrainingOpen,
  dispatchViewChange,
  onCommandMenuOpen,
} from "@/lib/events"
import { playableCharacters } from "@/lib/playable-characters"
import { cn } from "@/lib/utils"

export function CommandDialog() {
  const [open, setOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "k" &&
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        !event.shiftKey
      ) {
        event.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  useEffect(() => onCommandMenuOpen(() => setOpen(true)), [])

  const characterItems = useMemo(
    () =>
      playableCharacters.map((character) => ({
        name: character.name,
        icon: character.icon,
        fallbackIcons: [character.fallbackIcon, character.assetIcon],
      })),
    []
  )

  const run = (action: () => void) => {
    setOpen(false)
    action()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogPopup className="top-[20svh] left-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-0 p-0">
        <Command
          loop
          label="Command menu"
          className="flex flex-col overflow-hidden"
          shouldFilter={true}
        >
          <CommandInput
            placeholder="Search characters, or jump to a section..."
            className="h-10 border-none bg-transparent px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring/50"
          />
          <CommandList className="max-h-[300px] overflow-y-auto overflow-x-hidden p-1.5">
            <CommandEmpty className="py-6 text-center text-xs text-muted-foreground">
              No results found.
            </CommandEmpty>
            <CommandGroup heading="Go to">
              <CommandItem
                value="view-characters"
                onSelect={() => run(() => dispatchViewChange("characters"))}
                className={commandItemClass}
              >
                <Users className="size-4" />
                Characters
                <span className="ml-auto text-[10px] text-muted-foreground">
                  Characters view
                </span>
              </CommandItem>
              <CommandItem
                value="view-summary"
                onSelect={() => run(() => dispatchViewChange("summary"))}
                className={commandItemClass}
              >
                <Users className="size-4" />
                Summary
                <span className="ml-auto text-[10px] text-muted-foreground">
                  Summary view
                </span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator className="my-1 h-px bg-border" />
            <CommandGroup heading="Actions">
              <CommandItem
                value="action-add-character"
                onSelect={() => run(() => dispatchAddDialogOpen())}
                className={commandItemClass}
              >
                <Plus className="size-4" />
                Add characters
                <span className="ml-auto text-[10px] text-muted-foreground">
                  +
                </span>
              </CommandItem>
              <CommandItem
                value="action-theme"
                onSelect={() =>
                  run(() => setTheme(theme === "dark" ? "light" : "dark"))
                }
                className={commandItemClass}
              >
                {theme === "dark" ? (
                  <Sun className="size-4" />
                ) : (
                  <Moon className="size-4" />
                )}
                Toggle theme
                <span className="ml-auto text-[10px] text-muted-foreground">
                  d
                </span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator className="my-1 h-px bg-border" />
            <CommandGroup heading="Characters">
              {characterItems.map((character) => (
                <CommandItem
                  key={character.name}
                  value={`character-${character.name}`}
                  onSelect={() =>
                    run(() => {
                      dispatchViewChange("characters")
                      dispatchTrainingOpen(character.name)
                    })
                  }
                  className={commandItemClass}
                >
                  <CharacterIcon
                    src={character.icon}
                    fallbackSrcs={character.fallbackIcons}
                    alt=""
                    className="size-5"
                  />
                  <span className="truncate">{character.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogPopup>
    </Dialog>
  )
}

const commandItemClass = cn(
  "flex cursor-default items-center gap-2 rounded-none px-2 py-1.5 text-xs text-foreground",
  "data-[selected=true]:bg-muted data-[selected=true]:text-foreground",
  "data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
  "outline-none aria-selected:bg-muted focus-visible:ring-1 focus-visible:ring-ring/50"
)
