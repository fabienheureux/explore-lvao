import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Longue Vie Aux Objets - Carte des acteurs",
  description:
    "Exploration interactive des acteurs de la réparation et du réemploi en France",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" data-fr-scheme="light">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@gouvfr/dsfr@1.12.1/dist/dsfr.min.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@gouvfr/dsfr@1.12.1/dist/utility/utility.min.css"
        />
      </head>
      <body>
        {children}
        <Script
          src="https://cdn.jsdelivr.net/npm/@gouvfr/dsfr@1.12.1/dist/dsfr.module.min.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
