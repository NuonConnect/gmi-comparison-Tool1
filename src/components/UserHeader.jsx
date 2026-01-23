import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const UserHeader = ({ onOpenAdmin }) => {
  const { user, logout, isAdmin } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      logout();
    } catch (error) {
      console.error('Logout error:', error);
      alert('Failed to logout. Please try again.');
    } finally {
      setLoggingOut(false);
    }
  };

  const getUserName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  const getUserInitial = () => {
    const name = getUserName();
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <img
              src="https://i.imgur.com/GCOPBN1.png"
              alt="NSIB Logo"
              className="h-10"
            />
            <div>
              <h1 className="text-xl font-bold text-white">GMI Comparison Tool</h1>
              <p className="text-indigo-200 text-xs">New Shield Insurance Brokers</p>
            </div>
            <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded">TEST</span>
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg px-3 py-2 transition"
            >
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-indigo-600 font-bold">
                {getUserInitial()}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-white font-bold text-sm">{getUserName()}</div>
                {isAdmin && (
                  <div className="text-yellow-300 text-xs">👑 Administrator</div>
                )}
                {!isAdmin && (
                  <div className="text-indigo-200 text-xs">User</div>
                )}
              </div>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowDropdown(false)}
                />

                {/* Dropdown */}
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl z-20 overflow-hidden border border-gray-200">
                  {/* User Info */}
                  <div className="px-4 py-3 bg-gray-50 border-b">
                    <p className="text-sm font-bold text-gray-800">{getUserName()}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    {isAdmin && onOpenAdmin && (
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          onOpenAdmin();
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-indigo-50 flex items-center gap-3 transition"
                      >
                        <span className="text-xl">📊</span>
                        <div>
                          <div className="font-bold text-gray-800">Admin Dashboard</div>
                          <div className="text-xs text-gray-500">View all comparisons & activity</div>
                        </div>
                      </button>
                    )}

                    <button
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center gap-3 transition"
                    >
                      <span className="text-xl">🚪</span>
                      <div>
                        <div className="font-bold text-red-600">
                          {loggingOut ? 'Signing out...' : 'Sign Out'}
                        </div>
                        <div className="text-xs text-gray-500">Log out of your account</div>
                      </div>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default UserHeader;