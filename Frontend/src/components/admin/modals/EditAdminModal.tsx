import React, { useState, useEffect } from 'react';
import { Shield, X } from 'lucide-react';
import { ROLE_CONFIG } from '../../../constants/roles';
import { Role } from '../../../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface EditAdminModalProps {
  isOpen: boolean;
  admin: any | null;
  onClose: () => void;
  onSubmit: (id: number, data: { name: string; email: string; role: Role; password?: string }) => Promise<void>;
}

export default function EditAdminModal({
  isOpen,
  admin,
  onClose,
  onSubmit
}: EditAdminModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('site_manager');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (admin) {
      setName(admin.name || '');
      setEmail(admin.email || '');
      setRole(admin.role || 'site_manager');
      setPassword('');
    }
  }, [admin]);

  if (!isOpen || !admin) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: { name: string; email: string; role: Role; password?: string } = { name, email, role };
      if (password.trim()) payload.password = password.trim();
      await onSubmit(admin.id, payload);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1b23] rounded-3xl max-w-2xl w-full border border-white/10 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-redhill-red" />
              Edit Staff Role & Permissions
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Modify administrator access levels or reset password</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-redhill-red/50"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-redhill-red/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Change Role & Access Level</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(ROLE_CONFIG).map(([roleKey, cfg]) => {
                const isSelected = role === roleKey;
                const RoleIcon = cfg.icon;
                return (
                  <button
                    type="button"
                    key={roleKey}
                    onClick={() => setRole(roleKey as Role)}
                    className={cn(
                      "p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between",
                      isSelected
                        ? cn("bg-white/[0.08] border-white/40 shadow-lg ring-2", cfg.ring)
                        : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border", cfg.bg, cfg.color, cfg.border)}>
                          <RoleIcon className="w-4 h-4" />
                        </div>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-redhill-red text-white flex items-center justify-center text-xs font-bold">
                            ✓
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-white text-sm">{cfg.label}</p>
                      <p className="text-[10px] text-gray-400 mt-1 leading-snug">{cfg.tag}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Role Permissions Card */}
            {role && ROLE_CONFIG[role] && (
              <div className={cn("mt-4 p-4 rounded-2xl border", ROLE_CONFIG[role].bg, ROLE_CONFIG[role].border)}>
                <div className="flex items-start gap-3">
                  <div className={cn("p-2 rounded-xl border bg-black/20", ROLE_CONFIG[role].color, ROLE_CONFIG[role].border)}>
                    {React.createElement(ROLE_CONFIG[role].icon, { className: "w-5 h-5" })}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-white uppercase tracking-wider">{ROLE_CONFIG[role].label} Scope</p>
                    <p className="text-xs text-gray-300 mt-0.5">{ROLE_CONFIG[role].desc}</p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {ROLE_CONFIG[role].permissions.map((perm, idx) => (
                        <span key={idx} className="text-[10px] font-medium bg-black/30 text-gray-300 px-2 py-0.5 rounded-md border border-white/10">
                          ✓ {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Reset Password (Optional)</label>
            <input
              type="password"
              placeholder="Leave blank to keep existing password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 outline-none focus:border-redhill-red/50"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-300 font-bold rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-redhill-red to-red-700 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-redhill-red/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
