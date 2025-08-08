
"use client";

import { createContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Definisikan tipe untuk profil pengguna
export interface UserProfile {
  uid: string;
  email: string | null;
  role: 'admin' | 'guru'; 
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Effect 1: Handles setting up the auth state listener from Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        // Fetch user profile from Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        const profile = userSnap.exists() 
          ? ({ uid: currentUser.uid, ...userSnap.data() } as UserProfile) 
          : null;
        
        setUser(currentUser);
        setUserProfile(profile);
      } else {
        // No user is logged in
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    // Cleanup the listener on component unmount
    return () => unsubscribe();
  }, []);

  // Effect 2: Handles page protection and redirects based on auth state
  useEffect(() => {
    // Don't run redirect logic until auth state is confirmed
    if (loading) {
      return;
    }

    const isPublicPage = pathname === '/login' || pathname === '/register';

    if (userProfile) { // User is logged in
      if (isPublicPage) {
        // If logged in user is on a public page, redirect to dashboard
        router.push('/dashboard');
      } else if (userProfile.role === 'guru' && pathname.startsWith('/dashboard/teachers')) {
        // If a 'guru' tries to access admin-only page, redirect to dashboard
        router.push('/dashboard');
      }
    } else { // User is not logged in
      // If not logged in, redirect to login page, unless they are already on a public page
      if (!isPublicPage) {
        router.push('/login');
      }
    }
  }, [userProfile, loading, pathname, router]);

  const signOut = async () => {
    await firebaseSignOut(auth);
    // onAuthStateChanged will handle state cleanup and the redirect effect will run
  };
  
  // Show a global loader while the initial auth check is running
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If loading is complete, render the children within the context
  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
