import { forwardRef } from "react";
import { cn } from "@/lib/cn";

const baseClass =
  "w-full px-3.5 py-3 bg-paper-0 border border-paper-4 rounded-md font-sans text-base text-ink-1 transition-[border-color] duration-150 ease-pantry focus:outline-none focus:border-ink-1 placeholder:text-ink-4";

export const TextInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function TextInput({ className, ...rest }, ref) {
  return <input ref={ref} className={cn(baseClass, className)} {...rest} />;
});

export const TextArea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function TextArea({ className, ...rest }, ref) {
  return <textarea ref={ref} className={cn(baseClass, className)} {...rest} />;
});
