import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MiningGear — Marketplace for Bitcoin Mining Hardware & Sites",
  description:
    "The B2B marketplace for used Bitcoin mining hardware, power gear and sites across the United States.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Sora:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <footer className="site">
          <div className="footin">
            <span style={{ color: "var(--ink)", fontWeight: 700 }}>MiningGear</span>
            <span>
              The B2B marketplace for used Bitcoin mining hardware, power gear &amp; sites · United States
            </span>
            <span>Phase 1 MVP · Demo data</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
