'use client';

import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.replace('/'); // or wherever your main ChatApp page is
    }
  }, [session, router]);

  if (status === 'loading') return <p>Loading...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Login Page</h2>
      <button onClick={() => signIn('google')} className="bg-blue-500 text-white px-4 py-2 rounded mt-4">
        Sign in with Google
      </button>
      <button onClick={() => signIn('github')}>Sign in with GitHub</button>

    </div>
  );
}
