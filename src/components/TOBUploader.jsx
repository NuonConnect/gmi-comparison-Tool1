import { useState, useRef, useEffect } from 'react';

// TOB Upload Component - Extracts benefits data from uploaded documents
const TOBUploader = ({ onDataExtracted, onClose, editPlan = null, user = null }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [extractedData, setExtractedData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldSection, setNewFieldSection] = useState('other');
  const fileInputRef = useRef(null);

  // Field definitions with sections
  const [fieldDefinitions, setFieldDefinitions] = useState({
    provider: [
      { key: 'providerName', label: 'Insurance Provider' },
      { key: 'tpa', label: 'TPA' },
      { key: 'network', label: 'Network' },
      { key: 'areaOfCover', label: 'Area of Cover' },
      { key: 'aggregateLimit', label: 'Annual Limit' },
      { key: 'medicalUnderwriting', label: 'Medical Underwriting' },
    ],
    inpatient: [
      { key: 'roomType', label: 'Room Type' },
      { key: 'diagnosticTests', label: 'Diagnostic Tests' },
      { key: 'drugsMedicines', label: 'Drugs & Medicines' },
      { key: 'consultantFees', label: 'Consultant Fees' },
      { key: 'organTransplant', label: 'Organ Transplant' },
      { key: 'kidneyDialysis', label: 'Kidney Dialysis' },
      { key: 'inpatientCopay', label: 'Inpatient Copay' },
    ],
    outpatient: [
      { key: 'referralType', label: 'Referral Type' },
      { key: 'outpatientConsultation', label: 'Consultation' },
      { key: 'diagnosticLabs', label: 'Diagnostic Labs' },
      { key: 'pharmacyLimit', label: 'Pharmacy Limit' },
      { key: 'pharmacyCopay', label: 'Pharmacy Copay' },
      { key: 'medicineType', label: 'Medicine Type' },
      { key: 'prescribedPhysiotherapy', label: 'Physiotherapy' },
    ],
    other: [
      { key: 'inPatientMaternity', label: 'In-Patient Maternity' },
      { key: 'outPatientMaternity', label: 'Out-Patient Maternity' },
      { key: 'routineDental', label: 'Dental Benefits' },
      { key: 'routineOptical', label: 'Optical Benefits' },
      { key: 'preventiveServices', label: 'Preventive Services' },
      { key: 'alternativeMedicines', label: 'Alternative Medicines' },
      { key: 'repatriation', label: 'Repatriation' },
      { key: 'mentalHealth', label: 'Mental Health' },
    ],
  });

  // If editing an existing plan, load its data
  useEffect(() => {
    if (editPlan) {
      const planData = {
        providerName: editPlan.providerName || '',
        tpa: editPlan.tpa || '',
        ...editPlan.categoriesData,
        catAMembers: editPlan.catAMembers || '',
        catAPremium: editPlan.catAPremium || '',
        catBMembers: editPlan.catBMembers || '',
        catBPremium: editPlan.catBPremium || '',
      };
      setExtractedData(planData);
      setEditMode(true);
    }
  }, [editPlan]);

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      if (!validTypes.includes(selectedFile.type)) {
        setError('Please upload a PDF or image file (PNG, JPG)');
        return;
      }
      
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      setFile(selectedFile);
      setError('');
      
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target.result);
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null);
      }
    }
  };

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Extract data using Claude API
  const extractDataFromTOB = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const base64Data = await fileToBase64(file);
      const mediaType = file.type;

      const response = await fetch('/api/extract-tob', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: base64Data,
          mediaType: mediaType,
          fileName: file.name
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to extract data from document');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setExtractedData(data.extractedData);
      setEditMode(true);
      
    } catch (err) {
      console.error('Extraction error:', err);
      setError(err.message || 'Failed to extract data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle field value change
  const handleFieldChange = (key, value) => {
    setExtractedData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Delete a field
  const deleteField = (section, key) => {
    setFieldDefinitions(prev => ({
      ...prev,
      [section]: prev[section].filter(f => f.key !== key)
    }));
    
    setExtractedData(prev => {
      const newData = { ...prev };
      delete newData[key];
      return newData;
    });
  };

  // Add new field
  const addNewField = () => {
    if (!newFieldName.trim()) return;
    
    const key = newFieldName.toLowerCase().replace(/\s+/g, '');
    
    setFieldDefinitions(prev => ({
      ...prev,
      [newFieldSection]: [...prev[newFieldSection], { key, label: newFieldName }]
    }));
    
    setExtractedData(prev => ({
      ...prev,
      [key]: ''
    }));
    
    setNewFieldName('');
  };

  // Confirm and use extracted data
  const confirmData = () => {
    if (extractedData && onDataExtracted) {
      // Add user tracking info
      const dataWithTracking = {
        ...extractedData,
        uploadedBy: editPlan?.uploadedBy || user?.email || 'Unknown',
        uploadedByName: editPlan?.uploadedByName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Unknown',
        uploadedAt: editPlan?.uploadedAt || new Date().toISOString(),
        lastEditedBy: user?.email || 'Unknown',
        lastEditedByName: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Unknown',
        lastEditedAt: new Date().toISOString(),
        isEditing: !!editPlan,
        originalPlanId: editPlan?.id || null,
      };
      onDataExtracted(dataWithTracking);
      onClose();
    }
  };

  // Reset form
  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setExtractedData(null);
    setEditMode(false);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Render editable field with delete button
  const renderField = (section, field) => {
    const value = extractedData?.[field.key] || '';
    
    return (
      <div key={field.key} className="relative group">
        <label className="block text-xs font-bold text-gray-700 mb-1">{field.label}</label>
        <div className="flex gap-1">
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className="flex-1 p-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none text-sm"
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
          <button
            onClick={() => deleteField(section, field.key)}
            className="bg-red-100 text-red-600 px-2 rounded-lg hover:bg-red-200 font-bold text-lg"
            title="Remove field"
          >
            −
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`p-4 ${editPlan ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gradient-to-r from-emerald-600 to-teal-600'}`}>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {editPlan ? '✏️ Edit TOB Plan' : '📄 Upload TOB (Table of Benefits)'}
              </h2>
              <p className="text-white text-opacity-80 text-sm">
                {editPlan 
                  ? `Editing: ${editPlan.providerName || 'TOB Plan'} • Uploaded by: ${editPlan.uploadedByName || 'Unknown'}`
                  : 'Upload a document to automatically extract insurance benefits data'
                }
              </p>
            </div>
            <button 
              onClick={onClose}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-lg"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!editMode ? (
            // Upload Section
            <div className="space-y-6">
              {/* File Upload Area */}
              <div 
                className={`border-3 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                  file ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:border-emerald-400 hover:bg-gray-50'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                {file ? (
                  <div className="space-y-3">
                    <div className="text-5xl">✅</div>
                    <p className="font-bold text-emerald-700">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {preview && (
                      <img 
                        src={preview} 
                        alt="Preview" 
                        className="max-h-48 mx-auto rounded-lg shadow-md"
                      />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        resetForm();
                      }}
                      className="text-red-600 hover:text-red-700 text-sm underline"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-5xl text-gray-400">📁</div>
                    <p className="font-bold text-gray-700">Click to upload or drag & drop</p>
                    <p className="text-sm text-gray-500">
                      Supported formats: PDF, PNG, JPG (Max 10MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  ⚠️ {error}
                </div>
              )}

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-bold text-blue-800 mb-2">📋 How it works:</h4>
                <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
                  <li>Upload a TOB document (PDF or image)</li>
                  <li>AI will extract all benefits data automatically</li>
                  <li>Review, edit, add or remove fields as needed</li>
                  <li>Click "Use This Data" to add the plan</li>
                </ol>
              </div>

              {/* Extract Button */}
              <button
                onClick={extractDataFromTOB}
                disabled={!file || loading}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                  file && !loading
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Extracting data... This may take a moment
                  </span>
                ) : (
                  '🚀 Extract Benefits Data'
                )}
              </button>
            </div>
          ) : (
            // Edit Extracted Data Section
            <div className="space-y-6">
              {/* Success Header */}
              <div className={`border rounded-lg p-4 flex justify-between items-center ${
                editPlan ? 'bg-blue-50 border-blue-200' : 'bg-emerald-50 border-emerald-200'
              }`}>
                <div>
                  <h4 className={`font-bold ${editPlan ? 'text-blue-800' : 'text-emerald-800'}`}>
                    {editPlan ? '✏️ Editing TOB Plan' : '✅ Data Extracted Successfully!'}
                  </h4>
                  <p className={`text-sm ${editPlan ? 'text-blue-600' : 'text-emerald-600'}`}>
                    {editPlan 
                      ? `Last edited by: ${editPlan.lastEditedByName || 'Unknown'} on ${editPlan.lastEditedAt ? new Date(editPlan.lastEditedAt).toLocaleString() : '-'}`
                      : 'Review and edit. Use − to remove fields, or add new fields below.'
                    }
                  </p>
                </div>
                {!editPlan && (
                  <button
                    onClick={resetForm}
                    className="text-emerald-700 hover:text-emerald-800 underline text-sm"
                  >
                    Upload Different File
                  </button>
                )}
              </div>

              {/* User Tracking Info for Edit Mode */}
              {editPlan && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Uploaded by:</span>
                      <span className="ml-2 font-bold text-gray-700">{editPlan.uploadedByName || 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Upload date:</span>
                      <span className="ml-2 font-bold text-gray-700">
                        {editPlan.uploadedAt ? new Date(editPlan.uploadedAt).toLocaleString() : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Provider Info */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                <h3 className="font-bold text-lg text-gray-800 mb-4 border-b pb-2">🏢 Provider Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  {fieldDefinitions.provider.map(field => renderField('provider', field))}
                </div>
              </div>

              {/* Inpatient Benefits */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                <h3 className="font-bold text-lg text-gray-800 mb-4 border-b pb-2">🏥 Inpatient Benefits</h3>
                <div className="grid grid-cols-2 gap-4">
                  {fieldDefinitions.inpatient.map(field => renderField('inpatient', field))}
                </div>
              </div>

              {/* Outpatient Benefits */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                <h3 className="font-bold text-lg text-gray-800 mb-4 border-b pb-2">🩺 Outpatient Benefits</h3>
                <div className="grid grid-cols-2 gap-4">
                  {fieldDefinitions.outpatient.map(field => renderField('outpatient', field))}
                </div>
              </div>

              {/* Other Benefits */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                <h3 className="font-bold text-lg text-gray-800 mb-4 border-b pb-2">✨ Other Benefits</h3>
                <div className="grid grid-cols-2 gap-4">
                  {fieldDefinitions.other.map(field => renderField('other', field))}
                </div>
              </div>

              {/* Premium Info */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                <h3 className="font-bold text-lg text-gray-800 mb-4 border-b pb-2">💰 Premium Information</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">CAT A Members</label>
                    <input
                      type="number"
                      value={extractedData?.catAMembers || ''}
                      onChange={(e) => handleFieldChange('catAMembers', e.target.value)}
                      className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">CAT A Premium</label>
                    <input
                      type="number"
                      value={extractedData?.catAPremium || ''}
                      onChange={(e) => handleFieldChange('catAPremium', e.target.value)}
                      className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">CAT B Members</label>
                    <input
                      type="number"
                      value={extractedData?.catBMembers || ''}
                      onChange={(e) => handleFieldChange('catBMembers', e.target.value)}
                      className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">CAT B Premium</label>
                    <input
                      type="number"
                      value={extractedData?.catBPremium || ''}
                      onChange={(e) => handleFieldChange('catBPremium', e.target.value)}
                      className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Add New Field Section */}
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                <h3 className="font-bold text-lg text-yellow-800 mb-4">➕ Add New Field</h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    placeholder="Field name (e.g., Wellness Benefits)"
                    className="flex-1 p-2 border-2 border-yellow-300 rounded-lg focus:border-yellow-500 focus:outline-none"
                  />
                  <select
                    value={newFieldSection}
                    onChange={(e) => setNewFieldSection(e.target.value)}
                    className="p-2 border-2 border-yellow-300 rounded-lg focus:border-yellow-500 focus:outline-none"
                  >
                    <option value="provider">Provider Info</option>
                    <option value="inpatient">Inpatient</option>
                    <option value="outpatient">Outpatient</option>
                    <option value="other">Other Benefits</option>
                  </select>
                  <button
                    onClick={addNewField}
                    disabled={!newFieldName.trim()}
                    className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg font-bold hover:bg-gray-600"
          >
            Cancel
          </button>
          {editMode && (
            <button
              onClick={confirmData}
              className={`px-6 py-2 text-white rounded-lg font-bold shadow-lg ${
                editPlan 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
              }`}
            >
              {editPlan ? '💾 Update Plan' : '✅ Use This Data'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TOBUploader;