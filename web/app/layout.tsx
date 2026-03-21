import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import Navbar from "../components/Navbar";

export const metadata: Metadata = {
  title: "SkillBridge — India's Smartest Freelance Marketplace",
  description: "Verified skills. Fair bids. AI-powered trust. The freelance marketplace built for India's next generation.",
  keywords: ["freelance", "India", "skill verification", "escrow", "marketplace"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-appBg text-white font-sans antialiased">
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
