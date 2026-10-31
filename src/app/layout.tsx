import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Manrope, Mochiy_Pop_P_One } from "next/font/google";
import "./globals.css";
import ThemeRegistry from "@/theme/ThemeRegistry";

const font = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Public site font (Figma); Jakarta stays for the admin/partner theme.
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const logoFont = Mochiy_Pop_P_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-logo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EpicJourneys - Authentic Indian Tours & Experiences",
  description:
    "Explore curated journeys and adventures across incredible Indian destinations. Find tours starting right near you with EpicJourneys.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${font.variable} ${manrope.variable} ${logoFont.variable}`}>
      <head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </head>
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
