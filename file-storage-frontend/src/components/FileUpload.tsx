'use client';

import React, { useState, useRef } from 'react';
import { useFiles } from '@/context/FileContext';
import { SUPPORTED_FILE_TYPES } from '@/utils/fileUtils';

export default function FileUpload() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedBy, setUploadedBy] = useState('');
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, uploadProgress } = useFiles();

  const acceptedTypes = Object.keys(SUPPORTED_FILE_TYPES).join(',');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalError(null);
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setUploadedBy('');
    setLocalError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setLocalError(null);
    try {
      await uploadFile(selectedFile, uploadedBy || 'anonymous');
      setIsOpen(false);
      resetForm();
    } catch (err: any) {
      setLocalError(err.response?.data?.error || err.message || 'Upload failed. You can retry.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
      >
        + Upload File
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Upload File</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700">Your Name (Optional)</label>
              <input
                type="text"
                value={uploadedBy}
                onChange={(e) => setUploadedBy(e.target.value)}
                placeholder="anonymous"
                disabled={uploading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500 disabled:bg-gray-100"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700">Select File</label>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept={acceptedTypes}
                disabled={uploading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 disabled:bg-gray-100"
              />
              {selectedFile && (
                <p className="mt-1 text-sm text-gray-600">
                  {selectedFile.name} — {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              )}
            </div>

            {uploading && uploadProgress && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Uploading part {uploadProgress.uploadedParts} of {uploadProgress.totalParts}</span>
                  <span>{uploadProgress.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress.percentage}%` }}
                  />
                </div>
              </div>
            )}

            {localError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                {localError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? 'Uploading...' : localError ? 'Retry' : 'Upload'}
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  resetForm();
                }}
                disabled={uploading}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
