import {
  aggregateMaterials,
  buildCharacterPlan,
  buildTalentPlan,
  type CharacterPlan,
  type TalentPlan,
} from "@/lib/training-plan"
import {
  EXP_PER_HERO_WIT,
  type MaterialAmount,
  type PlayableCharacter,
} from "@/lib/playable-characters"
import type {
  LevelRange,
  TalentRanges,
  TrainingStates,
} from "@/lib/training-state"

export const DEFAULT_CHARACTER_LEVEL: LevelRange = { current: 1, desired: 90 }

const DEFAULT_TALENT_RANGE: LevelRange = { current: 1, desired: 10 }

export const DEFAULT_TALENT_RANGES: TalentRanges = {
  normal: DEFAULT_TALENT_RANGE,
  skill: DEFAULT_TALENT_RANGE,
  burst: DEFAULT_TALENT_RANGE,
}

export interface MaterialUsage {
  character: PlayableCharacter
  count: number
}

export interface MaterialTotal {
  name: string
  count: number
  usages: MaterialUsage[]
}

export interface CharacterSummary {
  character: PlayableCharacter
  characterLevel: LevelRange
  talentRanges: TalentRanges
  characterPlan: CharacterPlan
  talentPlans: {
    normal: TalentPlan
    skill: TalentPlan
    burst: TalentPlan
  }
  materials: MaterialAmount[]
  exp: number
  heroWits: number
}

export interface SummaryPlan {
  characters: CharacterSummary[]
  materials: MaterialTotal[]
  totalExp: number
  totalHeroWits: number
}

export function buildSummary(
  characters: PlayableCharacter[],
  addedNames: string[],
  states: TrainingStates
): SummaryPlan {
  const characterByName = new Map(
    characters.map((character) => [character.name, character])
  )
  const characterSummaries: CharacterSummary[] = []
  const totals = new Map<string, MaterialTotal>()
  let totalExp = 0

  for (const name of addedNames) {
    const character = characterByName.get(name)
    if (!character) continue
    const state = states[name]
    const characterLevel = state?.characterLevel ?? DEFAULT_CHARACTER_LEVEL
    const talentRanges = state?.talents ?? DEFAULT_TALENT_RANGES

    const characterPlan = buildCharacterPlan(
      character,
      characterLevel.current,
      characterLevel.desired
    )
    const talentPlans = {
      normal: buildTalentPlan(
        character.talentCosts,
        talentRanges.normal.current,
        talentRanges.normal.desired
      ),
      skill: buildTalentPlan(
        character.talentCosts,
        talentRanges.skill.current,
        talentRanges.skill.desired
      ),
      burst: buildTalentPlan(
        character.talentCosts,
        talentRanges.burst.current,
        talentRanges.burst.desired
      ),
    }

    const materials = aggregateMaterials([
      characterPlan.totalMaterials,
      talentPlans.normal.totalMaterials,
      talentPlans.skill.totalMaterials,
      talentPlans.burst.totalMaterials,
    ])
    const exp = characterPlan.totalExp
    totalExp += exp

    characterSummaries.push({
      character,
      characterLevel,
      talentRanges,
      characterPlan,
      talentPlans,
      materials,
      exp,
      heroWits: exp > 0 ? Math.ceil(exp / EXP_PER_HERO_WIT) : 0,
    })

    for (const material of materials) {
      const entry = totals.get(material.name) ?? {
        name: material.name,
        count: 0,
        usages: [],
      }
      entry.count += material.count
      entry.usages.push({ character, count: material.count })
      totals.set(material.name, entry)
    }
  }

  const materials = [...totals.values()]
    .filter((total) => total.count > 0)
    .map((total) => ({
      ...total,
      usages: total.usages
        .filter((usage) => usage.count > 0)
        .sort((a, b) => b.count - a.count),
    }))
    .sort((a, b) => b.count - a.count)

  const totalHeroWits = Math.ceil(totalExp / EXP_PER_HERO_WIT)
  if (totalHeroWits > 0) {
    materials.unshift({
      name: "Hero's Wit",
      count: totalHeroWits,
      usages: characterSummaries
        .filter((summary) => summary.heroWits > 0)
        .map((summary) => ({
          character: summary.character,
          count: summary.heroWits,
        }))
        .sort((a, b) => b.count - a.count),
    })
  }

  return {
    characters: characterSummaries,
    materials,
    totalExp,
    totalHeroWits,
  }
}
