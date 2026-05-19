import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Map,
  Users,
  Wallet,
  Package,
  Shield,
  LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/sig", label: "SIG & Cartographie", icon: Map, pillar: "Pilier 1" },
  { to: "/administration", label: "Administration", icon: Users, pillar: "Pilier 2" },
  { to: "/finances", label: "Finances", icon: Wallet, pillar: "Pilier 3" },
  { to: "/patrimoine", label: "Patrimoine", icon: Package, pillar: "Pilier 4" },
] as const;

export function AppSidebar() {
  const location = useLocation();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <aside className="hidden lg:flex w-72 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold">
            F
          </div>
          <div>
            <h1 className="font-display text-lg font-bold leading-tight">FANISA</h1>
            <p className="text-xs text-sidebar-foreground/60">Web Pro · Toamasina</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.to || location.pathname.startsWith(item.to + "/");
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {"pillar" in item && item.pillar && (
                <span className="text-[10px] uppercase tracking-wider text-sidebar-foreground/40">
                  {item.pillar.replace("Pilier ", "P")}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border space-y-1">
        <div className="px-3 py-2 flex items-center gap-2 text-xs text-sidebar-foreground/50">
          <Shield className="w-3 h-3" />
          Système sécurisé · v2.0
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
