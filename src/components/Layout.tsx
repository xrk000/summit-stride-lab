import { Outlet, Link, useLocation } from "react-router-dom";
import { Calendar, CheckSquare, StickyNote, TrendingUp, FolderKanban, LayoutDashboard, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

  return (
    <div className="flex h-screen bg-gradient-subtle">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            ProductiveMe
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Управление продуктивностью</p>
        </div>

        <div className="px-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Поиск по тегам..." 
              className="pl-9 bg-sidebar-accent border-sidebar-border"
            />
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link key={item.name} to={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    isActive && "bg-primary text-primary-foreground shadow-md"
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
    </div>
  );
}
