import React, { useEffect, useState } from "react";
import { Form, Input, Button, Upload, Modal, Select, Checkbox, Image } from "antd";
import { PlusOutlined, EyeOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";

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
    | "upload"
    | "select"
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
      case "upload":
        const currentPreview = currentPreviewImages[field.name] || field.previewImage;
        return (
          <div className="flex flex-col gap-2">
            <Upload
              listType="picture-card"
              className="avatar-uploader"
              showUploadList={true}
              maxCount={1}
              {...field.uploadProps}
            >
              {currentPreview ? (
                <div className="relative w-full h-full group">
                  <img
                    src={currentPreview}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-white">Thay đổi</span>
                  </div>
                </div>
              ) : (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>Tải lên</div>
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
                className="p-0"
              >
                Xem ảnh
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
                    console.log('getValueFromEvent:', e);
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
               field.type === "upload" ? [] : "")
            }
            label={
              field.type !== "checkbox" ? (
                <label className="font-semibold text-gray-700">
                  {field.label}
                </label>
              ) : null
            }
            rules={field.rules || renderField(field).props.rules}
            className="mb-4">
            {renderField(field)}
          </Form.Item>
        ))}
      </Form>
    </Modal>
  );
};

export default FormModal;
