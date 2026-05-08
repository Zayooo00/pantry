import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { requireUserId } from "@/lib/access";
import { getCurrentUser } from "@/lib/queries";
import { SettingsClient } from "./settings-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const userId = await requireUserId();
  const me = await getCurrentUser(userId);
  if (!me) {
    notFound();
  }
  return (
    <AppShell>
      <SettingsClient
        user={{ id: me.id, name: me.name, email: me.email, joined: me.createdAt }}
      />
    </AppShell>
  );
}
