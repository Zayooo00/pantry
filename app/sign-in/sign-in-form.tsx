"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/button";
import { TextInput } from "@/components/text-input";
import { safeNext } from "@/lib/safe-next";

const SignInSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
});

type SignInValues = z.infer<typeof SignInSchema>;

const DEV_DEFAULTS: SignInValues =
  process.env.NODE_ENV === "development"
    ? { email: "alex@pantry.local", password: "password123" }
    : { email: "", password: "" };

type SignInError = { kind: "credentials" } | { kind: "rate_limit" };

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const presetEmail = params.get("email") ?? "";
  const [signInError, setSignInError] = useState<SignInError | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(SignInSchema),
    defaultValues: presetEmail ? { email: presetEmail, password: "" } : DEV_DEFAULTS,
  });

  async function onSubmit(values: SignInValues) {
    setSignInError(null);
    const res = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });
    if (res?.error) {
      if (res.code === "too_many_attempts") {
        setSignInError({ kind: "rate_limit" });
      } else {
        setSignInError({ kind: "credentials" });
      }
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
      {signInError?.kind === "credentials" && (
        <div className="rounded-md border border-tomato-2 bg-tomato-3 px-3.5 py-2.5 font-display text-sm text-tomato-2">
          That email and password don't match. Try again.
        </div>
      )}
      {signInError?.kind === "rate_limit" && (
        <div className="rounded-md border border-tomato-2 bg-tomato-3 px-3.5 py-2.5 font-display text-sm text-tomato-2">
          Too many attempts. Try again in a few minutes.
        </div>
      )}
      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
