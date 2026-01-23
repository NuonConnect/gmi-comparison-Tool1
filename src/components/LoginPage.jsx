import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const { login, signup } = useAuth();

  useEffect(() => {
    // Auto-open login modal on page load
    // Uncomment if you want auto-open:
    // login();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-center">
          <div className="flex justify-center mb-3">
            <img
              src="https://i.imgur.com/GCOPBN1.png"
              alt="NSIB Logo"
              className="h-16"
            />
          </div>
          <h1 className="text-2xl font-bold text-white">GMI Comparison Tool</h1>
          <p className="text-indigo-200 text-sm mt-1">New Shield Insurance Brokers</p>
        </div>

        {/* Content */}
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 text-center mb-6">
            Welcome
          </h2>

          <p className="text-gray-600 text-center mb-6">
            Sign in to access the Group Medical Insurance Comparison Tool
          </p>

          {/* Login Button */}
          <button
            onClick={login}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-bold hover:from-indigo-700 hover:to-purple-700 transition mb-3"
          >
            🔐 Sign In
          </button>

          {/* Signup Button */}
          <button
            onClick={signup}
            className="w-full bg-white border-2 border-indigo-600 text-indigo-600 py-3 rounded-lg font-bold hover:bg-indigo-50 transition"
          >
            ✨ Create Account
          </button>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800 font-bold mb-2">📧 Email Verification Required</p>
            <p className="text-xs text-blue-700">
              After signing up, you'll receive a verification email. Click the link to activate your account.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 text-center">
          <p className="text-xs text-gray-500">
            © 2026 New Shield Insurance Brokers. All rights reserved.
          </p>
        </div>
      </div>

      {/* Netlify Identity Modal Container */}
      <div id="netlify-modal"></div>
    </div>
  );
};

export default LoginPage;