import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { dispatchAddDialogOpen } from "@/lib/events"

export function AddCharacterButton() {
  return (
    <Button
      type="button"
      variant="default"
      size="icon-lg"
      aria-label="Add character"
      onClick={() => dispatchAddDialogOpen()}
    >
      <Plus className="size-5" />
    </Button>
  )
}
