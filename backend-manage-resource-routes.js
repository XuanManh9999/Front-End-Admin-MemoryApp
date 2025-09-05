import express from "express";
import { manageResourceController } from "../../controller/admin/manage-resource-controller.js";
import multer from "multer";

const router = express.Router();

// Cấu hình multer để xử lý file upload
const upload = multer({
  storage: multer.memoryStorage(), // Lưu file trong memory để upload lên Cloudinary
  limits: {
    fileSize: 50 * 1024 * 1024, // Giới hạn 50MB
  },
  fileFilter: (req, file, cb) => {
    // Danh sách các loại file được phép
    const allowedTypes = [
      // Images
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      // Videos
      "video/mp4",
      "video/avi",
      "video/mov",
      "video/wmv",
      "video/flv",
      "video/webm",
      // Audio
      "audio/mp3",
      "audio/mpeg",
      "audio/wav",
      "audio/flac",
      "audio/aac",
      "audio/ogg",
      // Documents
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
      // Archives
      "application/zip",
      "application/x-rar-compressed",
      "application/x-7z-compressed",
      "application/x-tar",
      "application/gzip",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Loại file không được hỗ trợ: ${file.mimetype}`), false);
    }
  },
});

// === Utility Routes ===

// Lấy danh sách loại file
router.get("/all-file-type", manageResourceController.getAllFileType);

// === CRUD Operations ===

// Lấy danh sách tài nguyên với filters
router.get("/all", manageResourceController.getResources);

// Lấy chi tiết tài nguyên theo ID
router.get("/:id", manageResourceController.getResourceById);

// Tạo tài nguyên mới
router.post(
  "/create",
  upload.single("file"), // Nhận file với field name "file"
  (req, res, next) => {
    // Middleware để log request
    console.log("Create resource request:");
    console.log("Body:", req.body);
    console.log(
      "File:",
      req.file
        ? {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
          }
        : "No file"
    );
    next();
  },
  manageResourceController.createResource
);

// Cập nhật tài nguyên (hỗ trợ file upload)
router.put(
  "/:id",
  upload.single("file"), // File là optional cho update
  (req, res, next) => {
    // Middleware để log request
    console.log("Update resource request:");
    console.log("Params:", req.params);
    console.log("Body:", req.body);
    console.log(
      "File:",
      req.file
        ? {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
          }
        : "No file"
    );
    next();
  },
  manageResourceController.updateResource
);

// Xóa tài nguyên
router.delete("/:id", manageResourceController.deleteResource);

// === Admin Operations ===

// Cập nhật trạng thái tài nguyên (Admin only)
router.put("/:id/status", manageResourceController.updateResourceStatus);

// === Tags Management ===

// Thêm tags vào resource
router.post("/:id/tags", manageResourceController.addTagsToResource);

// Xóa tag khỏi resource
router.delete(
  "/:id/tags/:tagId",
  manageResourceController.removeTagFromResource
);

// Lấy tất cả tags của resource
router.get("/:id/tags", manageResourceController.getResourceTags);

// === Collections Management ===

// Thêm resource vào collection
router.post(
  "/:id/collections",
  manageResourceController.addResourceToCollection
);

// Xóa resource khỏi collection
router.delete(
  "/:id/collections/:collectionId",
  manageResourceController.removeResourceFromCollection
);

// Lấy tất cả collections chứa resource
router.get("/:id/collections", manageResourceController.getResourceCollections);

// === Error Handling Middleware ===

// Xử lý lỗi multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        statusCode: 400,
        message: "File quá lớn. Vui lòng chọn file nhỏ hơn 50MB.",
        error: "FILE_TOO_LARGE",
      });
    }

    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        statusCode: 400,
        message: 'Trường file không hợp lệ. Vui lòng sử dụng trường "file".',
        error: "INVALID_FILE_FIELD",
      });
    }

    return res.status(400).json({
      statusCode: 400,
      message: "Lỗi upload file: " + error.message,
      error: error.code,
    });
  }

  if (error.message.includes("Loại file không được hỗ trợ")) {
    return res.status(400).json({
      statusCode: 400,
      message: error.message,
      error: "UNSUPPORTED_FILE_TYPE",
    });
  }

  next(error);
});

export default router;
