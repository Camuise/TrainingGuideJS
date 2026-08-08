export const TRAINING_STATES_KEY = "training-states"

export interface LevelRange {
  current: number
  desired: number
}

export interface TalentRanges {
  normal: LevelRange
  skill: LevelRange
  burst: LevelRange
}

export interface TrainingState {
  characterLevel: LevelRange
  talents: TalentRanges
}

export type TrainingStates = Record<string, TrainingState>

function parseLevelRange(raw: unknown): LevelRange | null {
  if (typeof raw !== "object" || raw === null) return null
  const { current, desired } = raw as Record<string, unknown>
  if (
    typeof current !== "number" ||
    !Number.isFinite(current) ||
    typeof desired !== "number" ||
    !Number.isFinite(desired)
  ) {
    return null
  }
  return { current, desired }
}

function parseTalentRanges(raw: unknown): TalentRanges | null {
  if (typeof raw !== "object" || raw === null) return null
  const { normal, skill, burst } = raw as Record<string, unknown>
  const parsed = {
    normal: parseLevelRange(normal),
    skill: parseLevelRange(skill),
    burst: parseLevelRange(burst),
  }
  if (!parsed.normal || !parsed.skill || !parsed.burst) return null
  return parsed as TalentRanges
}

export function loadTrainingStates(validNames: Set<string>): TrainingStates {
  try {
    const raw = window.localStorage.getItem(TRAINING_STATES_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== "object" || parsed === null) return {}
    const result: TrainingStates = {}
    for (const name of validNames) {
      const state = (parsed as Record<string, unknown>)[name]
      if (typeof state !== "object" || state === null) continue
      const characterLevel = parseLevelRange(
        (state as Record<string, unknown>).characterLevel
      )
      const talents = parseTalentRanges(
        (state as Record<string, unknown>).talents
      )
      if (!characterLevel || !talents) continue
      result[name] = { characterLevel, talents }
    }
    return result
  } catch {
    return {}
  }
}

export function loadTrainingState(name: string): TrainingState | null {
  return loadTrainingStates(new Set([name]))[name] ?? null
}

function loadAllStates(): Record<string, TrainingState> {
  try {
    const raw = window.localStorage.getItem(TRAINING_STATES_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== "object" || parsed === null) return {}
    return parsed as Record<string, TrainingState>
  } catch {
    return {}
  }
}

function persistAllStates(states: Record<string, TrainingState>) {
  try {
    window.localStorage.setItem(TRAINING_STATES_KEY, JSON.stringify(states))
  } catch {
    // Ignore storage errors and keep the current session state.
  }
}

export function saveTrainingState(name: string, state: TrainingState) {
  const states = loadAllStates()
  states[name] = state
  persistAllStates(states)
}

export function removeTrainingState(name: string) {
  const states = loadAllStates()
  delete states[name]
  persistAllStates(states)
}
