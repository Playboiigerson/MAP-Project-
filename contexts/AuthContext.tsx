import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '@/services/supabaseRest';

type User = {
  id: string;
  email: string;
  [key: string]: any;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      try {
        console.log('AuthContext: Checking for existing user session');
        
        // First try to get user directly from AsyncStorage for faster loading
        const userJson = await AsyncStorage.getItem('supabase.auth.user');
        if (userJson) {
          try {
            const storedUser = JSON.parse(userJson);
            console.log('AuthContext: Found user in AsyncStorage', { id: storedUser.id, email: storedUser.email });
            setUser(storedUser);
            setIsLoading(false);
            return; // Exit early if we found a user in AsyncStorage
          } catch (e) {
            console.error('AuthContext: Error parsing stored user:', e);
            // Continue with API call if parsing fails
          }
        }
        
        // If no user in AsyncStorage, try the API
        console.log('AuthContext: Checking user via API');
        const { user: currentUser, error } = await authService.getCurrentUser();
        
        if (currentUser && !error) {
          console.log('AuthContext: User authenticated via API', { id: currentUser.id, email: currentUser.email });
          setUser(currentUser);
        } else if (error) {
          console.log('AuthContext: No authenticated user found', { error });
        }
      } catch (error) {
        console.error('AuthContext: Error checking authentication status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { user: newUser, error } = await authService.signIn(email, password);
      console.log('Sign in response:', { newUser, error });
      
      if (newUser && !error) {
        console.log('Setting user in AuthContext:', newUser);
        setUser(newUser);
        return { error: null };
      }
      return { error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { user: newUser, error } = await authService.signUp(email, password);
      if (newUser && !error) {
        // We don't set the user here because they need to confirm their email first
        return { error: null };
      }
      return { error };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      const { error } = await authService.signOut();
      if (!error) {
        setUser(null);
      }
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut }}>
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
