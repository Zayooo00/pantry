"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/button";
import { TextInput } from "@/components/text-input";

const Schema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
});

type Values = z.infer<typeof Schema>;

export function ForgotPasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(Schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: Values) {
    setServerError(null);
    let res: Response;
    try {
      res = await fetch("/api/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
    } catch {
      setServerError("Couldn't reach the server. Try again.");
      return;
    }
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      const message =
        typeof json?.error === "string" ? json.error : "Couldn't send reset link. Try again.";
      setServerError(message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-md border border-olive-2 bg-olive-3 px-4 py-4 font-display text-sm text-ink-2">
        If an account exists for that email, we've sent a reset link. Check your inbox — the link
        expires in one hour.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div>
        <label className="field-label">Email</label>
        <TextInput type="email" autoComplete="email" autoFocus {...register("email")} />
        {errors.email && (
          <div className="mt-2 rounded-md border border-tomato-2 bg-tomato-3 px-3.5 py-2.5 font-display text-sm text-tomato-2">
            {errors.email.message}
          </div>
        )}
      </div>
      {serverError && (
        <div className="rounded-md border border-tomato-2 bg-tomato-3 px-3.5 py-2.5 font-display text-sm text-tomato-2">
          {serverError}
        </div>
      )}
      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
