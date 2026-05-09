export function formatCount(count: number): string {
  if (Number.isInteger(count)) {
    return String(count);
  }
  return count.toFixed(2).replace(/\.?0+$/, "");
}

export function formatDate(d: Date | null | undefined, opts?: { dotted?: boolean }): string {
  if (!d) {
    return "—";
  }
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(2);
  if (opts?.dotted) {
    return `${dd}.${mm}.${yy}`;
  }
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${dd} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function daysUntil(d: Date | null | undefined): number | null {
  if (!d) {
    return null;
  }
  const now = new Date();
  const ms = d.getTime() - now.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export type ItemStatus = "ok" | "low" | "soon";

export function itemStatus(args: {
  count: number;
  threshold: number | null | undefined;
  expiresAt: Date | null | undefined;
}): ItemStatus {
  if (args.threshold != null && args.count < args.threshold) {
    return "low";
  }
  const days = daysUntil(args.expiresAt);
  if (days != null && days <= 14 && days >= 0) {
    return "soon";
  }
  return "ok";
}

export function shortLabel(name: string, len = 3): string {
  return name
    .split(/[\s,]+/)[0]
    .slice(0, len)
    .toUpperCase();
}

export function formatEventKind(kind: string, _payload?: unknown): string {
  switch (kind) {
    case "consume": {
      return "Consumed";
    }
    case "restock": {
      return "Restocked";
    }
    case "open":
    case "opened": {
      return "Opened";
    }
    case "created": {
      return "Created";
    }
    case "low_threshold_crossed": {
      return "Crossed low threshold";
    }
    default: {
      const spaced = kind.replace(/_/g, " ").trim();
      if (spaced.length === 0) {
        return kind;
      }
      return spaced.charAt(0).toUpperCase() + spaced.slice(1);
    }
  }
}
