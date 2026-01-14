import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  LayoutDashboard, 
  Building2, 
  FileText, 
  BarChart3, 
  Users, 
  FileEdit, 
  Settings, 
  LogOut,
  Bot,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Дашборд" },
  { path: "/mfo", icon: Building2, label: "МФО" },
  { path: "/applications", icon: FileText, label: "Заявки" },
  { path: "/analytics", icon: BarChart3, label: "Аналитика" },
  { path: "/users", icon: Users, label: "Пользователи" },
  { path: "/content", icon: FileEdit, label: "Контент" },
  { path: "/settings", icon: Settings, label: "Настройки" },
];

export default function Layout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#050505] flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-black border-r border-white/10
        transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        noise-overlay relative
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Bot className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-white">MicroLoan Bot</h1>
                <p className="text-xs text-zinc-500">Админ панель</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'}
                `}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* User */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white font-semibold">
                {admin?.name?.charAt(0).toUpperCase() || "A"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{admin?.name}</p>
                <p className="text-xs text-zinc-500 truncate">{admin?.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-zinc-400 hover:text-white hover:bg-white/5"
              onClick={handleLogout}
              data-testid="logout-btn"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Выйти
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden glass sticky top-0 z-30 px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            data-testid="mobile-menu-btn"
          >
            <Menu className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-blue-500" />
            <span className="font-bold text-white">MicroLoan</span>
          </div>
          <div className="w-10" />
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
