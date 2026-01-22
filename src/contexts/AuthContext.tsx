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
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const isInitialLoadRef = useRef(true);

  // Load user from Supabase on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        console.log('AuthContext: Loading user on mount');
        
        // Get current Supabase session
        const session = await SupabaseService.getSession();
        
        if (session?.user) {
          console.log('AuthContext: Found session for:', session.user.email);
          
          // Load user from database
          const userData = await SupabaseService.getUser(session.user.id);
          
          if (userData) {
            console.log('AuthContext: Loaded user from database, role:', userData.role);
            setUser(userData);
            setRoleState(userData.role || null);
          } else {
            console.log('AuthContext: User not in database yet - waiting for role selection');
            // User is in auth but not in database - keep state as is
          }
        } else {
          console.log('AuthContext: No session found on mount');
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

  // Listen to auth state changes
  useEffect(() => {
    let callbackCount = 0;

    const { data: { subscription } } = SupabaseService.onAuthStateChange(async (session) => {
      callbackCount++;
      console.log(`AuthContext: Auth state change #${callbackCount}`);

      // Skip early callbacks to prevent race conditions
      if (isInitialLoadRef.current || callbackCount <= 3) {
        console.log('AuthContext: Skipping early callback');
        return;
      }

      if (session?.user) {
        console.log('AuthContext: Session active for:', session.user.email);

        try {
          // Load user from database
          const userData = await SupabaseService.getUser(session.user.id);

          if (userData) {
            console.log('AuthContext: User loaded from database');
            setUser(userData);
            setRoleState(userData.role || null);
          } else {
            console.log('AuthContext: User in auth but not in database - needs role selection');
            // Keep existing state, don't clear
          }
        } catch (error) {
          console.error('AuthContext: Error loading user:', error);
        }
      } else {
        console.log('AuthContext: No session');

        // Only clear if user explicitly signed out
        if (!justLoggedIn && !role && !user) {
          console.log('AuthContext: No protection flags, clearing state');
          setUser(null);
          setRoleState(null);
        } else {
          console.log('AuthContext: Protection active, keeping user state');
        }
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [justLoggedIn, role, user]);

  const refreshUser = async () => {
    console.log('AuthContext: refreshUser called');
    
    try {
      const session = await SupabaseService.getSession();
      
      if (session?.user) {
        console.log('AuthContext: Refreshing user data for:', session.user.email);
        
        const userData = await SupabaseService.getUser(session.user.id);
        
        if (userData) {
          console.log('AuthContext: User refreshed from database');
          setUser(userData);
          setRoleState(userData.role || null);
        } else {
          console.log('AuthContext: User not in database yet');
        }
      }
    } catch (error) {
      console.error('AuthContext: Error refreshing user:', error);
    }
  };

  const setRole = async (newRole: UserRole) => {
    console.log('AuthContext: setRole called with:', newRole);

    try {
      // Get user ID - prefer session, fallback to state, fallback to AsyncStorage
      let userId: string | null = null;
      let userName: string | null = null;
      
      // Try to get from session first
      const session = await SupabaseService.getSession();
      
      if (session?.user) {
        userId = session.user.id;
        userName = session.user.email?.split('@')[0] || null;
        console.log('AuthContext: Got user ID from session:', userId);
      } else if (user?.id) {
        // Fallback to user in state
        userId = user.id;
        userName = user.name || null;
        console.log('AuthContext: No session, using user ID from state:', userId);
      } else {
        // Last resort - check AsyncStorage
        console.log('AuthContext: Checking AsyncStorage for user');
        const cachedUser = await storageService.getUser();
        if (cachedUser?.id) {
          userId = cachedUser.id;
          userName = cachedUser.name || null;
          console.log('AuthContext: Got user ID from AsyncStorage:', userId);
          // Update state with cached user
          setUser(cachedUser);
        } else {
          console.error('AuthContext: No user found anywhere (session, state, or storage)');
          return;
        }
      }

      console.log('AuthContext: Setting role for user:', userId);

      // Update role in Supabase database FIRST (source of truth)
      await SupabaseService.updateUser(userId, { role: newRole });
      console.log('AuthContext: Role updated in Supabase');

      // If farmer role, create farmer profile
      if (newRole === 'farmer') {
        try {
          console.log('AuthContext: Creating farmer profile');
          const farmName = userName ? `${userName}'s Farm` : 'My Farm';
          
          await SupabaseService.createFarmerProfile(userId, {
            farmName,
            farmAddress: {
              street: '',
              city: '',
              state: '',
              zipCode: '',
              country: '',
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
          console.log('AuthContext: Farmer profile created');
        } catch (farmerError: any) {
          if (farmerError?.code !== '23505') {
            console.error('AuthContext: Error creating farmer profile:', farmerError);
          } else {
            console.log('AuthContext: Farmer profile already exists');
          }
        }
      }

      // Load updated user from database
      const userData = await SupabaseService.getUser(userId);

      if (userData) {
        console.log('AuthContext: User reloaded with new role');
        setUser(userData);
        setRoleState(newRole);
      } else {
        console.error('AuthContext: Failed to reload user after role update');
        // Still update local state even if database reload fails
        if (user) {
          setUser({ ...user, role: newRole });
          setRoleState(newRole);
          console.log('AuthContext: Updated local state as fallback');
        }
      }
    } catch (error) {
      console.error('AuthContext: Error setting role:', error);
    }
  };

  const signOut = async () => {
    console.log('AuthContext: Signing out');
    
    try {
      await SupabaseService.signOut();
      await storageService.clearUser();
      setUser(null);
      setRoleState(null);
      setJustLoggedIn(false);
      console.log('AuthContext: Sign out complete');
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
