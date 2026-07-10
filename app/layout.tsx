import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cheevodash.example.com"),
  title: {
    default: "CheevoDash",
    template: "%s | CheevoDash",
  },
  description:
    "Track your achievements and compare your progress with other players.",
  applicationName: "CheevoDash",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "CheevoDash",
    description:
      "Track your achievements and compare your progress with other players.",
    type: "website",
    siteName: "CheevoDash",
  },
  twitter: {
    card: "summary",
    title: "CheevoDash",
    description:
      "Track your achievements and compare your progress with other players.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
