import type { Metadata } from "next";
import { Inter, Bricolage_Grotesque, Signika, Arya, Rubik } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const bricolage = Bricolage_Grotesque({ 
  subsets: ["latin"], 
  variable: "--font-bricolage",
  display: 'swap',
});

const signika = Signika({ subsets: ["latin"], variable: "--font-signika" });
const arya = Arya({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-arya" });
const rubik = Rubik({ subsets: ["latin"], variable: "--font-rubik" });

export const metadata: Metadata = {
  title: "Placely | Student Portal",
  description: "Manage your placement journey with ease.",
};

import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${bricolage.variable} ${signika.variable} ${arya.variable} ${rubik.variable}`}>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            (function() {
              try {
                var theme = localStorage.getItem('placely-theme');
                if (theme === 'modern') {
                  document.documentElement.classList.add('theme-modern');
                }
              } catch (e) {}
            })();
          `}
        </Script>
      </head>
      <body className="font-sans antialiased">
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
