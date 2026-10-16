'use client';

import React from 'react';
import QuickLoginModal from '@/components/QuickLoginModal';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <QuickLoginModal
        onClose={() => router.push('/')}
        onSuccess={() => {
          router.push('/');
          router.refresh();
        }}
      />
    </div>
  );
}

