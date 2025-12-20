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

        <main className="flex-grow w-full">{children}</main>
      </SessionProvider>
    </>
  );
}
