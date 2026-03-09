import type { Metadata } from "next";
import { Outfit, Roboto } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: 'Promptix Tech Solutions | Data Collection Tool',
  description: 'Advanced data collection and analytics platform by Promptix tech solutions',
  icons: {
    icon: '/logo.png',
  },
};

import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${roboto.variable} antialiased`} suppressHydrationWarning>
        <AuthProvider>
          <main className="min-h-screen bg-slate-50 transition-colors duration-500">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
