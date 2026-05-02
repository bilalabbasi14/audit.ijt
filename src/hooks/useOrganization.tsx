import React, { createContext, useContext, useEffect, useState } from 'react';
import { Organization } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

type OrgContextType = {
  organization: Organization | null;
  loading: boolean;
  refreshOrg: () => Promise<void>;
};

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrg = async () => {
    if (!user) {
      setOrganization(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching organization:', error);
        setOrganization(null);
      } else {
        setOrganization(data);
      }
    } catch (err) {
      console.error('Catch error fetching organization:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrg();
  }, [user]);

  return (
    <OrgContext.Provider value={{ organization, loading, refreshOrg: fetchOrg }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrgContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrgProvider');
  }
  return context;
}
