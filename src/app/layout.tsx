import type { Metadata } from "next";
import { Inter, Bricolage_Grotesque, Signika, Arya, Rubik, IBM_Plex_Sans } from "next/font/google";
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
const ibmPlex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex"
});

export const metadata: Metadata = {
  title: "CareerBridge | Student Portal",
  description: "Manage your placement journey with ease.",
};

import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${bricolage.variable} ${signika.variable} ${arya.variable} ${rubik.variable} ${ibmPlex.variable}`} suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                localStorage.setItem('careerbridge-theme', 'default');
                localStorage.setItem('careerbridge-design', 'default');
                var html = document.documentElement;
                html.classList.remove('design-geometric', 'design-hp', 'design-sece', 'theme-modern', 'theme-technical', 'theme-rubik', 'theme-cambria');
                html.classList.add('theme-default');
              } catch (e) {}
            })();
          `
        }} />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
