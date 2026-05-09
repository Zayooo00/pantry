import { cva } from "class-variance-authority";

export const roleBadge = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-3xs tracking-eyebrow-loose uppercase",
  {
    variants: {
      role: {
        owner: "border-ink-1 bg-ink-1 text-paper-0",
        editor: "border-paper-3 bg-paper-2 text-ink-1",
        viewer: "border-paper-3 bg-paper-1 text-ink-3",
      },
    },
  },
);
