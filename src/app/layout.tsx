import type { Metadata } from "next";
import { Be_Vietnam_Pro, Bodoni_Moda, Geist_Mono, Poiret_One } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { getSettings } from "@/lib/settings";
import Link from "next/link";
import { getSiteContent } from "@/lib/cms";

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const poiretOne = Poiret_One({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const bodoniModa = Bodoni_Moda({
  variable: "--font-accent",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent();

  return {
    title: content.seo.title,
    description: content.seo.description,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = getSettings();

  return (
    <html lang="en" suppressHydrationWarning className="light">
      <body
        className={`${beVietnam.variable} ${poiretOne.variable} ${bodoniModa.variable} ${geistMono.variable} min-h-screen bg-background font-sans text-foreground antialiased selection:bg-vibrant-coral selection:text-paper-white`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          disableTransitionOnChange
        >
          {settings.announcement && (
            <div className="bg-primary px-4 py-3 text-white text-center flex flex-col items-center justify-center border-b-4 border-vibrant-coral shadow-lg relative z-50">
              {settings.announcement.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={settings.announcement.imageUrl} alt="Announcement" className="h-16 w-auto object-contain mb-2 rounded" />
              )}
              <h3 className={`text-lg uppercase tracking-wider ${settings.announcement.isBold ? "font-bold" : "font-semibold"} ${settings.announcement.isItalic ? "italic" : ""}`}>
                {settings.announcement.heading}
              </h3>
              <p className={`mt-1 max-w-3xl text-sm opacity-90 ${settings.announcement.isBold ? "font-semibold" : ""} ${settings.announcement.isItalic ? "italic" : ""}`}>
                {settings.announcement.paragraph}
              </p>
              {settings.announcement.linkUrl && (
                <Link href={settings.announcement.linkUrl} className="mt-3 inline-block rounded bg-vibrant-coral px-4 py-1.5 text-xs font-bold hover:bg-white hover:text-primary transition-colors">
                  Learn More
                </Link>
              )}
            </div>
          )}
          {children}
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
