"use client";
import { ReactNode } from "react";
import Navbar from "@/app/components/Navbar";
import { ToastProvider } from "@/app/components/Toast";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Navbar />
        {/* Main content area */}
        <main
          style={{
            flex: 1,
            marginLeft: 260,
            padding: "32px 32px 32px 32px",
            minHeight: "100vh",
            background: "var(--background)",
          }}
          className="dashboard-main"
        >
          {children}
        </main>

        <style>{`
          @media (max-width: 768px) {
            .dashboard-main {
              margin-left: 0 !important;
              padding: 72px 16px 80px 16px !important;
            }
          }
        `}</style>
      </div>
    </ToastProvider>
  );
}
