import { useMemo, useState, type ReactNode } from "react"

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
      <span
        aria-hidden
        className={cn(
          "flex items-center justify-center border border-border bg-muted text-muted-foreground",
          className
        )}
      >
        {name.slice(0, 1)}
      </span>
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

function MaterialChips({
  materials,
  size = "md",
}: {
  materials: MaterialAmount[]
  size?: "sm" | "md"
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {materials.map((material) => (
        <span
          key={material.name}
          title={material.name}
          className="flex items-center gap-1 border border-border bg-background px-1.5 py-1 text-xs text-muted-foreground"
        >
          <MaterialIcon
            name={material.name}
            className={size === "sm" ? "size-4" : "size-5"}
          />
          {material.count.toLocaleString()}
        </span>
      ))}
    </div>
  )
}

function SummaryChip({
  children,
  highlight = false,
  title,
}: {
  children: ReactNode
  highlight?: boolean
  title?: string
}) {
  return (
    <span
      title={title}
      className={cn(
        "flex items-center gap-1 border border-border bg-background px-2 py-1 text-xs",
        highlight && "border-primary text-foreground"
      )}
    >
      {children}
    </span>
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

function LevelRangeInputs({
  label,
  current,
  desired,
  min,
  max,
  onCurrent,
  onDesired,
}: {
  label: string
  current: string
  desired: string
  min: number
  max: number
  onCurrent: (value: string) => void
  onDesired: (value: string) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="min-w-0 truncate text-xs font-medium">{label}</span>
      <div className="flex shrink-0 items-center gap-2">
        <NumberInput
          value={current}
          min={min}
          max={max}
          onChange={onCurrent}
          ariaLabel={`${label} current level`}
        />
        <span className="text-xs text-muted-foreground">→</span>
        <NumberInput
          value={desired}
          min={min}
          max={max}
          onChange={onDesired}
          ariaLabel={`${label} desired level`}
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

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-base font-medium">
          Character Level (Lv. {current} → {desired})
        </h2>
        <p className="text-xs text-muted-foreground">
          EXP to level, plus ascension materials at each ascension gate.
        </p>
      </div>
      {!plan ? (
        <p className="text-xs text-muted-foreground">
          Desired level must be above the current level.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5">
            <SummaryChip highlight>
              {plan.totalExp.toLocaleString()} EXP
            </SummaryChip>
            <SummaryChip>
              ≈ {Math.ceil(plan.totalExp / EXP_PER_HERO_WIT)} Hero&apos;s Wit
            </SummaryChip>
            {plan.totalMaterials.map((material) => (
              <SummaryChip key={material.name} title={material.name}>
                <MaterialIcon name={material.name} className="size-4" />
                {material.count.toLocaleString()}
              </SummaryChip>
            ))}
          </div>
          <div className="flex flex-col divide-y divide-border border border-border">
            {plan.steps.map((step, index) =>
              step.kind === "exp" ? (
                <div
                  key={index}
                  className="flex items-center justify-between gap-2 px-3 py-2"
                >
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
              ) : (
                <div key={index} className="flex flex-col gap-1.5 px-3 py-2">
                  <span className="text-xs">
                    Ascend at{" "}
                    <span className="font-medium">Lv. {step.level}</span> (
                    {step.label})
                  </span>
                  <MaterialChips materials={step.materials} />
                </div>
              )
            )}
          </div>
        </>
      )}
    </section>
  )
}

function TalentSection({
  label,
  costs,
  current,
  desired,
}: {
  label: string
  costs: MaterialAmount[][]
  current: number
  desired: number
}) {
  const plan: TalentPlan | undefined = useMemo(
    () =>
      desired > current ? buildTalentPlan(costs, current, desired) : undefined,
    [costs, current, desired]
  )

  if (!plan) return null

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-base font-medium">
          {label} (Lv. {current} → {desired})
        </h2>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {plan.totalMaterials.map((material) => (
          <SummaryChip key={material.name} title={material.name}>
            <MaterialIcon name={material.name} className="size-4" />
            {material.count.toLocaleString()}
          </SummaryChip>
        ))}
      </div>
      <div className="flex flex-col divide-y divide-border border border-border">
        {plan.steps.map((step, index) => (
          <div key={index} className="flex flex-col gap-1.5 px-3 py-2">
            <span className="text-xs">
              Lv.{" "}
              <span className="font-medium">
                {step.from} → {step.to}
              </span>
            </span>
            <MaterialChips materials={step.materials} size="sm" />
          </div>
        ))}
      </div>
    </section>
  )
}

interface CharacterTrainingDialogProps {
  character: PlayableCharacter | null
  onOpenChange: (open: boolean) => void
}

export function CharacterTrainingDialog({
  character,
  onOpenChange,
}: CharacterTrainingDialogProps) {
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

  if (!character) return null

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
  const talentKeys: ("normal" | "skill" | "burst")[] = [
    "normal",
    "skill",
    "burst",
  ]

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

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogPopup className="max-h-[90svh] w-full max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <CharacterIcon
              src={character.icon}
              fallbackSrcs={[character.fallbackIcon, character.assetIcon]}
              alt={character.name}
              className="size-14"
            />
            <div className="flex min-w-0 flex-col">
              <DialogTitle>{character.name}</DialogTitle>
              <DialogDescription className="line-clamp-2">
                {character.talentNames.normal} · {character.talentNames.skill} ·{" "}
                {character.talentNames.burst}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="flex flex-col gap-2.5 border border-border bg-card p-3">
          <LevelRangeInputs
            label="Character Level"
            current={characterRange.current}
            desired={characterRange.desired}
            min={1}
            max={90}
            onCurrent={updateCharacterRange("current")}
            onDesired={updateCharacterRange("desired")}
          />
          {talentKeys.map((talent) => (
            <LevelRangeInputs
              key={talent}
              label={character.talentNames[talent]}
              current={talentRanges[talent].current}
              desired={talentRanges[talent].desired}
              min={1}
              max={10}
              onCurrent={updateTalentRange(talent)("current")}
              onDesired={updateTalentRange(talent)("desired")}
            />
          ))}
        </div>
        <DialogViewport className="flex flex-col gap-6 pr-1">
          <CharacterSection
            character={character}
            current={currentCharacterLevel}
            desired={desiredCharacterLevel}
          />
          {talentKeys.map((talent) => (
            <TalentSection
              key={talent}
              label={character.talentNames[talent]}
              costs={character.talentCosts}
              current={clamp(
                parseLevel(talentRanges[talent].current, 1),
                1,
                10
              )}
              desired={clamp(
                parseLevel(talentRanges[talent].desired, 10),
                1,
                10
              )}
            />
          ))}
        </DialogViewport>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  )
}
