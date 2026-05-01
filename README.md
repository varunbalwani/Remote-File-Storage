# Remote File Storage

A full-stack file storage application that lets users upload, download, and preview files. Files are stored in AWS S3 with metadata tracked in MongoDB.

**Live URLs:**
- Frontend: https://remote-file-storage.vercel.app
- Backend: https://remote-file-storage-473c.onrender.com

---

## Tech Stack

### Backend
- **Runtime:** Node.js with Express.js
- **Database:** MongoDB (via Mongoose ODM)
- **File Storage:** AWS S3 (compatible with LocalStack for local dev)
- **File Handling:** Multer (single-part), S3 Multipart Upload (large files)
- **Other:** dotenv, cors, morgan, cookie-parser

### Frontend
- **Framework:** Next.js 16 (App Router) with TypeScript
- **Styling:** Tailwind CSS v4
- **HTTP Client:** Axios
- **State Management:** React Context API
- **Linter:** Biome

---

## Features

- Upload files with multipart chunked upload (5 MB parts) and progress tracking
- Retry logic for failed upload parts (up to 3 retries with exponential backoff)
- Abort in-progress uploads to clean up S3 resources
- Download any uploaded file
- In-browser preview for supported file types (images, text, JSON, PDF)
- Responsive file grid with file type icons, size, uploader name, and timestamps
- File type restrictions on upload (txt, json, jpg, png, gif, pdf, csv, xls, xlsx, doc, docx)
- S3 rollback if MongoDB metadata save fails (compensating transaction pattern)

---

## Project Structure

```
Remote-File-Storage/
├── file-storage-backend/        # Express.js API server
│   ├── config/
│   │   ├── common.js            # Centralized config (S3, DB, port)
│   │   ├── database.js          # MongoDB connection
│   │   └── s3Client.js          # AWS S3 client instance
│   ├── models/
│   │   └── File.js              # Mongoose schema for file metadata
│   ├── routes/
│   │   ├── fetchAllFiles.js     # GET  /fetchAllFiles
│   │   ├── downloadFile.js      # GET  /downloadFile/:s3Key
│   │   ├── initiateUpload.js    # POST /initiateUpload
│   │   ├── getPartUrl.js        # POST /getPartUrl
│   │   ├── completeUpload.js    # POST /completeUpload
│   │   ├── abortUpload.js       # POST /abortUpload
│   │   └── uploadFile.js        # PUT  /uploadFile (legacy single-part)
│   ├── app.js                   # Express app setup, middleware, routes
│   └── package.json
├── file-storage-frontend/       # Next.js frontend
│   ├── app/
│   │   ├── layout.tsx           # Root layout with FileProvider
│   │   ├── page.tsx             # Home page (file list + upload)
│   │   └── view/[s3Key]/
│   │       └── page.tsx         # File viewer page
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileList.tsx     # File grid component
│   │   │   └── FileUpload.tsx   # Upload modal with progress bar
│   │   ├── context/
│   │   │   └── FileContext.tsx   # Global state (files, upload, download)
│   │   └── utils/
│   │       ├── fileUtils.ts     # File type helpers, formatters
│   │       └── multipartUpload.ts  # Chunked upload logic with retry
│   └── package.json
└── README.md
```

---

## API Reference

Base URL: `https://remote-file-storage-473c.onrender.com`

### 1. Fetch All Files

```
GET /fetchAllFiles
```

Returns all uploaded files sorted by newest first.

**Response (200):**
```json
{
  "message": "Files fetched successfully",
  "count": 2,
  "files": [
    {
      "_id": "...",
      "fileName": "photo.jpg",
      "fileType": "image/jpeg",
      "fileSize": 204800,
      "s3Key": "1770918314756-photo.jpg",
      "uploadedBy": "varun",
      "createdAt": "2025-06-27T10:30:00.000Z",
      "updatedAt": "2025-06-27T10:30:00.000Z"
    }
  ]
}
```

### 2. Download File

```
GET /downloadFile/:s3Key
```

Downloads a file by its S3 key. Returns the file as a binary stream with appropriate `Content-Type` and `Content-Disposition` headers.

**Parameters:**
| Param  | Type   | Location | Description          |
|--------|--------|----------|----------------------|
| s3Key  | string | path     | The S3 key of the file |

**Response:** Binary file stream

**Error (404):**
```json
{ "error": "File not found" }
```

### 3. Initiate Multipart Upload

```
POST /initiateUpload
Content-Type: application/json
```

Starts a new multipart upload session with S3.

**Request Body:**
```json
{
  "fileName": "large-video.mp4",
  "fileType": "video/mp4",
  "fileSize": 52428800,
  "uploadedBy": "varun"
}
```

**Response (200):**
```json
{
  "uploadId": "abc123...",
  "s3Key": "1770918314756-large-video.mp4",
  "partSize": 5242880,
  "totalParts": 10
}
```

### 4. Get Presigned URLs for Parts

```
POST /getPartUrl
Content-Type: application/json
```

Generates presigned S3 URLs for uploading individual parts. The frontend uploads each chunk directly to S3 using these URLs.

**Request Body:**
```json
{
  "s3Key": "1770918314756-large-video.mp4",
  "uploadId": "abc123...",
  "partNumbers": [1, 2, 3, 4, 5]
}
```

**Response (200):**
```json
{
  "urls": [
    { "partNumber": 1, "url": "https://s3.amazonaws.com/...?X-Amz-Signature=..." },
    { "partNumber": 2, "url": "https://s3.amazonaws.com/...?X-Amz-Signature=..." }
  ]
}
```

### 5. Complete Multipart Upload

```
POST /completeUpload
Content-Type: application/json
```

Tells S3 to assemble all uploaded parts into the final file, then saves metadata to MongoDB.

**Request Body:**
```json
{
  "s3Key": "1770918314756-large-video.mp4",
  "uploadId": "abc123...",
  "parts": [
    { "PartNumber": 1, "ETag": "\"etag1...\"" },
    { "PartNumber": 2, "ETag": "\"etag2...\"" }
  ],
  "fileName": "large-video.mp4",
  "fileType": "video/mp4",
  "fileSize": 52428800,
  "uploadedBy": "varun"
}
```

**Response (201):**
```json
{
  "message": "File uploaded successfully",
  "file": { "_id": "...", "fileName": "large-video.mp4", "s3Key": "...", ... }
}
```

### 6. Abort Upload

```
POST /abortUpload
Content-Type: application/json
```

Cancels an in-progress multipart upload and cleans up any uploaded parts from S3.

**Request Body:**
```json
{
  "s3Key": "1770918314756-large-video.mp4",
  "uploadId": "abc123..."
}
```

**Response (200):**
```json
{ "message": "Upload aborted successfully" }
```

### 7. Single-Part Upload (Legacy)

```
PUT /uploadFile
Content-Type: multipart/form-data
```

Uploads a file in a single request using multipart form data. Suitable for smaller files.

**Form Fields:**
| Field      | Type   | Description                    |
|------------|--------|--------------------------------|
| file       | File   | The file to upload             |
| uploadedBy | string | Uploader name (default: anonymous) |

**Response (201):**
```json
{
  "message": "File uploaded successfully",
  "file": { "_id": "...", "fileName": "notes.txt", "s3Key": "...", ... }
}
```

---

## File Metadata Schema (MongoDB)

| Field      | Type   | Description                              |
|------------|--------|------------------------------------------|
| fileName   | String | Original file name                       |
| fileType   | String | MIME type (e.g. image/jpeg)              |
| fileSize   | Number | Size in bytes                            |
| s3Key      | String | Unique key in S3 bucket (unique index)   |
| uploadedBy | String | Uploader name, defaults to "anonymous"   |
| createdAt  | Date   | Auto-generated by Mongoose               |
| updatedAt  | Date   | Auto-generated by Mongoose               |

---

## Supported File Types

| Type        | Extensions         | Viewable in Browser |
|-------------|--------------------|---------------------|
| Plain Text  | .txt               | Yes                 |
| JSON        | .json              | Yes                 |
| JPEG Image  | .jpg, .jpeg        | Yes                 |
| PNG Image   | .png               | Yes                 |
| GIF Image   | .gif               | Yes                 |
| PDF         | .pdf               | Yes                 |
| CSV         | .csv               | No (download only)  |
| Excel       | .xls, .xlsx        | No (download only)  |
| Word        | .doc, .docx        | No (download only)  |

---

## Environment Variables

### Backend (`file-storage-backend/.env`)

| Variable             | Description                        |
|----------------------|------------------------------------|
| AWS_ACCESS_KEY_ID    | AWS access key                     |
| AWS_SECRET_ACCESS_KEY| AWS secret key                     |
| AWS_REGION           | S3 bucket region                   |
| S3_BUCKET_NAME       | S3 bucket name                     |
| S3_ENDPOINT          | S3 endpoint (LocalStack: http://localhost:4566) |
| DATABASE_URL         | MongoDB connection string          |
| PORT                 | Server port (default: 3000)        |

### Frontend (`file-storage-frontend/.env.local`)

| Variable              | Description                        |
|-----------------------|------------------------------------|
| NEXT_PUBLIC_API_URL   | Backend API base URL               |

---

## Running Locally

### Backend
```bash
cd file-storage-backend
npm install
npm start
```
Server starts on http://localhost:3000

### Frontend
```bash
cd file-storage-frontend
npm install
npm run dev
```
App starts on http://localhost:3001 (or next available port)

---

## Deployment

- **Backend:** Deployed on [Render](https://render.com) as a web service
- **Frontend:** Deployed on [Vercel](https://vercel.com) with root directory set to `file-storage-frontend`
- Environment variables are configured in each platform's dashboard
