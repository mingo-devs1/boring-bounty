'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { ReactNode } from 'react';

const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID!;

export function PrivyAuthProvider({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        loginMethods: ['wallet', 'email'],
        appearance: {
          theme: 'light',
          accentColor: '#6366f1',
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
