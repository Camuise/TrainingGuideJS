import { useEffect, useMemo, useState } from "react"
import { ChevronDown, Layers } from "lucide-react"

import { CharacterIcon } from "@/components/character-icon"
import { MaterialIcon } from "@/components/material-icon"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { onTrainingPlansChanged } from "@/lib/events"
import type { PlayableCharacter } from "@/lib/playable-characters"
import { buildSummary, type SummaryPlan } from "@/lib/summary-plan"
import { loadTrainingStates } from "@/lib/training-state"
import { cn } from "@/lib/utils"

interface SummaryProps {
  characters: PlayableCharacter[]
  added: string[]
}

export function Summary({ characters, added }: SummaryProps) {
  const validNames = useMemo(
    () => new Set(characters.map((character) => character.name)),
    [characters]
  )
  const [version, setVersion] = useState(0)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => onTrainingPlansChanged(() => setVersion((v) => v + 1)), [])

  const plan: SummaryPlan = useMemo(() => {
    void version
    return buildSummary(characters, added, loadTrainingStates(validNames))
  }, [characters, added, validNames, version])

  if (added.length === 0) {
    return (
      <Empty className="rounded-lg border border-border">
        <EmptyMedia>
          <Layers className="size-12 text-muted-foreground" />
        </EmptyMedia>
        <EmptyTitle className="text-muted-foreground">
          No characters added
        </EmptyTitle>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Card size="sm">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-1.5">
          <span className="bg-muted px-2 py-1 text-xs text-muted-foreground">
            {plan.characters.length} character
            {plan.characters.length === 1 ? "" : "s"}
          </span>
          <span className="bg-muted px-2 py-1 text-xs text-muted-foreground">
            {plan.totalExp.toLocaleString()} EXP total
          </span>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardContent className="flex flex-col p-0">
          {plan.materials.map((material) => {
            const isExpanded = expanded === material.name
            return (
              <div
                key={material.name}
                className="border-t border-border first:border-t-0"
              >
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  onClick={() => setExpanded(isExpanded ? null : material.name)}
                  className="flex w-full items-center justify-between gap-3 px-(--card-spacing) py-2 text-left hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <MaterialIcon
                      name={material.name}
                      className="size-6 shrink-0"
                    />
                    <span className="truncate text-xs font-medium">
                      {material.name}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-xs font-medium">
                      {material.count.toLocaleString()}
                    </span>
                    <ChevronDown
                      className={cn(
                        "size-4 text-muted-foreground transition-transform duration-200",
                        isExpanded && "rotate-180"
                      )}
                    />
                  </span>
                </button>
                {isExpanded && (
                  <div className="flex flex-col px-(--card-spacing) pb-2">
                    {material.usages.map(({ character, count }) => (
                      <div
                        key={character.name}
                        className="flex items-center justify-between gap-3 py-1"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <CharacterIcon
                            src={character.icon}
                            fallbackSrcs={[
                              character.fallbackIcon,
                              character.assetIcon,
                            ]}
                            alt=""
                            className="size-8 shrink-0 object-contain"
                          />
                          <span className="truncate text-xs">
                            {character.name}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {count.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
