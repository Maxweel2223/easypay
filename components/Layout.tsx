import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Link as LinkIcon, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Bell,
  HelpCircle,
  Wallet,
  Check,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppRoute, User, Notification } from '../types';
import { supabase } from '../services/supabaseClient';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Listen for custom events to add notifications from other components
  useEffect(() => {
    const handleNewNotification = (e: Event) => {
        const customEvent = e as CustomEvent<Notification>;
        setNotifications(prev => [customEvent.detail, ...prev]);
        // Auto show if urgent
        if(customEvent.detail.type !== 'success') {
             // Optional: Alert sound or automatic open
        }
    };

    window.addEventListener('payeasy-notification', handleNewNotification);
    
    // Click outside to close notifications
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('payeasy-notification', handleNewNotification);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', route: AppRoute.DASHBOARD },
    { icon: Wallet, label: 'Financeiro', route: AppRoute.FINANCE },
    { icon: Package, label: 'Produtos', route: AppRoute.PRODUCTS },
    { icon: LinkIcon, label: 'Links de Pagamento', route: AppRoute.LINKS },
    { icon: BarChart3, label: 'Relatórios', route: AppRoute.REPORTS },
    { icon: HelpCircle, label: 'Suporte', route: AppRoute.SUPPORT },
    { icon: Settings, label: 'Configurações', route: AppRoute.SETTINGS },
  ];

  const handleNav = (route: string) => {
    navigate(route);
    setIsSidebarOpen(false);
  };

  const markAllAsRead = () => {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden text-gray-900 dark:text-gray-100 transition-colors duration-200">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-xl font-bold text-gray-800 dark:text-white">PayEasy</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)} 
            className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.route;
            return (
              <button
                key={item.route}
                onClick={() => handleNav(item.route)}
                className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <item.icon size={20} className={`mr-3 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 dark:border-gray-700">
           <button
            onClick={onLogout}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={20} className="mr-3" />
            Sair da conta
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-8 relative z-20">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400"
          >
            <Menu size={24} />
          </button>

          <div className="flex items-center gap-4 ml-auto">
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
                <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></span>
                )}
                </button>
                
                {/* Notifications Dropdown - Fixed for Mobile */}
                {showNotifications && (
                    <div className="absolute right-0 lg:right-0 -mr-16 lg:mr-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
                        <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                            <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Notificações</h3>
                            {unreadCount > 0 && (
                                <button onClick={markAllAsRead} className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400">
                                    Marcar lidas
                                </button>
                            )}
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400 flex flex-col items-center">
                                    <Bell size={32} className="mb-2 opacity-20" />
                                    Nenhuma notificação nova.
                                </div>
                            ) : (
                                notifications.map(notif => (
                                    <div key={notif.id} className={`p-4 border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${!notif.read ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
                                        <div className="flex gap-3">
                                            <div className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${
                                                notif.type === 'success' ? 'bg-emerald-500' : 
                                                notif.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                                            }`} />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug">{notif.title}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notif.message}</p>
                                                <p className="text-[10px] text-gray-400 mt-2 font-medium">{notif.created_at}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Vendedor</p>
              </div>
              <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-700 overflow-hidden">
                {user.avatar ? (
                    <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    user.name.charAt(0).toUpperCase()
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-gray-50 dark:bg-gray-900 transition-colors">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;