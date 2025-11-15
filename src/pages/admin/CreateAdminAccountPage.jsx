import React, { useState, useRef, useEffect } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { authApi } from '../../api';
import PageLayout from '../../components/layout/PageLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import FileUploadButton from '../../components/ui/FileUploadButton';
import ImageEditorModal from '../../components/modal/ImageEditorModal';
import InfoBox from '../../components/ui/InfoBox';
import jsQR from 'jsqr';

const CreateAdminAccountPage = ({ onSuccess, onCancel }) => {
  const { showSuccess, showError } = useNotification();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    identification: '',
    dob: '',
    gender: '',
    phone: '',
    nation: 'Việt Nam',
    region: 'Không',
    address: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  // Image upload states
  const [cccdFile, setCccdFile] = useState(null);
  const [cccdPreview, setCccdPreview] = useState(null);
  const [editingImage, setEditingImage] = useState(null);
  const originalFilesRef = useRef({ cccdFront: null });
  const previewUrlsRef = useRef({ cccdFront: null });
  
  // Store temporary file and preview URL when user selects a new file (before confirming)
  const tempFileRef = useRef({ cccdFront: null });
  const tempPreviewUrlRef = useRef({ cccdFront: null });
  
  // Store temporary preview URL when re-editing existing image (from original file)
  const tempEditPreviewUrlRef = useRef({ cccdFront: null });
  
  const editStateRef = useRef({
    cccdFront: { zoom: 100, rotate: 0, position: { x: 0, y: 0 }, qrScanArea: null }
  });

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrlsRef.current.cccdFront) {
        URL.revokeObjectURL(previewUrlsRef.current.cccdFront);
      }
      // Cleanup temporary preview URL
      if (tempPreviewUrlRef.current.cccdFront) {
        URL.revokeObjectURL(tempPreviewUrlRef.current.cccdFront);
      }
      // Cleanup temporary edit preview URL
      if (tempEditPreviewUrlRef.current.cccdFront) {
        URL.revokeObjectURL(tempEditPreviewUrlRef.current.cccdFront);
      }
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (file) => {
    if (!file) return;

    // Clean up previous temporary file and preview URL if exists
    if (tempPreviewUrlRef.current.cccdFront) {
      URL.revokeObjectURL(tempPreviewUrlRef.current.cccdFront);
      tempPreviewUrlRef.current.cccdFront = null;
    }
    tempFileRef.current.cccdFront = null;

    // Reset edit state for new image
    editStateRef.current.cccdFront = { zoom: 100, rotate: 0, position: { x: 0, y: 0 }, qrScanArea: null };

    // Store file temporarily (not in state yet)
    tempFileRef.current.cccdFront = file;

    // Create temporary preview URL for modal display only
    const tempPreviewUrl = URL.createObjectURL(file);
    tempPreviewUrlRef.current.cccdFront = tempPreviewUrl;

    // Open image editor modal with temporary preview URL
    setEditingImage({
      type: 'cccdFront',
      src: tempPreviewUrl,
      originalFile: file,
      isNewFile: true // Flag to indicate this is a new file selection
    });

    // Clear error
    if (errors.cccdFront) {
      setErrors(prev => ({
        ...prev,
        cccdFront: ''
      }));
    }
  };

  // Format date from DD/MM/YYYY or DDMMYYYY to YYYY-MM-DD
  const formatDateForInput = (dateStr) => {
    if (!dateStr) return '';
    dateStr = dateStr.trim();

    // Try DDMMYYYY format (8 digits)
    if (/^\d{8}$/.test(dateStr)) {
      const day = dateStr.substring(0, 2);
      const month = dateStr.substring(2, 4);
      const year = dateStr.substring(4, 8);
      return `${year}-${month}-${day}`;
    }

    // Try DD/MM/YYYY format
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }

    // Already YYYY-MM-DD
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateStr;
    }

    return '';
  };

  // Map gender from Vietnamese to form values
  const mapGender = (gender) => {
    const lower = gender.toLowerCase();
    if (lower.includes('nam') || lower === '1' || lower === 'male') {
      return 'male';
    } else if (lower.includes('nữ') || lower.includes('nu') || lower === '0' || lower === 'female') {
      return 'female';
    }
    return '';
  };

  // Parse QR code data
  const parseQRCodeData = (qrData) => {
    // Format: mã cccd|không quan trọng|họ và tên|ngày tháng năm sinh|giới tính|địa chỉ|không quan trọng
    const parts = qrData.split('|');

    if (parts.length >= 6) {
      return {
        identification: parts[0]?.trim() || '',
        name: parts[2]?.trim() || '',
        dob: formatDateForInput(parts[3]?.trim() || ''),
        gender: mapGender(parts[4]?.trim() || ''),
        address: parts[5]?.trim() || ''
      };
    }

    return null;
  };

  // Scan QR code using jsQR
  const scanQRWithJsQR = async (imageSource) => {
    return new Promise((resolve) => {
      const img = new Image();
      let url;
      let shouldRevoke = false;

      if (imageSource instanceof File || imageSource instanceof Blob) {
        url = URL.createObjectURL(imageSource);
        shouldRevoke = true;
      } else {
        url = imageSource;
      }

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d', { willReadFrequently: true });

          const scales = [1, 2, 4, 0.5];

          for (const scale of scales) {
            canvas.width = img.naturalWidth * scale;
            canvas.height = img.naturalHeight * scale;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            if (jsQR) {
              const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
              });

              if (code && code.data) {
                if (shouldRevoke) URL.revokeObjectURL(url);
                resolve(code.data);
                return;
              }

              const codeInverted = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'attemptBoth',
              });

              if (codeInverted && codeInverted.data) {
                if (shouldRevoke) URL.revokeObjectURL(url);
                resolve(codeInverted.data);
                return;
              }
            }
          }

          if (shouldRevoke) URL.revokeObjectURL(url);
          resolve(null);
        } catch (e) {
          console.error('jsQR scan error:', e);
          if (shouldRevoke) URL.revokeObjectURL(url);
          resolve(null);
        }
      };

      img.onerror = () => {
        if (shouldRevoke) URL.revokeObjectURL(url);
        resolve(null);
      };

      img.src = url;
    });
  };

  // Crop image to QR area
  const cropImageToQRArea = async (imageSource, qrArea) => {
    return new Promise((resolve) => {
      const img = new Image();
      let url;
      let shouldRevoke = false;

      if (imageSource instanceof File || imageSource instanceof Blob) {
        url = URL.createObjectURL(imageSource);
        shouldRevoke = true;
      } else {
        url = imageSource;
      }

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;

        const qrX = Math.max(0, Math.min(imgWidth, qrArea.x));
        const qrY = Math.max(0, Math.min(imgHeight, qrArea.y));
        const qrWidth = Math.min(qrArea.width, imgWidth - qrX);
        const qrHeight = Math.min(qrArea.height, imgHeight - qrY);

        canvas.width = qrWidth;
        canvas.height = qrHeight;
        ctx.imageSmoothingEnabled = false;

        ctx.drawImage(
          img,
          qrX, qrY, qrWidth, qrHeight,
          0, 0, canvas.width, canvas.height
        );

        canvas.toBlob((blob) => {
          if (shouldRevoke) URL.revokeObjectURL(url);
          resolve(blob);
        }, 'image/png', 1.0);
      };

      img.onerror = () => {
        if (shouldRevoke) URL.revokeObjectURL(url);
        resolve(null);
      };

      img.src = url;
    });
  };

  const handleImageEditConfirm = async (editedBlob, qrScanArea, editState = null) => {
    if (editingImage && editedBlob) {
      const editedUrl = URL.createObjectURL(editedBlob);

      // Clean up temporary preview URL if this was a new file selection
      if (editingImage.isNewFile && tempPreviewUrlRef.current.cccdFront) {
        URL.revokeObjectURL(tempPreviewUrlRef.current.cccdFront);
        tempPreviewUrlRef.current.cccdFront = null;
      }

      // Clean up temporary edit preview URL if re-editing existing image
      if (!editingImage.isNewFile && tempEditPreviewUrlRef.current.cccdFront) {
        URL.revokeObjectURL(tempEditPreviewUrlRef.current.cccdFront);
        tempEditPreviewUrlRef.current.cccdFront = null;
      }

      // Revoke old preview URL (if editing existing image)
      if (!editingImage.isNewFile && previewUrlsRef.current.cccdFront) {
        URL.revokeObjectURL(previewUrlsRef.current.cccdFront);
      }

      // Get original file: for new file selection, use tempFileRef; for editing existing, use originalFilesRef or cccdFile
      const originalFile = editingImage.isNewFile 
        ? tempFileRef.current.cccdFront 
        : (originalFilesRef.current.cccdFront || cccdFile);
      const fileName = originalFile ? originalFile.name.replace(/\.[^/.]+$/, '.png') : 'edited_cccd.png';

      const editedFile = new File([editedBlob], fileName, {
        type: 'image/png',
        lastModified: Date.now()
      });

      previewUrlsRef.current.cccdFront = editedUrl;

      // For new file selection, store original file in originalFilesRef
      if (editingImage.isNewFile && tempFileRef.current.cccdFront) {
        originalFilesRef.current.cccdFront = tempFileRef.current.cccdFront;
        tempFileRef.current.cccdFront = null; // Clear temp file
      }

      if (editState) {
        editStateRef.current.cccdFront = {
          zoom: editState.zoom || 100,
          rotate: editState.rotate || 0,
          position: editState.position || { x: 0, y: 0 },
          qrScanArea: editState.qrScanArea || null
        };
      }

      setCccdFile(editedFile);
      setCccdPreview(editedUrl);

      // Scan QR code if QR area is provided
      if (qrScanArea) {
        setFormData(prev => ({
          ...prev,
          identification: '',
          name: '',
          dob: '',
          gender: '',
          address: ''
        }));

        (async () => {
          try {
            const originalImageSource = editingImage.originalFile || editingImage.src;
            const qrCroppedBlob = await cropImageToQRArea(originalImageSource, qrScanArea);

            if (qrCroppedBlob) {
              const qrData = await scanQRWithJsQR(qrCroppedBlob);

              if (qrData) {
                const parsedData = parseQRCodeData(qrData);
                if (parsedData) {
                  setFormData(prev => ({
                    ...prev,
                    ...parsedData
                  }));
                  showSuccess('Đã quét và điền thông tin từ mã QR CCCD thành công!');
                } else {
                  showError('Không thể phân tích dữ liệu QR code.');
                }
              } else {
                showError('Không quét được mã QR. Vui lòng điều chỉnh khung quét QR và thử lại.');
              }
            }
          } catch (error) {
            console.error('Error scanning QR code:', error);
            showError('Lỗi khi quét mã QR. Vui lòng thử lại.');
          }
        })();
      } else {
        // Fallback: try scanning full image
        setFormData(prev => ({
          ...prev,
          identification: '',
          name: '',
          dob: '',
          gender: '',
          address: ''
        }));

        (async () => {
          try {
            const qrData = await scanQRWithJsQR(editedBlob);
            if (qrData) {
              const parsedData = parseQRCodeData(qrData);
              if (parsedData) {
                setFormData(prev => ({
                  ...prev,
                  ...parsedData
                }));
                showSuccess('Đã quét và điền thông tin từ mã QR CCCD thành công!');
              } else {
                showError('Ảnh CCCD mờ, không quét được mã QR. Vui lòng chọn ảnh rõ hơn.');
              }
            } else {
              showError('Ảnh CCCD mờ, không quét được mã QR. Vui lòng chọn ảnh rõ hơn.');
            }
          } catch (error) {
            console.error('Error scanning QR code:', error);
            showError('Ảnh CCCD mờ, không quét được mã QR. Vui lòng chọn ảnh rõ hơn.');
          }
        })();
      }

      setEditingImage(null);
    }
  };

  const handleImageEditCancel = () => {
    if (!editingImage) return;
    
    // If this was a new file selection (not editing existing), clean up temp file and preview
    if (editingImage.isNewFile) {
      // Revoke temporary preview URL
      if (tempPreviewUrlRef.current.cccdFront) {
        URL.revokeObjectURL(tempPreviewUrlRef.current.cccdFront);
        tempPreviewUrlRef.current.cccdFront = null;
      }
      
      // Clear temporary file
      tempFileRef.current.cccdFront = null;
    } else {
      // If re-editing existing image, clean up temp edit preview URL
      if (tempEditPreviewUrlRef.current.cccdFront) {
        URL.revokeObjectURL(tempEditPreviewUrlRef.current.cccdFront);
        tempEditPreviewUrlRef.current.cccdFront = null;
      }
    }
    
    // Close modal
    setEditingImage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setErrors({});

    try {
      const response = await authApi.registerAdmin(formData);
      
      const message = response.data?.message || 'Tạo tài khoản Admin thành công!';
      showSuccess(message);

      // Reset form
      setFormData({
        name: '',
        email: '',
        identification: '',
        dob: '',
        gender: '',
        phone: '',
        nation: 'Việt Nam',
        region: 'Không',
        address: ''
      });

      // Reset image
      if (previewUrlsRef.current.cccdFront) {
        URL.revokeObjectURL(previewUrlsRef.current.cccdFront);
      }
      setCccdFile(null);
      setCccdPreview(null);
      originalFilesRef.current.cccdFront = null;

      // Call onSuccess callback after a short delay
      if (onSuccess) {
        setTimeout(() => {
          onSuccess(response.data?.data);
        }, 1500);
      }
    } catch (error) {
      console.error('Error creating admin account:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.[0]?.message ||
                          error.message || 
                          'Có lỗi xảy ra khi tạo tài khoản Admin. Vui lòng thử lại.';
      showError(errorMessage);
      
      // Set field-specific errors if available
      if (error.response?.data?.errors) {
        const fieldErrors = {};
        error.response.data.errors.forEach(err => {
          if (err.path && err.path.length > 0) {
            fieldErrors[err.path[0]] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
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
        imageType="cccd"
        onConfirm={(blob, qrScanArea, editState) => handleImageEditConfirm(blob, qrScanArea, editState)}
        title="Chỉnh sửa ảnh CCCD"
        initialZoom={editStateRef.current.cccdFront?.zoom || 100}
        initialRotate={editStateRef.current.cccdFront?.rotate || 0}
        initialPosition={editStateRef.current.cccdFront?.position || { x: 0, y: 0 }}
        initialQrScanArea={editStateRef.current.cccdFront?.qrScanArea || null}
      />
      <PageLayout
        title="Tạo tài khoản Admin"
        subtitle="Tạo tài khoản quản trị viên mới cho hệ thống"
        showClose={true}
        onClose={onCancel}
        className="bg-white"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* CCCD Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ảnh mặt trước CCCD (Tùy chọn - để tự động điền thông tin)
            </label>
            <FileUploadButton
              accept="image/*"
              onChange={handleFileChange}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            >
              {cccdFile ? cccdFile.name : 'Chọn ảnh CCCD'}
            </FileUploadButton>
            {cccdPreview && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-green-600 font-medium">✓ Đã chọn: {cccdFile.name}</p>
                  <Button
                    variant="outline"
                    size="small"
                    onClick={() => {
                      // Clean up previous temp edit preview URL if exists
                      if (tempEditPreviewUrlRef.current.cccdFront) {
                        URL.revokeObjectURL(tempEditPreviewUrlRef.current.cccdFront);
                      }
                      
                      // Always use original file when re-editing to preserve quality
                      const originalFile = originalFilesRef.current.cccdFront || cccdFile;
                      if (!originalFile) return;
                      
                      // Create temporary preview URL from original file for editing
                      const tempEditPreviewUrl = URL.createObjectURL(originalFile);
                      tempEditPreviewUrlRef.current.cccdFront = tempEditPreviewUrl;
                      
                      const editState = editStateRef.current.cccdFront;
                      setEditingImage({
                        type: 'cccdFront',
                        src: tempEditPreviewUrl, // Use original file preview URL
                        originalFile: originalFile,
                        editState: editState, // Pass edit state to restore zoom, rotate, position
                        isNewFile: false // Flag to indicate this is editing existing image
                      });
                    }}
                  >
                    Chỉnh sửa
                  </Button>
                </div>
                <div className="relative border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                  <img
                    src={cccdPreview}
                    alt="Preview CCCD"
                    className="w-full h-auto max-h-64 object-contain"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Họ và tên"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Nhập họ và tên hoặc quét QR từ CCCD"
              error={errors.name}
              required
            />

            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Nhập email"
              error={errors.email}
              required
            />

            <Input
              label="CCCD/CMND"
              name="identification"
              value={formData.identification}
              onChange={handleInputChange}
              placeholder="Nhập 12 số CCCD hoặc quét QR từ CCCD"
              error={errors.identification}
              required
            />

            <Input
              label="Ngày sinh"
              name="dob"
              type="date"
              value={formData.dob}
              onChange={handleInputChange}
              placeholder="Chọn ngày sinh hoặc quét QR từ CCCD"
              error={errors.dob}
              required
            />

            <Select
              label="Giới tính"
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              error={errors.gender}
              required
            >
              <option value="">Chọn giới tính hoặc quét QR từ CCCD</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </Select>

            <Input
              label="Số điện thoại"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="Nhập số điện thoại (0xxxxxxxxx)"
              error={errors.phone}
              required
            />

            <Input
              label="Quốc tịch"
              name="nation"
              value={formData.nation}
              onChange={handleInputChange}
              placeholder="Nhập quốc tịch"
              error={errors.nation}
              required
            />

            <Input
              label="Tôn giáo"
              name="region"
              value={formData.region}
              onChange={handleInputChange}
              placeholder="Nhập tôn giáo"
              error={errors.region}
              required
            />

            <div className="md:col-span-2">
              <Input
                label="Địa chỉ"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Nhập địa chỉ hoặc quét QR từ CCCD"
                error={errors.address}
                required
              />
            </div>
          </div>

          <InfoBox
            type="info"
            title="Lưu ý:"
            messages={[
              <>Mật khẩu mặc định cho tài khoản Admin là <strong>123456</strong>. Người dùng nên đổi mật khẩu sau khi đăng nhập lần đầu.</>,
              'Bạn có thể tải ảnh CCCD để tự động điền thông tin từ mã QR.'
            ]}
          />

          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              loading={loading}
              loadingText="Đang tạo..."
            >
              Tạo tài khoản
            </Button>
          </div>
        </form>
      </PageLayout>
    </>
  );
};

export default CreateAdminAccountPage;
