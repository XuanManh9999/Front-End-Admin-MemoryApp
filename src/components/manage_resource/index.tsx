import PageBreadcrumb from "../common/PageBreadCrumb";
import PageMeta from "../common/PageMeta";
import ComponentCard from "../common/ComponentCard";
import ReusableTable from "../common/ReusableTable";
import { useCallback, useEffect, useState, KeyboardEvent } from "react";
import { useSearchParams } from "react-router";
import { Input, message, Select, Upload } from "antd";
import Pagination from "../pagination";
import Label from "../form/Label";
import { IoIosAdd } from "react-icons/io";
import * as XLSX from 'xlsx';
import FormModal from "../common/FormModal";
import { 
  getResources, 
  createResource, 
  updateResource, 
  deleteResource,
  getAllFileType,
  Resource,
  ResourceUpdate 
} from "../../services/resource";
import { getCategories } from "../../services/category";
import { getTags } from "../../services/tag";
import { getCollections } from "../../services/collection";

// Interfaces
interface ResourcesResponse {
  statusCode: number;
  message: string;
  data: {
    resources: any[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalResources: number;
      limit: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
    filters: {
      search: string;
      category_id: number | null;
      file_type: string;
      collection_id: number | null;
      tag_id: number | null;
      status: string;
      plan: string;
    };
  };
}

const columns: { key: any; label: string }[] = [
  { key: "id", label: "ID" },
  { key: "title", label: "Tiêu đề" },
  { key: "description", label: "Mô tả" },
  { key: "category_name", label: "Danh mục" },
  { key: "plan", label: "Gói" },
  { key: "file_type", label: "Loại file" },
  { key: "downloads", label: "Lượt tải" },
  { key: "favorites_count", label: "Yêu thích" },
  { key: "status", label: "Trạng thái" },
  { key: "user_username_admin", label: "Người tạo" },
  { key: "created_at", label: "Ngày tạo" },
];
export default function ManageResource() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [offset, setOffset] = useState(Number(searchParams.get("offset")) || 0);
  const [quantity, setQuantity] = useState(Number(searchParams.get("quantity")) || 5);
  
  // Modal states
  const [openModal, setOpenModal] = useState(false);
  const [openModalAdd, setOpenModalAdd] = useState(false);
  
  // Data states
  const [loading, setLoading] = useState<boolean>(false);
  const [errorData, setErrorData] = useState("");
  const [resources, setResources] = useState<ResourcesResponse | undefined>(undefined);
  
  // Filter states
  const [search, setSearch] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [fileTypeFilter, setFileTypeFilter] = useState<string>("");
  const [planFilter, setPlanFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  
  // Form states
  const [formFields, setFormFields] = useState<any[]>([]);
  const [formFieldsAdd, setFormFieldsAdd] = useState<any[]>([]);
  const [currentEditItem, setCurrentEditItem] = useState<any>(null);
  
  // Options for dropdowns
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [fileTypes, setFileTypes] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  
  // File upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string>("");
  
  // File upload states for edit modal
  const [selectedFileEdit, setSelectedFileEdit] = useState<File | null>(null);
  const [previewImageEdit, setPreviewImageEdit] = useState<string>("");

  // Set default URL params
  useEffect(() => {
    if (!searchParams.get("limit") || !searchParams.get("offset")) {
      setSearchParams((prev: any) => {
        const newParams = new URLSearchParams(prev);
        if (!newParams.get("limit")) newParams.set("limit", "5");
        if (!newParams.get("offset")) newParams.set("offset", "0");
        return newParams;
      });
    }
  }, [searchParams, setSearchParams]);

  // Fetch resources
  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {
        search: search.trim(),
        category_id: categoryFilter,
        file_type: fileTypeFilter,
        plan: planFilter,
        status: statusFilter,
      };

      const response = await getResources(
        { page: offset, limit: quantity }, // Backend sử dụng offset thay vì page + 1
        filters
      );


      // Check if response has data - cấu trúc backend hiện tại
      console.log("Response data structure:", response?.data);
      console.log("Resources array:", response?.data?.resources);
      
      if (!response?.data?.resources || response.data.resources.length === 0) {
        setErrorData("Không có dữ liệu");
      } else {
        setErrorData("");
        console.log("Found", response.data.resources.length, "resources");
      }
      setResources(response);

      // Update URL params
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.set("limit", String(quantity));
        newParams.set("offset", String(offset));
        return newParams;
      });
    } catch (error) {
      const axiosError = error as Error;
      setErrorData(axiosError.message);
    } finally {
      setLoading(false);
    }
  }, [offset, quantity, search, categoryFilter, fileTypeFilter, planFilter, statusFilter]);

  // Fetch dropdown options
  const fetchOptions = useCallback(async () => {
    try {
      const [categoriesRes, tagsRes, fileTypesRes, collectionsRes] = await Promise.all([
        getCategories(0, 100, ""),
        getTags(0, 100, ""),
        getAllFileType(),
        getCollections({ page: 0, limit: 100 }, { search: "" })
      ]);
      console.log("Check collectionsRes", collectionsRes);
      
      if (categoriesRes?.data?.categories) {
        setCategories(categoriesRes.data.categories.map((cat: any) => ({
          label: cat.name,
          value: cat.id
        })));
      }

      if (tagsRes?.data?.tags) {
        const mappedTags = tagsRes.data.tags.map((tag: any) => ({
          label: tag.name,
          value: tag.id
        }));
        console.log("=== TAGS DEBUG ===");
        console.log("Raw tags response:", tagsRes.data.tags);
        console.log("Mapped tags:", mappedTags);
        console.log("=== END TAGS DEBUG ===");
        setTags(mappedTags);
      } else {
        console.error("No tags found in response:", tagsRes);
      }

      if (fileTypesRes?.data) {
        setFileTypes(fileTypesRes.data.map((type: any) => ({
          label: type.file_type,
          value: type.file_type
        })));
      }

      // Collections response structure: { data: { collections: [], pagination: {} } }
      if (collectionsRes?.data?.collections) {
        setCollections(collectionsRes.data.collections.map((col: any) => ({
          label: `${col.name} (${col.resources_count || 0} tài nguyên)`,
          value: col.id
        })));
      }
    } catch (error) {
      console.error("Error fetching options:", error);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      fetchResources()
        .then(() => setLoading(false))
        .catch((error) => {
          setErrorData(error.message);
          setLoading(false);
        });
    }, 1000);
  }, [quantity, offset]);

  // Handle search
  const handleKeyDown = async (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      fetchResources();
    }
  };

  // Handle create resource
  const handleShowModalAdd = () => {
    // Kiểm tra xem data đã load chưa
    if (tags.length === 0 || categories.length === 0 || collections.length === 0) {
      console.warn("Data chưa được load đầy đủ, đang load lại...");
      message.warning("Đang tải dữ liệu, vui lòng thử lại sau giây lát!");
      fetchOptions(); // Load lại data
      return;
    }
    
    // Reset file states
    setSelectedFile(null);
    setPreviewImage("");
    
    console.log("=== SHOW MODAL ADD DEBUG ===");
    console.log("Categories:", categories.length);
    console.log("Tags:", tags.length);
    console.log("Collections:", collections.length);
    console.log("=== END SHOW MODAL ADD DEBUG ===");
    
    const uploadProps = {
      beforeUpload: (file: File) => {
        console.log("=== BEFORE UPLOAD ===");
        console.log("File details:", {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        });
        
        // Validate file size (max 50MB)
        const isLt50M = file.size / 1024 / 1024 < 50;
        if (!isLt50M) {
          message.error('Tệp tin phải nhỏ hơn 50MB!');
          return Upload.LIST_IGNORE;
        }
        
        // Validate file type
        const allowedExtensions = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'mp4', 'avi', 'mov', 'mp3', 'wav', 'zip', 'rar', '7z'];
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        
        if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
          message.error(`Loại file không được hỗ trợ! Chỉ chấp nhận: ${allowedExtensions.join(', ')}`);
          return Upload.LIST_IGNORE;
        }
        
        // Lưu file vào state
        setSelectedFile(file);
        
        // Tạo preview nếu là ảnh
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = () => {
            setPreviewImage(reader.result as string);
          };
          reader.readAsDataURL(file);
        }
        
        // File đã được chọn thành công
        console.log("File selected successfully:", file.name);
        
        message.success(`✅ Đã chọn file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        console.log("=== END BEFORE UPLOAD ===");
        return false; // Ngăn upload thực sự
      },
      onChange: (info: any) => {
        console.log("=== UPLOAD CHANGE ===");
        console.log("Info:", info);
        console.log("FileList length:", info.fileList.length);
        
        if (info.fileList.length > 0) {
          const file = info.fileList[0];
          console.log("Current file in list:", {
            uid: file.uid,
            name: file.name,
            status: file.status,
            hasOriginFileObj: !!file.originFileObj,
            originFileObjType: typeof file.originFileObj
          });
          
          // Với beforeUpload: false, file sẽ có status 'done' hoặc không có status
          // Không cần báo lỗi nữa vì file đã được validate trong beforeUpload
          if (file.status !== 'error') {
            console.log("File ready for upload");
            // File đã sẵn sàng để submit
          }
        } else {
          console.log("No files in list");
        }
        console.log("=== END UPLOAD CHANGE ===");
      },
      accept: ".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.svg,.mp4,.avi,.mov,.mp3,.wav,.zip,.rar,.7z",
      maxCount: 1, // Chỉ cho phép 1 file
      showUploadList: true, // Hiển thị danh sách file đã chọn
      listType: "picture-card", // Hiển thị dạng card
      multiple: false, // Không cho phép chọn nhiều file
    };

    setFormFieldsAdd([
      {
        name: "title",
        label: "Tiêu đề",
        type: "text",
        placeholder: "Nhập tiêu đề tài nguyên",
        rules: [
          { required: true, message: "Vui lòng nhập tiêu đề!" },
          { min: 3, message: "Tiêu đề phải có ít nhất 3 ký tự!" }
        ],
      },
      {
        name: "description",
        label: "Mô tả",
        type: "textarea",
        placeholder: "Nhập mô tả tài nguyên",
      },
      {
        name: "category_id",
        label: "Danh mục",
        type: "select",
        placeholder: "Chọn danh mục",
        options: categories,
        rules: [{ required: true, message: "Vui lòng chọn danh mục!" }],
      },
      {
        name: "plan",
        label: "Gói",
        type: "select",
        placeholder: "Chọn gói",
        options: [
          { label: "Miễn phí", value: "free" },
          { label: "Trả phí", value: "premium" }
        ],
        rules: [{ required: true, message: "Vui lòng chọn gói!" }],
      },
      {
        name: "detail",
        label: "Chi tiết",
        type: "textarea",
        placeholder: "Nhập chi tiết tài nguyên",
      },
      {
        name: "file",
        label: "Tệp tin",
        type: "upload",
        uploadProps,
        // Không cần validation ở đây nữa, đã có hidden field
      },
      {
        name: "tag_ids",
        label: "Thẻ",
        type: "multiselect",
        placeholder: "Chọn một hoặc nhiều thẻ",
        options: tags,
        allowClear: true,
        rules: [{ required: true, message: "Vui lòng chọn ít nhất một thẻ!" }],
      },
      {
        name: "collection_id",
        label: "Bộ sưu tập",
        type: "select",
        placeholder: "Chọn bộ sưu tập",
        options: collections,
        rules: [{ required: true, message: "Vui lòng chọn bộ sưu tập!" }],
      }
    ]);
    setOpenModalAdd(true);
  };

  const handleAddResource = async (data: any) => {
    console.log("=== HANDLE ADD RESOURCE START ===");
    console.log("Complete form data:", data);
    console.log("Selected file from state:", selectedFile);
    
    // QUAN TRỌNG: Kiểm tra file trước khi submit form
    if (!selectedFile) {
      console.error("No file selected in state");
      message.error("Vui lòng chọn tệp tin trước khi submit!");
      return; // Dừng ngay, không submit form
    }

    if (!selectedFile || !(selectedFile instanceof File)) {
      console.error("File validation failed:", {
        hasFile: !!selectedFile,
        isInstance: selectedFile ? (selectedFile as any) instanceof File : false,
        type: typeof selectedFile
      });
      message.error("File không được nhận diện đúng cách! Vui lòng thử chọn lại file.");
      return; // Dừng ngay, không submit form
    }

    setLoading(true);
    try {
      console.log("=== DEBUG FILE UPLOAD ===");
      const fileToUpload = selectedFile;

      console.log("Final file to upload:", {
        file: fileToUpload,
        isFile: fileToUpload instanceof File,
        name: fileToUpload?.name,
        size: fileToUpload?.size,
        type: fileToUpload?.type
      });
      console.log("=== END DEBUG FILE UPLOAD ===");
      
      // Validate required fields
      if (!data.title) {
        message.error("Vui lòng nhập tiêu đề!");
        setLoading(false);
        return;
      }
      
      if (!data.category_id) {
        message.error("Vui lòng chọn danh mục!");
        setLoading(false);
        return;
      }
      
      if (!data.plan) {
        message.error("Vui lòng chọn gói!");
        setLoading(false);
        return;
      }
      
      // Debug form data
      console.log("=== FORM DATA DEBUG ===");
      console.log("Form data received:", data);
      console.log("Available tags:", tags);
      console.log("Available collections:", collections);
      console.log("data.tag_ids:", data.tag_ids);
      console.log("Type of data.tag_ids:", typeof data.tag_ids);
      console.log("Is array:", Array.isArray(data.tag_ids));
      console.log("=== END FORM DATA DEBUG ===");
      
      // Validate và xử lý tag_ids
      if (!data.tag_ids || (Array.isArray(data.tag_ids) && data.tag_ids.length === 0)) {
        console.error("Tag validation failed:", {
          hasTagIds: !!data.tag_ids,
          tagIds: data.tag_ids,
          availableTags: tags.length
        });
        message.error("Vui lòng chọn ít nhất một thẻ!");
        setLoading(false);
        return;
      }
      
      if (!data.collection_id) {
        message.error("Vui lòng chọn bộ sưu tập!");
        setLoading(false);
        return;
      }
      
      // Xử lý tag_ids theo format mong đợi của backend
      const tagIds = Array.isArray(data.tag_ids) ? data.tag_ids : [data.tag_ids];
      const primaryTagId = tagIds[0]; // Tag chính
      const additionalTagIds = tagIds.slice(1); // Các tag phụ
      
      console.log("Primary tag ID:", primaryTagId);
      console.log("Additional tag IDs:", additionalTagIds);
      
      const resourceData: Resource = {
        title: data.title,
        description: data.description,
        category_id: data.category_id,
        plan: data.plan,
        detail: data.detail,
        file: fileToUpload,
        tag_id: primaryTagId,
        collection_id: data.collection_id,
      };
      
      // Thêm additional tags nếu có (phải có ít nhất 2 tags để có additional)
      if (additionalTagIds.length > 0) {
        resourceData.additional_tag_ids = additionalTagIds;
      }

      console.log("=== FINAL RESOURCE DATA ===");
      console.log("Resource data to be sent:", {
        ...resourceData,
        file: resourceData.file ? {
          name: resourceData.file.name,
          size: resourceData.file.size,
          type: resourceData.file.type,
          isFile: resourceData.file instanceof File
        } : 'NO FILE'
      });
      console.log("=== CALLING CREATE RESOURCE ===");

      const response = await createResource(resourceData);
      
      console.log("Create resource response:", response);
      
      // Kiểm tra response thành công
      if (response?.statusCode === 200 || response?.statusCode === 201 || 
          response?.data?.resourceId || response?.data?.message || 
          response?.message?.includes("thành công")) {
        
        const successMessage = response?.message || response?.data?.message || "Thêm tài nguyên thành công";
        message.success(successMessage);
        fetchResources();
        setOpenModalAdd(false);
        setSelectedFile(null);
        setPreviewImage("");
      } else {
        console.error("Create resource failed:", response);
        
        // Hiển thị lỗi chi tiết hơn
        let errorMessage = "Thêm tài nguyên thất bại";
        
        if (response?.message) {
          errorMessage = response.message;
        } else if (response?.error) {
          errorMessage = response.error;
        } else if (response?.data?.error) {
          errorMessage = response.data.error;
        }
        
        console.error("Detailed error:", {
          statusCode: response?.statusCode,
          message: response?.message,
          error: response?.error,
          data: response?.data
        });
        
        message.error(errorMessage);
      }
    } catch (error: any) {
      console.error("Error creating resource:", error);
      message.error(error?.message || "Thêm tài nguyên thất bại. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  // Handle edit resource
  const onEdit = async (item: any) => {
    // Reset file states for edit modal
    setSelectedFileEdit(null);
    setPreviewImageEdit("");
    
    const uploadProps = {
      beforeUpload: (file: File) => {
        console.log("=== EDIT MODAL - BEFORE UPLOAD ===");
        console.log("File details:", {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        });
        
        // Validate file size (max 50MB)
        const isLt50M = file.size / 1024 / 1024 < 50;
        if (!isLt50M) {
          message.error('Tệp tin phải nhỏ hơn 50MB!');
          return Upload.LIST_IGNORE;
        }
        
        // Validate file type
        const allowedExtensions = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'mp4', 'avi', 'mov', 'mp3', 'wav', 'zip', 'rar', '7z'];
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        
        if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
          message.error(`Loại file không được hỗ trợ! Chỉ chấp nhận: ${allowedExtensions.join(', ')}`);
          return Upload.LIST_IGNORE;
        }
        
        // Lưu file vào state cho edit modal
        setSelectedFileEdit(file);
        
        // Tạo preview nếu là ảnh
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = () => {
            setPreviewImageEdit(reader.result as string);
          };
          reader.readAsDataURL(file);
        }
        
        message.success(`✅ Đã chọn file mới: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        console.log("File selected for edit:", file.name);
        console.log("=== END EDIT MODAL - BEFORE UPLOAD ===");
        return false; // Prevent automatic upload
      },
      onChange: (info: any) => {
        console.log("=== EDIT MODAL - UPLOAD CHANGE ===");
        console.log("Info:", info);
        console.log("FileList length:", info.fileList.length);
        
        if (info.fileList.length > 0) {
          const file = info.fileList[0];
          console.log("Current file in edit list:", {
            uid: file.uid,
            name: file.name,
            status: file.status,
            hasOriginFileObj: !!file.originFileObj,
            originFileObjType: typeof file.originFileObj
          });
          
          if (file.status !== 'error') {
            console.log("Edit file ready for upload");
          }
        } else {
          console.log("No files in edit list");
          // Reset state khi không có file
          setSelectedFileEdit(null);
          setPreviewImageEdit("");
        }
        console.log("=== END EDIT MODAL - UPLOAD CHANGE ===");
      },
      accept: ".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.svg,.mp4,.avi,.mov,.mp3,.wav,.zip,.rar,.7z",
      maxCount: 1,
      showUploadList: true,
      listType: "picture-card",
      multiple: false,
    };

    setFormFields([
      {
        name: "id",
        label: "ID",
        type: "text",
        initialValue: item.id,
        disabled: true,
      },
      {
        name: "title",
        label: "Tiêu đề",
        type: "text",
        placeholder: "Nhập tiêu đề tài nguyên",
        initialValue: item.title,
        rules: [
          { required: true, message: "Vui lòng nhập tiêu đề!" },
          { min: 3, message: "Tiêu đề phải có ít nhất 3 ký tự!" }
        ],
      },
      {
        name: "description",
        label: "Mô tả",
        type: "textarea",
        placeholder: "Nhập mô tả tài nguyên",
        initialValue: item.description,
      },
      {
        name: "category_id",
        label: "Danh mục",
        type: "select",
        placeholder: "Chọn danh mục",
        options: categories,
        initialValue: item.category_id,
        rules: [{ required: true, message: "Vui lòng chọn danh mục!" }],
      },
      {
        name: "status",
        label: "🔐 Trạng thái (Admin)",
        type: "select",
        placeholder: "Chọn trạng thái phê duyệt",
        options: [
          { label: "⏳ Chờ duyệt", value: "pending" },
          { label: "✅ Đã xuất bản", value: "publish" }
        ],
        initialValue: item.status,
        rules: [{ required: true, message: "Vui lòng chọn trạng thái!" }],
      },
      {
        name: "plan",
        label: "Gói",
        type: "select",
        placeholder: "Chọn gói",
        options: [
          { label: "Miễn phí", value: "free" },
          { label: "Trả phí", value: "premium" }
        ],
        initialValue: item.plan,
        rules: [{ required: true, message: "Vui lòng chọn gói!" }],
      },
      {
        name: "detail",
        label: "Chi tiết",
        type: "textarea",
        placeholder: "Nhập chi tiết tài nguyên",
        initialValue: item.detail,
      },
      {
        name: "current_file_info",
        label: "File hiện tại",
        type: "textarea",
        initialValue: [
          `📁 File: ${item.file_url ? item.file_url.split('/').pop() : 'Không có'}`,
          `🔗 URL: ${item.file_url || 'Chưa có'}`,
          `📊 Loại: ${item.file_type || 'Không xác định'}`,
          `💾 Kích thước: ${item.file_size ? `${(item.file_size / 1024 / 1024).toFixed(2)}MB` : 'Không xác định'}`
        ].join("\n"),
        disabled: true,
      },
      {
        name: "file",
        label: "Thay đổi file (để trống nếu không đổi)",
        type: "upload",
        uploadProps,
        previewImage: previewImageEdit || item.file_url,
      },
      {
        name: "current_tags",
        label: "Tags hiện tại",
        type: "text",
        initialValue: item.tags?.map((tag: any) => tag.name).join(", ") || "Không có",
        disabled: true,
      },
      {
        name: "tag_ids",
        label: "Cập nhật Tags",
        type: "multiselect",
        placeholder: "Chọn tags mới (để trống nếu không thay đổi)",
        options: tags,
        initialValue: item.tags?.map((tag: any) => tag.id) || [],
        allowClear: true,
      },
      {
        name: "current_collections",
        label: "Collections hiện tại",
        type: "textarea",
        initialValue: item.collections?.map((col: any) => 
          `• ${col.name}${col.description ? ` - ${col.description}` : ''}`
        ).join("\n") || "Không có collection nào",
        disabled: true,
      },
      {
        name: "statistics",
        label: "Thống kê",
        type: "textarea",
        initialValue: [
          `📊 Lượt tải: ${item.downloads || item.download_count || 0}`,
          `❤️ Yêu thích: ${item.favorites_count || 0}`,
          `⭐ Đánh giá: ${item.reviews_count || 0} (TB: ${item.avg_rating ? Number(item.avg_rating).toFixed(1) : '0'})`,
          `💬 Bình luận: ${item.comments_count || 0}`,
          `📈 Điểm phổ biến: ${item.metadata?.popularityScore ? Number(item.metadata.popularityScore).toFixed(1) : '0'}`,
          `🔗 URL: ${item.file_url || 'Chưa có'}`
        ].join("\n"),
        disabled: true,
      }
    ]);
    setCurrentEditItem(item);
    setOpenModal(true);
  };

  const handleUpdateResource = async (data: any) => {
    console.log("=== HANDLE UPDATE RESOURCE START ===");
    console.log("Complete form data:", data);
    console.log("Selected file from edit state:", selectedFileEdit);
    
    setLoading(true);
    try {
      const resourceData: ResourceUpdate = {
        title: data.title,
        description: data.description,
        category_id: data.category_id,
        plan: data.plan,
        detail: data.detail,
        status: data.status,
      };
      
      // Xử lý tag_ids nếu có thay đổi
      if (data.tag_ids && Array.isArray(data.tag_ids) && data.tag_ids.length > 0) {
        resourceData.tag_ids = data.tag_ids;
      }

      // QUAN TRỌNG: Sử dụng selectedFileEdit thay vì data.file
      if (selectedFileEdit && selectedFileEdit instanceof File) {
        console.log("=== DEBUG FILE UPDATE ===");
        console.log("File from state to update:", {
          file: selectedFileEdit,
          isFile: selectedFileEdit instanceof File,
          name: selectedFileEdit.name,
          size: selectedFileEdit.size,
          type: selectedFileEdit.type
        });
        console.log("=== END DEBUG FILE UPDATE ===");
        
        resourceData.file = selectedFileEdit;
      } else {
        console.log("No new file selected for update - keeping existing file");
      }

      console.log("=== FINAL UPDATE DATA ===");
      console.log("Resource update data:", {
        ...resourceData,
        file: resourceData.file ? {
          name: resourceData.file.name,
          size: resourceData.file.size,
          type: resourceData.file.type,
          isFile: resourceData.file instanceof File
        } : 'NO FILE UPDATE'
      });
      console.log("=== CALLING UPDATE RESOURCE ===");

      const response = await updateResource(data.id, resourceData);
      
      console.log("Update resource response:", response);
      
      if (response?.statusCode === 200 || response?.data?.success || 
          response?.message?.includes("thành công")) {
        
        // Thông báo đặc biệt khi thay đổi trạng thái
        if (currentEditItem && data.status && data.status !== currentEditItem.status) {
          const statusText = data.status === 'publish' ? 'đã được phê duyệt và xuất bản' : 'đã được chuyển về chờ duyệt';
          message.success(`Tài nguyên "${data.title}" ${statusText}!`);
        } else if (selectedFileEdit) {
          message.success(`Cập nhật tài nguyên và file "${selectedFileEdit.name}" thành công!`);
        } else {
          message.success(response?.message || "Cập nhật tài nguyên thành công");
        }
        
        fetchResources();
        setOpenModal(false);
        setCurrentEditItem(null);
        // Reset edit file states
        setSelectedFileEdit(null);
        setPreviewImageEdit("");
      } else {
        console.error("Update resource failed:", response);
        
        let errorMessage = "Cập nhật tài nguyên thất bại";
        if (response?.message) {
          errorMessage = response.message;
        } else if (response?.error) {
          errorMessage = response.error;
        } else if (response?.data?.error) {
          errorMessage = response.data.error;
        }
        
        message.error(errorMessage);
      }
    } catch (error: any) {
      console.error("Error updating resource:", error);
      message.error(error?.message || "Cập nhật tài nguyên thất bại. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  // Handle delete resource
  const onDelete = async (id: number | string) => {
    setLoading(true);
    try {
      const response = await deleteResource(Number(id));
      
      if (response?.statusCode === 200 || response?.data?.success) {
        message.success(response?.message || "Xóa tài nguyên thành công");
        fetchResources();
      } else {
        message.error(response?.message || "Xóa tài nguyên thất bại. Vui lòng thử lại!");
      }
    } catch (error: any) {
      console.error("Error deleting resource:", error);
      message.error(error?.message || "Xóa tài nguyên thất bại. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  // Handle export to Excel
  const handleExportExcel = async () => {
    try {
      console.log("=== EXPORT EXCEL START ===");
      setLoading(true);
      
      // Fetch tất cả resources để xuất (không phân trang)
      const exportFilters = {
        search: search.trim(),
        category_id: categoryFilter,
        file_type: fileTypeFilter,
        plan: planFilter,
        status: statusFilter,
      };
      
      // Fetch với limit lớn để lấy tất cả data
      const exportResponse = await getResources(
        { page: 0, limit: 1000 }, // Lấy tối đa 1000 records
        exportFilters
      );
      
      if (!exportResponse?.data?.resources || exportResponse.data.resources.length === 0) {
        message.warning("Không có dữ liệu để xuất!");
        return;
      }
      
      const exportData = exportResponse.data.resources;
      console.log("Export data count:", exportData.length);
      
      // Chuẩn bị dữ liệu cho Excel
      const excelData = exportData.map((item: any, index: number) => ({
        'STT': index + 1,
        'ID': item.id || '',
        'Tiêu đề': item.title || '',
        'Mô tả': item.description || '',
        'Danh mục': item.category_name || '',
        'Gói': item.plan === 'free' ? 'Miễn phí' : 'Premium',
        'Loại file': item.file_type || '',
        'Lượt tải': item.downloads || 0,
        'Yêu thích': item.favorites_count || 0,
        'Trạng thái': item.status === 'publish' ? 'Đã xuất bản' : 'Chờ duyệt',
        'Người tạo': item.user_username_admin || '',
        'Ngày tạo': item.created_at ? new Date(item.created_at).toLocaleDateString('vi-VN') : '',
        'URL File': item.file_url || '',
        'Tags': item.tags?.map((tag: any) => tag.name).join(', ') || '',
        'Collections': item.collections?.map((col: any) => col.name).join(', ') || '',
        'Chi tiết': item.detail || ''
      }));
      
      console.log("Excel data prepared:", excelData.length, "rows");
      
      // Tạo workbook và worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Thiết lập độ rộng cột
      const colWidths = [
        { wch: 5 },   // STT
        { wch: 8 },   // ID
        { wch: 30 },  // Tiêu đề
        { wch: 40 },  // Mô tả
        { wch: 20 },  // Danh mục
        { wch: 12 },  // Gói
        { wch: 15 },  // Loại file
        { wch: 10 },  // Lượt tải
        { wch: 10 },  // Yêu thích
        { wch: 15 },  // Trạng thái
        { wch: 20 },  // Người tạo
        { wch: 15 },  // Ngày tạo
        { wch: 50 },  // URL File
        { wch: 30 },  // Tags
        { wch: 30 },  // Collections
        { wch: 50 }   // Chi tiết
      ];
      ws['!cols'] = colWidths;
      
      // Thêm worksheet vào workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Danh sách tài nguyên');
      
      // Tạo tên file với timestamp
      const now = new Date();
      const timestamp = now.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
      const filename = `BaoCao_TaiNguyen_${timestamp}.xlsx`;
      
      // Xuất file
      XLSX.writeFile(wb, filename);
      
      console.log("Excel file exported:", filename);
      message.success(`✅ Đã xuất báo cáo Excel: ${filename}`);
      
    } catch (error: any) {
      console.error("Error exporting Excel:", error);
      message.error("Xuất Excel thất bại! Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className="">
      <PageMeta
          title="Quản lý tài nguyên"
          description="Quản lý tài nguyên của hệ thống"
      />
      <PageBreadcrumb pageTitle="Quản lý tài nguyên" />
      
      {/* Statistics Cards */}
      {resources?.data && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
          <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng tài nguyên</p>
                <p className="text-2xl font-bold text-gray-900">{resources.data.pagination?.totalResources || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Đã xuất bản</p>
                <p className="text-2xl font-bold text-gray-900">
                  {resources.data.resources?.filter((r: any) => r.status === 'publish').length || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
                <span className="text-2xl">⏳</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Chờ duyệt</p>
                <p className="text-2xl font-bold text-gray-900">
                  {resources.data.resources?.filter((r: any) => r.status === 'pending').length || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                <span className="text-2xl">💎</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Premium</p>
                <p className="text-2xl font-bold text-gray-900">
                  {resources.data.resources?.filter((r: any) => r.plan === 'premium').length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
        
      <div className="flex justify-between mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSearch("");
              setCategoryFilter("");
              setFileTypeFilter("");
              setPlanFilter("");
              setStatusFilter("");
              setTimeout(() => fetchResources(), 100);
            }}
            className="flex items-center gap-2 rounded-full border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-theme-xs hover:bg-red-100"
          >
            🔄 Reset Filters
          </button>
          <button
            onClick={handleExportExcel}
            disabled={loading}
            className="flex items-center gap-2 rounded-full border border-green-300 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 shadow-theme-xs hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📊 Xuất Excel
          </button>
        </div>
        <button
            onClick={handleShowModalAdd}
            className="flex items-center dark:bg-black dark:text-white gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50">
          <IoIosAdd size={24} />
          Thêm
        </button>
      </div>

      <ComponentCard title="Danh sách các tài nguyên có trong hệ thống">
        {/* Search and Filter Controls */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm">
          <div className="flex flex-col space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2">
              <span className="text-blue-600 text-lg">🔍</span>
              <h4 className="text-sm font-semibold text-blue-800">Tìm kiếm & Lọc tài nguyên</h4>
            </div>
            
            {/* Search and Filter Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Search Input */}
              <div className="space-y-2">
                <Label htmlFor="searchInput">
                  <span className="flex items-center gap-1">
                    📝 Tìm kiếm theo tiêu đề
                  </span>
                </Label>
                <Input
                  type="text"
                  id="searchInput"
                  placeholder="Nhập tiêu đề tài nguyên..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  prefix={<span className="text-gray-400">🔎</span>}
                  allowClear
                />
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <Label htmlFor="categoryFilter">
                  <span className="flex items-center gap-1">
                    📂 Danh mục
                  </span>
                </Label>
                <Select
                  id="categoryFilter"
                  placeholder="Chọn danh mục..."
                  value={categoryFilter || undefined}
                  onChange={(value) => {
                    setCategoryFilter(value || "");
                    setTimeout(() => fetchResources(), 100);
                  }}
                  allowClear
                  className="w-full"
                  style={{ borderRadius: '6px' }}
                >
                  {categories.map((cat) => (
                    <Select.Option key={cat.value} value={cat.value}>
                      📂 {cat.label}
                    </Select.Option>
                  ))}
                </Select>
              </div>

              {/* File Type Filter */}
              <div className="space-y-2">
                <Label htmlFor="fileTypeFilter">
                  <span className="flex items-center gap-1">
                    📁 Loại file
                  </span>
                </Label>
                <Select
                  id="fileTypeFilter"
                  placeholder="Chọn loại file..."
                  value={fileTypeFilter || undefined}
                  onChange={(value) => {
                    setFileTypeFilter(value || "");
                    setTimeout(() => fetchResources(), 100);
                  }}
                  allowClear
                  className="w-full"
                  style={{ borderRadius: '6px' }}
                >
                  {fileTypes.map((type) => (
                    <Select.Option key={type.value} value={type.value}>
                      📄 {type.label}
                    </Select.Option>
                  ))}
                </Select>
              </div>

              {/* Plan Filter */}
              <div className="space-y-2">
                <Label htmlFor="planFilter">
                  <span className="flex items-center gap-1">
                    💎 Gói
                  </span>
                </Label>
                <Select
                  id="planFilter"
                  placeholder="Chọn gói..."
                  value={planFilter || undefined}
                  onChange={(value) => {
                    setPlanFilter(value || "");
                    setTimeout(() => fetchResources(), 100);
                  }}
                  allowClear
                  className="w-full"
                  style={{ borderRadius: '6px' }}
                >
                  <Select.Option value="free">🆓 Miễn phí</Select.Option>
                  <Select.Option value="premium">💎 Premium</Select.Option>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label htmlFor="statusFilter">
                  <span className="flex items-center gap-1">
                    📋 Trạng thái
                  </span>
                </Label>
                <Select
                  id="statusFilter"
                  placeholder="Chọn trạng thái..."
                  value={statusFilter || undefined}
                  onChange={(value) => {
                    setStatusFilter(value || "");
                    setTimeout(() => fetchResources(), 100);
                  }}
                  allowClear
                  className="w-full"
                  style={{ borderRadius: '6px' }}
                >
                  <Select.Option value="pending">⏳ Chờ duyệt</Select.Option>
                  <Select.Option value="publish">✅ Đã xuất bản</Select.Option>
                </Select>
              </div>

              {/* Search Button */}
              <div className="space-y-2 flex flex-col justify-end">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSearch("");
                      setCategoryFilter("");
                      setFileTypeFilter("");
                      setPlanFilter("");
                      setStatusFilter("");
                      setTimeout(() => fetchResources(), 100);
                    }}
                    className="flex items-center gap-1 px-3 py-2 text-gray-600 border border-gray-300 rounded-md hover:border-gray-400 hover:text-gray-700 text-sm"
                  >
                    <span>🔄</span>
                    <span>Reset</span>
                  </button>
                  <button
                    onClick={() => fetchResources()}
                    className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
                  >
                    <span>🔍</span>
                    <span>Tìm kiếm</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filters Display */}
            {(search || categoryFilter || fileTypeFilter || planFilter || statusFilter) && (
              <div className="flex items-center gap-2 pt-2 border-t border-blue-200">
                <span className="text-xs font-medium text-blue-700">Bộ lọc đang áp dụng:</span>
                {search && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    🔍 "{search}"
                  </span>
                )}
                {categoryFilter && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                    📂 {categories.find(c => c.value.toString() === categoryFilter)?.label}
                  </span>
                )}
                {fileTypeFilter && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                    📁 {fileTypeFilter}
                  </span>
                )}
                {planFilter && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                    💎 {planFilter === 'free' ? 'Miễn phí' : 'Premium'}
                  </span>
                )}
                {statusFilter && (
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                    📋 {statusFilter === 'pending' ? 'Chờ duyệt' : 'Đã xuất bản'}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

          <ReusableTable
            error={errorData}
            title="Danh sách tài nguyên"
            data={resources?.data?.resources ?? []}
            columns={columns}
            onEdit={onEdit}
            onDelete={onDelete}
            isLoading={loading}
          />

        <Pagination
          limit={quantity}
          offset={offset ?? 1}
          totalPages={resources?.data?.pagination?.totalPages ?? 0}
          onPageChange={(limit, newOffset) => {
            setQuantity(limit);
            setOffset(newOffset);
          }}
          onLimitChange={(newLimit) => {
            setQuantity(newLimit);
            setOffset(0);
          }}
        />
      </ComponentCard>
    </div>

      {/* Edit Modal */}
      <FormModal
        title="Cập nhật tài nguyên"
        isOpen={openModal}
        isLoading={loading}
        onSubmit={handleUpdateResource}
        onCancel={() => {
          setOpenModal(false);
          setCurrentEditItem(null);
          // Reset edit file states
          setSelectedFileEdit(null);
          setPreviewImageEdit("");
        }}
        formFields={formFields}
      />

      {/* Add Modal */}
      <FormModal
        title="Thêm tài nguyên mới"
        isOpen={openModalAdd}
        isLoading={loading}
        onSubmit={handleAddResource}
        onCancel={() => {
          setOpenModalAdd(false);
          setSelectedFile(null);
          setPreviewImage("");
        }}
        formFields={formFieldsAdd}
      />
    </>
  );
}
