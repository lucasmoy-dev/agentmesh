"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <button 
      onClick={handleLogout} 
      className="btn btn-outline" 
      style={{ padding: '0.4rem', border: 'none' }}
      title="Cerrar sesión"
    >
      <LogOut size={20} />
    </button>
  );
}
