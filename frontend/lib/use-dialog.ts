"use client";

import { useState } from "react";

/**
 * Dialog open state that closes itself once the server confirms a submission.
 *
 * `marker` is a value the action changes only on success — the id of the
 * transaction just posted, or the name of the account just created. A
 * rejection leaves it alone, so the dialog stays open with the messages and
 * every typed value still in place.
 *
 * Compared during render rather than in an effect. An effect would run after
 * the browser had already painted the dialog still open, then close it in a
 * second pass; this closes it in the same pass. It is also the form React
 * documents for adjusting state when an input changes, which is why the
 * effect version trips react-hooks/set-state-in-effect.
 */
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
