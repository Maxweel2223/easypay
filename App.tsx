import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Welcome from './pages/Welcome';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Links from './pages/Links';
import Reports from './pages/Reports';
import Support from './pages/Support';
import Settings from './pages/Settings';
import Finance from './pages/Finance';
import Checkout from './pages/Checkout';
import { User, AppRoute } from './types';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Theme Initialization
    const savedTheme = localStorage.getItem('payeasy-theme') as 'light' | 'dark';
    const initialTheme = savedTheme || 'light';
    
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }

    // Check active session with error handling
    const checkSession = async () => {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;
            
            if (session?.user) {
                mapSupabaseUser(session.user);
            } else {
                setIsLoading(false);
            }
        } catch (error) {
            console.error("Session check failed (Network or Auth error):", error);
            // Even if auth fails, stop loading so user can try to login again or see welcome screen
            setIsLoading(false);
        }
    };

    checkSession();

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        mapSupabaseUser(session.user);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('payeasy-theme', newTheme);
    
    if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  };

  const mapSupabaseUser = (sbUser: any) => {
    setUser({
      id: sbUser.id,
      name: sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || 'Usuário',
      email: sbUser.email || '',
      avatar: sbUser.user_metadata?.avatar_url,
      // Mapping new metadata fields if they exist
      pushEnabled: sbUser.user_metadata?.push_enabled,
      webhookUrl: sbUser.user_metadata?.webhook_url
    });
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const handleUpdateUser = (updatedUser: Partial<User>) => {
      if (user) {
          setUser({ ...user, ...updatedUser });
      }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-500 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path={AppRoute.WELCOME} element={
            user ? <Navigate to={AppRoute.DASHBOARD} /> : <Welcome />
        } />
        
        <Route path={AppRoute.LOGIN} element={
            user ? <Navigate to={AppRoute.DASHBOARD} /> : 
            <Auth mode="login" />
        } />

        <Route path={AppRoute.REGISTER} element={
            user ? <Navigate to={AppRoute.DASHBOARD} /> : 
            <Auth mode="register" />
        } />

        {/* Public Checkout Route - Now accessible via /#/checkout/:id */}
        <Route path="/checkout/:id" element={<Checkout />} />

        {/* Protected Routes */}
        <Route path="*" element={
          user ? (
            <Layout user={user} onLogout={handleLogout}>
              <Routes>
                <Route path={AppRoute.DASHBOARD} element={<Dashboard />} />
                <Route path={AppRoute.FINANCE} element={<Finance />} />
                <Route path={AppRoute.PRODUCTS} element={<Products user={user} />} />
                <Route path={AppRoute.LINKS} element={<Links user={user} />} />
                <Route path={AppRoute.REPORTS} element={<Reports />} />
                <Route path={AppRoute.SUPPORT} element={<Support user={user} />} />
                <Route path={AppRoute.SETTINGS} element={
                    <Settings 
                        user={user} 
                        theme={theme} 
                        toggleTheme={toggleTheme} 
                        onUpdateUser={handleUpdateUser}
                    />
                } />
                <Route path="*" element={<Navigate to={AppRoute.DASHBOARD} />} />
              </Routes>
            </Layout>
          ) : (
            <Navigate to={AppRoute.WELCOME} />
          )
        } />
      </Routes>
    </Router>
  );
};

export default App;