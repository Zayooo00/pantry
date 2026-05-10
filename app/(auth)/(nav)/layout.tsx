import { AppShell } from "@/components/app-shell";

export default function NavLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
