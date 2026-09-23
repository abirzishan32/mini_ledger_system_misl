import { CircleAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * The live region stays mounted even when empty, so screen readers announce a
 * failure that appears after submission rather than silently inserting it.
 */
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
