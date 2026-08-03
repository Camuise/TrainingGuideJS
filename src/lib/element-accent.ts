export interface AccentClasses {
  text: string
  border: string
  ring: string
  ringSoft: string
  bgSoft: string
  bgSoftest: string
  bar: string
}

const ELEMENT_ACCENTS: Record<string, AccentClasses> = {
  Anemo: {
    text: "text-element-anemo",
    border: "border-element-anemo",
    ring: "ring-element-anemo",
    ringSoft: "ring-element-anemo/40",
    bgSoft: "bg-element-anemo/10",
    bgSoftest: "bg-element-anemo/5",
    bar: "bg-element-anemo",
  },
  Cryo: {
    text: "text-element-cryo",
    border: "border-element-cryo",
    ring: "ring-element-cryo",
    ringSoft: "ring-element-cryo/40",
    bgSoft: "bg-element-cryo/10",
    bgSoftest: "bg-element-cryo/5",
    bar: "bg-element-cryo",
  },
  Dendro: {
    text: "text-element-dendro",
    border: "border-element-dendro",
    ring: "ring-element-dendro",
    ringSoft: "ring-element-dendro/40",
    bgSoft: "bg-element-dendro/10",
    bgSoftest: "bg-element-dendro/5",
    bar: "bg-element-dendro",
  },
  Electro: {
    text: "text-element-electro",
    border: "border-element-electro",
    ring: "ring-element-electro",
    ringSoft: "ring-element-electro/40",
    bgSoft: "bg-element-electro/10",
    bgSoftest: "bg-element-electro/5",
    bar: "bg-element-electro",
  },
  Geo: {
    text: "text-element-geo",
    border: "border-element-geo",
    ring: "ring-element-geo",
    ringSoft: "ring-element-geo/40",
    bgSoft: "bg-element-geo/10",
    bgSoftest: "bg-element-geo/5",
    bar: "bg-element-geo",
  },
  Hydro: {
    text: "text-element-hydro",
    border: "border-element-hydro",
    ring: "ring-element-hydro",
    ringSoft: "ring-element-hydro/40",
    bgSoft: "bg-element-hydro/10",
    bgSoftest: "bg-element-hydro/5",
    bar: "bg-element-hydro",
  },
  Pyro: {
    text: "text-element-pyro",
    border: "border-element-pyro",
    ring: "ring-element-pyro",
    ringSoft: "ring-element-pyro/40",
    bgSoft: "bg-element-pyro/10",
    bgSoftest: "bg-element-pyro/5",
    bar: "bg-element-pyro",
  },
}

const DEFAULT_ACCENT: AccentClasses = {
  text: "text-primary",
  border: "border-primary",
  ring: "ring-primary",
  ringSoft: "ring-primary/40",
  bgSoft: "bg-primary/10",
  bgSoftest: "bg-primary/5",
  bar: "bg-primary",
}

export function accentFor(element: string): AccentClasses {
  return ELEMENT_ACCENTS[element] ?? DEFAULT_ACCENT
}
