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

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [session, setSession] = useState<Session | null>(null);
  const [checkoutProductId, setCheckoutProductId] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.remove('dark');

    // 1. Check for Payment Link URL first
    const path = window.location.pathname;
    let isCheckout = false;

    if (path.startsWith('/p/')) {
       const productId = path.split('/p/')[1];
       if (productId) {
         setCheckoutProductId(productId);
         setCurrentView('checkout');
         isCheckout = true;
       }
    }

    // 2. Check Auth Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      // Only redirect to dashboard if logged in AND NOT on a checkout page
      if (session && !isCheckout) {
        setCurrentView('dashboard');
      }
    });

    // 3. Listen for Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      
      // If we are on checkout, stay there regardless of auth state
      if (isCheckout) return;

      if (session) {
         setCurrentView('dashboard');
      } else {
        // Only go to landing if we were inside the dashboard or login/register
        if (currentView === 'dashboard' || currentView === 'settings') {
          setCurrentView('landing');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []); // Run once on mount

  // --- Realtime Remote Logout Logic ---
  useEffect(() => {
    if (!session) return;
    const channel = supabase.channel('global_logout')
      .on('postgres_changes', 
        { event: 'DELETE', schema: 'public', table: 'user_devices' }, 
        async (payload) => {
           const myDeviceId = localStorage.getItem('payeasy_device_id');
           if (payload.old.id === myDeviceId) {
             await supabase.auth.signOut();
             localStorage.removeItem('payeasy_device_id');
             alert('Sua sessão foi encerrada remotamente.');
             window.location.reload(); 
           }
      })
      .subscribe();

    const interval = setInterval(async () => {
       const myDeviceId = localStorage.getItem('payeasy_device_id');
       if (myDeviceId && session) {
         const { data, error } = await supabase.from('user_devices').select('id').eq('id', myDeviceId).single();
         if (!data && !error) { 
            await supabase.auth.signOut();
            localStorage.removeItem('payeasy_device_id');
            alert('Sua sessão expirou ou foi encerrada.');
            window.location.reload();
         }
       }
    }, 30000);

    return () => { 
      supabase.removeChannel(channel); 
      clearInterval(interval); 
    }
  }, [session]);

  const navigate = (view: ViewState) => {
    window.scrollTo(0, 0);
    setCurrentView(view);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentView('landing');
  };

  if (currentView === 'checkout' && checkoutProductId) {
    return <Checkout productId={checkoutProductId} />;
  }

  if (currentView === 'dashboard' && session) {
    return <Dashboard session={session} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden font-sans bg-white text-slate-900">
      
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