import React, { ReactNode, useState, useEffect } from 'react';
import { Menu, X, LogOut } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import Logo from './Logo';
import { User } from '../types';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  sidebarContent?: (closeMenu: () => void) => ReactNode;
  children: ReactNode;
}

export default function Layout({ user, onLogout, sidebarContent, children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen bg-redhill-dark flex flex-col md:flex-row text-gray-100 overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#171A21] border-b border-white/[0.05] sticky top-0 z-50">
        <Logo light />
        <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-gray-400 hover:text-white">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#171A21] shadow-xl">
            <div className="p-4 border-b border-white/[0.05] flex justify-between items-center">
               <Logo light />
               <button onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-white">
                 <X className="w-6 h-6" />
               </button>
            </div>
            {/* Sidebar Content inside Mobile Drawer */}
            <div className="flex-1 overflow-y-auto">
              {sidebarContent ? sidebarContent(() => setMobileMenuOpen(false)) : (
                 <div className="p-4 text-gray-400 text-sm">Navigation</div>
              )}
            </div>
            {/* User details / logout on mobile */}
            <div className="p-4 border-t border-white/[0.05] flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">{user.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role.replace('_', ' ')}</p>
              </div>
              <button onClick={onLogout} className="p-2 text-gray-500 hover:text-redhill-red transition-all">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar (Only for Admins generally) */}
      {sidebarContent && (
        <aside className="hidden md:flex w-64 bg-[#171A21] border-r border-white/[0.05] text-white flex-col sticky top-0 h-screen flex-shrink-0">
          <div className="p-6 border-b border-white/[0.05]">
            <Logo light />
          </div>
          <div className="flex-1 overflow-y-auto">
            {sidebarContent(() => {})}
          </div>
          <div className="p-4 border-t border-white/[0.05] flex items-center justify-between">
             <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate">{user.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role.replace('_', ' ')}</p>
              </div>
              <button onClick={onLogout} className="p-2 ml-2 text-gray-500 hover:text-redhill-red transition-all flex-shrink-0">
                <LogOut className="w-5 h-5" />
              </button>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative min-w-0">
         {/* If no sidebar (e.g. Investor dashboard), show a desktop top-header */}
         {!sidebarContent && (
           <header className="hidden md:flex bg-redhill-gray/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-30">
             <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <Logo light />
                </div>
                <div className="flex items-center gap-6">
                   <div className="text-right">
                     <p className="text-sm font-bold text-white">{user.name}</p>
                     <p className="text-xs text-gray-500 font-medium capitalize">{user.role.replace('_', ' ')} Account</p>
                   </div>
                   <button onClick={onLogout} className="p-2.5 text-gray-500 hover:text-redhill-red hover:bg-white/5 rounded-xl transition-all">
                     <LogOut className="w-5 h-5" />
                   </button>
                </div>
             </div>
           </header>
         )}
         {/* Page Children */}
         <div className="flex-1 w-full max-w-[1600px] mx-auto min-w-0">
           {children}
         </div>
      </main>
    </div>
  );
}
