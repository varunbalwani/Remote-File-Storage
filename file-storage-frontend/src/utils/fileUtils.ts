export const SUPPORTED_FILE_TYPES = {
  'text/plain': ['.txt'],
  'application/json': ['.json'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'application/pdf': ['.pdf'],
  'text/csv': ['.csv'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

export const VIEWABLE_FILE_TYPES = [
  'text/plain',
  'application/json',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
];

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

export function isViewableFile(fileType: string): boolean {
  return VIEWABLE_FILE_TYPES.includes(fileType);
}

export function getFileIcon(fileType: string): string {
  if (fileType.startsWith('image/')) return '🖼️';
  if (fileType.startsWith('text/')) return '📄';
  if (fileType.includes('pdf')) return '📕';
  if (fileType.includes('json')) return '📋';
  if (fileType.includes('spreadsheet') || fileType.includes('excel')) return '📊';
  if (fileType.includes('word') || fileType.includes('document')) return '📝';
  return '📎';
}
