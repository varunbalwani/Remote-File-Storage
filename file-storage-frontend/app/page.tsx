import FileList from '@/components/FileList';
import FileUpload from '@/components/FileUpload';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">My Files</h1>
            <p className="text-gray-600 mt-2">Upload and manage your files</p>
          </div>
          <FileUpload />
        </div>
        <FileList />
      </div>
    </main>
  );
}
