import * as manageResourceService from "../../service/admin/manage_resource-service.js";
import { uploadFileToCloudinary } from "../../utils/cloudinaryUpload.js";

export const manageResourceController = {
  getResources: async (req, res) => {
    try {
      const {
        page = 0,
        limit = 10,
        search = "",
        category_id = "",
        collection_id = "",
        tag_id = "",
        file_type = "",
        status = "",
        plan = "",
      } = req.query;

      const resources = await manageResourceService.getResources(
        page,
        limit,
        search,
        category_id,
        file_type,
        collection_id,
        tag_id,
        status,
        plan
      );

      res.status(200).json({
        statusCode: 200,
        message: "Lấy danh sách tài nguyên thành công",
        data: resources,
      });
    } catch (error) {
      console.error("Error in getResources controller:", error);
      res.status(500).json({
        statusCode: 500,
        message: "Lỗi khi lấy danh sách tài nguyên",
        error: error.message,
      });
    }
  },

  getAllFileType: async (req, res) => {
    try {
      const fileTypes = await manageResourceService.getAllFileType();
      res.status(200).json({
        statusCode: 200,
        message: "Lấy danh sách loại tài nguyên thành công",
        data: fileTypes,
      });
    } catch (error) {
      console.error("Error in getAllFileType controller:", error);
      res.status(500).json({
        statusCode: 500,
        message: "Lỗi khi lấy danh sách loại tài nguyên",
        error: error.message,
      });
    }
  },

  getResourceById: async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          statusCode: 400,
          message: "ID không hợp lệ",
        });
      }

      const resource = await manageResourceService.getResourceById(id);
      res.status(200).json({
        statusCode: 200,
        message: "Lấy tài nguyên thành công",
        data: resource,
      });
    } catch (error) {
      console.error("Error in getResourceById controller:", error);
      if (
        error.message === "Không tìm thấy tài nguyên" ||
        error.message === "ID tài nguyên không hợp lệ"
      ) {
        return res.status(404).json({
          statusCode: 404,
          message: error.message,
        });
      }
      res.status(500).json({
        statusCode: 500,
        message: "Lỗi khi lấy tài nguyên",
        error: error.message,
      });
    }
  },

  createResource: async (req, res) => {
    try {
      const {
        title,
        description,
        category_id,
        plan,
        detail,
        collection_id,
        tag_id,
        file_type, // Nhận file_type từ frontend
        additional_tag_ids, // Nhận additional tags từ frontend
      } = req.body;
      const file = req.file;
      const user = req.user;

      console.log("Create resource - Request body:", req.body);
      console.log(
        "Create resource - File:",
        file
          ? { name: file.originalname, type: file.mimetype, size: file.size }
          : null
      );

      if (!file) {
        return res.status(400).json({
          statusCode: 400,
          message: "Vui lòng chọn file",
        });
      }

      // Validate required fields
      if (!title || !category_id || !plan || !collection_id || !tag_id) {
        return res.status(400).json({
          statusCode: 400,
          message: "Vui lòng nhập đầy đủ thông tin bắt buộc",
        });
      }

      // Upload to Cloudinary
      const base64File = `data:${file.mimetype};base64,${file.buffer.toString(
        "base64"
      )}`;
      const result = await uploadFileToCloudinary(base64File, "resources", {
        resource_type: "auto",
      });

      if (!result || !result.secure_url) {
        return res.status(500).json({
          statusCode: 500,
          message: "Lỗi khi upload file lên Cloudinary",
        });
      }

      // Sử dụng file_type từ frontend, fallback về Cloudinary result
      const finalFileType = file_type || result.resource_type || "other";

      console.log("File type used:", finalFileType);

      // Parse additional_tag_ids nếu có
      let additionalTagIds = [];
      if (additional_tag_ids) {
        try {
          additionalTagIds =
            typeof additional_tag_ids === "string"
              ? JSON.parse(additional_tag_ids)
              : additional_tag_ids;

          if (!Array.isArray(additionalTagIds)) {
            additionalTagIds = [additionalTagIds];
          }
        } catch (e) {
          console.log("Error parsing additional_tag_ids:", e);
          additionalTagIds = [];
        }
      }

      const resource = await manageResourceService.createResource(
        title,
        description,
        finalFileType,
        category_id,
        plan,
        detail,
        result.secure_url,
        user,
        collection_id,
        tag_id,
        additionalTagIds // Truyền additional tags
      );

      res.status(200).json({
        statusCode: 200,
        message: "Tạo tài nguyên thành công",
        data: {
          resourceId: resource.resourceId,
          message: resource.message,
          file_url: result.secure_url,
          file_type: finalFileType,
        },
      });
    } catch (error) {
      console.error("Error in createResource controller:", error);
      res.status(500).json({
        statusCode: 500,
        message: error.message || "Lỗi khi tạo tài nguyên",
        error: error.message,
      });
    }
  },

  updateResource: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const user = req.user;
      const file = req.file;

      console.log("Update resource - ID:", id);
      console.log("Update resource - Request body:", updateData);
      console.log(
        "Update resource - File:",
        file
          ? { name: file.originalname, type: file.mimetype, size: file.size }
          : null
      );

      if (!id) {
        return res.status(400).json({
          statusCode: 400,
          message: "ID tài nguyên không hợp lệ",
        });
      }

      // Xử lý file upload nếu có
      if (file) {
        const base64File = `data:${file.mimetype};base64,${file.buffer.toString(
          "base64"
        )}`;
        const uploadResult = await uploadFileToCloudinary(
          base64File,
          "resources",
          {
            resource_type: "auto",
          }
        );

        if (uploadResult && uploadResult.secure_url) {
          updateData.file_url = uploadResult.secure_url;
          // Sử dụng file_type từ frontend, fallback về Cloudinary
          updateData.file_type =
            updateData.file_type || uploadResult.resource_type || "other";
        }
      }

      // Parse tags và collections nếu có
      let newTagIds = null;
      let newCollectionIds = null;

      if (updateData.tag_ids) {
        try {
          newTagIds = Array.isArray(updateData.tag_ids)
            ? updateData.tag_ids
            : JSON.parse(updateData.tag_ids);

          if (!Array.isArray(newTagIds)) {
            newTagIds = [newTagIds];
          }

          // Lọc ra các ID hợp lệ
          newTagIds = newTagIds.filter((id) => {
            const num = Number(id);
            return !isNaN(num) && num > 0;
          });
        } catch (e) {
          console.log("Error parsing tag_ids:", e);
          newTagIds = updateData.tag_ids ? [updateData.tag_ids] : null;
        }
        delete updateData.tag_ids;
      }

      if (updateData.collection_ids) {
        try {
          newCollectionIds = Array.isArray(updateData.collection_ids)
            ? updateData.collection_ids
            : JSON.parse(updateData.collection_ids);

          if (!Array.isArray(newCollectionIds)) {
            newCollectionIds = [newCollectionIds];
          }

          // Lọc ra các ID hợp lệ
          newCollectionIds = newCollectionIds.filter((id) => {
            const num = Number(id);
            return !isNaN(num) && num > 0;
          });
        } catch (e) {
          console.log("Error parsing collection_ids:", e);
          newCollectionIds = updateData.collection_ids
            ? [updateData.collection_ids]
            : null;
        }
        delete updateData.collection_ids;
      }

      console.log("Parsed newTagIds:", newTagIds);
      console.log("Parsed newCollectionIds:", newCollectionIds);

      const result = await manageResourceService.updateResource(
        id,
        updateData,
        user.id,
        newTagIds,
        newCollectionIds
      );

      res.status(200).json({
        statusCode: 200,
        message: result.message,
        data: result,
      });
    } catch (error) {
      console.error("Error in updateResource controller:", error);
      res.status(500).json({
        statusCode: 500,
        message: error.message || "Lỗi khi cập nhật tài nguyên",
        error: error.message,
      });
    }
  },

  deleteResource: async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user;

      if (!id) {
        return res.status(400).json({
          statusCode: 400,
          message: "ID tài nguyên không hợp lệ",
        });
      }

      const result = await manageResourceService.deleteResource(id, user.id);

      res.status(200).json({
        statusCode: 200,
        message: result.message,
        data: result.deletedResource,
      });
    } catch (error) {
      console.error("Error in deleteResource controller:", error);
      if (error.message === "Không tìm thấy tài nguyên") {
        return res.status(404).json({
          statusCode: 404,
          message: error.message,
        });
      }
      if (
        error.message === "Bạn không có quyền xóa tài nguyên này" ||
        error.message === "ID tài nguyên không hợp lệ"
      ) {
        return res.status(403).json({
          statusCode: 403,
          message: error.message,
        });
      }
      res.status(500).json({
        statusCode: 500,
        message: "Lỗi khi xóa tài nguyên",
        error: error.message,
      });
    }
  },

  updateResourceStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const user = req.user;

      if (!id) {
        return res.status(400).json({
          statusCode: 400,
          message: "ID tài nguyên không hợp lệ",
        });
      }

      if (!status) {
        return res.status(400).json({
          statusCode: 400,
          message: "Trạng thái không được để trống",
        });
      }

      const result = await manageResourceService.updateResourceStatus(
        id,
        status,
        user.id
      );

      res.status(200).json({
        statusCode: 200,
        message: result.message,
        data: result.resource,
      });
    } catch (error) {
      console.error("Error in updateResourceStatus controller:", error);
      if (error.message === "Không tìm thấy tài nguyên") {
        return res.status(404).json({
          statusCode: 404,
          message: error.message,
        });
      }
      if (
        error.message === "Bạn không có quyền thực hiện thao tác này" ||
        error.message === "Trạng thái không hợp lệ"
      ) {
        return res.status(403).json({
          statusCode: 403,
          message: error.message,
        });
      }
      res.status(500).json({
        statusCode: 500,
        message: "Lỗi khi cập nhật trạng thái tài nguyên",
        error: error.message,
      });
    }
  },

  // === Tags Management ===
  addTagsToResource: async (req, res) => {
    try {
      const { id } = req.params;
      const { tag_ids } = req.body;
      const user = req.user;

      if (!id) {
        return res.status(400).json({
          statusCode: 400,
          message: "ID tài nguyên không hợp lệ",
        });
      }

      if (!tag_ids || (!Array.isArray(tag_ids) && !tag_ids)) {
        return res.status(400).json({
          statusCode: 400,
          message: "Danh sách tag không hợp lệ",
        });
      }

      const result = await manageResourceService.addTagsToResource(
        id,
        tag_ids,
        user.id
      );

      res.status(200).json({
        statusCode: 200,
        message: result.message,
        data: { success: result.success },
      });
    } catch (error) {
      console.error("Error in addTagsToResource controller:", error);
      if (error.message === "Tài nguyên không tồn tại") {
        return res.status(404).json({
          statusCode: 404,
          message: error.message,
        });
      }
      if (error.message === "Bạn không có quyền chỉnh sửa tài nguyên này") {
        return res.status(403).json({
          statusCode: 403,
          message: error.message,
        });
      }
      res.status(500).json({
        statusCode: 500,
        message: "Lỗi khi thêm tags",
        error: error.message,
      });
    }
  },

  removeTagFromResource: async (req, res) => {
    try {
      const { id, tagId } = req.params;
      const user = req.user;

      if (!id || !tagId) {
        return res.status(400).json({
          statusCode: 400,
          message: "ID tài nguyên hoặc tag không hợp lệ",
        });
      }

      const result = await manageResourceService.removeTagFromResource(
        id,
        tagId,
        user.id
      );

      res.status(200).json({
        statusCode: 200,
        message: result.message,
        data: { success: result.success },
      });
    } catch (error) {
      console.error("Error in removeTagFromResource controller:", error);
      if (
        error.message === "Tài nguyên không tồn tại" ||
        error.message === "Tag không tồn tại trong tài nguyên này"
      ) {
        return res.status(404).json({
          statusCode: 404,
          message: error.message,
        });
      }
      if (error.message === "Bạn không có quyền chỉnh sửa tài nguyên này") {
        return res.status(403).json({
          statusCode: 403,
          message: error.message,
        });
      }
      res.status(500).json({
        statusCode: 500,
        message: "Lỗi khi xóa tag",
        error: error.message,
      });
    }
  },

  getResourceTags: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          statusCode: 400,
          message: "ID tài nguyên không hợp lệ",
        });
      }

      const tags = await manageResourceService.getResourceTags(id);

      res.status(200).json({
        statusCode: 200,
        message: "Lấy tags thành công",
        data: tags,
      });
    } catch (error) {
      console.error("Error in getResourceTags controller:", error);
      if (error.message === "ID tài nguyên không hợp lệ") {
        return res.status(400).json({
          statusCode: 400,
          message: error.message,
        });
      }
      res.status(500).json({
        statusCode: 500,
        message: "Lỗi khi lấy tags",
        error: error.message,
      });
    }
  },

  // === Collections Management ===
  addResourceToCollection: async (req, res) => {
    try {
      const { id } = req.params;
      const { collection_id } = req.body;
      const user = req.user;

      if (!id || !collection_id) {
        return res.status(400).json({
          statusCode: 400,
          message: "ID tài nguyên hoặc collection không hợp lệ",
        });
      }

      const result = await manageResourceService.addResourceToCollection(
        id,
        collection_id,
        user.id
      );

      res.status(200).json({
        statusCode: 200,
        message: result.message,
        data: { success: result.success },
      });
    } catch (error) {
      console.error("Error in addResourceToCollection controller:", error);
      if (
        error.message === "Bộ sưu tập không tồn tại" ||
        error.message === "Tài nguyên không tồn tại"
      ) {
        return res.status(404).json({
          statusCode: 404,
          message: error.message,
        });
      }
      if (
        error.message === "Bạn không có quyền truy cập bộ sưu tập này" ||
        error.message === "Tài nguyên đã có trong bộ sưu tập này"
      ) {
        return res.status(403).json({
          statusCode: 403,
          message: error.message,
        });
      }
      res.status(500).json({
        statusCode: 500,
        message: "Lỗi khi thêm tài nguyên vào bộ sưu tập",
        error: error.message,
      });
    }
  },

  removeResourceFromCollection: async (req, res) => {
    try {
      const { id, collectionId } = req.params;
      const user = req.user;

      if (!id || !collectionId) {
        return res.status(400).json({
          statusCode: 400,
          message: "ID tài nguyên hoặc collection không hợp lệ",
        });
      }

      const result = await manageResourceService.removeResourceFromCollection(
        id,
        collectionId,
        user.id
      );

      res.status(200).json({
        statusCode: 200,
        message: result.message,
        data: { success: result.success },
      });
    } catch (error) {
      console.error("Error in removeResourceFromCollection controller:", error);
      if (
        error.message === "Bộ sưu tập không tồn tại" ||
        error.message === "Tài nguyên không có trong bộ sưu tập này"
      ) {
        return res.status(404).json({
          statusCode: 404,
          message: error.message,
        });
      }
      if (error.message === "Bạn không có quyền truy cập bộ sưu tập này") {
        return res.status(403).json({
          statusCode: 403,
          message: error.message,
        });
      }
      res.status(500).json({
        statusCode: 500,
        message: "Lỗi khi xóa tài nguyên khỏi bộ sưu tập",
        error: error.message,
      });
    }
  },

  getResourceCollections: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          statusCode: 400,
          message: "ID tài nguyên không hợp lệ",
        });
      }

      const collections = await manageResourceService.getResourceCollections(
        id
      );

      res.status(200).json({
        statusCode: 200,
        message: "Lấy collections thành công",
        data: collections,
      });
    } catch (error) {
      console.error("Error in getResourceCollections controller:", error);
      if (error.message === "ID tài nguyên không hợp lệ") {
        return res.status(400).json({
          statusCode: 400,
          message: error.message,
        });
      }
      res.status(500).json({
        statusCode: 500,
        message: "Lỗi khi lấy collections",
        error: error.message,
      });
    }
  },
};
