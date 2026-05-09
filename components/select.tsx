"use client";

import { useState } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cn } from "@/lib/cn";

export type SelectOption = { value: string; label: string; description?: string };

export function Select({
  value,
  onChange,
  options,
  placeholder = "Select…",
  disabled,
  size = "md",
}: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(false);
  return (
    <SelectPrimitive.Root
      value={value}
      onValueChange={onChange}
      disabled={disabled}
      open={open}
      onOpenChange={setOpen}
    >
      <SelectPrimitive.Trigger
        className={cn(
          "flex w-full cursor-pointer items-center justify-between rounded-md border border-paper-4 bg-paper-0 text-left font-sans text-ink-1 transition-[border-color] duration-150 ease-pantry hover:border-ink-3 data-disabled:cursor-not-allowed data-disabled:opacity-50 data-placeholder:text-ink-4 data-[state=open]:border-ink-1",
          size === "sm" ? "px-2.5 py-1.5 text-sm" : "px-3.5 py-3 text-base",
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          <span
            className={cn(
              "inline-block text-lg leading-none text-ink-4 transition-transform duration-150 ease-pantry",
              open && "rotate-180 text-ink-2",
            )}
          >
            ▾
          </span>
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className="z-50 max-h-(--radix-select-content-available-height) w-(--radix-select-trigger-width) animate-[pantry-pop_0.15s_var(--ease-pantry)] overflow-hidden rounded-md border border-ink-1 bg-paper-0 p-1 shadow-[0_12px_32px_rgba(26,24,20,0.12)]"
        >
          <SelectPrimitive.Viewport>
            {options.map((opt) => (
              <SelectPrimitive.Item
                key={opt.value}
                value={opt.value}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-sm px-3 py-2.5 font-sans text-sm text-ink-1 transition-[background] duration-150 ease-pantry outline-none data-highlighted:bg-paper-2 data-[state=checked]:bg-ink-1 data-[state=checked]:text-paper-0 data-[state=checked]:data-highlighted:bg-ink-0"
              >
                <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                {opt.description && (
                  <span className="ml-auto font-mono text-2xs opacity-60">{opt.description}</span>
                )}
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
