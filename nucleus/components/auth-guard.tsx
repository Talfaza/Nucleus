"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkAuth, type User } from '@/lib/auth';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const verifyAuth = async () => {
      const authenticatedUser = await checkAuth();
      
      if (!authenticatedUser) {
        router.push('/auth');
        return;
      }
      
      setUser(authenticatedUser);
      setIsLoading(false);
    };

    verifyAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth page
  }

  return <>{children}</>;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const verifyAuth = async () => {
      const authenticatedUser = await checkAuth();
      setUser(authenticatedUser);
    };

    verifyAuth();
  }, []);

  return user;
}
