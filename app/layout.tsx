import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers"; // client wrapper
import { Navbar } from "@/components/navbar";
import { Toaster } from "@/components/ui/sonner";
import { ThreadsBackground } from "@/components/reactbits/threads-background";
import { auth } from "@clerk/nextjs/server";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Evenly.",
  description: "Fast, clean group expenses.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { userId } = auth();
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="flex min-h-screen flex-col bg-background text-foreground">
            {/* Global threads background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
              <ThreadsBackground />
            </div>
            <Navbar initialUserId={userId} />
            <div className="flex-1">{children}</div>
            <footer className="border-t">
              <div className="mx-auto max-w-6xl px-6 py-6">
                <p className="text-center text-xs text-muted-foreground">
                  Built by <span className="font-medium">Jerald Choon</span>
                </p>
              </div>
            </footer>
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
