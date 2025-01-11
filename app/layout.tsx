import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TourProvider } from "@/components/tour";

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: "shadcn/tour",
  description: "Make your own product tour with shadcn/tour.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className}`}>
        <TourProvider>
          {children}
        </TourProvider>
      </body>
    </html>
  );
}
