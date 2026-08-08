import genshin, { type Items } from "genshin-db"

export const EXP_PER_HERO_WIT = 20000

export const characterExpCurve: number[] = [
  1000,
  1325,
  1700,
  2150,
  2625,
  3150,
  3725,
  4350,
  5000,
  5700, // 1-10
  6450,
  7225,
  8050,
  8925,
  9825,
  10750,
  11725,
  12725,
  13775,
  14875, // 11-20
  16800,
  18000,
  19250,
  20550,
  21875,
  23250,
  24650,
  26100,
  27575,
  29100, // 21-30
  30650,
  32250,
  33875,
  35550,
  37250,
  38975,
  40750,
  42575,
  44425,
  46300, // 31-40
  50625,
  52700,
  54775,
  56900,
  59075,
  61275,
  63525,
  65800,
  68125,
  70475, // 41-50
  76500,
  79050,
  81650,
  84275,
  86950,
  89650,
  92400,
  95175,
  98000,
  100875, // 51-60
  108950,
  112050,
  115175,
  118325,
  121525,
  124775,
  128075,
  131400,
  134775,
  138175, // 61-70
  148700,
  152375,
  156075,
  159825,
  163600,
  167425,
  171300,
  175225,
  179175,
  183175, // 71-80
  216225,
  243025,
  273100,
  306800,
  344600,
  386950,
  434425,
  487625,
  547200, // 81-89
]

export function expBetween(from: number, to: number): number {
  let total = 0
  for (let level = from; level < to; level++) {
    total += characterExpCurve[level - 1]
  }
  return total
}

export interface MaterialAmount {
  name: string
  count: number
}

function elementIconFor(element: string): string {
  return genshin.elements(element)?.images?.base64 ?? ""
}

const WEAPON_TYPE_NAMES: Record<string, string> = {
  WEAPON_SWORD_ONE_HAND: "Sword",
  WEAPON_CLAYMORE: "Claymore",
  WEAPON_BOW: "Bow",
  WEAPON_POLE: "Polearm",
  WEAPON_CATALYST: "Catalyst",
}

function weaponTypeFor(type: string): string {
  return WEAPON_TYPE_NAMES[type] ?? type
}

export interface PlayableCharacter {
  name: string
  element: string
  elementIcon: string
  weaponType: string
  icon: string
  fallbackIcon: string
  assetIcon: string
  ascension: MaterialAmount[][]
  talentCosts: MaterialAmount[][]
  talentNames: {
    normal: string
    skill: string
    burst: string
  }
  talentIcons: {
    normal: string
    skill: string
    burst: string
  }
}

export const materialIcons: Record<string, string> = {}

function collectMaterial(name: string, count: number): MaterialAmount {
  if (!(name in materialIcons)) {
    const icon = genshin.materials(name)?.images.filename_icon
    materialIcons[name] = icon ? `https://enka.network/ui/${icon}.png` : ""
  }
  return { name, count }
}

function collectTier(tier: Items[]): MaterialAmount[] {
  return tier.map((item) => collectMaterial(item.name, item.count))
}

export const playableCharacters: PlayableCharacter[] = genshin
  .characters("names", { matchCategories: true })
  .map((name) => {
    const character = genshin.characters(name)
    const talentKey = name === "Aether" || name === "Lumine" ? "Traveler" : name
    const talents = genshin.talents(talentKey)

    return {
      name: character?.name ?? name,
      element: character?.elementText ?? "",
      elementIcon: elementIconFor(character?.elementText ?? ""),
      weaponType: weaponTypeFor(character?.weaponType ?? ""),
      icon: character?.images.mihoyo_icon ?? "",
      fallbackIcon: character?.images.hoyowiki_icon ?? "",
      assetIcon: character
        ? `https://enka.network/ui/${character.images.filename_icon}.png`
        : "",
      ascension: character
        ? Object.values(character.costs).map((tier) => collectTier(tier))
        : [],
      talentCosts: talents
        ? Object.values(talents.costs).map((cost) => collectTier(cost))
        : [],
      talentNames: {
        normal: talents?.combat1?.name ?? "Normal Attack",
        skill: talents?.combat2?.name ?? "Elemental Skill",
        burst: talents?.combat3?.name ?? "Elemental Burst",
      },
      talentIcons: {
        normal: talents?.images?.filename_combat1
          ? `https://enka.network/ui/${talents.images.filename_combat1}.png`
          : "",
        skill: talents?.images?.filename_combat2
          ? `https://enka.network/ui/${talents.images.filename_combat2}.png`
          : "",
        burst: talents?.images?.filename_combat3
          ? `https://enka.network/ui/${talents.images.filename_combat3}.png`
          : "",
      },
    }
  })
  .sort((a, b) => a.name.localeCompare(b.name))
