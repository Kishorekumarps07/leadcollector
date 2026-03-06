import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
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
      <body className={`${plusJakartaSans.variable} antialiased`}>
        <AuthProvider>
          <main className="min-h-screen bg-slate-50 transition-colors duration-500">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
