'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

interface FileMetadata {
  _id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  s3Key: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

interface FileContextType {
  files: FileMetadata[];
  loading: boolean;
  error: string | null;
  fetchFiles: () => Promise<void>;
  uploadFile: (file: File, uploadedBy?: string) => Promise<void>;
  downloadFile: (s3Key: string, fileName: string) => Promise<void>;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export function FileProvider({ children }: { children: React.ReactNode }) {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/fetchAllFiles`);
      setFiles(response.data.files);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch files');
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadFile = useCallback(async (file: File, uploadedBy: string = 'anonymous') => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploadedBy', uploadedBy);

      await axios.put(`${API_URL}/uploadFile`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      await fetchFiles();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload file');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchFiles]);

  const downloadFile = useCallback(async (s3Key: string, fileName: string) => {
    try {
      const response = await axios.get(`${API_URL}/downloadFile/${s3Key}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to download file');
      throw err;
    }
  }, []);

  return (
    <FileContext.Provider value={{ files, loading, error, fetchFiles, uploadFile, downloadFile }}>
      {children}
    </FileContext.Provider>
  );
}

export function useFiles() {
  const context = useContext(FileContext);
  if (context === undefined) {
    throw new Error('useFiles must be used within a FileProvider');
  }
  return context;
}
