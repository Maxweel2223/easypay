import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import LocalPayments from './components/LocalPayments';
import HowItWorks from './components/HowItWorks';
import Testimonials from './components/Testimonials';
import Pricing from './components/Pricing';
import Footer from './components/Footer';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Checkout from './components/Checkout';
import { supabase } from './supabaseClient';
import { Session } from '@supabase/supabase-js';

export type ViewState = 'landing' | 'login' | 'register' | 'dashboard' | 'checkout';

// Helper for safe history manipulation
const safePushState = (path: string) => {
  try {
    window.history.pushState({}, '', path);
  } catch (e) {
    // Silently fail in restricted environments (e.g. sandboxed iframes)
  }
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [session, setSession] = useState<Session | null>(null);
  const [checkoutProductId, setCheckoutProductId] = useState<string | null>(null);
  const [initialDashboardTab, setInitialDashboardTab] = useState<string>('overview');

  useEffect(() => {
    document.documentElement.classList.remove('dark');

    const handleRouting = async () => {
        const path = window.location.pathname;
        const searchParams = new URLSearchParams(window.location.search);
        
        let isCheckout = false;
        
        // 1. Check for Payment Link with robust parsing
        if (path.startsWith('/p/')) {
           const rawId = path.split('/p/')[1];
           if (rawId) {
             const cleanId = rawId.split('/')[0].split('?')[0];
             
             if (cleanId) {
               setCheckoutProductId(cleanId);
               setCurrentView('checkout');
               isCheckout = true;
             }
           }
        }

        // 2. Check Auth Session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);

        if (!isCheckout) {
            if (currentSession) {
                // Handle Dashboard Sub-routes
                if (path.startsWith('/dashboard')) {
                    const subRoute = path.split('/dashboard/')[1];
                    if (subRoute) setInitialDashboardTab(subRoute);
                    setCurrentView('dashboard');
                } else if (path === '/login' || path === '/register') {
                    // Redirect logged user trying to access login to dashboard
                    safePushState('/dashboard');
                    setCurrentView('dashboard');
                } else {
                     // Default logged in view could be dashboard or landing
                }
            } else {
                // Public Routes
                if (path === '/login') setCurrentView('login');
                else if (path === '/register') setCurrentView('register');
                else if (path.startsWith('/dashboard')) {
                    // Protect dashboard
                    safePushState('/login');
                    setCurrentView('login');
                } else {
                    setCurrentView('landing');
                }
            }
        }
    };

    handleRouting();

    // 3. Listen for Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      
      const path = window.location.pathname;
      const isCheckout = path.startsWith('/p/');

      if (isCheckout) return;

      if (session) {
         if (currentView === 'login' || currentView === 'register') {
             safePushState('/dashboard');
             setCurrentView('dashboard');
         }
      } else {
        if (currentView === 'dashboard' || path.startsWith('/dashboard')) {
          safePushState('/');
          setCurrentView('landing');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [currentView]);

  useEffect(() => {
    if (!session) return;
    const channel = supabase.channel('global_logout')
      .on('postgres_changes', 
        { event: 'DELETE', schema: 'public', table: 'user_devices' }, 
        async (payload) => {
           let myDeviceId = null;
           try {
             myDeviceId = localStorage.getItem('payeasy_device_id');
           } catch (e) {
             // Silently ignore storage access errors
           }

           if (payload.old.id === myDeviceId) {
             await supabase.auth.signOut();
             try {
               localStorage.removeItem('payeasy_device_id');
             } catch (e) {}
             alert('Sua sessão foi encerrada remotamente.');
             window.location.reload(); 
           }
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
    }
  }, [session]);

  const navigate = (view: ViewState) => {
    window.scrollTo(0, 0);
    
    let path = '/';
    if (view === 'login') path = '/login';
    if (view === 'register') path = '/register';
    if (view === 'dashboard') path = '/dashboard';
    
    safePushState(path);
    setCurrentView(view);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    safePushState('/');
    setCurrentView('landing');
  };

  if (currentView === 'checkout' && checkoutProductId) {
    return <Checkout productId={checkoutProductId} />;
  }

  if (currentView === 'dashboard' && session) {
    return <Dashboard session={session} onLogout={handleLogout} initialTab={initialDashboardTab as any} />;
  }

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden font-sans bg-slate-50 text-slate-900">
      
      {currentView === 'landing' && (
        <>
          <Header onNavigate={navigate} />
          <main>
            <Hero onNavigate={navigate} />
            <Features />
            <LocalPayments />
            <HowItWorks />
            <Testimonials />
            <Pricing onNavigate={navigate} />
          </main>
          <Footer />
        </>
      )}

      {currentView === 'login' && (
        <Login onNavigate={navigate} />
      )}

      {currentView === 'register' && (
        <Register onNavigate={navigate} />
      )}
    </div>
  );
};

export default App;