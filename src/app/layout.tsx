import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { LayoutDashboard, GitBranch, Terminal, LogOut, ChevronRight, Database, Settings2 } from "lucide-react";
import { LogoutButton } from "@/components/LogoutButton";
import { startScheduler } from "@/lib/scheduler";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AgentMesh Control Panel",
  description: "Manage your AI automated prompts",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Iniciamos el motor de triggers si estamos en el servidor
  if (typeof window === "undefined") {
    const port = process.env.PORT || "3000";
    startScheduler(`http://localhost:${port}`);
  }

  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <div className="layout-wrapper">
          {/* Sidebar */}
          <aside className="sidebar">
            <div className="p-8">
              <div className="logo">AgentMesh</div>
            </div>
            
            <nav className="flex-1 px-4 space-y-1">
              <Link href="/" className="flex items-center justify-between group p-3 rounded-xl hover:bg-white/5 transition-all text-sm font-medium text-white/70 hover:text-white">
                <div className="flex items-center gap-3">
                  <LayoutDashboard size={18} className="text-blue-500" /> Workflows
                </div>
                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              
              <Link href="/prompts" className="flex items-center justify-between group p-3 rounded-xl hover:bg-white/5 transition-all text-sm font-medium text-white/70 hover:text-white">
                <div className="flex items-center gap-3">
                  <Terminal size={18} className="text-emerald-500" /> Prompts
                </div>
                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>

              <Link href="/storage" className="flex items-center justify-between group p-3 rounded-xl hover:bg-white/5 transition-all text-sm font-medium text-white/70 hover:text-white">
                <div className="flex items-center gap-3">
                  <Database size={18} className="text-pink-500" /> Almacén
                </div>
                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>

              <Link href="/settings" className="flex items-center justify-between group p-3 rounded-xl hover:bg-white/5 transition-all text-sm font-medium text-white/70 hover:text-white">
                <div className="flex items-center gap-3">
                  <Settings2 size={18} className="text-gray-400" /> Configuración
                </div>
                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </nav>

            <div className="p-6 border-t border-white/5 bg-black/20">
              <div className="mb-4 px-2">
                <div className="text-[10px] uppercase tracking-widest text-muted font-bold mb-1">Usuario</div>
                <div className="text-xs font-semibold">Administrador</div>
              </div>
              <LogoutButton />
            </div>
          </aside>

          {/* Main Content */}
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
