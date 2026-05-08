import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/session-provider";
import { ThemeProvider } from "@/components/theme";
import { THEME_COOKIE_NAME, type Theme } from "@/components/theme-shared";
import { ToastProvider } from "@/components/toast";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["SOFT", "WONK"],
  style: ["normal", "italic"],
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-plex-sans",
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex-mono",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pantry — A quiet inventory, kept honest.",
  description: "A pantry tracker for the household.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieValue = (await cookies()).get(THEME_COOKIE_NAME)?.value;
  const initialTheme: Theme | null =
    cookieValue === "light" || cookieValue === "dark" ? cookieValue : null;

  return (
    <html
      lang="en"
      data-theme={initialTheme ?? undefined}
      className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable}`}
    >
      <body>
        <SessionProvider>
          <ThemeProvider initialTheme={initialTheme}>
            <ToastProvider>{children}</ToastProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
