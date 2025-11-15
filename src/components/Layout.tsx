import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Calendar, CheckSquare, StickyNote, TrendingUp, FolderKanban, LayoutDashboard, Search, BarChart3, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import GlobalSearch from "@/components/GlobalSearch";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const navigation = [
  { name: "Дашборд", href: "/", icon: LayoutDashboard },
  { name: "Календарь", href: "/calendar", icon: Calendar },
  { name: "Задачи", href: "/tasks", icon: CheckSquare },
  { name: "Заметки", href: "/notes", icon: StickyNote },
  { name: "Привычки", href: "/habits", icon: TrendingUp },
  { name: "Проекты", href: "/projects", icon: FolderKanban },
  { name: "Аналитика", href: "/analytics", icon: BarChart3 },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const { profile } = useProfile();

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (!user) {
    return null; // Or a loading spinner
  }

  return (
    <div className="flex h-screen bg-gradient-subtle">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-card to-background border-r border-border shadow-lg flex flex-col">
        <div className="p-6 border-b border-border text-center">
          <h1 className="text-2xl font-display font-bold bg-gradient-primary bg-clip-text text-transparent">
            ProductiveMe
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Ваша продуктивность</p>
        </div>

        <div className="p-4 border-b border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="focus:outline-none flex items-center gap-3 w-full hover:opacity-80 transition-opacity">
                <Avatar className="h-12 w-12 cursor-pointer">
                  <AvatarImage src={profile?.avatar_url || ""} alt={profile?.username || "User"} />
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {profile?.username?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-foreground">
                    {profile?.username || "Пользователь"}
                  </p>
                  <p className="text-xs text-muted-foreground">Профиль</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <User className="mr-2 h-4 w-4" />
                Профиль
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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

        <div className="p-4 border-t border-border">
          <ThemeToggle />
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
