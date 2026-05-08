"use client";

export function Checkbox({
  checked,
  onChange,
  ...rest
}: {
  checked: boolean;
  onChange?: (next: boolean) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "type" | "checked">) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange?.(e.target.checked)}
      className="pantry-check"
      {...rest}
    />
  );
}
