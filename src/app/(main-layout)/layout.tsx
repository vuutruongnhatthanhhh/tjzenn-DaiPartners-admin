"use client";
import Header from "@/components/Header";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SessionProvider>
        <Header />
        <Toaster position="top-center" richColors />
        <main className="flex-grow w-full">{children}</main>
      </SessionProvider>
    </>
  );
}
