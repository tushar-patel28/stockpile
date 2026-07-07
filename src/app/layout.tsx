import type { Metadata } from "next";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Stockpile",
  description: "Personal stock portfolio tracker",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body className="antialiased">
        {user ? (
          <div className="flex h-screen">
            <AppSidebar />
            <div className="flex-1 overflow-auto">{children}</div>
          </div>
        ) : (
          children
        )}
        <Toaster />
      </body>
    </html>
  );
}