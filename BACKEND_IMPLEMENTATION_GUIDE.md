# Backend Implementation Guide - Resource Management

## 📁 File Structure

```
backend/
├── routes/admin/
│   └── manage-resource-routes.js
├── controller/admin/
│   └── manage-resource-controller.js
├── service/admin/
│   └── manage_resource-service.js
└── utils/
    └── cloudinaryUpload.js
```

## 🔧 Key Features Implemented

### 1. **Multiple Tags Support**

- ✅ Primary tag (required)
- ✅ Additional tags (optional)
- ✅ Frontend gửi `tag_id` (primary) và `additional_tag_ids` (array)
- ✅ Backend xử lý và lưu tất cả tags vào `resource_tags` table

### 2. **File Type Auto-Detection**

- ✅ Frontend tự detect file type từ extension
- ✅ Gửi `file_type` parameter đến backend
- ✅ Backend sử dụng `file_type` từ frontend, fallback về Cloudinary

### 3. **Enhanced Error Handling**

- ✅ Detailed error messages
- ✅ Proper HTTP status codes
- ✅ File validation (size, type)
- ✅ Transaction rollback on errors

### 4. **Complete CRUD Operations**

- ✅ Create resource with tags & collections
- ✅ Read resources with filters
- ✅ Update resource (including tags & collections)
- ✅ Delete resource with cascade delete

## 📋 API Endpoints

### Core CRUD

```
GET    /admin/manage-resource/all              # Lấy danh sách resources
GET    /admin/manage-resource/:id              # Lấy resource theo ID
POST   /admin/manage-resource/create           # Tạo resource mới
PUT    /admin/manage-resource/:id              # Cập nhật resource
DELETE /admin/manage-resource/:id              # Xóa resource
```

### Utility

```
GET    /admin/manage-resource/all-file-type    # Lấy danh sách file types
```

### Admin Operations

```
PUT    /admin/manage-resource/:id/status       # Cập nhật trạng thái (Admin only)
```

### Tags Management

```
POST   /admin/manage-resource/:id/tags         # Thêm tags vào resource
DELETE /admin/manage-resource/:id/tags/:tagId  # Xóa tag khỏi resource
GET    /admin/manage-resource/:id/tags         # Lấy tags của resource
```

### Collections Management

```
POST   /admin/manage-resource/:id/collections           # Thêm resource vào collection
DELETE /admin/manage-resource/:id/collections/:collectionId # Xóa resource khỏi collection
GET    /admin/manage-resource/:id/collections           # Lấy collections chứa resource
```

## 📝 Request/Response Examples

### Create Resource

**Request:**

```javascript
// FormData
{
  title: "Sample Resource",
  description: "Resource description",
  category_id: 1,
  plan: "free",
  detail: "Detailed information",
  collection_id: 1,
  tag_id: 1,                    // Primary tag
  additional_tag_ids: [2, 3, 4], // Additional tags
  file_type: "image",           // Auto-detected by frontend
  file: [File object]
}
```

**Response:**

```json
{
  "statusCode": 200,
  "message": "Tạo tài nguyên thành công",
  "data": {
    "resourceId": 123,
    "message": "Tạo tài nguyên thành công và đã thêm vào bộ sưu tập với 4 tag(s)",
    "file_url": "https://cloudinary.com/...",
    "file_type": "image"
  }
}
```

### Update Resource

**Request:**

```javascript
// FormData
{
  title: "Updated Resource",
  description: "Updated description",
  category_id: 2,
  plan: "premium",
  status: "publish",
  tag_ids: [1, 2, 5],          // All tags (replaces existing)
  collection_ids: [1, 3],      // All collections (replaces existing)
  file_type: "document",       // If file is updated
  file: [File object]          // Optional
}
```

**Response:**

```json
{
  "statusCode": 200,
  "message": "Cập nhật tài nguyên thành công",
  "data": {
    "success": true,
    "message": "Cập nhật tài nguyên thành công",
    "resource": {
      /* full resource data */
    }
  }
}
```

## 🔐 Authentication & Authorization

### Required Middleware

```javascript
// Cần implement middleware này trước các routes
app.use("/admin/manage-resource", authMiddleware); // Xác thực user
app.use("/admin/manage-resource", adminMiddleware); // Chỉ admin mới truy cập được
```

### Permission Levels

- **User**: Chỉ có thể thao tác với resources của chính mình
- **Admin**: Có thể thao tác với tất cả resources + update status

## 🗄️ Database Schema Requirements

### Tables cần thiết:

```sql
-- Resources table
CREATE TABLE resources (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category_id INT,
  file_url VARCHAR(500),
  file_type VARCHAR(50),
  downloads INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  plan ENUM('free', 'premium') DEFAULT 'free',
  status ENUM('pending', 'publish', 'rejected') DEFAULT 'pending',
  detail TEXT,
  user_id INT,
  INDEX idx_user_id (user_id),
  INDEX idx_category_id (category_id),
  INDEX idx_status (status),
  INDEX idx_file_type (file_type)
);

-- Resource Tags (Many-to-Many)
CREATE TABLE resource_tags (
  resource_id INT,
  tag_id INT,
  PRIMARY KEY (resource_id, tag_id),
  FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Collection Resources (Many-to-Many)
CREATE TABLE collection_resources (
  collection_id INT,
  resource_id INT,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (collection_id, resource_id),
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
  FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE
);
```

## 🚀 Deployment Checklist

### Environment Variables

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Database Configuration
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
```

### File Upload Limits

- **Max file size**: 50MB
- **Allowed types**: Images, Videos, Audio, Documents, Archives
- **Storage**: Cloudinary (auto-optimization)

## 🐛 Troubleshooting

### Common Issues

1. **File upload fails**

   - Check file size (< 50MB)
   - Verify file type is allowed
   - Ensure Cloudinary credentials are correct

2. **Tags not saving**

   - Verify `tag_id` exists in database
   - Check `additional_tag_ids` is valid array
   - Ensure tags table has required IDs

3. **Collections not working**

   - Verify user owns the collection
   - Check collection exists in database
   - Ensure proper foreign key constraints

4. **Permission errors**
   - Verify user authentication
   - Check admin role for status updates
   - Ensure resource ownership for modifications

### Debug Logs

Backend includes comprehensive logging:

- Request/response data
- SQL queries and parameters
- File upload details
- Transaction status

## 📊 Performance Considerations

### Optimizations Implemented

- ✅ Database indexes on frequently queried columns
- ✅ Connection pooling for MySQL
- ✅ Transaction management for data integrity
- ✅ Efficient queries with JOINs instead of N+1 queries
- ✅ File validation before upload to Cloudinary

### Monitoring

- Log all database queries
- Track file upload success/failure rates
- Monitor Cloudinary usage
- Track response times for optimization

## 🔄 Integration with Frontend

### Data Flow

```
Frontend Form → FormData → Backend Route → Controller → Service → Database
                                    ↓
Cloudinary ← File Upload ← Controller ← Service ← Database Response
                                    ↓
Frontend ← JSON Response ← Controller ← Service Result
```

### Key Integration Points

1. **File Type Detection**: Frontend detects, backend validates
2. **Multiple Tags**: Frontend sends array, backend processes individually
3. **Collections**: User can only add to their own collections
4. **Error Handling**: Consistent error format for frontend display

---

## 📞 Support

Nếu có vấn đề trong quá trình implement, hãy check:

1. Database connection và schema
2. Cloudinary configuration
3. File permissions và middleware setup
4. Frontend-backend data format matching
