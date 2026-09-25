import type { LucideIcon } from "lucide-react";


export function EmptyState({
  icon: Icon,
  title,
  titleAs: Title = "p",
  children,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  titleAs?: "p" | "h1";
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl bg-card px-6 py-12 text-center ring-1 ring-foreground/10">
      {Icon && (
        <Icon className="size-6 text-muted-foreground" aria-hidden="true" />
      )}
      <div className="space-y-1">
        <Title className="text-sm font-medium">{title}</Title>
        {children && (
          <p className="max-w-sm text-sm text-muted-foreground">{children}</p>
        )}
      </div>
      {action}
    </div>
  );
}
