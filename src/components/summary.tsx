import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
} from "react"
import {
  ChevronDown,
  Coins,
  Layers,
  PieChart as PieChartIcon,
  Sparkles,
  Users,
  Zap,
} from "lucide-react"
import { Cell, Pie, PieChart } from "recharts"

import { MaterialIcon } from "@/components/material-icon"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { onTrainingPlansChanged } from "@/lib/events"
import type { PlayableCharacter } from "@/lib/playable-characters"
import {
  buildSummary,
  type MaterialTotal,
  type SummaryPlan,
} from "@/lib/summary-plan"
import { loadTrainingStates } from "@/lib/training-state"
import { cn } from "@/lib/utils"

const ELEMENT_FILL: Record<string, string> = {
  Anemo: "#73d7ff",
  Cryo: "#a9e4f5",
  Dendro: "#9ac437",
  Electro: "#c87ef4",
  Geo: "#ffd45c",
  Hydro: "#4fc2f7",
  Pyro: "#ff6b4a",
}

const DEFAULT_FILL = "#9b9b9b"
const OTHERS_FILL = "#9b9b9b"

interface SummaryProps {
  characters: PlayableCharacter[]
  added: string[]
}

function formatCompact(value: number): string {
  const trim = (number: number) =>
    Number.isInteger(number) || number >= 1000
      ? Math.round(number).toString()
      : number.toFixed(1).replace(/\.0$/, "")
  if (value >= 1e9) return `${trim(value / 1e9)}B`
  if (value >= 1e6) return `${trim(value / 1e6)}M`
  if (value >= 1e4) return `${Math.round(value / 1e3)}K`
  return value.toLocaleString()
}

function percentage(value: number, total: number): string {
  if (total <= 0) return "0%"
  return `${((value / total) * 100).toFixed(1)}%`
}

interface Slice {
  name: string
  value: number
  fill: string
}

function buildSlices(
  items: { name: string; value: number }[],
  fillFor: (name: string) => string,
  limit = 6
): Slice[] {
  const sorted = items
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
  if (sorted.length === 0) return []
  if (sorted.length <= limit) {
    return sorted.map((item) => ({
      name: item.name,
      value: item.value,
      fill: fillFor(item.name),
    }))
  }
  const top = sorted.slice(0, limit)
  const othersValue = sorted
    .slice(limit)
    .reduce((sum, item) => sum + item.value, 0)
  return [
    ...top.map((item) => ({
      name: item.name,
      value: item.value,
      fill: fillFor(item.name),
    })),
    ...(othersValue > 0
      ? [{ name: "Others", value: othersValue, fill: OTHERS_FILL }]
      : []),
  ]
}

function toChartConfig(slices: Slice[]): ChartConfig {
  const config: ChartConfig = {}
  for (const slice of slices) {
    config[slice.name] = { label: slice.name, color: slice.fill }
  }
  return config
}

function MiniDonut({
  slices,
  config,
  className,
}: {
  slices: Slice[]
  config: ChartConfig
  className?: string
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)
  return (
    <ChartContainer
      config={config}
      className={cn("mx-auto aspect-square w-full max-w-[260px]", className)}
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              nameKey="name"
              formatter={(value, name) => (
                <div className="flex flex-1 items-center justify-between gap-4 leading-none">
                  <span className="text-muted-foreground">{name}</span>
                  <span className="font-mono font-medium text-foreground tabular-nums">
                    {Number(value).toLocaleString()}{" "}
                    <span className="font-sans font-normal text-muted-foreground">
                      ({percentage(Number(value), total)})
                    </span>
                  </span>
                </div>
              )}
            />
          }
        />
        <Pie
          data={slices}
          dataKey="value"
          nameKey="name"
          isAnimationActive={false}
          innerRadius={60}
          strokeWidth={4}
          paddingAngle={2}
        >
          {slices.map((slice) => (
            <Cell key={slice.name} fill={slice.fill} />
          ))}
        </Pie>
        <ChartLegend
          content={<ChartLegendContent nameKey="name" className="flex-wrap" />}
        />
      </PieChart>
    </ChartContainer>
  )
}

function MaterialUsagePanel({
  material,
  fillFor,
}: {
  material: MaterialTotal
  fillFor: (name: string) => string
}) {
  const slices = buildSlices(
    material.usages.map((usage) => ({
      name: usage.character.name,
      value: usage.count,
    })),
    fillFor
  )
  const config = toChartConfig(slices)

  return (
    <div className="flex flex-col gap-3 border-t border-border/60 bg-muted/40 px-(--card-spacing) py-3">
      {slices.length > 0 ? (
        <MiniDonut slices={slices} config={config} className="w-full" />
      ) : null}
    </div>
  )
}

interface StatTileProps {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
  exact: string
}

function StatTile({ icon: Icon, label, value, exact }: StatTileProps) {
  return (
    <div className="flex min-w-0 items-center gap-3 bg-card p-3">
      <span className="flex size-9 shrink-0 items-center justify-center bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <div className="flex min-w-0 flex-col">
        <span
          title={exact}
          className="truncate font-heading text-base leading-tight font-semibold tabular-nums"
        >
          {value}
        </span>
        <span className="truncate text-[10px] tracking-wide text-muted-foreground uppercase">
          {label}
        </span>
      </div>
    </div>
  )
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

  const fillFor = useMemo(() => {
    const elementByName = new Map(
      characters.map((character) => [character.name, character.element])
    )
    return (name: string) =>
      ELEMENT_FILL[elementByName.get(name) ?? ""] ?? DEFAULT_FILL
  }, [characters])

  const trainedCharacters = useMemo(
    () => plan.characters.filter((summary) => summary.exp > 0),
    [plan]
  )
  const expSlices = useMemo(
    () =>
      buildSlices(
        trainedCharacters.map((summary) => ({
          name: summary.character.name,
          value: summary.exp,
        })),
        fillFor
      ),
    [trainedCharacters, fillFor]
  )
  const expConfig = useMemo(() => toChartConfig(expSlices), [expSlices])

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

  const moraCount =
    plan.materials.find((material) => material.name === "Mora")?.count ?? 0

  const stats = [
    {
      icon: Users,
      label: "Characters",
      value: String(plan.characters.length),
      exact: String(plan.characters.length),
    },
    {
      icon: Zap,
      label: "Total EXP",
      value: formatCompact(plan.totalExp),
      exact: plan.totalExp.toLocaleString(),
    },
    {
      icon: Sparkles,
      label: "Hero's Wit",
      value: formatCompact(plan.totalHeroWits),
      exact: plan.totalHeroWits.toLocaleString(),
    },
    {
      icon: Coins,
      label: "Mora",
      value: formatCompact(moraCount),
      exact: moraCount.toLocaleString(),
    },
  ]

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <Card size="sm" className="gap-0 p-0">
        <CardContent className="grid grid-cols-2 gap-px overflow-hidden bg-border p-0 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatTile key={stat.label} {...stat} />
          ))}
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="size-4 text-muted-foreground" />
            Character breakdown
          </CardTitle>
          <span className="shrink-0 text-xs text-muted-foreground">
            {plan.totalExp.toLocaleString()} EXP
          </span>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {expSlices.length > 0 ? (
            <MiniDonut slices={expSlices} config={expConfig} className="w-full" />
          ) : (
            <p className="mx-auto text-xs text-muted-foreground">
              No EXP required.
            </p>
          )}
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <Layers className="size-4 text-muted-foreground" />
            Materials
          </CardTitle>
          <span className="shrink-0 text-xs text-muted-foreground">
            {plan.materials.length} required
          </span>
        </CardHeader>
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
                  className="flex w-full items-center justify-between gap-3 px-(--card-spacing) py-2.5 text-left hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="flex size-9 shrink-0 items-center justify-center bg-muted">
                      <MaterialIcon name={material.name} className="size-6" />
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-xs font-medium">
                        {material.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {material.usages.length} character
                        {material.usages.length === 1 ? "" : "s"}
                      </span>
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <Badge variant="secondary" className="tabular-nums">
                      {material.count.toLocaleString()}
                    </Badge>
                    <ChevronDown
                      className={cn(
                        "size-4 text-muted-foreground transition-transform duration-200",
                        isExpanded && "rotate-180"
                      )}
                    />
                  </span>
                </button>
                {isExpanded && (
                  <MaterialUsagePanel material={material} fillFor={fillFor} />
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
