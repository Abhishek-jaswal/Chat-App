'use client';
import Image from "next/image";
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
    <div style={{ padding: 20 }} className="min-h-screen  items-center justify-center bg-gradient-to-bl from-black to-teal-300 text-white font-[family-name:var(--font-patrick-hand)]">
      <h1 className="text-2xl font-bold ">Login Page</h1>
     <button
                 onClick={() => signIn('google')}
                 className="bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-xl hover:bg-gray-300 transition mb-3 w-lg block "
               >
                 <Image src="/google.jpg" alt="Google Logo" width={20} height={20} className="inline-block mr-2" />
                 Sign in with Google
               </button>
      <button
                 onClick={() => signIn('github')}
                 className="bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-xl hover:bg-teal-00 transition w-lg inline-block mt-4"
               >
               <Image src="/github.png" alt="GitHub Logo" width={20} height={20} className="inline-block mr-2" />
               Sign in with GitHub
               </button>

    </div>
  );
}
