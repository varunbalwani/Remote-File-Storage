'use client';

import React, { useEffect } from 'react';
import { useFiles } from '@/context/FileContext';
import { formatFileSize, formatDate, getFileIcon, isViewableFile } from '@/utils/fileUtils';
import { useRouter } from 'next/navigation';

export default function FileList() {
  const { files, loading, error, fetchFiles, downloadFile } = useFiles();
  const router = useRouter();

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleFileClick = (file: any) => {
    if (isViewableFile(file.fileType)) {
      router.push(`/view/${file.s3Key}`);
    } else {
      downloadFile(file.s3Key, file.fileName);
    }
  };

  if (loading && files.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-xl">No files uploaded yet</p>
        <p className="mt-2">Click the "Upload File" button to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {files.map((file) => (
        <div
          key={file._id}
          onClick={() => handleFileClick(file)}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div className="flex items-start gap-3">
            <div className="text-4xl">{getFileIcon(file.fileType)}</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate" title={file.fileName}>
                {file.fileName}
              </h3>
              <p className="text-sm text-gray-500 mt-1">{formatFileSize(file.fileSize)}</p>
              <p className="text-xs text-gray-400 mt-1">
                Uploaded by {file.uploadedBy}
              </p>
              <p className="text-xs text-gray-400">{formatDate(file.createdAt)}</p>
              {isViewableFile(file.fileType) && (
                <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  Click to view
                </span>
              )}
              {!isViewableFile(file.fileType) && (
                <span className="inline-block mt-2 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  Click to download
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
