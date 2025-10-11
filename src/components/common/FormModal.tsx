import React, { useEffect, useState } from "react";
import { Form, Input, Button, Upload, Modal, Select, Checkbox } from "antd";
import { PlusOutlined, EyeOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Wrapper component for ReactQuill to work with Ant Design Form
const ReactQuillWrapper: React.FC<{
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder }) => {
  return (
    <div className="richtext-editor-wrapper">
      <ReactQuill
        theme="snow"
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        modules={{
          toolbar: [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'script': 'sub'}, { 'script': 'super' }],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            [{ 'direction': 'rtl' }],
            [{ 'size': ['small', false, 'large', 'huge'] }],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'font': [] }],
            [{ 'align': [] }],
            ['clean'],
            ['link', 'image', 'video']
          ],
        }}
        formats={[
          'header', 'font', 'size',
          'bold', 'italic', 'underline', 'strike', 'blockquote',
          'list', 'bullet', 'indent',
          'link', 'image', 'video', 'align', 'color', 'background',
          'script', 'direction'
        ]}
        style={{ minHeight: '200px' }}
      />
      <style dangerouslySetInnerHTML={{
        __html: `
          .richtext-editor-wrapper .ql-editor {
            min-height: 150px !important;
            font-family: inherit;
          }
          .richtext-editor-wrapper .ql-toolbar {
            border-top: 1px solid #ccc;
            border-left: 1px solid #ccc;
            border-right: 1px solid #ccc;
            border-bottom: none;
          }
          .richtext-editor-wrapper .ql-container {
            border-bottom: 1px solid #ccc;
            border-left: 1px solid #ccc;
            border-right: 1px solid #ccc;
            border-top: none;
          }
          .richtext-editor-wrapper .ql-editor.ql-blank::before {
            color: #999;
            font-style: normal;
          }
        `
      }} />
    </div>
  );
};

interface Field {
  name: string;
  label: string;
  placeholder?: string;
  initialValue?: any;
  rules?: any[];
  type?:
    | "text"
    | "number"
    | "email"
    | "textarea"
    | "richtext"
    | "upload"
    | "select"
    | "multiselect"
    | "checkbox"
    | "checkbox-group";
  options?: { label: string; value: any }[];
  minLength?: number;
  maxLength?: number;
  readOnly?: boolean;
  disabled?: boolean;
  uploadProps?: UploadProps;
  previewImage?: string;
  allowClear?: boolean;
}

interface FormModalProps {
  title?: string;
  isOpen: boolean;
  isLoading?: boolean;
  onSubmit?: (values: any) => void;
  onCancel?: () => void;
  formFields: Field[];
  okText?: string;
  cancelText?: string;
}

const FormModal: React.FC<FormModalProps> = ({
  title = "Form nhập liệu",
  isOpen,
  isLoading = false,
  onSubmit,
  onCancel,
  formFields = [],
  okText = "Xác nhận",
  cancelText = "Đóng",
}) => {
  const [form] = Form.useForm();
  const [currentPreviewImages, setCurrentPreviewImages] = useState<Record<string, string>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isOpen && !isInitialized) {
      // Chỉ set initial values khi modal vừa mở lần đầu
      const initialValues = formFields.reduce((values: Record<string, any>, field: Field) => {
        if (field.type !== "upload") {
          values[field.name] = field.initialValue || "";
        }
        return values;
      }, {});
      form.setFieldsValue(initialValues);
      setIsInitialized(true);

      // Cập nhật preview images
      const previewImages = formFields.reduce((images: Record<string, string>, field: Field) => {
        if (field.type === "upload" && field.previewImage) {
          images[field.name] = field.previewImage;
        }
        return images;
      }, {});
      setCurrentPreviewImages(previewImages);
    } else if (!isOpen) {
      // Reset form khi modal đóng
      form.resetFields();
      setCurrentPreviewImages({});
      setIsInitialized(false);
    }
  }, [isOpen, form, isInitialized]);

  // Chỉ cập nhật preview images khi formFields thay đổi, không động vào form values
  useEffect(() => {
    if (isOpen && isInitialized) {
      const previewImages = formFields.reduce((images: Record<string, string>, field: Field) => {
        if (field.type === "upload" && field.previewImage) {
          images[field.name] = field.previewImage;
        }
        return images;
      }, {});
      setCurrentPreviewImages(prev => ({
        ...prev,
        ...previewImages
      }));
    }
  }, [formFields, isOpen, isInitialized]);

  const onFinish = (values: any) => {
    console.log("=== FORMMODAL SUBMIT ===");
    console.log("Form values:", values);
    console.log("Keys:", Object.keys(values));
    console.log("description value:", values.description);
    console.log("description type:", typeof values.description);
    console.log("tag_ids value:", values.tag_ids);
    console.log("=== END FORMMODAL SUBMIT ===");
    if (onSubmit) onSubmit(values);
  };

  const renderField = (field: Field) => {
    const validationRules = [];

    if (field.rules) {
      validationRules.push(...field.rules);
    }

    switch (field.type) {
      case "textarea":
        return (
          <Input.TextArea
            className="max-h-[200px]"
            placeholder={field.placeholder}
          />
        );
      case "richtext":
        return (
          <ReactQuillWrapper
            placeholder={field.placeholder}
          />
        );
      case "upload":
        const currentPreview = currentPreviewImages[field.name] || field.previewImage;
        return (
          <div className="flex flex-col gap-2">
            <Upload
              listType="picture-card"
              className="avatar-uploader"
              showUploadList={{
                showPreviewIcon: true,
                showRemoveIcon: true,
                showDownloadIcon: false,
              }}
              maxCount={1}
              {...field.uploadProps}
              onChange={(info) => {
                if (field.uploadProps?.onChange) {
                  field.uploadProps.onChange(info);
                }
              }}
            >
              {currentPreview ? (
                <div className="relative w-full h-full group">
                  <img
                    src={currentPreview}
                    alt="preview"
                    className="w-full h-full object-cover rounded"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded">
                    <span className="text-white text-sm">Thay đổi file</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400">
                  <PlusOutlined className="text-2xl mb-2" />
                  <div className="text-sm">Chọn file</div>
                  <div className="text-xs mt-1 text-gray-500 text-center">
                    Hỗ trợ: Ảnh, Video, Audio, PDF, Document
                  </div>
                </div>
              )}
            </Upload>
            {currentPreview && (
              <Button 
                type="link" 
                icon={<EyeOutlined />}
                onClick={() => {
                  window.open(currentPreview, '_blank');
                }}
                className="p-0 text-blue-500 hover:text-blue-700"
                size="small"
              >
                Xem file hiện tại
              </Button>
            )}
          </div>
        );
      case "select":
        return (
          <Select 
            placeholder={field.placeholder}
            allowClear={field.allowClear}
          >
            {field.options?.map((option) => (
              <Select.Option key={option.value} value={option.value}>
                {option.label}
              </Select.Option>
            ))}
          </Select>
        );
      case "multiselect":
        return (
          <Select 
            mode="multiple"
            placeholder={field.placeholder}
            allowClear={field.allowClear}
            showSearch
            filterOption={(input, option) =>
              (option?.children?.toString().toLowerCase() ?? '').includes(input.toLowerCase())
            }
          >
            {field.options?.map((option) => (
              <Select.Option key={option.value} value={option.value}>
                {option.label}
              </Select.Option>
            ))}
          </Select>
        );
      case "checkbox":
        return <Checkbox>{field.label}</Checkbox>;
      case "checkbox-group":
        return (
          <Checkbox.Group options={field.options} disabled={field.disabled} />
        );
      default:
        return (
          <Input
            readOnly={field.readOnly}
            disabled={field.disabled}
            className={`${field.readOnly ? "bg-gray-200" : "bg-white"} ${
              field.disabled ? "cursor-not-allowed" : ""
            }`}
            placeholder={field.placeholder}
          />
        );
    }
  };

  return (
    <Modal
      className="max-h-[620px] overflow-y-auto"
      title={<span className="text-lg font-bold">{title}</span>}
      open={isOpen}
      confirmLoading={isLoading}
      onOk={() => form.submit()}
      onCancel={onCancel}
      okText={okText}
      cancelText={cancelText}
      centered>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        {formFields.map((field) => (
          <Form.Item
            key={field.name}
            name={field.name}
            valuePropName={
              field.type === "checkbox-group" 
                ? "value" 
                : field.type === "upload" 
                  ? "fileList" 
                  : "value"
            }
            getValueFromEvent={
              field.type === "upload" 
                ? (e) => {
                    if (Array.isArray(e)) {
                      return e;
                    }
                    return e && e.fileList;
                  }
                : undefined
            }
            initialValue={
              field.initialValue || 
              (field.type === "checkbox-group" ? [] : 
               field.type === "multiselect" ? [] :
               field.type === "upload" ? [] : "")
            }
            label={
              field.type !== "checkbox" ? (
                <label className="font-semibold text-gray-700">
                  {field.label}
                </label>
              ) : null
            }
            rules={field.type === "upload" ? 
              (field.rules || []).map(rule => {
                // Nếu rule đã có validator, giữ nguyên
                if (rule.validator) {
                  return rule;
                }
                // Nếu chỉ có required: true, thêm validator với delay
                if (rule.required) {
                  return {
                    validator: (_: any, value: any) => {
                      return new Promise((resolve, reject) => {
                        // Thêm delay nhỏ để đảm bảo file đã được set vào form
                        setTimeout(() => {
                          if (!value || (Array.isArray(value) && value.length === 0)) {
                            reject(new Error(rule.message || 'Vui lòng chọn tệp tin!'));
                            return;
                          }
                          
                          // Kiểm tra xem có file thực sự không
                          if (Array.isArray(value) && value.length > 0) {
                            const fileItem = value[0];
                            console.log("File item in validation:", {
                              uid: fileItem?.uid,
                              name: fileItem?.name,
                              status: fileItem?.status,
                              hasOriginFileObj: !!fileItem?.originFileObj,
                              hasFile: !!fileItem?.file,
                              isFile: fileItem instanceof File,
                              keys: Object.keys(fileItem || {})
                            });
                            
                            // Kiểm tra các cách khác nhau để có file object
                            const hasValidFile = !!(
                              fileItem?.originFileObj || 
                              fileItem?.file || 
                              (fileItem instanceof File) ||
                              (fileItem?.status === 'done' && fileItem?.name) ||
                              (fileItem?.status === 'uploading' && fileItem?.name)
                            );
                            
                            console.log("Has valid file:", hasValidFile);
                            
                            if (!hasValidFile) {
                              console.log("Validation FAILED: No valid file object");
                              reject(new Error("File không hợp lệ! Vui lòng chọn lại file."));
                              return;
                            }
                          }
                          
                          console.log("Validation PASSED");
                          console.log("=== END FORMMODAL FILE VALIDATION ===");
                          resolve(undefined);
                        }, 100); // Delay 100ms để đảm bảo file đã được process
                      });
                    }
                  };
                } else {
                  return rule;
                }
              }) : 
              (field.rules || [])
            }
            className="mb-4">
            {renderField(field)}
          </Form.Item>
        ))}
      </Form>
    </Modal>
  );
};

export default FormModal;
