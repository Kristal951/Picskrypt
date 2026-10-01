import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/hooks/useToast";
import AuthBootstrap from "@/components/AuthBootstrap";
import CreatePictureButton from "@/components/ui/CreatePictureButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Picskrypt",
  description: "Enjoy unlimited and premium photos for free.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased relative h-screen`}
      >
        <ToastProvider>
          <AuthBootstrap />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
