import {
  expBetween,
  type MaterialAmount,
  type PlayableCharacter,
} from "@/lib/playable-characters"

export const ASCENSION_GATES = [
  { level: 20, label: "Ascension 2" },
  { level: 40, label: "Ascension 3" },
  { level: 50, label: "Ascension 4" },
  { level: 60, label: "Ascension 5" },
  { level: 70, label: "Ascension 6" },
  { level: 80, label: "Ascension 7" },
]

export interface ExpStep {
  kind: "exp"
  from: number
  to: number
  exp: number
}

export interface AscensionStep {
  kind: "ascension"
  level: number
  label: string
  materials: MaterialAmount[]
}

export type TrainingStep = ExpStep | AscensionStep

export interface CharacterPlan {
  steps: TrainingStep[]
  totalExp: number
  totalMaterials: MaterialAmount[]
}

export interface TalentPlan {
  steps: { from: number; to: number; materials: MaterialAmount[] }[]
  totalMaterials: MaterialAmount[]
}

export function aggregateMaterials(
  tiers: MaterialAmount[][]
): MaterialAmount[] {
  const totals = new Map<string, number>()
  for (const tier of tiers) {
    for (const { name, count } of tier) {
      totals.set(name, (totals.get(name) ?? 0) + count)
    }
  }
  return [...totals].map(([name, count]) => ({ name, count }))
}

export function buildCharacterPlan(
  character: PlayableCharacter,
  current: number,
  desired: number
): CharacterPlan {
  const steps: TrainingStep[] = []
  let level = current
  for (const [index, gate] of ASCENSION_GATES.entries()) {
    if (level <= gate.level && desired > gate.level) {
      if (gate.level > level) {
        steps.push({
          kind: "exp",
          from: level,
          to: gate.level,
          exp: expBetween(level, gate.level),
        })
      }
      steps.push({
        kind: "ascension",
        level: gate.level,
        label: gate.label,
        materials: character.ascension[index] ?? [],
      })
      level = gate.level
    }
  }
  if (level < desired) {
    steps.push({
      kind: "exp",
      from: level,
      to: desired,
      exp: expBetween(level, desired),
    })
  }

  const ascensionTiers = steps
    .filter((step): step is AscensionStep => step.kind === "ascension")
    .map((step) => step.materials)
  return {
    steps,
    totalExp: steps
      .filter((step): step is ExpStep => step.kind === "exp")
      .reduce((sum, step) => sum + step.exp, 0),
    totalMaterials: aggregateMaterials(ascensionTiers),
  }
}

export function buildTalentPlan(
  costs: MaterialAmount[][],
  current: number,
  desired: number
): TalentPlan {
  const steps: { from: number; to: number; materials: MaterialAmount[] }[] = []
  for (let level = current + 1; level <= desired; level++) {
    steps.push({
      from: level - 1,
      to: level,
      materials: costs[level - 2] ?? [],
    })
  }
  return {
    steps,
    totalMaterials: aggregateMaterials(steps.map((step) => step.materials)),
  }
}
