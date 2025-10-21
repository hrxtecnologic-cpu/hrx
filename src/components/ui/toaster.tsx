'use client';

import { Toaster as Sonner } from 'sonner';

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      toastOptions={{
        style: {
          background: '#18181b',
          color: '#fff',
          border: '1px solid #27272a',
        },
      }}
    />
  );
}
