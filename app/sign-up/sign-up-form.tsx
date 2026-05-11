"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/button";
import { TextInput } from "@/components/text-input";
import { useMutation } from "@/lib/api/client";
import { safeNext } from "@/lib/safe-next";

const SignUpSchema = z.object({
  name: z.string().trim().min(1, "Tell us your name."),
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  password: z.string().min(8, "At least 8 characters."),
});

type SignUpValues = z.infer<typeof SignUpSchema>;

export function SignUpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const presetEmail = params.get("email") ?? "";
  const inviteToken = params.get("inviteToken") ?? undefined;
  const next = safeNext(params.get("next"));
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: { name: "", email: presetEmail, password: "" },
  });

  const { trigger } = useMutation("post", "/api/sign-up");

  async function onSubmit(values: SignUpValues) {
    setServerError(null);
    let res: { verified?: boolean; emailSent?: boolean } | undefined;
    try {
      res = (await trigger({ body: { ...values, inviteToken } })) as {
        verified?: boolean;
        emailSent?: boolean;
      };
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Could not create account.");
      return;
    }
    const nextQuery = next === "/dashboard" ? "" : `&next=${encodeURIComponent(next)}`;
    if (res?.verified) {
      router.push(`/sign-in?email=${encodeURIComponent(values.email)}${nextQuery}`);
      return;
    }
    const sent = res?.emailSent ? "1" : "0";
    router.push(`/verify-email?email=${encodeURIComponent(values.email)}&sent=${sent}${nextQuery}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div>
        <label className="field-label">Your name</label>
        <TextInput type="text" autoComplete="name" placeholder="Alex Hsu" {...register("name")} />
        {errors.name && (
          <div className="mt-2 rounded-md border border-tomato-2 bg-tomato-3 px-3.5 py-2.5 font-display text-sm text-tomato-2">
            {errors.name.message}
          </div>
        )}
      </div>
      <div>
        <label className="field-label">Email</label>
        <TextInput
          type="email"
          autoComplete="email"
          placeholder="you@household.com"
          {...register("email")}
        />
        {errors.email && (
          <div className="mt-2 rounded-md border border-tomato-2 bg-tomato-3 px-3.5 py-2.5 font-display text-sm text-tomato-2">
            {errors.email.message}
          </div>
        )}
      </div>
      <div>
        <label className="field-label">Password</label>
        <TextInput
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          {...register("password")}
        />
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
      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating…" : "Create account"}
      </Button>
    </form>
  );
}
