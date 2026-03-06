import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "Pit Stop | F1 Predictions & Live Data",
  description: "Your ultimate F1 companion — live race data, weather-based predictions, tyre strategy analysis, and comprehensive race calendar. Experience Formula 1 like never before.",
  keywords: "F1, Formula 1, predictions, tyre strategy, race calendar, weather, live data, standings",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Navigation />
        <div className="global-background">
          <div className="global-blur" />
          <div className="global-carbon" />
          <div className="global-glow" />
          <div className="global-glow2" />
          <div className="global-overlay" />
        </div>
        <main style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
          {children}
        </main>
      </body>
    </html>
  );
}
