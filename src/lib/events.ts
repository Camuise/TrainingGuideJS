export const ADD_DIALOG_OPEN_EVENT = "add-dialog:open"
export const CHARACTERS_ADDED_EVENT = "characters:added"
export const TRAINING_OPEN_EVENT = "training:open"

export function dispatchAddDialogOpen(): void {
  window.dispatchEvent(new CustomEvent(ADD_DIALOG_OPEN_EVENT))
}

export function onAddDialogOpen(listener: () => void): () => void {
  window.addEventListener(ADD_DIALOG_OPEN_EVENT, listener)
  return () => window.removeEventListener(ADD_DIALOG_OPEN_EVENT, listener)
}

export function dispatchCharactersAdded(names: string[]): void {
  window.dispatchEvent(new CustomEvent(CHARACTERS_ADDED_EVENT, { detail: names }))
}

export function onCharactersAdded(listener: (names: string[]) => void): () => void {
  const handler = (event: Event) =>
    listener((event as CustomEvent<string[]>).detail)
  window.addEventListener(CHARACTERS_ADDED_EVENT, handler)
  return () => window.removeEventListener(CHARACTERS_ADDED_EVENT, handler)
}

export function dispatchTrainingOpen(name: string): void {
  window.dispatchEvent(new CustomEvent(TRAINING_OPEN_EVENT, { detail: name }))
}

export function onTrainingOpen(listener: (name: string) => void): () => void {
  const handler = (event: Event) =>
    listener((event as CustomEvent<string>).detail)
  window.addEventListener(TRAINING_OPEN_EVENT, handler)
  return () => window.removeEventListener(TRAINING_OPEN_EVENT, handler)
}
