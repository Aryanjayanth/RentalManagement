
import { useState, useEffect } from 'react';
import LoginForm from '@/components/LoginForm';
import Dashboard from '@/components/Dashboard';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  const handleLogin = (userData: any) => {
    setUser(userData);
    setIsLoggedIn(true);
    // Store login session
    localStorage.setItem('rentalApp_user', JSON.stringify(userData));
    localStorage.setItem('rentalApp_loginTime', Date.now().toString());
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem('rentalApp_user');
    localStorage.removeItem('rentalApp_loginTime');
  };

  // Keyboard shortcuts for dashboard
  useKeyboardShortcuts({
    onLogout: isLoggedIn ? handleLogout : undefined,
  });

  // Check for existing session on component mount
  useEffect(() => {
    const savedUser = localStorage.getItem('rentalApp_user');
    const loginTime = localStorage.getItem('rentalApp_loginTime');
    
    if (savedUser && loginTime) {
      const timeDiff = Date.now() - parseInt(loginTime);
      // Session timeout: 8 hours
      if (timeDiff < 8 * 60 * 60 * 1000) {
        setUser(JSON.parse(savedUser));
        setIsLoggedIn(true);
      } else {
        localStorage.removeItem('rentalApp_user');
        localStorage.removeItem('rentalApp_loginTime');
      }
    }
  }, []);

  if (!isLoggedIn) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return <Dashboard user={user} onLogout={handleLogout} />;
};

export default Index;
