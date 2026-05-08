"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/components/toast";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { SharingSection } from "./sharing-section";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import { button } from "@/components/button";
import { TextInput } from "@/components/text-input";
import { useMutation } from "@/lib/api/client";

const ProfileSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
});

type ProfileValues = z.infer<typeof ProfileSchema>;

const PasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z.string().min(8, "New password must be at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "New passwords don't match.",
  });

type PasswordValues = z.infer<typeof PasswordSchema>;

type User = { id: string; name: string; email: string; joined: Date };

export function SettingsClient({ user }: { user: User }) {
  const { toast } = useToast();
  const router = useRouter();
  const [profileError, setProfileError] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);
  const [signOutOpen, setSignOutOpen] = useState(false);

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: { name: user.name, email: user.email },
  });

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(PasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const profileValues = profileForm.watch();
  const profileUnchanged =
    profileValues.name === user.name && profileValues.email.toLowerCase() === user.email;

  const { trigger: triggerProfile } = useMutation("patch", "/api/me");
  const { trigger: triggerPassword } = useMutation("patch", "/api/me");

  async function onSaveProfile(values: ProfileValues) {
    setProfileError(null);
    if (values.name === user.name && values.email === user.email) {
      return;
    }
    try {
      await triggerProfile({ body: values });
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Could not update profile.");
      return;
    }
    toast(<>Profile <em>saved</em>.</>);
    profileForm.reset(values);
    router.refresh();
  }

  async function onChangePassword(values: PasswordValues) {
    setPwError(null);
    try {
      await triggerPassword({
        body: {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        },
      });
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Could not change password.");
      return;
    }
    passwordForm.reset();
    toast(<>Password <em>changed</em>.</>);
  }

  return (
    <>
      <div className="mb-8 md:mb-12">
        <div className={cn("caption","mb-3")}>PROFILE · NO. 0001</div>
        <h1 className="m-0 font-display text-3xl leading-none font-light tracking-[-0.03em] sm:text-4xl lg:text-5xl">
          Your <em className="font-normal italic">desk</em>.
        </h1>
        <div className="mt-3 font-display text-md font-light text-ink-3 italic sm:text-xl">
          Joined {formatDate(user.joined)}.
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px] lg:gap-12">
        <div className="flex flex-col gap-12">
          <SettingsSection
            num="01"
            title="Identity"
            lede="Your name and email — visible only to your household."
          >
            <form
              onSubmit={profileForm.handleSubmit(onSaveProfile)}
              className="grid grid-cols-1 gap-4 md:grid-cols-2"
              noValidate
            >
              <div>
                <label className="field-label">Name</label>
                <TextInput {...profileForm.register("name")} />
                {profileForm.formState.errors.name && (
                  <div className="mt-1 font-display text-sm text-tomato-2">
                    {profileForm.formState.errors.name.message}
                  </div>
                )}
              </div>
              <div>
                <label className="field-label">Email</label>
                <TextInput type="email" {...profileForm.register("email")} />
                {profileForm.formState.errors.email && (
                  <div className="mt-1 font-display text-sm text-tomato-2">
                    {profileForm.formState.errors.email.message}
                  </div>
                )}
              </div>
              {profileError && (
                <div className="rounded-md border border-tomato-2 bg-tomato-3 px-3 py-2 font-display text-sm text-tomato-2 md:col-span-2">
                  {profileError}
                </div>
              )}
              <div className="flex justify-end md:col-span-2">
                <button
                  type="submit"
                  disabled={profileForm.formState.isSubmitting || profileUnchanged}
                  className={button({ variant: "primary" })}
                >
                  {profileForm.formState.isSubmitting ? "Saving…" : "Save profile"}
                </button>
              </div>
            </form>
          </SettingsSection>

          <SettingsSection
            num="02"
            title="Password"
            lede="Change the key to your pantry. Use at least eight characters."
          >
            <form
              onSubmit={passwordForm.handleSubmit(onChangePassword)}
              className="grid grid-cols-1 gap-4 md:grid-cols-2"
              noValidate
            >
              <div className="md:col-span-2">
                <label className="field-label">Current password</label>
                <TextInput
                  type="password"
                  autoComplete="current-password"
                  {...passwordForm.register("currentPassword")}
                />
                {passwordForm.formState.errors.currentPassword && (
                  <div className="mt-1 font-display text-sm text-tomato-2">
                    {passwordForm.formState.errors.currentPassword.message}
                  </div>
                )}
              </div>
              <div>
                <label className="field-label">New password</label>
                <TextInput
                  type="password"
                  autoComplete="new-password"
                  {...passwordForm.register("newPassword")}
                />
                {passwordForm.formState.errors.newPassword && (
                  <div className="mt-1 font-display text-sm text-tomato-2">
                    {passwordForm.formState.errors.newPassword.message}
                  </div>
                )}
              </div>
              <div>
                <label className="field-label">Confirm new password</label>
                <TextInput
                  type="password"
                  autoComplete="new-password"
                  {...passwordForm.register("confirmPassword")}
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <div className="mt-1 font-display text-sm text-tomato-2">
                    {passwordForm.formState.errors.confirmPassword.message}
                  </div>
                )}
              </div>
              {pwError && (
                <div className="rounded-md border border-tomato-2 bg-tomato-3 px-3 py-2 font-display text-sm text-tomato-2 md:col-span-2">
                  {pwError}
                </div>
              )}
              <div className="flex justify-end md:col-span-2">
                <button
                  type="submit"
                  disabled={passwordForm.formState.isSubmitting}
                  className={button({ variant: "primary" })}
                >
                  {passwordForm.formState.isSubmitting ? "Updating…" : "Change password"}
                </button>
              </div>
            </form>
          </SettingsSection>

          <SettingsSection
            num="03"
            title="Session"
            lede="Sign out of this browser. Your pantry will still be here."
          >
            <button type="button" onClick={() => setSignOutOpen(true)} className={button({ variant: "secondary" })}>
              Sign out
            </button>
          </SettingsSection>

          <SharingSection currentUserId={user.id} />
        </div>

        <aside className="h-fit rounded-xl border border-paper-3 bg-paper-1 p-6 lg:sticky lg:top-24">
          <div className={cn("caption","mb-3")}>A NOTE</div>
          <p className="m-0 font-display text-lg leading-snug text-ink-2">
            "The pantry is a ledger first, a magazine second."
          </p>
          <hr className="my-4 border-0 h-px bg-[linear-gradient(to_right,var(--color-paper-4)_50%,transparent_0)] bg-size-[6px_1px] bg-repeat-x" />
          <div className="caption">EST. KITCHEN · NO. 0001</div>
          <div className="mt-2 font-display text-sm text-ink-3 italic">
            Your changes save the moment you press the button. Nothing leaves the household.
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={signOutOpen}
        onClose={() => setSignOutOpen(false)}
        onConfirm={() => signOut({ callbackUrl: "/welcome" })}
        title="Sign out?"
        message={<>You'll need to sign back in to see the pantry.</>}
        confirmLabel="Sign out"
      />
    </>
  );
}

function SettingsSection({
  num,
  title,
  lede,
  children,
}: {
  num: string;
  title: string;
  lede: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between border-t border-ink-1 pt-3">
        <div className="flex items-baseline gap-3">
          <span className="caption">{num}</span>
          <h2 className="m-0 font-display text-2xl tracking-[-0.01em]">{title}</h2>
        </div>
      </div>
      <p className="mb-6 max-w-prose text-sm text-ink-3">{lede}</p>
      {children}
    </section>
  );
}
