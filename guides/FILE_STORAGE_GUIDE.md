# Flexible File Storage System

This system supports both AWS S3 and local file system storage for photo uploads. You can switch between them by changing environment variables without modifying code.

## Configuration

Add these environment variables to your `.env` file:

### Basic Configuration
```env
# Set storage type: 's3' or 'local'
FILE_STORAGE_TYPE=s3
```

### For Local Storage
```env
FILE_STORAGE_TYPE=local
LOCAL_STORAGE_PATH=./uploads/photos
BASE_URL=http://localhost:3000
```

### For S3 Storage
```env
FILE_STORAGE_TYPE=s3
S3_ACCESS_KEY=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET=your-bucket-name
S3_REGION=us-east-1
```

## How It Works

### Architecture
1. **Abstract Interface**: `IFileStorageService` defines common methods for all storage types
2. **Implementations**: 
   - `S3Service` - handles AWS S3 uploads
   - `LocalFileStorageService` - handles local file system storage
3. **Factory Pattern**: `FileStorageFactory` returns the appropriate service based on configuration
4. **File Serving**: When using local storage, files are served via `/api/files/*` endpoint

### API Response
The API now returns different URL formats based on storage type:

**S3 Storage:**
```json
{
  "pathPhoto": "https://your-bucket.s3.amazonaws.com/trees/tree_123.jpg",
  "photoStorageType": "s3"
}
```

**Local Storage:**
```json
{
  "pathPhoto": "http://localhost:3000/api/files/trees/tree_123.jpg",
  "photoStorageType": "local"
}
```

### Frontend Considerations

The frontend doesn't need to change! The API always returns a complete URL that can be used directly in:
- `<img src="{pathPhoto}" />` (HTML)
- `Image` components (React, Vue, etc.)
- Any HTTP client

The `photoStorageType` field is provided for debugging or analytics purposes.

### File Structure

**Local Storage:**
```
./uploads/photos/
├── trees/
│   ├── tree_1.jpg
│   ├── tree_2.jpg
│   └── ...
```

**S3 Storage:**
Files are stored in your S3 bucket with the same path structure.

### Migration

To switch from S3 to local storage (or vice versa):

1. Change `FILE_STORAGE_TYPE` in your `.env` file
2. Restart the application
3. New uploads will use the new storage type
4. Existing files remain accessible via their stored URLs

### Performance Notes

- **Local Storage**: Faster uploads, but requires server disk space
- **S3 Storage**: Scalable, CDN-friendly, but requires internet connection
- Both support the same file types and size limits

### Security

- **Local Storage**: Files are served through the application with proper security headers
- **S3 Storage**: Uses public-read ACL for direct browser access
- All uploads still require proper authentication through your API

## Troubleshooting

### Local Storage Issues
- Ensure `LOCAL_STORAGE_PATH` directory has write permissions
- Check disk space availability
- Verify `BASE_URL` matches your application's URL

### S3 Storage Issues
- Verify AWS credentials have proper permissions
- Ensure bucket exists and is accessible
- Check CORS settings if accessing from browser

## Environment Examples

### Development (Local)
```env
FILE_STORAGE_TYPE=local
LOCAL_STORAGE_PATH=./uploads/photos
BASE_URL=http://localhost:3000
```

### Production (S3)
```env
FILE_STORAGE_TYPE=s3
S3_ACCESS_KEY=AKIA...
S3_SECRET_ACCESS_KEY=...
S3_BUCKET=myapp-production-photos
S3_REGION=us-east-1
```

### Testing (Local)
```env
FILE_STORAGE_TYPE=local
LOCAL_STORAGE_PATH=./test-uploads
BASE_URL=http://localhost:3001
```
