import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

type AdminContextType = {
  isSuperAdmin: boolean;
  adminLoading: boolean;
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setIsSuperAdmin(false);
      setAdminLoading(false);
      return;
    }

    let cancelled = false;

    const checkAdmin = async () => {
      setAdminLoading(true);
      try {
        const { data, error } = await supabase.rpc('is_super_admin');
        if (!cancelled) {
          setIsSuperAdmin(!error && data === true);
        }
      } catch {
        if (!cancelled) {
          setIsSuperAdmin(false);
        }
      } finally {
        if (!cancelled) {
          setAdminLoading(false);
        }
      }
    };

    checkAdmin();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  return (
    <AdminContext.Provider value={{ isSuperAdmin, adminLoading }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
