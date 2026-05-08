"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/cn";
import { button } from "@/components/button";
import { TextInput } from "@/components/text-input";
import { useMutation } from "@/lib/api/client";

const SignupSchema = z.object({
  name: z.string().trim().min(1, "Tell us your name."),
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  password: z.string().min(8, "At least 8 characters."),
});

type SignupValues = z.infer<typeof SignupSchema>;

export function SignupForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(SignupSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const { trigger } = useMutation("post", "/api/signup");

  async function onSubmit(values: SignupValues) {
    setServerError(null);
    try {
      await trigger({ body: values });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Could not create account.");
      return;
    }
    const signed = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });
    if (signed?.error) {
      setServerError("Account created, but sign-in failed. Try logging in.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
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
      <button
        type="submit"
        className={cn(button({ variant: "primary", size: "lg" }), "w-full")}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Creating…" : "Create account"}
      </button>
    </form>
  );
}
