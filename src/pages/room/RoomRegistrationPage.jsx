import React, { useState, useRef, useEffect } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import FileUploadButton from '../../components/ui/FileUploadButton';
import PageLayout from '../../components/ui/PageLayout';
import RoomSelection from '../../components/room/RoomSelection';
import { useNotification } from '../../contexts/NotificationContext';
import ImageEditorModal from '../../components/modal/ImageEditorModal';
import RoomDetail from "../../components/room/RoomDetail"
import jsQR from 'jsqr';
import { authAPI } from "../../api"
const RoomRegistrationPage = () => {
  const [currentStep, setCurrentStep] = useState('room-selection'); // room-selection, personal-info
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedRoomSlot, setSelectedRoomSlot] = useState(null);

  const handleRoomSelected = (room) => {
    setSelectedRoom(room);
    setCurrentStep('room-detail');
  };


  const handleRoomSlotSelected = (roomSlot) => {
    setSelectedRoomSlot(roomSlot);
    setCurrentStep('personal-info');
  };
  const handleCancel = () => {
    window.location.href = '/login';
  };

  const handleBackToRoomSelection = () => {
    setCurrentStep('room-selection');
    setSelectedRoom(null);
  };


  const handleBackToRoomDetail = () => {
    setCurrentStep('room-detail');
    setSelectedRoomSlot(null);
  };


  if (currentStep === 'room-selection') {
    return (
      <RoomSelection
        onRoomSelected={handleRoomSelected}
        onCancel={handleCancel}
      />
    );
  }
  if (currentStep === 'room-detail') {
    return (
      <RoomDetail
        room={selectedRoom}
        onRoomSlotSelected={handleRoomSlotSelected}
        onBack={handleBackToRoomSelection}
      />
    );
  }



  if (currentStep === 'personal-info') {
    return (
      <PersonalInfoForm
        selectedRoom={selectedRoom}
        selectedRoomSlot={selectedRoomSlot}
        onBack={handleBackToRoomDetail}
        onCancel={handleCancel}
      />
    );
  }

  return null;
};

// Personal Information Form Component
const PersonalInfoForm = ({ selectedRoom, selectedRoomSlot, onBack, onCancel }) => {
  const { showSuccess, showError, NotificationComponent } = useNotification();

  const [formData, setFormData] = useState({
    nation: 'Việt Nam', // Mặc định Việt Nam, không cho thay đổi
    identification: '',
    name: '',
    dob: '',
    gender: '',
    address: '',
    region: '',
    email: '',
    phone: '',
    mssv: '',
    school: "Trường đại học Sư Phạm Kỹ Thuật TP. HCM"
  });

  const [files, setFiles] = useState({
    cccdFront: null,
    avatar: null
  });

  const [previews, setPreviews] = useState({
    cccdFront: null,
    avatar: null
  });

  // Store original files separately to preserve quality when re-editing
  const originalFilesRef = useRef({ cccdFront: null, avatar: null });
  const previewUrlsRef = useRef({ cccdFront: null, avatar: null });

  // Store edit state (zoom, rotate, position, qrScanArea) to restore when re-editing
  const editStateRef = useRef({
    cccdFront: { zoom: 100, rotate: 0, position: { x: 0, y: 0 }, qrScanArea: null },
    avatar: { zoom: 100, rotate: 0, position: { x: 0, y: 0 }, qrScanArea: null }
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [editingImage, setEditingImage] = useState(null); // { type: 'cccdFront' | 'avatar', src: string }
  const [qrCroppedPreview, setQrCroppedPreview] = useState(null); // Preview URL for cropped QR image (for debugging)

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (fieldName) => (file) => {
    console.log('handleFileChange called for:', fieldName, file);

    if (!file) {
      console.warn('No file provided for', fieldName);
      return;
    }

    // Revoke previous preview URL if exists
    if (previewUrlsRef.current[fieldName]) {
      URL.revokeObjectURL(previewUrlsRef.current[fieldName]);
    }

    // If changing image, reset edit state for new image
    editStateRef.current[fieldName] = { zoom: 100, rotate: 0, position: { x: 0, y: 0 }, qrScanArea: null };

    // If changing CCCD image, clear QR cropped preview only
    // Don't clear form data here - only clear when scanning QR
    if (fieldName === 'cccdFront') {
      if (qrCroppedPreview) {
        URL.revokeObjectURL(qrCroppedPreview);
        setQrCroppedPreview(null);
      }
      // Form data will be cleared when scanning QR in handleImageEditConfirm
    }

    // Create preview URL for the new file
    const previewUrl = URL.createObjectURL(file);
    console.log('Created preview URL for', fieldName, ':', previewUrl);

    // Update ref
    previewUrlsRef.current[fieldName] = previewUrl;

    // Store original file separately to preserve quality when re-editing
    originalFilesRef.current[fieldName] = file;

    // Set file
    setFiles(prev => ({
      ...prev,
      [fieldName]: file
    }));

    // Set preview immediately so it shows even before editing
    setPreviews(prev => ({
      ...prev,
      [fieldName]: previewUrl
    }));

    // Open image editor modal immediately
    console.log('Setting editingImage for', fieldName, 'with src:', previewUrl);
    setEditingImage({
      type: fieldName,
      src: previewUrl,
      originalFile: file // Keep reference to original file for QR cropping
    });

    // Clear error when user uploads file
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: ''
      }));
    }
  };

  // Cleanup preview URLs on unmount
  React.useEffect(() => {
    return () => {
      // Cleanup all preview URLs when component unmounts
      if (previewUrlsRef.current.cccdFront) {
        URL.revokeObjectURL(previewUrlsRef.current.cccdFront);
      }
      if (previewUrlsRef.current.avatar) {
        URL.revokeObjectURL(previewUrlsRef.current.avatar);
      }
    };
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!files.cccdFront) {
      newErrors.cccdFront = 'Vui lòng tải ảnh mặt trước CCCD';
    }

    if (!files.avatar) {
      newErrors.avatar = 'Vui lòng tải ảnh 3x4';
    }

    if (!formData.identification.trim()) {
      newErrors.identification = 'Số CCCD không được để trống';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Họ & Tên không được để trống';
    }
    if (!formData.region.trim()) {
      newErrors.region = 'Tôn giáo không được để trống Nếu không có hãy nhập không';
    }

    if (!formData.dob) {
      newErrors.dob = 'Ngày tháng năm sinh không được để trống';
    }

    if (!formData.gender) {
      newErrors.gender = 'Giới tính không được để trống';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Địa chỉ không được để trống';
    }

    if (!formData.mssv.trim()) {
      newErrors.mssv = 'MSSV không được để trống';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Gmail không được để trống';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Gmail không hợp lệ';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'SĐT không được để trống';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [uploadedPaths, setUploadedPaths] = useState({
    cccdPath: null,
    avatarPath: null
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (validateForm()) {
      setIsLoading(true);
      const formDataCCCD = new FormData();
      formDataCCCD.append("CCCD", files.cccdFront); // Gửi file thật, không chỉ .name
      const formDataAvatar = new FormData();
      formDataAvatar.append("Avatar", files.avatar);
      try {
        const cccdResponse = await authApi.checkCCCD(formDataCCCD);
        const avatarResponse = await authApi.checkAvatar(formDataAvatar);
        // Prepare registration data
        const genderMap = { Nam: "male", Nữ: "female" };

        const registrationData = {
          ...formData,
          gender: genderMap[formData.gender] || formData.gender,
          roomSlotId: selectedRoomSlot.slotId,
          endDate: selectedRoomSlot.endDate,
          frontIdentificationImage: cccdResponse.data.cccdPath,
          avatar: avatarResponse.data.avatarPath
        };
        console.log("registration data", registrationData)
        const response = await authApi.register(registrationData);
        if (response.success === true) {
          setTimeout(() => {
            setIsLoading(false);
            showSuccess('Đăng ký phòng thành công! Hồ sơ của bạn đang được xét duyệt.');
            setTimeout(() => {
              window.location.href = '/login';
            }, 2000);
          }, 1500);
        }
      } catch (err) {
        console.log(err.response.data.message)
        showError(err.response.data.message);
      }
    }
  };


  // Image preprocessing functions
  const enhanceImageForQR = (imageData) => {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // Convert to grayscale and enhance contrast more aggressively
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Convert to grayscale
      let gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

      // Aggressive contrast enhancement for QR codes
      // Use threshold-based approach to make it more binary (black/white)
      const threshold = 128;
      if (gray < threshold) {
        gray = Math.max(0, gray - 50); // Darken dark areas more
      } else {
        gray = Math.min(255, gray + 50); // Lighten light areas more
      }

      // Apply additional contrast
      const factor = 1.5;
      gray = ((gray / 255 - 0.5) * factor + 0.5) * 255;
      gray = Math.max(0, Math.min(255, gray));

      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }

    return imageData;
  };

  // Function to scan QR code using jsQR library
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

          // Try multiple scales
          const scales = [1, 2, 4, 0.5];

          for (const scale of scales) {
            canvas.width = img.naturalWidth * scale;
            canvas.height = img.naturalHeight * scale;

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // Try jsQR if available
            if (jsQR) {
              const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
              });

              if (code && code.data) {
                console.log('QR code found using jsQR at scale', scale);
                if (shouldRevoke) {
                  URL.revokeObjectURL(url);
                }
                resolve(code.data);
                return;
              }

              // Try with inversion
              const codeInverted = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'attemptBoth',
              });

              if (codeInverted && codeInverted.data) {
                console.log('QR code found using jsQR (inverted) at scale', scale);
                if (shouldRevoke) {
                  URL.revokeObjectURL(url);
                }
                resolve(codeInverted.data);
                return;
              }
            }
          }

          if (shouldRevoke) {
            URL.revokeObjectURL(url);
          }
          resolve(null);
        } catch (e) {
          console.error('jsQR scan error:', e);
          if (shouldRevoke) {
            URL.revokeObjectURL(url);
          }
          resolve(null);
        }
      };

      img.onerror = () => {
        if (shouldRevoke) {
          URL.revokeObjectURL(url);
        }
        resolve(null);
      };

      img.src = url;
    });
  };

  // Cache for BarcodeDetector support check (to avoid repeated checks and warnings)
  const barcodeDetectorSupported = React.useMemo(() => {
    return 'BarcodeDetector' in window;
  }, []);

  // Log warning only once
  React.useEffect(() => {
    if (!barcodeDetectorSupported && jsQR) {
      console.warn('BarcodeDetector API is not supported in this browser, using jsQR library instead');
    } else if (!barcodeDetectorSupported && !jsQR) {
      console.warn('Neither BarcodeDetector API nor jsQR library is available. QR scanning will not work.');
    }
  }, [barcodeDetectorSupported]);

  // Function to scan QR code using jsQR first, then BarcodeDetector API as fallback
  const scanQRCode = async (imageSource) => {
    return new Promise(async (resolve) => {
      // First, try jsQR (more compatible and doesn't require API support)
      if (jsQR) {
        try {
          const qrData = await scanQRWithJsQR(imageSource);
          if (qrData) {
            resolve(qrData);
            return;
          }
        } catch (e) {
          // Continue to BarcodeDetector fallback
        }
      }

      // Fallback to BarcodeDetector if supported
      if (!barcodeDetectorSupported) {
        resolve(null);
        return;
      }

      try {
        const detector = new BarcodeDetector({
          formats: ['qr_code']
        });

        let url;
        let shouldRevoke = false;

        // Handle both File and Blob
        if (imageSource instanceof File || imageSource instanceof Blob) {
          url = URL.createObjectURL(imageSource);
          shouldRevoke = true;
        } else {
          url = imageSource;
        }

        // Try with image URL directly first (fastest)
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';

          img.onload = async () => {
            try {
              const barcodes = await detector.detect(img);
              if (barcodes && barcodes.length > 0) {
                const qrCode = barcodes.find(b => b.format === 'qr_code');
                if (qrCode && qrCode.rawValue) {
                  console.log('QR code found using BarcodeDetector (direct)');
                  if (shouldRevoke) {
                    URL.revokeObjectURL(url);
                  }
                  resolve(qrCode.rawValue);
                  return;
                }
              }
            } catch (e) {
              console.log('Direct detection failed, trying with canvas:', e);
            }

            // Try with canvas at different sizes
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            // Try multiple sizes
            const sizes = [
              { w: img.width, h: img.height, name: 'original' },
              { w: Math.min(2000, img.width), h: Math.min(2000, img.height), name: '2000px' },
              { w: Math.min(1500, img.width), h: Math.min(1500, img.height), name: '1500px' },
              { w: Math.min(1000, img.width), h: Math.min(1000, img.height), name: '1000px' },
            ].filter(s => s.w >= 200 && s.h >= 200);

            const tryScanAtSize = async (sizeIndex) => {
              if (sizeIndex >= sizes.length) {
                // Try with enhanced image as last resort
                try {
                  const size = sizes[0]; // Use first size for enhancement
                  canvas.width = size.w;
                  canvas.height = size.h;
                  ctx.drawImage(img, 0, 0, size.w, size.h);

                  const imageData = ctx.getImageData(0, 0, size.w, size.h);
                  const enhanced = enhanceImageForQR(imageData);
                  ctx.putImageData(enhanced, 0, 0);

                  const barcodes = await detector.detect(canvas);
                  if (barcodes && barcodes.length > 0) {
                    const qrCode = barcodes.find(b => b.format === 'qr_code');
                    if (qrCode && qrCode.rawValue) {
                      console.log('QR code found using BarcodeDetector with enhancement');
                      if (shouldRevoke) {
                        URL.revokeObjectURL(url);
                      }
                      resolve(qrCode.rawValue);
                      return;
                    }
                  }
                } catch (e) {
                  console.log('Enhanced detection also failed:', e);
                }

                console.log('QR code not found after trying all methods');
                if (shouldRevoke) {
                  URL.revokeObjectURL(url);
                }
                resolve(null);
                return;
              }

              const size = sizes[sizeIndex];
              canvas.width = size.w;
              canvas.height = size.h;

              // Draw image
              ctx.drawImage(img, 0, 0, size.w, size.h);

              try {
                const barcodes = await detector.detect(canvas);
                if (barcodes && barcodes.length > 0) {
                  const qrCode = barcodes.find(b => b.format === 'qr_code');
                  if (qrCode && qrCode.rawValue) {
                    console.log(`QR code found at ${size.name} (${size.w}x${size.h})`);
                    if (shouldRevoke) {
                      URL.revokeObjectURL(url);
                    }
                    resolve(qrCode.rawValue);
                    return;
                  }
                }
              } catch (e) {
                // Continue to next size
              }

              // Try next size
              tryScanAtSize(sizeIndex + 1);
            };

            tryScanAtSize(0);
          };

          img.onerror = () => {
            if (shouldRevoke) {
              URL.revokeObjectURL(url);
            }
            resolve(null);
          };

          img.src = url;
        } catch (error) {
          console.error('Error in QR scanning:', error);
          if (shouldRevoke && url) {
            URL.revokeObjectURL(url);
          }
          resolve(null);
        }
      } catch (error) {
        console.error('Error creating BarcodeDetector:', error);
        resolve(null);
      }
    });
  };

  // Format date from DD/MM/YYYY or DDMMYYYY to YYYY-MM-DD for input type="date"
  const formatDateForInput = (dateStr) => {
    if (!dateStr) return '';

    // Remove all whitespace
    dateStr = dateStr.trim();

    // Try to parse DDMMYYYY format (8 digits, no separators) - from QR code
    // Example: 12022004 -> 2004-02-12
    if (/^\d{8}$/.test(dateStr)) {
      const day = dateStr.substring(0, 2);
      const month = dateStr.substring(2, 4);
      const year = dateStr.substring(4, 8);
      return `${year}-${month}-${day}`;
    }

    // Try to parse DD/MM/YYYY format
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }

    // Try to parse YYYY-MM-DD format (already correct)
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateStr;
    }

    return '';
  };

  // Map gender from Vietnamese to form values
  const mapGender = (gender) => {
    const lower = gender.toLowerCase();
    if (lower.includes('nam') || lower === '1' || lower === 'male') {
      return 'Nam';
    } else if (lower.includes('nữ') || lower.includes('nu') || lower === '0' || lower === 'female') {
      return 'Nữ';
    }
    return '';
  };

  // Function to parse QR code data and fill form
  const parseQRCodeData = (qrData) => {
    // Format: mã cccd|không quan trọng|họ và tên|ngày tháng năm sinh|giới tính|địa chỉ|không quan trọng
    const parts = qrData.split('|');

    if (parts.length >= 6) {
      const data = {
        identification: parts[0]?.trim() || '',
        name: parts[2]?.trim() || '',
        dob: formatDateForInput(parts[3]?.trim() || ''),
        gender: mapGender(parts[4]?.trim() || ''),
        address: parts[5]?.trim() || ''
      };

      return data;
    }

    return null;
  };

  // Function to upscale QR image for better detection
  const upscaleQRImage = async (blob, scale = 4) => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = img.naturalWidth * scale;
        canvas.height = img.naturalHeight * scale;

        // Use nearest neighbor for sharp upscaling
        ctx.imageSmoothingEnabled = false;
        ctx.imageSmoothingQuality = 'low';

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((upscaledBlob) => {
          URL.revokeObjectURL(url);
          resolve(upscaledBlob);
        }, 'image/png', 1.0);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };

      img.src = url;
    });
  };

  // Function to enhance QR image (grayscale + contrast)
  const enhanceQRImage = async (blob) => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const enhanced = enhanceImageForQR(imageData);
        ctx.putImageData(enhanced, 0, 0);

        canvas.toBlob((enhancedBlob) => {
          URL.revokeObjectURL(url);
          resolve(enhancedBlob);
        }, 'image/png', 1.0);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };

      img.src = url;
    });
  };

  // Function to crop image to QR area
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
        console.log('Crop QR: Image loaded, size:', img.naturalWidth, 'x', img.naturalHeight);
        console.log('Crop QR: QR area requested:', qrArea);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Use natural dimensions for accurate cropping
        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;

        // Ensure QR area is within image bounds
        const qrX = Math.max(0, Math.min(imgWidth, qrArea.x));
        const qrY = Math.max(0, Math.min(imgHeight, qrArea.y));
        const qrWidth = Math.min(qrArea.width, imgWidth - qrX);
        const qrHeight = Math.min(qrArea.height, imgHeight - qrY);

        console.log('Crop QR: Final crop coordinates:', {
          x: qrX,
          y: qrY,
          width: qrWidth,
          height: qrHeight,
          imageSize: { width: imgWidth, height: imgHeight }
        });

        // Crop at native resolution - no upscaling or processing
        canvas.width = qrWidth;
        canvas.height = qrHeight;

        // Use nearest neighbor for sharp image (better for QR codes)
        ctx.imageSmoothingEnabled = false;

        // Draw the QR area directly from the original image
        ctx.drawImage(
          img,
          qrX, qrY, qrWidth, qrHeight, // Source: crop area from original image
          0, 0, canvas.width, canvas.height // Destination: canvas at same size
        );

        console.log('Crop QR: Canvas created with size:', canvas.width, 'x', canvas.height);

        // Convert to blob with maximum quality
        canvas.toBlob((blob) => {
          if (shouldRevoke) {
            URL.revokeObjectURL(url);
          }
          if (blob) {
            console.log('Crop QR: Blob created, size:', blob.size, 'bytes');
            // Create a preview URL for debugging (optional)
            // const previewUrl = URL.createObjectURL(blob);
            // console.log('Crop QR preview URL:', previewUrl);
          }
          resolve(blob);
        }, 'image/png', 1.0); // Use maximum quality PNG for QR scanning
      };

      img.onerror = () => {
        if (shouldRevoke) {
          URL.revokeObjectURL(url);
        }
        resolve(null);
      };

      img.src = url;
    });
  };

  const handleImageEditConfirm = async (editedBlob, qrScanArea, editState = null) => {
    if (editingImage && editedBlob) {
      const editedUrl = URL.createObjectURL(editedBlob);

      // Revoke old preview URL
      if (previewUrlsRef.current[editingImage.type]) {
        URL.revokeObjectURL(previewUrlsRef.current[editingImage.type]);
      }

      // Get original file name or generate new one
      // Always use the original file name, not the edited one
      const originalFile = originalFilesRef.current[editingImage.type] || files[editingImage.type];
      const fileName = originalFile ? originalFile.name.replace(/\.[^/.]+$/, '.png') : `edited_${editingImage.type}.png`;

      // Create new file from blob (for display/preview)
      const editedFile = new File([editedBlob], fileName, {
        type: 'image/png',
        lastModified: Date.now()
      });

      // Update state first
      const fieldType = editingImage.type;

      // Update ref
      previewUrlsRef.current[fieldType] = editedUrl;

      // Save edit state for next edit session
      if (editState) {
        editStateRef.current[fieldType] = {
          zoom: editState.zoom || 100,
          rotate: editState.rotate || 0,
          position: editState.position || { x: 0, y: 0 },
          qrScanArea: editState.qrScanArea || null
        };
      }

      // Update files and previews state (for display)
      // But keep originalFilesRef unchanged so next edit uses original image
      setFiles(prev => ({
        ...prev,
        [fieldType]: editedFile
      }));

      setPreviews(prev => ({
        ...prev,
        [fieldType]: editedUrl
      }));

      // If it's CCCD front image and QR scan area is provided, crop and scan QR
      // Always scan QR for new or edited CCCD images to get fresh data
      if (fieldType === 'cccdFront' && qrScanArea) {
        // Clear form data first (before scanning) so user sees fields cleared immediately
        setFormData(prev => ({
          ...prev,
          identification: '',
          name: '',
          dob: '',
          gender: '',
          address: ''
        }));

        // Crop and show QR preview immediately, then scan in background
        (async () => {
          try {
            // Get original image to crop QR area (use the original source before editing)
            const originalImageSource = editingImage.originalFile || editingImage.src;

            // Crop image to QR area first
            const qrCroppedBlob = await cropImageToQRArea(originalImageSource, qrScanArea);

            if (qrCroppedBlob) {
              console.log('QR cropped blob size:', qrCroppedBlob.size, 'bytes');

              // Create preview URL and show immediately (don't wait for scanning)
              const qrPreviewUrl = URL.createObjectURL(qrCroppedBlob);
              setQrCroppedPreview(qrPreviewUrl);

              // Scan QR immediately
              const qrData = await scanQRCode(qrCroppedBlob);

              // Process result immediately
              if (qrData) {
                const parsedData = parseQRCodeData(qrData);
                if (parsedData) {
                  // Auto-fill form data immediately on success
                  setFormData(prev => ({
                    ...prev,
                    ...parsedData
                  }));

                  showSuccess('Đã quét và điền thông tin từ mã QR CCCD thành công!');
                } else {
                  // Clear form data on parse failure (already cleared above, but keep it cleared)
                  showError('Không thể phân tích dữ liệu QR code.');
                }
              } else {
                // Clear form data on scan failure (already cleared above, but keep it cleared)
                showError('Không quét được mã QR. Vui lòng điều chỉnh khung quét QR và thử lại.');
              }
            }
          } catch (error) {
            console.error('Error scanning QR code:', error);
            // Clear form data on error (already cleared above, but keep it cleared)
            if (error.message !== 'Timeout') {
              showError('Lỗi khi quét mã QR. Vui lòng thử lại.');
            }
          }
        })();
      } else if (fieldType === 'cccdFront') {
        // Fallback: try scanning full image if QR area not provided
        // Clear form data first
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
            const qrData = await scanQRCode(editedBlob);
            if (qrData) {
              const parsedData = parseQRCodeData(qrData);
              if (parsedData) {
                // Auto-fill form data immediately on success
                setFormData(prev => ({
                  ...prev,
                  ...parsedData
                }));
                showSuccess('Đã quét và điền thông tin từ mã QR CCCD thành công!');
              } else {
                // Keep form data cleared (already cleared above)
                showError('Ảnh CCCD mờ, không quét được mã QR. Vui lòng chọn ảnh rõ hơn.');
              }
            } else {
              // Keep form data cleared (already cleared above)
              showError('Ảnh CCCD mờ, không quét được mã QR. Vui lòng chọn ảnh rõ hơn.');
            }
          } catch (error) {
            console.error('Error scanning QR code:', error);
            // Keep form data cleared (already cleared above)
            showError('Ảnh CCCD mờ, không quét được mã QR. Vui lòng chọn ảnh rõ hơn.');
          }
        })();
      }

      // Close modal after state update
      setEditingImage(null);
    }
  };

  const handleImageEditCancel = () => {
    // Just close the modal, keep the image (don't remove file or preview)
    // User can edit again later if needed
    setEditingImage(null);
  };


  return (
    <>
      <NotificationComponent />
      <ImageEditorModal
        isOpen={!!editingImage}
        onClose={handleImageEditCancel}
        imageSrc={editingImage?.src}
        imageType={editingImage?.type === 'cccdFront' ? 'cccd' : '3x4'}
        onConfirm={(blob, qrScanArea, editState) => handleImageEditConfirm(blob, qrScanArea, editState)}
        title={editingImage?.type === 'cccdFront' ? 'Chỉnh sửa ảnh CCCD' : 'Chỉnh sửa ảnh 3x4'}
        initialZoom={editingImage?.editState?.zoom || 100}
        initialRotate={editingImage?.editState?.rotate || 0}
        initialPosition={editingImage?.editState?.position || { x: 0, y: 0 }}
        initialQrScanArea={editingImage?.editState?.qrScanArea || null}
      />
      <PageLayout
        title="Thông tin đăng ký KTX"
        subtitle="Vui lòng điền đầy đủ thông tin để hoàn tất đăng ký"
        showBack={true}
        backText="Quay lại chọn phòng"
        onBack={onBack}
      >
        {/* Selected Room Info */}
        {selectedRoom && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Phòng đã chọn</h3>
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center">
                <span className="text-blue-700 font-medium">Phòng:</span>
                <span className="ml-1 text-blue-600">{selectedRoom.roomNumber}</span>
              </div>
              <div className="flex items-center">
                <span className="text-blue-700 font-medium">Loại:</span>
                <span className="ml-1 text-blue-600">{selectedRoom.roomType_type}</span>
              </div>
              <div className="flex items-center">
                <span className="text-blue-700 font-medium">Giá:</span>
                <span className="ml-1 text-blue-600">
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND'
                  }).format(selectedRoom.monthlyFee)}/tháng
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-blue-700 font-medium">Vị trí:</span>
                <span className="ml-1 text-blue-600">
                  {selectedRoom.roomSlots.find(slot => slot.id === selectedRoomSlot.slotId)?.slotNumber}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-blue-700 font-medium">Thời hạn thuê:</span>
                <span className="ml-1 text-blue-600">
                  {selectedRoomSlot.duration} Tháng
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Uploads */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ảnh mặt trước CCCD <span className="text-red-500">*</span>
              </label>
              <FileUploadButton
                accept="image/*"
                onChange={handleFileChange('cccdFront')}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
              >
                {files.cccdFront ? files.cccdFront.name : 'Chọn ảnh CCCD'}
              </FileUploadButton>
              {errors.cccdFront && (
                <p className="mt-1 text-sm text-red-600">{errors.cccdFront}</p>
              )}
              {previews.cccdFront && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-green-600 font-medium">✓ Đã chọn: {files.cccdFront.name}</p>
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => {
                        // Always use original file when re-editing to preserve quality
                        const originalFile = originalFilesRef.current.cccdFront || files.cccdFront;
                        const originalUrl = originalFile ? URL.createObjectURL(originalFile) : previews.cccdFront;
                        const editState = editStateRef.current.cccdFront;
                        setEditingImage({
                          type: 'cccdFront',
                          src: originalUrl,
                          originalFile: originalFile,
                          editState: editState // Pass edit state to restore zoom, rotate, position
                        });
                      }}
                    >
                      Chỉnh sửa
                    </Button>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="relative border border-gray-300 rounded-lg overflow-hidden bg-gray-50 flex-1">
                      <img
                        src={previews.cccdFront}
                        alt="Preview CCCD"
                        className="w-full h-auto max-h-64 object-contain"
                      />
                    </div>
                    {qrCroppedPreview && (
                      <div className="relative border-2 border-green-500 rounded-lg overflow-hidden bg-gray-50" style={{ width: '150px', height: '150px', flexShrink: 0 }}>
                        <div className="absolute top-0 left-0 bg-green-500 text-white text-xs px-2 py-1 z-10 rounded-br-lg">
                          QR Crop Preview
                        </div>
                        <img
                          src={qrCroppedPreview}
                          alt="QR Cropped Preview"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ảnh 3x4 (Avatar) <span className="text-red-500">*</span>
              </label>
              <FileUploadButton
                accept="image/*"
                onChange={handleFileChange('avatar')}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              >
                {files.avatar ? files.avatar.name : 'Chọn ảnh 3x4'}
              </FileUploadButton>
              {errors.avatar && (
                <p className="mt-1 text-sm text-red-600">{errors.avatar}</p>
              )}
              {previews.avatar && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-green-600 font-medium">✓ Đã chọn: {files.avatar.name}</p>
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => {
                        // Always use original file when re-editing to preserve quality
                        const originalFile = originalFilesRef.current.avatar || files.avatar;
                        const originalUrl = originalFile ? URL.createObjectURL(originalFile) : previews.avatar;
                        const editState = editStateRef.current.avatar;
                        setEditingImage({
                          type: 'avatar',
                          src: originalUrl,
                          originalFile: originalFile,
                          editState: editState // Pass edit state to restore zoom, rotate, position
                        });
                      }}
                    >
                      Chỉnh sửa
                    </Button>
                  </div>
                  <div className="relative border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                    <img
                      src={previews.avatar}
                      alt="Preview Avatar"
                      className="w-full h-auto max-h-64 object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Quốc gia"
              name="nation"
              type="text"
              value={formData.nation}
              disabled={true}
              required
            />

            <Input
              label="CCCD"
              name="cccd"
              type="text"
              value={formData.identification}
              disabled={true}
              placeholder="Sẽ được điền tự động từ QR code"
              required
              error={errors.identification}
            />

            <Input
              label="Họ & Tên"
              name="name"
              type="text"
              value={formData.name}
              disabled={true}
              placeholder="Sẽ được điền tự động từ QR code"
              required
              error={errors.name}
            />

            <Input
              label="Ngày tháng năm sinh"
              name="dateOfBirth"
              type="date"
              value={formData.dob}
              disabled={true}
              placeholder="Sẽ được điền tự động từ QR code"
              required
              error={errors.dob}
            />

            <Input
              label="Giới tính"
              name="gender"
              type="text"
              value={formData.gender}
              disabled={true}
              placeholder="Sẽ được điền tự động từ QR code"
              required
              error={errors.gender}
            />

            <Input
              label="Địa chỉ"
              name="address"
              type="text"
              value={formData.address}
              disabled={true}
              placeholder="Sẽ được điền tự động từ QR code"
              required
              error={errors.address}
            />

            <Input
              label="MSSV"
              name="mssv"
              type="text"
              value={formData.mssv}
              onChange={handleChange}
              placeholder="Nhập mã số sinh viên"
              required
              error={errors.mssv}
            />

            <Input
              label="Tôn giáo"
              name="region"
              type="text"
              value={formData.region}
              onChange={handleChange}
              placeholder="Nhập tôn giáo"
              required
              error={errors.region}
            />

            <Input
              label="Gmail"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Nhập Gmail"
              required
              error={errors.email}
            />

            <Input
              label="SĐT"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Nhập số điện thoại"
              required
              error={errors.phone}
            />
            <Input
              label="Trường học"
              name="school"
              type="text"
              value={formData.school}
              required
              readOnly
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={onCancel}
            >
              Hủy
            </Button>

            <Button
              type="submit"
              variant="primary"
              loading={isLoading}
              loadingText="Đang xử lý..."
            >
              Hoàn tất đăng ký
            </Button>
          </div>
        </form>
      </PageLayout>
    </>
  );
};

export default RoomRegistrationPage;