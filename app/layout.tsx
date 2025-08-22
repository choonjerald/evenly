import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers"; // client wrapper

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Evenly.",
  description: "Fast, clean group expenses.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Client-only providers live inside this wrapper */}
        <Providers>
          <div className="min-h-screen bg-background text-foreground">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
