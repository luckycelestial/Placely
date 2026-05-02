import type { Metadata } from "next";
import { Inter, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const bricolage = Bricolage_Grotesque({ 
  subsets: ["latin"], 
  variable: "--font-bricolage",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Placely | Student Portal",
  description: "Manage your placement journey with ease.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${bricolage.variable}`}>
      <head>
        {/* We keep the font loading via Next.js Font for optimization, 
            but if Bricolage needs special weights, we can specify them here */}
      </head>
      <body className="font-sans antialiased bg-[#fcfcfc] text-[#1f1f1f]">
        {children}
      </body>
    </html>
  );
}
