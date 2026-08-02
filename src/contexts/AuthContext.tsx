import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { SupabaseService } from '../services/supabase';
import { storageService } from '../services/storage';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  role: UserRole | null;
  setRole: (role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setJustLoggedIn: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRoleState] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setJustLoggedIn] = useState(false);
  const isInitialLoadRef = useRef(true);

  // Load user on mount: Supabase session first, AsyncStorage fallback (offline mode)
  useEffect(() => {
    const loadUser = async () => {
      try {
        const session = await SupabaseService.getSession();

        if (session?.user) {
          const userData = await SupabaseService.getUser(session.user.id);
          if (userData) {
            setUser(userData);
            setRoleState(userData.role || null);
            return;
          }
          // User in auth but not in database yet - waiting for role selection
          return;
        }

        // No session (offline mode) - restore from AsyncStorage
        const cachedUser = await storageService.getUser();
        if (cachedUser) {
          setUser(cachedUser);
          setRoleState(cachedUser.role || (await storageService.getRole()));
        }
      } catch (error) {
        console.error('AuthContext: Error loading user:', error);
      } finally {
        setLoading(false);
        isInitialLoadRef.current = false;
      }
    };

    loadUser();
  }, []);

  // Listen to auth state changes (cloud backend only; offline mode fires once with null)
  useEffect(() => {
    const { data: { subscription } } = SupabaseService.onAuthStateChange(async (session) => {
      if (isInitialLoadRef.current) return;

      if (session?.user) {
        try {
          const userData = await SupabaseService.getUser(session.user.id);
          if (userData) {
            setUser(userData);
            setRoleState(userData.role || null);
          }
        } catch (error) {
          console.error('AuthContext: Error loading user:', error);
        }
      }
      // Null session: do nothing - explicit signOut() clears state.
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshUser = async () => {
    try {
      const session = await SupabaseService.getSession();
      const userId = session?.user?.id || (await storageService.getUser())?.id;
      if (!userId) return;

      const userData = await SupabaseService.getUser(userId);
      if (userData) {
        setUser(userData);
        setRoleState(userData.role || null);
      }
    } catch (error) {
      console.error('AuthContext: Error refreshing user:', error);
    }
  };

  const setRole = async (newRole: UserRole) => {
    try {
      // Resolve the user: session, then state, then AsyncStorage
      let currentUser = user;
      const session = await SupabaseService.getSession();

      if (session?.user) {
        currentUser = (await SupabaseService.getUser(session.user.id)) || {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.email?.split('@')[0],
          createdAt: new Date(),
          updatedAt: new Date(),
        } as User;
      } else if (!currentUser) {
        currentUser = await storageService.getUser();
      }

      if (!currentUser) {
        console.error('AuthContext: No user found (session, state, or storage)');
        return;
      }

      await SupabaseService.updateUser(currentUser.id, { role: newRole });

      if (newRole === 'farmer') {
        try {
          const farmName = currentUser.name ? `${currentUser.name}'s Farm` : 'My Farm';
          await SupabaseService.createFarmerProfile(currentUser.id, {
            farmName,
            farmAddress: {
              id: 'farm',
              label: 'Farm',
              street: '',
              city: '',
              state: '',
              pincode: '',
              latitude: 0,
              longitude: 0,
              isDefault: true,
            },
            verificationStatus: 'pending',
            verificationDocuments: [],
            rating: 0,
            totalReviews: 0,
            bio: '',
          });
        } catch (farmerError: any) {
          if (farmerError?.code !== '23505') {
            console.error('AuthContext: Error creating farmer profile:', farmerError);
          }
        }
      }

      // Update local state unconditionally so role selection always completes
      const updatedUser = (await SupabaseService.getUser(currentUser.id)) || { ...currentUser, role: newRole };
      await storageService.saveUser(updatedUser);
      await storageService.saveRole(newRole);
      setUser(updatedUser);
      setRoleState(newRole);
    } catch (error) {
      console.error('AuthContext: Error setting role:', error);
    }
  };

  const signOut = async () => {
    try {
      await SupabaseService.signOut();
      await storageService.clearUser();
      setUser(null);
      setRoleState(null);
      setJustLoggedIn(false);
    } catch (error) {
      console.error('AuthContext: Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        role,
        setRole,
        signOut,
        refreshUser,
        setJustLoggedIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
