import React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import AuthProvider from "@/components/AuthProvider"; // Make sure to create this simple client wrapper

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });

export const metadata: Metadata = {
  title: "Workmind.ai - Enterprise AI Agents",
  description: "Departmental AI Experts for SMEs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {/* We condition sidebar on authenticated state usually, simplified here */}
          <div className="flex bg-brand-bg min-h-screen">
            <Sidebar /> 
            <main className="ml-64 flex-1 p-8">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}