import { CircleAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Renders the message and per-rule errors an action returned, or nothing.
// The live region stays mounted even while empty, so a screen reader announces a
// failure that appears after submission instead of it being inserted silently.
// Used by every form and by the pages, which pass the backend's envelope through.
export function FormAlert({
  message,
  errors,
}: {
  message: string;
  errors: string[];
}) {
  const hasError = message !== "" || errors.length > 0;

  return (
    <div aria-live="polite" aria-atomic="true">
      {hasError && (
        <Alert variant="destructive">
          <CircleAlert aria-hidden="true" />
          <AlertTitle>{message || "Something went wrong."}</AlertTitle>
          {errors.length > 0 && (
            <AlertDescription>
              <ul className="list-outside list-disc space-y-1 pl-4">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          )}
        </Alert>
      )}
    </div>
  );
}
