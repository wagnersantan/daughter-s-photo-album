import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface Permissions {
  view_photos: boolean;
  upload_photos: boolean;
  send_messages: boolean;
  manage_users: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  permissions: Permissions;
  profile: { display_name: string; avatar_url: string | null } | null;
  signOut: () => Promise<void>;
}

const defaultPermissions: Permissions = {
  view_photos: true,
  upload_photos: true,
  send_messages: true,
  manage_users: false,
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  permissions: defaultPermissions,
  profile: null,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [permissions, setPermissions] = useState<Permissions>(defaultPermissions);
  const [profile, setProfile] = useState<{ display_name: string; avatar_url: string | null } | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        // Fetch role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', currentUser.id)
          .maybeSingle();
        setIsAdmin(roleData?.role === 'admin');

        // Fetch permissions
        const { data: permData } = await supabase
          .from('user_permissions')
          .select('*')
          .eq('user_id', currentUser.id)
          .maybeSingle();
        if (permData) {
          setPermissions({
            view_photos: permData.view_photos,
            upload_photos: permData.upload_photos,
            send_messages: permData.send_messages,
            manage_users: permData.manage_users,
          });
        }

        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('display_name, avatar_url')
          .eq('user_id', currentUser.id)
          .maybeSingle();
        setProfile(profileData);
      } else {
        setIsAdmin(false);
        setPermissions(defaultPermissions);
        setProfile(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, permissions, profile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
