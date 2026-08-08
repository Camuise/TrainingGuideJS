import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { Gem, TrendingUp, Zap } from "lucide-react"

import { CharacterIcon } from "@/components/character-icon"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { DialogHeader } from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  onTrainingClose,
  onTrainingOpen,
} from "@/lib/events"
import {
  accentFor,
  type AccentClasses,
} from "@/lib/element-accent"
import { cn } from "@/lib/utils"
import {
  EXP_PER_HERO_WIT,
  materialIcons,
  type MaterialAmount,
  type PlayableCharacter,
} from "@/lib/playable-characters"
import {
  buildCharacterPlan,
  buildTalentPlan,
  type CharacterPlan,
  type TalentPlan,
} from "@/lib/training-plan"

const DEFAULT_CHARACTER_RANGE = { current: "1", desired: "90" }
const DEFAULT_TALENT_RANGE = { current: "1", desired: "10" }

const TALENT_TYPES = [
  { key: "normal", type: "Normal Attack" },
  { key: "skill", type: "Elemental Skill" },
  { key: "burst", type: "Elemental Burst" },
] as const

interface LevelRange {
  current: string
  desired: string
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(Math.round(value), min), max)
}

function parseLevel(value: string, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function MaterialIcon({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const src = materialIcons[name]
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <Badge
        aria-hidden
        variant="outline"
        className={cn(
          "justify-center bg-muted p-0 text-muted-foreground",
          className
        )}
      >
        {name.slice(0, 1)}
      </Badge>
    )
  }

  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("object-contain", className)}
    />
  )
}

function MaterialTooltip({
  name,
  children,
}: {
  name: string
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>
        {children}
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={6}>
        <span className="truncate">{name}</span>
      </TooltipContent>
    </Tooltip>
  )
}

function MaterialChips({
  materials,
  className,
}: {
  materials: MaterialAmount[]
  size?: "sm" | "md"
  className?: string
}) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {materials.map((material) => (
        <MaterialTooltip key={material.name} name={material.name}>
          <Badge
            variant="outline"
            className="gap-1 bg-background px-1.5 py-1 text-muted-foreground"
          >
            <MaterialIcon name={material.name} className="size-4" />
            {material.count.toLocaleString()}
          </Badge>
        </MaterialTooltip>
      ))}
    </div>
  )
}

function bookTierFor(materials: MaterialAmount[]): string | null {
  for (const { name } of materials) {
    if (name.startsWith("Teachings of ")) return name
    if (name.startsWith("Guide to ")) return name
    if (name.startsWith("Philosophies of ")) return name
  }
  return null
}

interface TalentStepGroup {
  label: string
  steps: { from: number; to: number; materials: MaterialAmount[] }[]
}

function groupTalentSteps(steps: TalentPlan["steps"]): TalentStepGroup[] {
  const groups: TalentStepGroup[] = []
  for (const step of steps) {
    const label = bookTierFor(step.materials) ?? "Materials"
    const last = groups[groups.length - 1]
    if (last && last.label === label) {
      last.steps.push(step)
    } else {
      groups.push({ label, steps: [step] })
    }
  }
  return groups
}

function SummaryItem({
  children,
  highlight = false,
  title,
}: {
  children: ReactNode
  highlight?: boolean
  title?: string
}) {
  const item = (
    <span
      className={cn(
        "flex items-center gap-1.5 bg-background px-2 py-1.5 text-xs text-muted-foreground",
        highlight && "text-foreground"
      )}
    >
      {children}
    </span>
  )

  if (!title) return item
  return <MaterialTooltip name={title}>{item}</MaterialTooltip>
}

function SummaryStrip({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap gap-px overflow-hidden border border-border bg-border">
      {children}
    </div>
  )
}

function NumberInput({
  value,
  min,
  max,
  onChange,
  ariaLabel,
}: {
  value: string
  min: number
  max: number
  onChange: (value: string) => void
  ariaLabel: string
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      value={value}
      min={min}
      max={max}
      aria-label={ariaLabel}
      onChange={(event) => {
        const raw = event.target.value
        if (raw === "" || /^\d+$/.test(raw)) onChange(raw)
      }}
      onBlur={() => onChange(String(clamp(parseLevel(value, min), min, max)))}
      className="h-8 w-16 border border-border bg-background px-2 text-center text-xs text-foreground focus:border-ring focus:ring-1 focus:ring-ring/50 focus:outline-none"
    />
  )
}

function TalentIcon({
  src,
  name,
  className,
}: {
  src: string
  name: string
  className?: string
}) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <Badge
        aria-hidden
        variant="outline"
        className={cn(
          "justify-center bg-muted p-0 text-muted-foreground",
          className
        )}
      >
        {name.slice(0, 1)}
      </Badge>
    )
  }

  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("object-contain", className)}
    />
  )
}

function TalentRangeInputs({
  icon,
  type,
  name,
  current,
  desired,
  min,
  max,
  onCurrent,
  onDesired,
}: {
  icon: string
  type: string
  name: string
  current: string
  desired: string
  min: number
  max: number
  onCurrent: (value: string) => void
  onDesired: (value: string) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <TalentIcon src={icon} name={name} className="size-7 shrink-0" />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-xs font-medium">{type}</span>
          <span className="truncate text-[10px] text-muted-foreground">
            {name}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <NumberInput
          value={current}
          min={min}
          max={max}
          onChange={onCurrent}
          ariaLabel={`${name} current level`}
        />
        <span className="text-xs text-muted-foreground">→</span>
        <NumberInput
          value={desired}
          min={min}
          max={max}
          onChange={onDesired}
          ariaLabel={`${name} desired level`}
        />
      </div>
    </div>
  )
}

function CharacterSection({
  character,
  current,
  desired,
}: {
  character: PlayableCharacter
  current: number
  desired: number
}) {
  const plan: CharacterPlan | undefined = useMemo(
    () =>
      desired > current
        ? buildCharacterPlan(character, current, desired)
        : undefined,
    [character, current, desired]
  )

  const accent = accentFor(character.element)

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-heading text-base font-medium">
          <TrendingUp className={cn("size-4", accent.text)} />
          Character Level
        </h2>
        <span className="shrink-0 text-xs text-muted-foreground">
          Lv. {current} → {desired}
        </span>
      </div>
      {!plan ? (
        <p className="text-xs text-muted-foreground">
          Desired level must be above the current level.
        </p>
      ) : (
        <>
          <SummaryStrip>
            <SummaryItem highlight>
              <span className="font-medium">
                {plan.totalExp.toLocaleString()}
              </span>
              EXP
            </SummaryItem>
            <SummaryItem title="Hero's Wit">
              <MaterialIcon name="Hero's Wit" className="size-4" />≈{" "}
              {Math.ceil(plan.totalExp / EXP_PER_HERO_WIT)}
            </SummaryItem>
            {plan.totalMaterials.map((material) => (
              <SummaryItem key={material.name} title={material.name}>
                <MaterialIcon name={material.name} className="size-4" />
                {material.count.toLocaleString()}
              </SummaryItem>
            ))}
          </SummaryStrip>
          <ol className="flex flex-col">
            {plan.steps.map((step, index) => {
              const isLast = index === plan.steps.length - 1
              const isAscension = step.kind === "ascension"
              return (
                <li
                  key={index}
                  className={cn("relative flex gap-3", !isLast && "pb-3")}
                >
                  {!isLast && (
                    <span
                      aria-hidden
                      className="absolute top-7 bottom-0 left-3.5 w-px bg-border"
                    />
                  )}
                  <span
                    className={cn(
                      "z-10 flex size-7 shrink-0 items-center justify-center border",
                      isAscension
                        ? cn(accent.border, accent.bgSoft, accent.text)
                        : "border-border bg-card text-muted-foreground"
                    )}
                  >
                    {isAscension ? (
                      <Gem className="size-4" />
                    ) : (
                      <Zap className="size-4" />
                    )}
                  </span>
                  {isAscension ? (
                    <Card
                      size="sm"
                      className={cn(
                        "min-w-0 flex-1 p-1.75",
                        accent.ringSoft,
                        accent.bgSoftest
                      )}
                    >
                      <CardContent className="flex flex-col gap-1.5 p-0">
                        <span className="flex items-center gap-1 text-xs">
                          <span className="font-medium">{step.label}</span>
                          <span className="text-muted-foreground">
                            at Lv. {step.level}
                          </span>
                        </span>
                        <MaterialChips materials={step.materials} size="sm" />
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="flex min-h-7 min-w-0 flex-1 items-center">
                      <div className="flex w-full items-center justify-between gap-2">
                        <span className="text-xs">
                          EXP{" "}
                          <span className="font-medium">
                            {step.from} → {step.to}
                          </span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {step.exp.toLocaleString()} EXP
                        </span>
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ol>
        </>
      )}
    </section>
  )
}

function TalentSection({
  type,
  label,
  icon,
  costs,
  current,
  desired,
  accent,
}: {
  type: string
  label: string
  icon: string
  costs: MaterialAmount[][]
  current: number
  desired: number
  accent: AccentClasses
}) {
  const plan: TalentPlan | undefined = useMemo(
    () =>
      desired > current ? buildTalentPlan(costs, current, desired) : undefined,
    [costs, current, desired]
  )
  const groups = useMemo(
    () => (plan ? groupTalentSteps(plan.steps) : []),
    [plan]
  )

  if (!plan) return null

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <TalentIcon src={icon} name={label} className="size-6 shrink-0" />
          <div className="flex min-w-0 flex-col">
            <h2 className="truncate font-heading text-base font-medium">
              {type}
            </h2>
            <span className="truncate text-[10px] text-muted-foreground">
              {label}
            </span>
          </div>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          Lv. {current} → {desired}
        </span>
      </div>
      {plan.totalMaterials.length > 0 && (
        <SummaryStrip>
          {plan.totalMaterials.map((material) => (
            <SummaryItem key={material.name} title={material.name}>
              <MaterialIcon name={material.name} className="size-4" />
              {material.count.toLocaleString()}
            </SummaryItem>
          ))}
        </SummaryStrip>
      )}
      <div className="flex flex-col">
        {groups.length > 0 && (
          <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Materials required per level
          </p>
        )}
        {groups.map((group, index) => (
          <div
            key={group.label}
            className={cn(
              "flex flex-col gap-1.5 pt-2",
              index > 0 && "mt-3 border-t border-border pt-3"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-1.5">
                <span
                  aria-hidden
                  className={cn("h-3.5 w-0.5 shrink-0", accent.bar)}
                />
                <MaterialTooltip name={group.label}>
                  <Badge
                    variant="outline"
                    className="gap-1.5 bg-background px-1.5 py-1"
                  >
                    <MaterialIcon name={group.label} className="size-4" />
                    <span className="font-medium">{group.label}</span>
                  </Badge>
                </MaterialTooltip>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                Lv. {group.steps[0].from} →{" "}
                {group.steps[group.steps.length - 1].to}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {group.steps.map((step, stepIndex) => (
                <div
                  key={stepIndex}
                  className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1"
                >
                  <span className="shrink-0 text-xs">
                    <span className="text-muted-foreground">Lv. </span>
                    <span className="font-medium">{step.from}</span>
                    <span className="text-muted-foreground"> → </span>
                    <span className="font-medium">{step.to}</span>
                  </span>
                  <MaterialChips materials={step.materials} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

interface TrainingDialogProps {
  characters: PlayableCharacter[]
}

export function TrainingDialog({ characters }: TrainingDialogProps) {
  const characterByName = useMemo(
    () => new Map(characters.map((character) => [character.name, character])),
    [characters]
  )
  const [open, setOpen] = useState(false)
  const [character, setCharacter] = useState<PlayableCharacter | null>(null)
  const [displayCharacter, setDisplayCharacter] =
    useState<PlayableCharacter | null>(null)
  const [characterRange, setCharacterRange] = useState<LevelRange>(
    DEFAULT_CHARACTER_RANGE
  )
  const [talentRanges, setTalentRanges] = useState<
    Record<"normal" | "skill" | "burst", LevelRange>
  >({
    normal: DEFAULT_TALENT_RANGE,
    skill: DEFAULT_TALENT_RANGE,
    burst: DEFAULT_TALENT_RANGE,
  })
  const lastCharacterName = useRef<string | null>(null)

  useEffect(
    () =>
      onTrainingOpen((name) => {
        const next = characterByName.get(name)
        if (!next) return
        if (next.name !== lastCharacterName.current) {
          setCharacterRange(DEFAULT_CHARACTER_RANGE)
          setTalentRanges({
            normal: DEFAULT_TALENT_RANGE,
            skill: DEFAULT_TALENT_RANGE,
            burst: DEFAULT_TALENT_RANGE,
          })
          lastCharacterName.current = next.name
        }
        setCharacter(next)
        setDisplayCharacter(next)
        setOpen(true)
      }),
    [characterByName]
  )

  useEffect(() => onTrainingClose(() => setOpen(false)), [])

  const currentCharacter = character ?? displayCharacter

  const currentCharacterLevel = clamp(
    parseLevel(characterRange.current, 1),
    1,
    90
  )
  const desiredCharacterLevel = clamp(
    parseLevel(characterRange.desired, 90),
    1,
    90
  )

  const updateCharacterRange = (key: keyof LevelRange) => (value: string) =>
    setCharacterRange((prev) => ({ ...prev, [key]: value }))
  const updateTalentRange =
    (talent: keyof typeof talentRanges) =>
    (key: keyof LevelRange) =>
    (value: string) =>
      setTalentRanges((prev) => ({
        ...prev,
        [talent]: { ...prev[talent], [key]: value },
      }))

  const accent = accentFor(currentCharacter?.element ?? "")

  return (
    <TooltipProvider>
      <div
        data-slot="training-profile"
        inert={!open}
        className={cn(
          "shrink-0 overflow-hidden transition-[width,margin-left] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          open ? "ml-3 w-[min(28rem,calc(100vw-3rem))]" : "w-0"
        )}
      >
        <Card
          aria-hidden={!open}
          className={cn(
            "h-full w-[min(28rem,calc(100vw-3rem))] flex-col gap-4 border border-foreground/10 p-4 ring-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
            open ? "translate-x-0" : "translate-x-full"
          )}
        >
          {currentCharacter && (
            <>
              <Card className="relative shrink-0 overflow-hidden">
                <DialogHeader className="px-(--card-spacing)">
                  <span
                    aria-hidden
                    className={cn("absolute inset-x-0 top-0 h-1", accent.bar)}
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -right-3 -bottom-5 size-28"
                  >
                    <CharacterIcon
                      src={currentCharacter.icon}
                      fallbackSrcs={[
                        currentCharacter.fallbackIcon,
                        currentCharacter.assetIcon,
                      ]}
                      alt=""
                      className="size-28 -scale-x-100 object-contain opacity-10"
                    />
                  </div>
                  <div className="relative flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <CharacterIcon
                        src={currentCharacter.icon}
                        fallbackSrcs={[
                          currentCharacter.fallbackIcon,
                          currentCharacter.assetIcon,
                        ]}
                        alt={currentCharacter.name}
                        className="size-14 shrink-0"
                      />
                      <div className="flex min-w-0 flex-col">
                        <h2 className="font-heading text-lg font-medium">
                          {currentCharacter.name}
                        </h2>
                        <p className="line-clamp-2 text-xs/relaxed text-muted-foreground">
                          {currentCharacter.talentNames.normal} ·{" "}
                          {currentCharacter.talentNames.skill} ·{" "}
                          {currentCharacter.talentNames.burst}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-xs font-medium">
                        Character Level
                      </span>
                      <div className="flex items-center gap-2">
                        <NumberInput
                          value={characterRange.current}
                          min={1}
                          max={90}
                          onChange={updateCharacterRange("current")}
                          ariaLabel="Character Level current level"
                        />
                        <span className="text-xs text-muted-foreground">
                          →
                        </span>
                        <NumberInput
                          value={characterRange.desired}
                          min={1}
                          max={90}
                          onChange={updateCharacterRange("desired")}
                          ariaLabel="Character Level desired level"
                        />
                      </div>
                    </div>
                  </div>
                </DialogHeader>
              </Card>
              <Card size="sm" className="shrink-0">
                <CardContent className="flex flex-col gap-2.5">
                  {TALENT_TYPES.map(({ key, type }) => (
                    <TalentRangeInputs
                      key={key}
                      icon={currentCharacter.talentIcons[key]}
                      type={type}
                      name={currentCharacter.talentNames[key]}
                      current={talentRanges[key].current}
                      desired={talentRanges[key].desired}
                      min={1}
                      max={10}
                      onCurrent={updateTalentRange(key)("current")}
                      onDesired={updateTalentRange(key)("desired")}
                    />
                  ))}
                </CardContent>
              </Card>
              <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pr-1">
                <CharacterSection
                  character={currentCharacter}
                  current={currentCharacterLevel}
                  desired={desiredCharacterLevel}
                />
                {TALENT_TYPES.map(({ key, type }) => (
                  <TalentSection
                    key={key}
                    type={type}
                    label={currentCharacter.talentNames[key]}
                    icon={currentCharacter.talentIcons[key]}
                    costs={currentCharacter.talentCosts}
                    current={clamp(
                      parseLevel(talentRanges[key].current, 1),
                      1,
                      10
                    )}
                    desired={clamp(
                      parseLevel(talentRanges[key].desired, 10),
                      1,
                      10
                    )}
                    accent={accent}
                  />
                ))}
              </div>
            </>
          )}
        </Card>
      </div>
    </TooltipProvider>
  )
}
