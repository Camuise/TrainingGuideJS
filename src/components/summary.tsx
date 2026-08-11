import { useEffect, useMemo, useRef, useState, type ComponentType } from "react"

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

import { CharacterIcon } from "@/components/character-icon"
import { MaterialIcon } from "@/components/material-icon"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { onTrainingPlansChanged } from "@/lib/events"
import type { PlayableCharacter } from "@/lib/playable-characters"
import {
  buildSummary,
  type CharacterSummary,
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

const RADIAN = Math.PI / 180
const LABEL_GAP = 8
const LABEL_HEIGHT = 36
const LABEL_IMAGE_SIZE = 16
const LABEL_PAD_X = 7
const LABEL_IMAGE_GAP = 4
const LABEL_CHAR_WIDTH = 5.8
const LABEL_NAME_Y = -7
const LABEL_PCT_Y = 10

type LabelAnchor = "start" | "end" | "middle"

interface DonutLabelMetrics {
  cx: number
  cy: number
  desiredX: number
  desiredY: number
  width: number
  anchor: LabelAnchor
}

interface ResolvedDonutLabel {
  x: number
  y: number
  anchor: LabelAnchor
}

function labelAnchor(cos: number): LabelAnchor {
  return cos > 0.05 ? "start" : cos < -0.05 ? "end" : "middle"
}

function normalizeAngle(angle: number): number {
  const full = Math.PI * 2
  return ((((angle + Math.PI) % full) + full) % full) - Math.PI
}

function resolveDonutLabels(labels: DonutLabelMetrics[]): ResolvedDonutLabel[] {
  if (labels.length === 0) return []
  const cx = labels[0].cx
  const cy = labels[0].cy
  const items = labels.map((label) => {
    const dx = label.desiredX - label.cx
    const dy = label.desiredY - label.cy
    const angle = Math.atan2(dy, dx)
    return {
      angle,
      radius: Math.hypot(dx, dy) || 1,
      width: label.width,
      originalAngle: angle,
    }
  })

  const box = (item: (typeof items)[number]) => {
    const x = cx + item.radius * Math.cos(item.angle)
    const y = cy + item.radius * Math.sin(item.angle)
    const anchor = labelAnchor(Math.cos(item.angle))
    const left =
      x +
      (anchor === "start"
        ? 0
        : anchor === "end"
          ? -item.width
          : -item.width / 2)
    return {
      x0: left,
      x1: left + item.width,
      y0: y - LABEL_HEIGHT / 2,
      y1: y + LABEL_HEIGHT / 2,
    }
  }

  const overlap = (a: (typeof items)[number], b: (typeof items)[number]) => {
    const boxA = box(a)
    const boxB = box(b)
    return (
      boxA.x0 < boxB.x1 &&
      boxB.x0 < boxA.x1 &&
      boxA.y0 < boxB.y1 &&
      boxB.y0 < boxA.y1
    )
  }

  const MAX_ITERATIONS = 120
  const MAX_ANGLE_SHIFT = Math.PI / 3
  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    let moved = false
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        if (!overlap(items[i], items[j])) continue
        const step = 0.012
        const diff = normalizeAngle(items[j].angle - items[i].angle)
        if (diff >= 0) {
          items[i].angle -= step
          items[j].angle += step
        } else {
          items[i].angle += step
          items[j].angle -= step
        }
        moved = true
      }
    }
    for (const item of items) {
      const low = item.originalAngle - MAX_ANGLE_SHIFT
      const high = item.originalAngle + MAX_ANGLE_SHIFT
      item.angle = Math.min(high, Math.max(low, item.angle))
    }
    if (!moved) break
  }

  return items.map((item) => ({
    x: cx + item.radius * Math.cos(item.angle),
    y: cy + item.radius * Math.sin(item.angle),
    anchor: labelAnchor(Math.cos(item.angle)),
  }))
}

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
  icon?: string
}

function buildSlices(
  items: { name: string; value: number; icon?: string }[],
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
      icon: item.icon,
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
      icon: item.icon,
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

interface DonutOverlayGeometry {
  left: number
  top: number
  width: number
  height: number
}

function computeDonutLabelMetrics(
  slices: Slice[],
  width: number,
  height: number
): DonutLabelMetrics[] | null {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)
  if (total <= 0 || slices.length === 0) return null
  const maxPieRadius = Math.min(width, height) / 2
  const cx = width / 2
  const cy = height / 2
  const outerRadius = 0.68 * maxPieRadius
  const paddingAngle = 2
  const notZeroCount = slices.filter((slice) => slice.value !== 0).length
  const realTotalAngle = 360 - notZeroCount * paddingAngle
  const metrics: DonutLabelMetrics[] = []
  let angle = 0
  for (const slice of slices) {
    const startAngle = angle
    const endAngle =
      startAngle +
      (slice.value !== 0 ? 0 : 0) +
      (slice.value / total) * realTotalAngle
    const midAngle = (startAngle + endAngle) / 2
    const cos = Math.cos(-midAngle * RADIAN)
    const sin = Math.sin(-midAngle * RADIAN)
    const pctText = `${((slice.value / total) * 100).toFixed(1)}%`
    const textWidth =
      Math.max(slice.name.length, pctText.length) * LABEL_CHAR_WIDTH
    const boxWidth =
      LABEL_PAD_X * 2 +
      (slice.icon ? LABEL_IMAGE_SIZE + LABEL_IMAGE_GAP : 0) +
      textWidth
    metrics.push({
      cx,
      cy,
      desiredX: cx + (outerRadius + LABEL_GAP) * cos,
      desiredY: cy + (outerRadius + LABEL_GAP) * sin,
      width: boxWidth,
      anchor: labelAnchor(cos),
    })
    angle = endAngle + (slice.value !== 0 ? paddingAngle : 0)
  }
  return metrics
}

function DonutOverlayLabel({
  label,
  resolved,
  slice,
  total,
}: {
  label: DonutLabelMetrics
  resolved: ResolvedDonutLabel
  slice: Slice
  total: number
}) {
  const boxX =
    resolved.anchor === "start"
      ? 0
      : resolved.anchor === "end"
        ? -label.width
        : -label.width / 2
  const imageX = boxX + LABEL_PAD_X
  const textX = imageX + (slice.icon ? LABEL_IMAGE_SIZE + LABEL_IMAGE_GAP : 0)
  const pct = total > 0 ? ((slice.value / total) * 100).toFixed(1) : "0.0"

  return (
    <g transform={`translate(${resolved.x}, ${resolved.y})`}>
      <rect
        x={boxX}
        y={-LABEL_HEIGHT / 2}
        width={label.width}
        height={LABEL_HEIGHT}
        rx={5}
        fill={slice.fill}
      />
      {slice.icon ? (
        <image
          href={slice.icon}
          x={imageX}
          y={-LABEL_IMAGE_SIZE / 2}
          width={LABEL_IMAGE_SIZE}
          height={LABEL_IMAGE_SIZE}
          preserveAspectRatio="xMidYMid meet"
        />
      ) : null}
      <text
        x={textX}
        y={LABEL_NAME_Y}
        dominantBaseline="central"
        fill="rgba(0, 0, 0, 0.85)"
        className="text-[11px] font-medium"
      >
        {slice.name}
      </text>
      <text
        x={textX}
        y={LABEL_PCT_Y}
        dominantBaseline="central"
        fill="rgba(0, 0, 0, 0.55)"
        className="text-[9px] font-semibold tabular-nums"
      >
        {pct}%
      </text>
    </g>
  )
}

function MiniDonut({
  slices,
  config,
  className,
  center,
}: {
  slices: Slice[]
  config: ChartConfig
  className?: string
  center?: { label: string; value: string }
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [overlay, setOverlay] = useState<DonutOverlayGeometry | null>(null)

  useEffect(() => {
    const node = wrapperRef.current
    if (!node) return
    const apply = () => {
      const svg = node.querySelector("svg")
      if (!svg) return
      const svgRect = svg.getBoundingClientRect()
      const nodeRect = node.getBoundingClientRect()
      setOverlay((previous) => {
        const next = {
          left: svgRect.left - nodeRect.left,
          top: svgRect.top - nodeRect.top,
          width: svgRect.width,
          height: svgRect.height,
        }
        if (
          previous &&
          Math.abs(previous.left - next.left) < 0.5 &&
          Math.abs(previous.top - next.top) < 0.5 &&
          Math.abs(previous.width - next.width) < 0.5 &&
          Math.abs(previous.height - next.height) < 0.5
        ) {
          return previous
        }
        return next
      })
    }
    const observer = new ResizeObserver(apply)
    observer.observe(node)
    let raf = requestAnimationFrame(function poll() {
      const svg = node.querySelector("svg")
      const rect = svg ? svg.getBoundingClientRect() : null
      if (!rect || rect.width === 0 || rect.height === 0) {
        raf = requestAnimationFrame(poll)
        return
      }
      apply()
    })
    return () => {
      observer.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [])

  const metrics = overlay
    ? computeDonutLabelMetrics(slices, overlay.width, overlay.height)
    : null
  const resolved = metrics ? resolveDonutLabels(metrics) : []

  return (
    <div ref={wrapperRef} className="relative w-full min-w-0">
      <ChartContainer
        config={config}
        className={cn("mx-auto aspect-[8/5] max-h-[280px] w-full", className)}
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
            labelLine={false}
            innerRadius="46%"
            outerRadius="68%"
            paddingAngle={2}
            strokeWidth={4}
          >
            {slices.map((slice) => (
              <Cell key={slice.name} fill={slice.fill} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      {overlay && metrics && metrics.length > 0 ? (
        <svg
          viewBox={`0 0 ${overlay.width} ${overlay.height}`}
          className="pointer-events-none"
          style={{
            position: "absolute",
            left: overlay.left,
            top: overlay.top,
            width: overlay.width,
            height: overlay.height,
          }}
        >
          {metrics.map((label, index) => (
            <DonutOverlayLabel
              key={slices[index].name}
              label={label}
              resolved={resolved[index]}
              slice={slices[index]}
              total={total}
            />
          ))}
        </svg>
      ) : null}
      {overlay && center ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute flex flex-col items-center justify-center gap-0.5 text-center"
          style={{
            left: overlay.left,
            top: overlay.top,
            width: overlay.width,
            height: overlay.height,
          }}
        >
          <span className="font-heading text-2xl leading-none font-semibold tabular-nums">
            {center.value}
          </span>
          <span className="max-w-[80%] truncate text-[10px] tracking-wide text-muted-foreground uppercase">
            {center.label}
          </span>
        </div>
      ) : null}
    </div>
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
      icon: usage.character.icon,
    })),
    fillFor
  )
  const config = toChartConfig(slices)

  return (
    <div className="flex flex-col gap-3 border-t border-border/60 bg-muted/40 px-(--card-spacing) py-3">
      {slices.length > 0 ? (
        <MiniDonut
          slices={slices}
          config={config}
          center={{
            label: material.name,
            value: material.count.toLocaleString(),
          }}
          className="w-full"
        />
      ) : null}
    </div>
  )
}

function CharacterShareList({
  summaries,
  total,
  fillFor,
  className,
}: {
  summaries: CharacterSummary[]
  total: number
  fillFor: (name: string) => string
  className?: string
}) {
  const sorted = useMemo(
    () => [...summaries].sort((a, b) => b.exp - a.exp),
    [summaries]
  )

  return (
    <ScrollArea className={cn("min-h-0 lg:max-h-[460px]", className)}>
      <div className="flex flex-col gap-3 pr-3">
        {sorted.map((summary) => {
          const name = summary.character.name
          const pct = total > 0 ? (summary.exp / total) * 100 : 0
          return (
            <div key={name} className="flex items-center gap-2.5">
              <CharacterIcon
                src={summary.character.icon}
                fallbackSrcs={[
                  summary.character.fallbackIcon,
                  summary.character.assetIcon,
                ]}
                alt={name}
                className="size-9 shrink-0"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-medium">{name}</span>
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground tabular-nums">
                    {pct.toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={pct}
                  trackClassName="h-1.5"
                  indicatorStyle={{
                    backgroundColor: fillFor(name),
                  }}
                />
                <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                  {summary.exp.toLocaleString()} EXP
                  <span className="font-sans"> · </span>
                  {summary.heroWits.toLocaleString()} Hero's Wit
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
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
          icon: summary.character.icon,
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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <Card size="sm" className="gap-0 p-0">
        <CardContent className="grid grid-cols-2 gap-px overflow-hidden bg-border p-0 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatTile key={stat.label} {...stat} />
          ))}
        </CardContent>
      </Card>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card size="sm">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="size-4 text-muted-foreground" />
              Character breakdown
            </CardTitle>
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {plan.totalExp.toLocaleString()} EXP
            </span>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-col gap-4 lg:flex-row lg:gap-6">
            {expSlices.length > 0 ? (
              <>
                <div className="min-w-0 lg:w-[46%] lg:shrink-0 lg:self-center">
                  <MiniDonut
                    slices={expSlices}
                    config={expConfig}
                    center={{
                      label: "Total EXP",
                      value: formatCompact(plan.totalExp),
                    }}
                    className="w-full"
                  />
                </div>
                <div className="min-h-0 min-w-0 flex-1">
                  <CharacterShareList
                    summaries={trainedCharacters}
                    total={plan.totalExp}
                    fillFor={fillFor}
                  />
                </div>
              </>
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
          <CardContent className="flex min-h-0 flex-col p-0">
            <ScrollArea className="min-h-0 lg:max-h-[460px]">
              <div className="flex flex-col">
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
                        onClick={() =>
                          setExpanded(isExpanded ? null : material.name)
                        }
                        className="flex w-full items-center justify-between gap-3 px-(--card-spacing) py-2.5 text-left hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      >
                        <span className="flex min-w-0 items-center gap-2.5">
                          <span className="flex size-9 shrink-0 items-center justify-center bg-muted">
                            <MaterialIcon
                              name={material.name}
                              className="size-6"
                            />
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
                        <MaterialUsagePanel
                          material={material}
                          fillFor={fillFor}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
