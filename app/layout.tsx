import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "GDG Backend Lab",
  description: "Team-based backend engineering learning lab at Mount Kenya University",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="header">
          <nav className="navbar">
            <Link href="/" className="brand">
              <span className="brand-mark">GDG</span>
              <span>
                Backend Engineering Lab
                <small>MOUNT KENYA UNIVERSITY</small>
              </span>
            </Link>
            <div className="nav-links">
              <Link href="/">Home</Link>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/facilitator">Facilitator</Link>
              <Link href="/login">Sign in</Link>
              <Link href="/register">Get started ↗</Link>
            </div>
          </nav>
        </header>
        {children}
        <footer className="footer">
          GDG on Campus · Mount Kenya University · Backend Engineering Journey
        </footer>
      </body>
    </html>
  );
}
