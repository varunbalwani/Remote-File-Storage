'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFiles } from '@/context/FileContext';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function ViewFile() {
  const params = useParams();
  const router = useRouter();
  const { files } = useFiles();
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const s3Key = decodeURIComponent(params.s3Key as string);
  const file = files.find((f) => f.s3Key === s3Key);

  useEffect(() => {
    if (!file) return;

    const fetchContent = async () => {
      try {
        const response = await axios.get(`${API_URL}/downloadFile/${encodeURIComponent(s3Key)}`, {
          responseType: file.fileType.startsWith('image/') ? 'blob' : 'text',
        });

        if (file.fileType.startsWith('image/')) {
          const url = URL.createObjectURL(response.data);
          setContent(url);
        } else if (file.fileType === 'application/pdf') {
          const blob = new Blob([response.data], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          setContent(url);
        } else {
          setContent(response.data);
        }
      } catch (err: any) {
        setError('Failed to load file content');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [file, s3Key]);

  if (!file) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">File not found</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Go back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-700 mb-4"
          >
            ← Back to files
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{file.fileName}</h1>
          <p className="text-gray-600 mt-1">
            {file.fileType} • {(file.fileSize / 1024).toFixed(2)} KB
          </p>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {!loading && !error && content && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            {file.fileType.startsWith('image/') && (
              <img src={content} alt={file.fileName} className="max-w-full h-auto" />
            )}

            {file.fileType === 'application/pdf' && (
              <iframe
                src={content}
                className="w-full h-screen"
                title={file.fileName}
              />
            )}

            {(file.fileType === 'text/plain' || file.fileType === 'application/json') && (
              <pre className="whitespace-pre-wrap font-mono text-sm overflow-auto max-h-screen">
                {content}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
