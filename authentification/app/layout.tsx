import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nucleus",
  description: "Awesome Website :3",
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
