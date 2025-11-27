import React, { useState, useRef, useEffect } from 'react';
import { hasPlate, detectPlate } from '../../services/plateDetectionService';
import { numberPlateApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import PageLayout from '../layout/PageLayout';
import Button from '../ui/Button';
import InfoBox from '../ui/InfoBox';

const PlateRecognition = ({ onSuccess, onCancel }) => {
  const { user, isLoading: authLoading } = useAuth();
  const { showSuccess, showError } = useNotification();
  const videoRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const streamRef = useRef(null);
  const isApiCallingRef = useRef(false);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPlateDetected, setHasPlateDetected] = useState(false);
  const [detectedPlates, setDetectedPlates] = useState([]);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Chuẩn bị quét biển số xe...');

  useEffect(() => {
    startCamera();

    return () => {
      // Cleanup when component unmounts
      stopCamera();
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      setError('');
      setStatus('Đang khởi động camera...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment' // Use back camera for vehicles
        }
      });

      if (videoRef.current) {
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        setStatus('Camera đã sẵn sàng. Đang quét biển số xe...');
        
        videoRef.current.onloadedmetadata = () => {
          startContinuousScan();
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Hiện tại không thể mở camera. Vui lòng kiểm tra quyền truy cập camera.');
      setStatus('Lỗi camera');
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach(track => {
        if (track.readyState === "live") {
          track.stop();
        }
      });
      streamRef.current = null;
    }
  
    if (videoRef.current) {
      const v = videoRef.current;
      v.pause();
      v.srcObject = null;
      v.removeAttribute("src");
      setTimeout(() => v.load(), 0);
    }
  };

  const captureFrameAsBlob = () => {
    return new Promise((resolve) => {
      if (!videoRef.current) {
        resolve(null);
        return;
      }

      const video = videoRef.current;

      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        resolve(null);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');

      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  };


  const callRecognizePlateAPI = async (blob) => {
    if (isApiCallingRef.current) {
      return;
    }

    try {
      isApiCallingRef.current = true;
      setStatus('Đang nhận diện biển số...');
      console.log('Calling recognizeNumberPlate API');

      const formData = new FormData();
      formData.append('numberPlate', blob, 'plate.jpg');

      const response = await numberPlateApi.recognizeNumberPlate(formData);
      console.log('Recognize response:', response);
      
      const numberPlate = response.data?.data || response.data;

      showSuccess('Nhận diện biển số thành công!');
      setStatus('✓ Đã nhận diện biển số thành công');

      setTimeout(() => {
        if (onSuccess) {
          onSuccess({
            image: blob,
            numberPlate: numberPlate,
            plates: detectedPlates
          });
        }
      }, 1000);
    } catch (err) {
      console.error('Recognize plate error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Không thể nhận diện biển số';
      showError(errorMessage);
      setStatus('Nhận diện thất bại. Vui lòng thử lại.');
      isApiCallingRef.current = false;
    }
  };

  const startContinuousScan = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }

    setIsScanning(true);
    setStatus('Đang quét biển số xe...');

    scanIntervalRef.current = setInterval(async () => {
      try {
        if (isApiCallingRef.current) {
          return;
        }

        if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
          return;
        }

        const blob = await captureFrameAsBlob();
        
        if (!blob) {
          setHasPlateDetected(false);
          setDetectedPlates([]);
          setStatus('Chưa phát hiện biển số. Vui lòng đưa biển số vào khung hình.');
          return;
        }

        const plates = await detectPlate(blob, 0.3);
        const plateDetected = plates.length > 0;
        
        setHasPlateDetected(plateDetected);
        setDetectedPlates(plates);

        if (plateDetected) {
          setStatus('✓ Đã phát hiện biển số');
          await callRecognizePlateAPI(blob);
        } else {
          setStatus('Chưa phát hiện biển số. Vui lòng đưa biển số vào khung hình.');
        }
      } catch (err) {
        console.error('Error scanning plate:', err);
        setHasPlateDetected(false);
        setDetectedPlates([]);
        setStatus('Lỗi khi quét biển số. Vui lòng thử lại.');
        isApiCallingRef.current = false;
      }
    }, 500);
  };


  const handleCancel = () => {
    // Stop camera immediately before redirect
    stopCamera();
    
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <PageLayout
      title="Nhận diện biển số xe"
      subtitle="Đưa biển số xe vào khung hình để nhận diện"
      showClose={true}
      onClose={handleCancel}
    >
      {/* Camera Preview */}
      <div className="mb-6">
        <div className="relative bg-gray-200 rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-96 object-cover"
          />
          
          {/* Overlay trạng thái biển số */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {hasPlateDetected ? (
              <div className="bg-green-500 bg-opacity-20 rounded-lg p-4 border-2 border-green-500">
                <div className="flex items-center space-x-3">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-green-700 font-bold text-lg">
                    Đã phát hiện biển số
                  </span>
                </div>
              </div>
            ) : isScanning ? (
              <div className="bg-yellow-500 bg-opacity-20 rounded-lg p-4 border-2 border-yellow-500">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
                  <span className="text-yellow-700 font-medium">Đang quét...</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="mb-4">
        <p className="text-center text-sm text-gray-600">{status}</p>
      </div>

      {error && (
        <div className="mb-4">
          <InfoBox type="error" messages={[error]} />
        </div>
      )}


      <div className="space-y-3">
        <Button
          onClick={handleCancel}
          variant="outline"
          fullWidth
        >
          Hủy
        </Button>
      </div>

      <div className="mt-6">
        <InfoBox
          type="info"
          title="Hướng dẫn"
          messages={[
            'Đảm bảo ánh sáng đủ để camera nhìn rõ biển số',
            'Giữ biển số ở giữa khung hình',
            'Đảm bảo biển số không bị che khuất',
            'Giữ nguyên vị trí trong vài giây để hệ thống nhận diện'
          ]}
        />
      </div>
    </PageLayout>
  );
};

export default PlateRecognition;

