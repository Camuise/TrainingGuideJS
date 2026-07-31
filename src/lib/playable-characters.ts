import genshin from "genshin-db"

export interface PlayableCharacter {
  name: string
  icon: string
  fallbackIcon: string
  assetIcon: string
}

export const playableCharacters: PlayableCharacter[] = genshin
  .characters("names", { matchCategories: true })
  .map((name) => {
    const character = genshin.characters(name)
    return {
      name: character?.name ?? name,
      icon: character?.images.mihoyo_icon ?? "",
      fallbackIcon: character?.images.hoyowiki_icon ?? "",
      assetIcon: character
        ? `https://enka.network/ui/${character.images.filename_icon}.png`
        : "",
    }
  })
  .sort((a, b) => a.name.localeCompare(b.name))
