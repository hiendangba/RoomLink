import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import FileUploadButton from '../../components/ui/FileUploadButton';
import InfoBox from '../../components/ui/InfoBox';
import PageLayout from '../../components/layout/PageLayout';
import ImageEditorModal from '../../components/modal/ImageEditorModal';
import numberPlateApi from '../../api/numberPlateApi';
import { hasPlate } from '../../services/plateDetectionService';

const VehicleRegistrationPage = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [formData, setFormData] = useState({ licensePlate: '' });
  const [licensePlateImage, setLicensePlateImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editingImage, setEditingImage] = useState(null); // { type: 'numberPlate', src: string }
  const [detectingPlate, setDetectingPlate] = useState(false);
  const [plateDetected, setPlateDetected] = useState(null); // null: chưa kiểm tra, true: có biển số, false: không có
  const fileInputRef = useRef(null);

  // Store original file separately to preserve quality when re-editing
  const originalFileRef = useRef(null);
  const previewUrlRef = useRef(null);

  // Store temporary file and preview URL when user selects a new file (before confirming)
  const tempFileRef = useRef(null);
  const tempPreviewUrlRef = useRef(null);

  // Store temporary preview URL when re-editing existing image (from original file)
  const tempEditPreviewUrlRef = useRef(null);

  // Store edit state (zoom, rotate, position) to restore when re-editing
  const editStateRef = useRef({
    zoom: 100,
    rotate: 0,
    position: { x: 0, y: 0 }
  });

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
      if (tempPreviewUrlRef.current) {
        URL.revokeObjectURL(tempPreviewUrlRef.current);
      }
      if (tempEditPreviewUrlRef.current) {
        URL.revokeObjectURL(tempEditPreviewUrlRef.current);
      }
    };
  }, []);

  const handleInputChange = (e) => { 
    const { name, value } = e.target; 
    setFormData(prev => ({ ...prev, [name]: value })); 
  };

  const handleFileChange = async (file) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      showError('Vui lòng chọn file hình ảnh hợp lệ');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('Kích thước file không được vượt quá 5MB');
      return;
    }

    try {
      setDetectingPlate(true);
      const hasPlateDetected = await hasPlate(file, 0.25);
      
      if (!hasPlateDetected) {
        showError('Không phát hiện biển số xe trong ảnh. Vui lòng chọn ảnh khác.');
        setDetectingPlate(false);
        return;
      }
      
      showSuccess('Đã phát hiện biển số xe!');
    } catch (error) {
      console.error('Error detecting plate:', error);
      showError('Không thể kiểm tra biển số. Vui lòng thử lại.');
      setDetectingPlate(false);
      return;
    } finally {
      setDetectingPlate(false);
    }
    if (tempPreviewUrlRef.current) {
      URL.revokeObjectURL(tempPreviewUrlRef.current);
      tempPreviewUrlRef.current = null;
    }
    tempFileRef.current = null;

    editStateRef.current = { zoom: 100, rotate: 0, position: { x: 0, y: 0 } };
    tempFileRef.current = file;
    const tempPreviewUrl = URL.createObjectURL(file);
    tempPreviewUrlRef.current = tempPreviewUrl;
    setEditingImage({
      type: 'numberPlate',
      src: tempPreviewUrl,
      originalFile: file,
      isNewFile: true
    });
  };

  const handleImageEditConfirm = async (editedBlob, qrScanArea, editState = null) => {
    if (editingImage && editedBlob) {
      try {
        const editedUrl = URL.createObjectURL(editedBlob);

        if (editingImage.isNewFile && tempPreviewUrlRef.current) {
          URL.revokeObjectURL(tempPreviewUrlRef.current);
          tempPreviewUrlRef.current = null;
        }

        if (!editingImage.isNewFile && tempEditPreviewUrlRef.current) {
          URL.revokeObjectURL(tempEditPreviewUrlRef.current);
          tempEditPreviewUrlRef.current = null;
        }

        if (!editingImage.isNewFile && previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
        }

        const originalFile = editingImage.isNewFile 
          ? tempFileRef.current 
          : originalFileRef.current;
        const fileName = originalFile ? originalFile.name.replace(/\.[^/.]+$/, '.png') : 'edited_numberPlate.png';

        const editedFile = new File([editedBlob], fileName, {
          type: 'image/png',
          lastModified: Date.now()
        });

        previewUrlRef.current = editedUrl;

        if (editingImage.isNewFile && tempFileRef.current) {
          originalFileRef.current = tempFileRef.current;
          tempFileRef.current = null;
        }

        if (editState) {
          editStateRef.current = {
            zoom: editState.zoom || 100,
            rotate: editState.rotate || 0,
            position: editState.position || { x: 0, y: 0 }
          };
        }

        setLicensePlateImage(editedFile);
        setImagePreview(editedUrl);
        setPlateDetected(true);
        setEditingImage(null);
      } catch (error) {
        console.error('Error detecting plate:', error);
        showError('Không thể kiểm tra biển số. Vui lòng thử lại.');
      } finally {
        setDetectingPlate(false);
      }
    }
  };

  const handleImageEditCancel = () => {
    if (!editingImage) return;
    
    // If this was a new file selection (not editing existing), clean up temp file and preview
    if (editingImage.isNewFile) {
      if (tempPreviewUrlRef.current) {
        URL.revokeObjectURL(tempPreviewUrlRef.current);
        tempPreviewUrlRef.current = null;
      }
      tempFileRef.current = null;
    } else {
      // If re-editing existing image, clean up temp edit preview URL
      if (tempEditPreviewUrlRef.current) {
        URL.revokeObjectURL(tempEditPreviewUrlRef.current);
        tempEditPreviewUrlRef.current = null;
      }
    }
    
    // Close modal
    setEditingImage(null);
  };

  const removeImage = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setLicensePlateImage(null);
    setImagePreview(null);
    originalFileRef.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatLicensePlate = (plate) => {
    // Backend chỉ cần biển số, không cần format đặc biệt
    // Chỉ loại bỏ khoảng trắng và chuyển thành uppercase
    return plate.replace(/\s/g, '').toUpperCase();
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setLoading(true);
    
    try {
      // Validation - chỉ validate biển số và ảnh vì backend chỉ nhận 2 field này
      if (!formData.licensePlate.trim()) {
        showError('Vui lòng nhập biển số xe');
        setLoading(false);
        return;
      }
      
      if (!licensePlateImage) {
        showError('Vui lòng tải lên hình ảnh biển số xe');
        setLoading(false);
        return;
      }

      // Tạo FormData để gửi file
      const submitFormData = new FormData();
      submitFormData.append('number', formatLicensePlate(formData.licensePlate));
      submitFormData.append('numberPlate', licensePlateImage);

      // Gọi API
      const response = await numberPlateApi.createNumberPlate(submitFormData);
      
      if (response.success) {
        showSuccess('Đăng ký biển số xe thành công.');
        
        // Reset form
        setFormData({ licensePlate: '' });
        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
          previewUrlRef.current = null;
        }
        setLicensePlateImage(null);
        setImagePreview(null);
        originalFileRef.current = null;
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Call onSuccess callback sau 1.5s
        setTimeout(() => {
          if (onSuccess) {
            onSuccess(response.data);
          }
        }, 1500);
      }
    } catch (err) {
      console.error('Error registering vehicle:', err);
      showError(err?.response?.data?.message || 'Có lỗi xảy ra khi đăng ký biển số xe. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ImageEditorModal
        isOpen={!!editingImage}
        onClose={handleImageEditCancel}
        imageSrc={editingImage?.src}
        imageType="numberPlate"
        onConfirm={(blob, qrScanArea, editState) => handleImageEditConfirm(blob, qrScanArea, editState)}
        title="Chỉnh sửa ảnh biển số xe"
        initialZoom={editingImage?.editState?.zoom || 100}
        initialRotate={editingImage?.editState?.rotate || 0}
        initialPosition={editingImage?.editState?.position || { x: 0, y: 0 }}
      />
      <PageLayout
        title="Đăng ký biển số xe"
        subtitle="Đăng ký thông tin xe để ra vào KTX hợp lệ"
        showClose={true}
        onClose={onCancel}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Biển số xe"
            name="licensePlate"
            type="text"
            value={formData.licensePlate}
            onChange={handleInputChange}
            placeholder="VD: 12A-12345, 12-AB12345, 12-AB1234"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hình ảnh biển số xe <span className="text-red-500">*</span>
            </label>
            <div className="space-y-4">
              <FileUploadButton 
                accept="image/*" 
                onChange={handleFileChange} 
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
              >
                {licensePlateImage ? licensePlateImage.name : 'Chọn hình ảnh biển số xe'}
              </FileUploadButton>
              {imagePreview && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-green-600 font-medium">✓ Đã chọn: {licensePlateImage.name}</p>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="small"
                        onClick={() => {
                          // Clean up previous temp edit preview URL if exists
                          if (tempEditPreviewUrlRef.current) {
                            URL.revokeObjectURL(tempEditPreviewUrlRef.current);
                          }
                          
                          const originalFile = originalFileRef.current;
                          if (!originalFile) {
                            showError('Không tìm thấy ảnh gốc. Vui lòng chọn ảnh mới.');
                            return;
                          }
                          
                          // Create temporary preview URL from original file for editing
                          const tempEditPreviewUrl = URL.createObjectURL(originalFile);
                          tempEditPreviewUrlRef.current = tempEditPreviewUrl;
                          
                          const editState = editStateRef.current;
                          setEditingImage({
                            type: 'numberPlate',
                            src: tempEditPreviewUrl,
                            originalFile: originalFile,
                            editState: editState,
                            isNewFile: false
                          });
                        }}
                      >
                        Chỉnh sửa
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 border rounded-lg overflow-hidden bg-gray-50">
                    <img
                      src={imagePreview}
                      alt="Biển số xe đã chỉnh sửa"
                      className="w-full h-auto max-h-64 object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <InfoBox
            type="info"
            title="Lưu ý quan trọng"
            messages={[
              'Biển số xe phải đúng định dạng theo quy định của Việt Nam',
              'Hình ảnh biển số phải rõ nét, không bị mờ hoặc che khuất',
              'Sau khi được phê duyệt, bạn có thể sử dụng xe để ra vào KTX'
            ]}
          />

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={onCancel} 
              disabled={loading}
            >
              Hủy
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              disabled={loading} 
              loading={loading} 
              loadingText="Đang xử lý..."
            >
              Đăng ký biển số xe
            </Button>
          </div>
        </form>
      </PageLayout>
    </>
  );
};

export default VehicleRegistrationPage;
