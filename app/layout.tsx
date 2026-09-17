import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, IBM_Plex_Sans, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const sourceSans3Heading = Source_Sans_3({subsets:['latin'],variable:'--font-heading'});

const ibmPlexSans = IBM_Plex_Sans({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "내 위치 근처 단속 이력",
  description: "현재 위치 기준으로 서울시 주정차 단속 이력을 확인합니다.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", ibmPlexSans.variable, sourceSans3Heading.variable)}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
