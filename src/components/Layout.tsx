import { Outlet, Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Calendar, CheckSquare, StickyNote, TrendingUp, FolderKanban, LayoutDashboard, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GlobalSearch from "@/components/GlobalSearch";

const navigation = [
  { name: "Дашборд", href: "/", icon: LayoutDashboard },
  { name: "Календарь", href: "/calendar", icon: Calendar },
  { name: "Задачи", href: "/tasks", icon: CheckSquare },
  { name: "Заметки", href: "/notes", icon: StickyNote },
  { name: "Привычки", href: "/habits", icon: TrendingUp },
  { name: "Проекты", href: "/projects", icon: FolderKanban },
];

export default function Layout() {
  const location = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gradient-subtle">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-card to-background border-r border-border shadow-lg flex flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-display font-bold bg-gradient-primary bg-clip-text text-transparent">
            ProductiveMe
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Ваша продуктивность</p>
        </div>

        <div className="px-4 mb-4">
          <button 
            className="w-full flex items-center gap-2 px-4 py-2.5 bg-muted/50 hover:bg-muted text-muted-foreground rounded-lg transition-all hover:shadow-md group cursor-pointer"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search className="h-4 w-4 group-hover:text-primary transition-colors" />
            <span className="text-sm">Поиск...</span>
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link key={item.name} to={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start transition-all duration-200",
                    isActive 
                      ? "bg-gradient-primary text-white shadow-glow font-medium hover:bg-gradient-primary" 
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="text-xs text-muted-foreground">
            <p>Версия 1.0.0</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

      {/* Global Search Dialog */}
      <GlobalSearch open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </div>
  );
}
