import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  TODO: "bg-slate-700 text-slate-100",
  IN_PROGRESS: "bg-indigo-500/20 text-indigo-300",
  REVIEW: "bg-amber-500/20 text-amber-300",
  COMPLETED: "bg-emerald-500/20 text-emerald-300",
  LOW: "bg-slate-700 text-slate-200",
  MEDIUM: "bg-sky-500/20 text-sky-300",
  HIGH: "bg-orange-500/20 text-orange-300",
  URGENT: "bg-rose-500/20 text-rose-300",
  NEW: "bg-indigo-500/20 text-indigo-300",
  CONTACTED: "bg-sky-500/20 text-sky-300",
  IN_DISCUSSION: "bg-amber-500/20 text-amber-300",
  QUALIFIED: "bg-emerald-500/20 text-emerald-300",
  CONVERTED: "bg-emerald-600/30 text-emerald-200",
  LOST: "bg-slate-700 text-slate-300",
  ACTIVE: "bg-emerald-500/20 text-emerald-300",
  INACTIVE: "bg-slate-700 text-slate-300",
};

export function Badge({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        styles[value] ?? "bg-slate-700 text-slate-200",
        className,
      )}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}
