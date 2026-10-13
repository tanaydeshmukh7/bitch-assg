import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, LogOut, User, Sparkles, CheckCircle2 } from 'lucide-react';

export const Navbar: React.FC<{ activeProjectTitle?: string }> = ({ activeProjectTitle }) => {
  const { user, signOut, isSupabaseConfigured } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-slate-900 flex items-center gap-1.5">
                Assignment Studio
                <span className="text-[10px] uppercase font-semibold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-200">
                  AI
                </span>
              </span>
            </div>
          </Link>

          {activeProjectTitle && (
            <div className="hidden md:flex items-center gap-2 text-sm text-slate-500 pl-4 border-l border-slate-200">
              <span className="font-medium text-slate-800 truncate max-w-xs">{activeProjectTitle}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Supabase status badge */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
            <span className={`h-2 w-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500' : 'bg-blue-500'}`} />
            <span>{isSupabaseConfigured ? 'Supabase Connected' : 'Local / Offline Mode'}</span>
          </div>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 text-sm text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <User className="h-4 w-4 text-slate-400" />
                <span className="font-medium">{user.fullName || user.email.split('@')[0]}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/auth"
                className="text-sm font-medium text-slate-700 hover:text-slate-900 px-3 py-1.5"
              >
                Sign in
              </Link>
              <Link
                to="/auth?tab=signup"
                className="inline-flex items-center justify-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow-sm transition-colors"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
