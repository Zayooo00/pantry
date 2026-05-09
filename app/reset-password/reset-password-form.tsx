"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/cn";
import { button } from "@/components/button";
import { TextInput } from "@/components/text-input";

const Schema = z
  .object({
    newPassword: z.string().min(8, "At least 8 characters."),
    confirm: z.string(),
  })
  .refine((d) => d.newPassword === d.confirm, {
    path: ["confirm"],
    message: "Passwords don't match.",
  });

type Values = z.infer<typeof Schema>;

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(Schema),
    defaultValues: { newPassword: "", confirm: "" },
  });

  async function onSubmit(values: Values) {
    setServerError(null);
    let res: Response;
    try {
      res = await fetch("/api/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: values.newPassword }),
      });
    } catch {
      setServerError("Couldn't reach the server. Try again.");
      return;
    }
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      const message =
        typeof json?.error === "string" ? json.error : "This link is invalid or expired.";
      setServerError(message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/signin"), 1500);
  }

  if (done) {
    return (
      <div className="rounded-md border border-olive-2 bg-olive-3 px-4 py-4 font-display text-sm text-ink-2">
        Password updated. Redirecting to sign in…
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div>
        <label className="field-label">New password</label>
        <TextInput
          type="password"
          autoComplete="new-password"
          autoFocus
          {...register("newPassword")}
        />
        {errors.newPassword && (
          <div className="mt-2 rounded-md border border-tomato-2 bg-tomato-3 px-3.5 py-2.5 font-display text-sm text-tomato-2">
            {errors.newPassword.message}
          </div>
        )}
      </div>
      <div>
        <label className="field-label">Confirm password</label>
        <TextInput type="password" autoComplete="new-password" {...register("confirm")} />
        {errors.confirm && (
          <div className="mt-2 rounded-md border border-tomato-2 bg-tomato-3 px-3.5 py-2.5 font-display text-sm text-tomato-2">
            {errors.confirm.message}
          </div>
        )}
      </div>
      {serverError && (
        <div className="rounded-md border border-tomato-2 bg-tomato-3 px-3.5 py-2.5 font-display text-sm text-tomato-2">
          {serverError}{" "}
          <Link href="/forgot-password" className="ml-1 border-b border-tomato-2">
            Request a new link →
          </Link>
        </div>
      )}
      <button
        type="submit"
        className={cn(button({ variant: "primary", size: "lg" }), "w-full")}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Updating…" : "Set password"}
      </button>
    </form>
  );
}
