import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sorting Hat",
  description: "Sorting Hat - A magical sorting hat for your Hogwarts house",
  icons: {
    icon: "/sorting-hat.png",
    shortcut: "/sorting-hat.png",
    apple: "/sorting-hat.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
