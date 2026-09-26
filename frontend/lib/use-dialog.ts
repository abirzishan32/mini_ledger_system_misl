"use client";

import { useState } from "react";

// Dialog open state that closes itself once the server confirms a submission.
// marker is a value the action changes only on success — the posted
// transaction's id, or the created account's name — so a rejection leaves the
// dialog open with the messages and every typed value still in place.
// Compared during render rather than in an effect, which would paint the dialog
// still open and close it a frame later. Shared by account-form and
// transaction-form, which had the same effect written out twice.
export function useDialogClosedOnSuccess(marker: string) {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(marker);

  if (marker !== seen) {
    setSeen(marker);

    if (marker !== "") {
      setOpen(false);
    }
  }

  return [open, setOpen] as const;
}
