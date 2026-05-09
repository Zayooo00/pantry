"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/cn";
import { button } from "@/components/button";
import { TextInput } from "@/components/text-input";
import { safeNext } from "@/lib/safe-next";

const SigninSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
});

type SigninValues = z.infer<typeof SigninSchema>;

// In local dev the seed creates a known demo user; pre-fill so iteration is
// fast. `process.env.NODE_ENV` is statically replaced by Next.js at build, so
// this branch is dead-stripped in production.
const DEV_DEFAULTS: SigninValues =
  process.env.NODE_ENV === "development"
    ? { email: "alex@pantry.local", password: "password123" }
    : { email: "", password: "" };

export function SigninForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SigninValues>({
    resolver: zodResolver(SigninSchema),
    defaultValues: DEV_DEFAULTS,
  });

  async function onSubmit(values: SigninValues) {
    setServerError(null);
    const res = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });
    if (res?.error) {
      setServerError("That email and password don't match. Try again.");
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div>
        <label className="field-label">Email</label>
        <TextInput type="email" autoComplete="email" {...register("email")} />
        {errors.email && (
          <div className="mt-2 rounded-md border border-tomato-2 bg-tomato-3 px-3.5 py-2.5 font-display text-sm text-tomato-2">
            {errors.email.message}
          </div>
        )}
      </div>
      <div>
        <label className="field-label">Password</label>
        <TextInput type="password" autoComplete="current-password" {...register("password")} />
        {errors.password && (
          <div className="mt-2 rounded-md border border-tomato-2 bg-tomato-3 px-3.5 py-2.5 font-display text-sm text-tomato-2">
            {errors.password.message}
          </div>
        )}
      </div>
      {serverError && (
        <div className="rounded-md border border-tomato-2 bg-tomato-3 px-3.5 py-2.5 font-display text-sm text-tomato-2">
          {serverError}
        </div>
      )}
      <button
        type="submit"
        className={cn(button({ variant: "primary", size: "lg" }), "w-full")}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
