import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAllComparisons, getAllActivityLogs, deleteComparison } from '../utils/supabaseDb';

const AdminDashboard = ({ onClose, onLoadComparison }) => {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('comparisons');
  const [comparisons, setComparisons] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const loadData = async () => {
    setLoading(true);
    
    try {
      const [comps, logs] = await Promise.all([
        getAllComparisons(),
        getAllActivityLogs()
      ]);
      setComparisons(comps || []);
      setActivityLogs(logs || []);
    } catch (err) {
      console.error('Error loading data:', err);
    }

    setLoading(false);
  };

  // Load comparison into the main PlanGenerator
  const handleViewEdit = (comparison) => {
    if (onLoadComparison) {
      onLoadComparison(comparison);
      onClose();
    }
  };

  // Download the stored HTML
  const handleDownload = (comparison) => {
    if (comparison.htmlContent) {
      const blob = new Blob([comparison.htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${comparison.companyName || 'Comparison'}_${comparison.referenceNumber || Date.now()}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      alert('HTML content not available for this comparison.');
    }
  };

  // View HTML in new window
  const handleViewHTML = (comparison) => {
    if (comparison.htmlContent) {
      const newWindow = window.open('', '_blank');
      newWindow.document.write(comparison.htmlContent);
      newWindow.document.close();
    } else {
      alert('HTML content not available for this comparison.');
    }
  };

  // Delete comparison
  const handleDelete = async (comparisonId) => {
    if (!confirm('Are you sure you want to delete this comparison?')) return;

    try {
      await deleteComparison(comparisonId);
      setComparisons(prev => prev.filter(comp => comp.id !== comparisonId));
      alert('✅ Comparison deleted');
    } catch (error) {
      console.error('Error deleting:', error);
      alert('❌ Error deleting comparison');
    }
  };

  // Export as CSV
  const exportCSV = () => {
    const headers = activeTab === 'comparisons' 
      ? ['Reference', 'Company', 'Created By', 'Email', 'Date', 'Plans']
      : ['User', 'Email', 'Action', 'Timestamp'];
    
    const rows = activeTab === 'comparisons'
      ? filteredComparisons.map(c => [c.referenceNumber, c.companyName, c.createdBy, c.createdByEmail, c.date, c.plans?.length])
      : filteredLogs.map(l => [l.userName, l.email, l.action, l.timestamp]);
    
    const csv = [headers, ...rows].map(r => r.map(c => `"${c || ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredComparisons = comparisons.filter(comp =>
    comp.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comp.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comp.createdBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comp.createdByEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLogs = activityLogs.filter(log =>
    log.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.userName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionColor = (action) => {
    switch (action) {
      case 'login': return 'bg-green-100 text-green-800';
      case 'logout': return 'bg-gray-100 text-gray-800';
      case 'create_comparison': return 'bg-blue-100 text-blue-800';
      case 'edit_comparison': return 'bg-yellow-100 text-yellow-800';
      case 'delete_comparison': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
          <p className="text-gray-600 mt-2">You need administrator privileges.</p>
          <button onClick={onClose} className="mt-4 bg-gray-600 text-white px-6 py-2 rounded-lg font-bold">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">👑 Admin Dashboard</h1>
              <p className="text-indigo-100 text-sm">View all comparisons from all users</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={loadData}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-2 rounded text-sm font-bold"
              >
                🔄 Refresh
              </button>
              <button 
                onClick={onClose} 
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-2 rounded font-bold"
              >
                ✕ Close
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 border-b">
          <div className="bg-white rounded-lg p-3 shadow border-l-4 border-blue-500">
            <div className="text-2xl font-bold text-blue-600">{comparisons.length}</div>
            <div className="text-xs text-gray-600">Total Comparisons</div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow border-l-4 border-purple-500">
            <div className="text-2xl font-bold text-purple-600">{activityLogs.length}</div>
            <div className="text-xs text-gray-600">Activity Logs</div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow border-l-4 border-amber-500">
            <div className="text-2xl font-bold text-amber-600">
              {activityLogs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length}
            </div>
            <div className="text-xs text-gray-600">Today's Activities</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('comparisons')}
            className={`flex-1 py-3 px-4 font-bold text-sm ${
              activeTab === 'comparisons' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            📊 Comparisons <span className="ml-1 bg-gray-200 px-2 py-0.5 rounded-full text-xs">{comparisons.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex-1 py-3 px-4 font-bold text-sm ${
              activeTab === 'activity' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            📋 Activity Logs <span className="ml-1 bg-gray-200 px-2 py-0.5 rounded-full text-xs">{activityLogs.length}</span>
          </button>
        </div>

        {/* Search & Export */}
        <div className="p-3 bg-gray-50 border-b flex gap-3">
          <input
            type="text"
            placeholder="🔍 Search by company, reference, or user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 p-2 border-2 border-gray-300 rounded-lg text-sm focus:border-indigo-500 focus:outline-none"
          />
          <button
            onClick={exportCSV}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-green-700"
          >
            📥 Export CSV
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading data...</p>
            </div>
          ) : activeTab === 'comparisons' ? (
            filteredComparisons.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📭</div>
                <p>No comparisons found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredComparisons.map((comp, idx) => (
                  <div key={idx} className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-indigo-300 transition">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-800">{comp.companyName || 'Unknown Company'}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-indigo-600 text-sm">👤 {comp.createdBy || 'Unknown'}</span>
                          {comp.createdByEmail && (
                            <span className="text-gray-400 text-xs">({comp.createdByEmail})</span>
                          )}
                        </div>
                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                          <span>Ref: <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{comp.referenceNumber}</span></span>
                          <span>📅 {comp.date ? new Date(comp.date).toLocaleDateString() : '-'}</span>
                          <span>📊 {comp.plans?.length || 0} plans</span>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2 flex-wrap justify-end">
                        <button
                          onClick={() => handleViewEdit(comp)}
                          className="bg-blue-600 text-white px-3 py-2 rounded-lg font-bold text-sm hover:bg-blue-700"
                          title="Load into editor"
                        >
                          ✏️ View/Edit
                        </button>
                        {comp.htmlContent && (
                          <button
                            onClick={() => handleViewHTML(comp)}
                            className="bg-purple-600 text-white px-3 py-2 rounded-lg font-bold text-sm hover:bg-purple-700"
                            title="View HTML in new window"
                          >
                            👁️ View
                          </button>
                        )}
                        <button
                          onClick={() => handleDownload(comp)}
                          className={`px-3 py-2 rounded-lg font-bold text-sm ${
                            comp.htmlContent 
                              ? 'bg-green-600 text-white hover:bg-green-700' 
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                          disabled={!comp.htmlContent}
                          title="Download HTML"
                        >
                          📥
                        </button>
                        <button
                          onClick={() => handleDelete(comp.id)}
                          className="bg-red-600 text-white px-3 py-2 rounded-lg font-bold text-sm hover:bg-red-700"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            // Activity Logs Tab
            filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📭</div>
                <p>No activity logs found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredLogs.map((log, idx) => (
                  <div key={idx} className="bg-white border rounded-lg p-3 hover:shadow-md">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm">
                          {log.userName?.charAt(0).toUpperCase() || log.email?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="font-bold text-sm">{log.userName || log.email}</div>
                          <div className="text-xs text-gray-500">{log.email}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${getActionColor(log.action)}`}>
                          {log.action?.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;