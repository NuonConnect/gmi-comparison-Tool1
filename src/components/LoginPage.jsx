import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const { signIn, signUp, resetPassword } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isResetPassword) {
        await resetPassword(email);
        setMessage('Password reset email sent! Check your inbox.');
      } else if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, fullName);
        setMessage('Account created! Please check your email to verify your account.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

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

        {/* Form */}
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 text-center mb-6">
            {isResetPassword ? 'Reset Password' : isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              ⚠️ {error}
            </div>
          )}

          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
              ✅ {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && !isResetPassword && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                  placeholder="Enter your full name"
                  required={!isLogin && !isResetPassword}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                placeholder="Enter your email"
                required
              />
            </div>

            {!isResetPassword && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                  placeholder="Enter your password"
                  required={!isResetPassword}
                  minLength={6}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-bold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Processing...
                </span>
              ) : isResetPassword ? 'Send Reset Link' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Toggle Links */}
          <div className="mt-6 text-center space-y-2">
            {isResetPassword ? (
              <button
                onClick={() => {
                  setIsResetPassword(false);
                  setError('');
                  setMessage('');
                }}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-bold"
              >
                ← Back to Sign In
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                    setMessage('');
                  }}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-bold block w-full"
                >
                  {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
                </button>
                {isLogin && (
                  <button
                    onClick={() => {
                      setIsResetPassword(true);
                      setError('');
                      setMessage('');
                    }}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    Forgot Password?
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 text-center">
          <p className="text-xs text-gray-500">
            © 2026 New Shield Insurance Brokers. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;