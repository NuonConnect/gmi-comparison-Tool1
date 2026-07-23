import { createContext, useContext, useState, useEffect } from 'react';
import netlifyIdentity from 'netlify-identity-widget';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Initialize Netlify Identity (without container - uses default modal)
    netlifyIdentity.init();

    // Check for existing user
    const currentUser = netlifyIdentity.currentUser();
    if (currentUser) {
      setUser(currentUser);
      setIsAdmin(currentUser.app_metadata?.roles?.includes('admin') || false);
    }
    setLoading(false);

    // Listen for login
    netlifyIdentity.on('login', (loggedInUser) => {
      setUser(loggedInUser);
      setIsAdmin(loggedInUser.app_metadata?.roles?.includes('admin') || false);
      netlifyIdentity.close();
    });

    // Listen for logout
    netlifyIdentity.on('logout', () => {
      setUser(null);
      setIsAdmin(false);
    });

    // Listen for signup
    netlifyIdentity.on('signup', (signedUpUser) => {
      console.log('User signed up:', signedUpUser);
    });

    // Listen for init
    netlifyIdentity.on('init', (initUser) => {
      if (initUser) {
        setUser(initUser);
        setIsAdmin(initUser.app_metadata?.roles?.includes('admin') || false);
      }
      setLoading(false);
    });

    return () => {
      netlifyIdentity.off('login');
      netlifyIdentity.off('logout');
      netlifyIdentity.off('signup');
      netlifyIdentity.off('init');
    };
  }, []);

  const login = () => {
    netlifyIdentity.open('login');
  };

  const signup = () => {
    netlifyIdentity.open('signup');
  };

  const logout = () => {
    netlifyIdentity.logout();
  };

  const logActivity = async (action, details = {}) => {
    if (!user) return;
    
    try {
      const activityLog = {
        id: Date.now().toString(),
        user_id: user.id,
        user_email: user.email,
        user_name: user.user_metadata?.full_name || user.email,
        action,
        details,
        created_at: new Date().toISOString()
      };

      await fetch('/api/activity-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([activityLog])
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const value = {
    user,
    isAdmin,
    loading,
    login,
    signup,
    logout,
    logActivity
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;