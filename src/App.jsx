import { useState } from 'react';
import GroupMedicalInsurance from './components/GroupMedicalInsurance';

export default function App() {
  const [selectedApp, setSelectedApp] = useState('home');

  if (selectedApp === 'gmi') {
    return <GroupMedicalInsurance />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-5">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-purple-700 mb-4">
            NSIB Insurance System
          </h1>
          <p className="text-xl text-gray-600">Group Medical Insurance Comparison Tool</p>
        </div>

        <div className="flex justify-center">
          {/* Group Medical Insurance Card */}
          <div 
            onClick={() => setSelectedApp('gmi')}
            className="bg-white rounded-2xl p-8 shadow-2xl hover:shadow-3xl transition-all cursor-pointer transform hover:scale-105 border-2 border-indigo-200 hover:border-indigo-400 max-w-md w-full"
          >
            <div className="text-6xl mb-4 text-center">🏥</div>
            <h2 className="text-2xl font-bold text-indigo-800 mb-3 text-center">
              Group Medical Insurance
            </h2>
            <p className="text-gray-600 text-center mb-4">
              Compare medical insurance plans, calculate premiums, and generate professional comparison reports
            </p>
            <div className="bg-indigo-50 rounded-lg p-4 mb-4">
              <h3 className="font-bold text-sm text-indigo-800 mb-2">Features:</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>✓ Multi-plan comparison</li>
                <li>✓ Premium calculations</li>
                <li>✓ Benefits comparison</li>
                <li>✓ PDF export</li>
              </ul>
            </div>
            <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-bold hover:from-indigo-700 hover:to-purple-700 transition">
              Get Started →
            </button>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            © 2025 NSIB Insurance. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}