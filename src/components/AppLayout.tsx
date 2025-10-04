import { ReactNode } from 'react';
import { LocalStorageManager } from '@/components/LocalStorageManager';

type AppLayoutProps = {
  children: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Backup/Restore Bar */}
      <div className="w-full border-b dark:border-gray-800">
        <div className="flex justify-center w-full">
          <div className="w-full max-w-7xl mx-4">
            <LocalStorageManager />
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
