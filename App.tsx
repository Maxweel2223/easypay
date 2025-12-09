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
import { supabase } from './supabaseClient';
import { Session } from '@supabase/supabase-js';

export type ViewState = 'landing' | 'login' | 'register' | 'dashboard';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Force removal of dark class if present
    document.documentElement.classList.remove('dark');

    // Check active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setCurrentView('dashboard');
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setCurrentView('dashboard');
      } else {
        // Only redirect to landing if we were on dashboard
        if (currentView === 'dashboard') {
          setCurrentView('landing');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const navigate = (view: ViewState) => {
    window.scrollTo(0, 0);
    setCurrentView(view);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentView('landing');
  };

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