import { useEffect, useState, useRef, useCallback } from 'react';
import { Download, Upload, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { debounce } from 'lodash';

declare global {
  interface Window {
    indexedDB: IDBFactory;
  }
}

interface StorageManagerProps {
  dbName?: string;
  version?: number;
}

const DEFAULT_DB_NAME = 'rentalManagementDB';
const DEFAULT_DB_VERSION = 1;

export const useStorageManager = ({
  dbName = DEFAULT_DB_NAME,
  version = DEFAULT_DB_VERSION,
}: StorageManagerProps = {}) => {
  const [db, setDb] = useState<IDBDatabase | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initDB = async () => {
      try {
        const request = indexedDB.open(dbName, version);

        request.onerror = (event) => {
          setError('Error opening database');
          console.error('Database error:', event);
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          
          // Create object stores for different data types
          if (!db.objectStoreNames.contains('tenants')) {
            db.createObjectStore('tenants', { keyPath: 'id', autoIncrement: true });
          }
          if (!db.objectStoreNames.contains('properties')) {
            db.createObjectStore('properties', { keyPath: 'id', autoIncrement: true });
          }
          if (!db.objectStoreNames.contains('leases')) {
            db.createObjectStore('leases', { keyPath: 'id', autoIncrement: true });
          }
          if (!db.objectStoreNames.contains('documents')) {
            db.createObjectStore('documents', { keyPath: 'id', autoIncrement: true });
          }
        };

        request.onsuccess = (event) => {
          setDb((event.target as IDBOpenDBRequest).result);
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Failed to initialize database:', err);
      }
    };

    initDB();

    return () => {
      if (db) {
        db.close();
      }
    };
  }, [dbName, version]);

  const saveData = async <T extends Record<string, any>>(
    storeName: string,
    data: T
  ): Promise<number> => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  };

  const getData = async <T extends Record<string, any>>(
    storeName: string,
    id: number
  ): Promise<T | null> => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  };

  const getAllData = async <T extends Record<string, any>>(
    storeName: string
  ): Promise<T[]> => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  const updateData = async <T extends Record<string, any>>(
    storeName: string,
    id: number,
    data: Partial<T>
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        const updatedData = { ...request.result, ...data };
        const updateRequest = store.put(updatedData);
        updateRequest.onsuccess = () => resolve();
        updateRequest.onerror = () => reject(updateRequest.error);
      };
      request.onerror = () => reject(request.error);
    });
  };

  const deleteData = async (
    storeName: string,
    id: number
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  };

  const backupData = async (): Promise<{ 
    indexedDB: { [key: string]: any[] },
    localStorage: { [key: string]: any }
  }> => {
    if (!db) {
      throw new Error('Database not initialized');
    }

    // Backup IndexedDB data
    const indexedDBBackup: { [key: string]: any[] } = {};
    const stores = Array.from(db.objectStoreNames);

    for (const storeName of stores) {
      try {
        indexedDBBackup[storeName] = await getAllData(storeName);
      } catch (error) {
        console.error(`Error backing up ${storeName}:`, error);
        indexedDBBackup[storeName] = [];
      }
    }

    // Backup localStorage data (excluding internal React and Vite keys)
    const localStorageBackup: { [key: string]: any } = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !key.startsWith('_') && !key.startsWith('vite-') && key !== 'debug') {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            localStorageBackup[key] = JSON.parse(value);
          }
        } catch (e) {
          // If JSON parsing fails, store as string
          localStorageBackup[key] = localStorage.getItem(key);
        }
      }
    }

    return {
      indexedDB: indexedDBBackup,
      localStorage: localStorageBackup,
      _metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0'
      }
    };
  };

  const restoreData = async (backupData: { 
    indexedDB?: { [key: string]: any[] },
    localStorage?: { [key: string]: any },
    _metadata?: any
  }): Promise<void> => {
    if (!db) {
      throw new Error('Database not initialized');
    }

    // Restore IndexedDB data
    if (backupData.indexedDB) {
      const stores = Object.keys(backupData.indexedDB);
      for (const storeName of stores) {
        if (!db.objectStoreNames.contains(storeName)) {
          console.warn(`Skipping restore for non-existent store: ${storeName}`);
          continue;
        }

        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);

        // Clear existing data
        await new Promise<void>((resolve, reject) => {
          const clearRequest = store.clear();
          clearRequest.onsuccess = () => resolve();
          clearRequest.onerror = () => reject(clearRequest.error);
        });

        // Restore backup data
        const items = backupData.indexedDB[storeName] || [];
        for (const item of items) {
          await new Promise<void>((resolve, reject) => {
            const addRequest = store.add(item);
            addRequest.onsuccess = () => resolve();
            addRequest.onerror = () => reject(addRequest.error);
          });
        }
      }
    }

    // Restore localStorage data
    if (backupData.localStorage) {
      // Clear existing localStorage (except for certain keys)
      const keysToPreserve = ['debug', 'vite-ui-theme'];
      const preservedData: { [key: string]: string | null } = {};
      
      // Save data we want to preserve
      keysToPreserve.forEach(key => {
        preservedData[key] = localStorage.getItem(key);
      });

      // Clear all localStorage
      localStorage.clear();

      // Restore preserved data
      Object.entries(preservedData).forEach(([key, value]) => {
        if (value !== null) {
          localStorage.setItem(key, value);
        }
      });

      // Restore backup data
      Object.entries(backupData.localStorage).forEach(([key, value]) => {
        try {
          if (typeof value === 'string') {
            localStorage.setItem(key, value);
          } else {
            localStorage.setItem(key, JSON.stringify(value));
          }
        } catch (e) {
          console.error(`Failed to restore localStorage item '${key}':`, e);
        }
      });
    }

    for (const storeName of stores) {
      if (!db.objectStoreNames.contains(storeName)) {
        continue;
      }

      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      // Clear existing data
      await new Promise<void>((resolve, reject) => {
        const clearRequest = store.clear();
        clearRequest.onsuccess = () => resolve();
        clearRequest.onerror = () => reject(clearRequest.error);
      });

      // Restore backup data
      for (const item of backupData[storeName]) {
        await new Promise<void>((resolve, reject) => {
          const addRequest = store.add(item);
          addRequest.onsuccess = () => resolve();
          addRequest.onerror = () => reject(addRequest.error);
        });
      }
    }
  };

  const downloadBackup = async () => {
    try {
      setIsLoading(true);
      const backup = await backupData();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      a.download = `rental-management-backup-${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Backup downloaded successfully!');
    } catch (error) {
      console.error('Failed to download backup:', error);
      toast.error('Failed to download backup. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const uploadBackup = async (file: File): Promise<void> => {
    try {
      setIsLoading(true);
      const text = await file.text();
      const backupData = JSON.parse(text);
      
      // Show confirmation dialog
      const confirmed = window.confirm(
        'WARNING: This will replace all current data with the backup. Are you sure you want to continue?'
      );
      
      if (!confirmed) {
        toast.info('Restore cancelled');
        return;
      }
      
      await restoreData(backupData);
      toast.success('Backup restored successfully!');
      // Force a page reload to ensure all components re-initialize with the restored data
      window.location.reload();
    } catch (error) {
      console.error('Failed to upload backup:', error);
      toast.error('Failed to restore backup. The file may be corrupted or in an invalid format.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    db,
    error,
    saveData,
    getData,
    getAllData,
    updateData,
    deleteData,
    backupData,
    restoreData,
    downloadBackup,
    uploadBackup
  };
};

interface Position {
  x: number;
  y: number;
}

export const useAutoSave = () => {
  const { saveData, updateData } = useStorageManager();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Create a debounced save function
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSave = useCallback(
    debounce(async <T extends { id?: number }>(
      storeName: string,
      data: T
    ) => {
      if (!data) return;

      setIsSaving(true);
      setError(null);

      try {
        if (data.id) {
          // Update existing record
          await updateData(storeName, data.id, data);
        } else {
          // Create new record
          await saveData(storeName, data);
        }
        setLastSaveTime(new Date());
      } catch (err) {
        console.error('Auto-save failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to save data');
        toast.error('Failed to save changes');
      } finally {
        setIsSaving(false);
      }
    }, 1000), // 1 second debounce
    []
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  return {
    autoSave: debouncedSave,
    isSaving,
    lastSaveTime,
    error,
  };
};

interface AutoSaveStatusProps {
  isSaving: boolean;
  lastSaveTime: Date | null;
  error: string | null;
}

export const AutoSaveStatus: React.FC<AutoSaveStatusProps> = ({
  isSaving,
  lastSaveTime,
  error,
}) => {
  const [showStatus, setShowStatus] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);

  // Show status temporarily when it changes
  useEffect(() => {
    if (isSaving || error) {
      setShowStatus(true);
      const timer = setTimeout(() => setShowStatus(false), 3000);
      return () => clearTimeout(timer);
    } else if (lastSaveTime) {
      setShowStatus(true);
      const timer = setTimeout(() => setShowStatus(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isSaving, lastSaveTime, error]);

  if (!showStatus) return null;

  return (
    <div
      ref={statusRef}
      className={`fixed bottom-4 right-4 p-3 rounded-md text-sm flex items-center gap-2 ${
        error
          ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
          : isSaving
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
          : 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
      }`}
    >
      {error ? (
        <>
          <span className="text-red-500">✕</span>
          <span>Error saving: {error}</span>
        </>
      ) : isSaving ? (
        <>
          <span className="animate-spin">⟳</span>
          <span>Saving changes...</span>
        </>
      ) : (
        <>
          <span>✓</span>
          <span>
            Saved {lastSaveTime && new Date(lastSaveTime).toLocaleTimeString()}
          </span>
        </>
      )}
    </div>
  );
};

export const LocalStorageManager = () => {
  const { backupData, restoreData } = useStorageManager();
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState<Position>({ x: window.innerWidth / 2, y: 20 });
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved position from localStorage on component mount
  useEffect(() => {
    const savedPosition = localStorage.getItem('backupButtonPosition');
    if (savedPosition) {
      try {
        const { x, y } = JSON.parse(savedPosition);
        setPosition({ x, y });
      } catch (e) {
        console.error('Failed to load button position:', e);
      }
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('backupButtonPosition', JSON.stringify(position));
    } catch (e) {
      console.error('Failed to save button position:', e);
    }
  }, [position]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!buttonRef.current || isLoading) return;
    
    const rect = buttonRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    setDragOffset({ x: offsetX, y: offsetY });
    setIsDragging(true);
    
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp, { once: true });
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging, dragOffset]);

  const handleBackup = async () => {
    try {
      setIsLoading(true);
      const backup = await backupData();
      
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rental-management-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Backup created and downloaded successfully');
    } catch (error) {
      console.error('Backup failed:', error);
      toast.error('Failed to create backup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!confirm('Are you sure you want to restore from this backup? This will overwrite existing data.')) {
      return;
    }

    try {
      setIsLoading(true);
      const fileContent = await file.text();
      const backupData = JSON.parse(fileContent) as { [key: string]: any[] };
      
      await restoreData(backupData);
      toast.success('Backup restored successfully');
    } catch (error) {
      console.error('Restore failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to restore backup. The file may be corrupted.');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div 
      ref={buttonRef}
      className="fixed z-50 select-none touch-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'none',
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: isDragging ? 'none' : 'left 0.1s ease, top 0.1s ease'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="relative group">
        <div className={`absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-500 rounded-lg blur opacity-75 ${isDragging ? 'opacity-100' : 'group-hover:opacity-100'} transition duration-300`}></div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="default" 
              size="lg" 
              className="relative bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 font-medium py-2 px-4 rounded-lg shadow-lg transition-all duration-200"
              disabled={isLoading}
            >
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span>Backup & Restore</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 p-2 rounded-lg shadow-xl border-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm mt-2">
            <DropdownMenuItem 
              onClick={handleBackup}
              disabled={isLoading}
              className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Download className="h-4 w-4" />
              <span>Create Backup</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleRestoreClick}
              disabled={isLoading}
              className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Upload className="h-4 w-4" />
              <span>Restore Backup</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".json"
          className="hidden"
        />
      </div>
    </div>
  );
};

export default LocalStorageManager;