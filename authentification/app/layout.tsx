import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nucleus",
  description: "An Awesome Website ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
