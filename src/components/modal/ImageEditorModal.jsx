import React, { useState, useRef, useEffect } from 'react';
import BaseModal, { ModalBody, ModalFooter } from './BaseModal';
import Button from '../ui/Button';
import InfoBox from '../ui/InfoBox';

const ImageEditorModal = ({
  isOpen,
  onClose,
  imageSrc,
  imageType = '3x4', // '3x4' or 'cccd'
  onConfirm,
  title = 'Chỉnh sửa ảnh',
  initialZoom = 100,
  initialRotate = 0,
  initialPosition = { x: 0, y: 0 },
  initialQrScanArea = null
}) => {
  const [zoom, setZoom] = useState(initialZoom);
  const [baseScale, setBaseScale] = useState(1); // Scale to fit frame, zoom 100% = this scale
  const [rotate, setRotate] = useState(initialRotate);
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // QR scanning area (only for CCCD)
  const [qrScanArea, setQrScanArea] = useState(initialQrScanArea || { x: 0, y: 0, width: 60, height: 60 });
  const [isDraggingQR, setIsDraggingQR] = useState(false);
  const [qrDragStart, setQrDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const qrAreaRef = useRef(null);
  const isRestoringPositionRef = useRef(false); // Track if we're restoring position from saved state

  // Frame dimensions based on type
  const frameDimensions = {
    '3x4': { width: 150, height: 200 }, // 3x4 cm ratio (approx 3:4)
    'cccd': { width: 400, height: 250 }, // CCCD ratio (approx 8:5)
    'numberPlate': { width: 300, height: 120 } // Biển số xe ratio (approx 5:2)
  };

  const frame = frameDimensions[imageType] || frameDimensions['3x4'];

  useEffect(() => {
    if (isOpen) {
      // Check if we're restoring a saved position (not default values)
      const isRestoring = !(initialPosition.x === 0 && initialPosition.y === 0 && initialZoom === 100 && initialRotate === 0);
      isRestoringPositionRef.current = isRestoring;

      // Restore values from props when modal opens (or use defaults for new image)
      setZoom(initialZoom);
      setRotate(initialRotate);
      setPosition(initialPosition);

      // Initialize QR scan area position (top-right corner for CCCD)
      // Will be set after container and image are rendered
      if (imageType === 'cccd') {
        const initQRPosition = () => {
          const container = containerRef.current;
          const img = imageRef.current;
          if (container && img && img.complete) {
            // If initialQrScanArea is provided, use it; otherwise set default
            if (initialQrScanArea) {
              setQrScanArea(initialQrScanArea);
            } else {
              const containerWidth = container.offsetWidth;
              // Position QR area at top-right, but consider frame position
              // Frame is centered, so we position QR relative to frame's top-right
              const frameCenterX = containerWidth / 2;
              const frameRight = frameCenterX + frame.width / 2;
              // Position QR area at frame's top-right corner area
              setQrScanArea({
                x: frameRight - 60 - 15 - 2, // Align with frame's right edge, then move left 0.25 times (15px) + a bit left (3px)
                y: 10 + 60 - 10,   // Small offset from top, then move down 1 time (60px), then move up a bit (10px)
                width: 60,
                height: 60
              });
            }
          } else {
            // If image not loaded yet, try again
            setTimeout(initQRPosition, 100);
          }
        };
        setTimeout(initQRPosition, 100);
      }
    }
  }, [isOpen, imageType, initialZoom, initialRotate, initialPosition, initialQrScanArea]);

  const handleZoomChange = (e) => {
    const newZoom = parseInt(e.target.value);
    setZoom(newZoom);
  };

  const handleRotateChange = (e) => {
    const newRotate = parseInt(e.target.value);
    setRotate(newRotate);
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only left mouse button
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    // Limit movement within container bounds
    const maxX = rect.width / 2;
    const maxY = rect.height / 2;

    setPosition({
      x: Math.max(-maxX, Math.min(maxX, newX)),
      y: Math.max(-maxY, Math.min(maxY, newY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  // QR area drag handlers
  const handleQRMouseDown = (e) => {
    if (e.button !== 0) return;
    e.stopPropagation(); // Prevent image dragging
    setIsDraggingQR(true);
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setQrDragStart({
      x: e.clientX - qrScanArea.x - rect.left,
      y: e.clientY - qrScanArea.y - rect.top
    });
  };

  const handleQRMouseMove = (e) => {
    if (!isDraggingQR) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const newX = e.clientX - qrDragStart.x - rect.left;
    const newY = e.clientY - qrDragStart.y - rect.top;

    // Limit QR area within container bounds
    const maxX = rect.width - qrScanArea.width;
    const maxY = rect.height - qrScanArea.height;

    setQrScanArea(prev => ({
      ...prev,
      x: Math.max(0, Math.min(maxX, newX)),
      y: Math.max(0, Math.min(maxY, newY))
    }));
  };

  const handleQRMouseUp = () => {
    setIsDraggingQR(false);
  };

  useEffect(() => {
    if (isDraggingQR) {
      document.addEventListener('mousemove', handleQRMouseMove);
      document.addEventListener('mouseup', handleQRMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleQRMouseMove);
        document.removeEventListener('mouseup', handleQRMouseUp);
      };
    }
  }, [isDraggingQR, qrDragStart]);

  // Function to get QR scan area in original image coordinates
  const getQRScanAreaInImage = () => {
    if (!imageRef.current || !containerRef.current || imageType !== 'cccd') {
      return null;
    }

    const img = imageRef.current;
    const container = containerRef.current;

    // Get container dimensions
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;
    const containerCenterX = containerWidth / 2;
    const containerCenterY = containerHeight / 2;

    // Get image natural dimensions
    const imgNaturalWidth = img.naturalWidth;
    const imgNaturalHeight = img.naturalHeight;

    // Calculate scale applied to image
    const scale = baseScale * (zoom / 100);
    const scaledWidth = imgNaturalWidth * scale;
    const scaledHeight = imgNaturalHeight * scale;

    // QR area center in container coordinates
    const qrAreaCenterX = qrScanArea.x + qrScanArea.width / 2;
    const qrAreaCenterY = qrScanArea.y + qrScanArea.height / 2;

    // Convert QR area center from container coordinates to image coordinates
    // Step 1: Get offset from container center
    let offsetX = qrAreaCenterX - containerCenterX;
    let offsetY = qrAreaCenterY - containerCenterY;

    // Step 2: Account for image position offset (if user dragged the image)
    // When image moves right (position.x positive), offset should decrease
    offsetX = offsetX - position.x;
    offsetY = offsetY - position.y;

    // Step 3: Apply inverse rotation to get coordinates in image space before rotation
    const rad = (rotate * Math.PI) / 180;
    const cos = Math.cos(-rad); // Inverse rotation
    const sin = Math.sin(-rad);
    const rotatedX = offsetX * cos - offsetY * sin;
    const rotatedY = offsetX * sin + offsetY * cos;

    // Step 4: Convert to natural image coordinates
    // The offset is in container pixels, need to convert to image pixels
    // Image is scaled, so we need to account for the scale
    const scaleRatioX = imgNaturalWidth / scaledWidth;
    const scaleRatioY = imgNaturalHeight / scaledHeight;

    // Image center in natural coordinates
    const imgCenterX = imgNaturalWidth / 2;
    const imgCenterY = imgNaturalHeight / 2;

    // QR area center in natural coordinates
    const qrX = imgCenterX + (rotatedX * scaleRatioX);
    const qrY = imgCenterY + (rotatedY * scaleRatioY);

    // QR area size in natural coordinates
    const qrWidth = qrScanArea.width * scaleRatioX;
    const qrHeight = qrScanArea.height * scaleRatioY;

    // Calculate top-left corner
    const qrTopLeftX = qrX - qrWidth / 2;
    const qrTopLeftY = qrY - qrHeight / 2;

    return {
      x: Math.max(0, Math.min(imgNaturalWidth, qrTopLeftX)),
      y: Math.max(0, Math.min(imgNaturalHeight, qrTopLeftY)),
      width: Math.min(qrWidth, imgNaturalWidth - Math.max(0, qrTopLeftX)),
      height: Math.min(qrHeight, imgNaturalHeight - Math.max(0, qrTopLeftY))
    };
  };

  const handleRotateLeft = () => {
    setRotate(prev => prev - 90);
  };

  const handleRotateRight = () => {
    setRotate(prev => prev + 90);
  };

  const handleReset = () => {
    setZoom(100);
    setRotate(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleConfirm = async () => {
    // Capture the edited image exactly as displayed in the frame
    if (imageRef.current && containerRef.current) {
      const img = imageRef.current;

      // Wait for image to load if not already loaded
      if (!img.complete) {
        await new Promise((resolve) => {
          img.onload = resolve;
        });
      }

      const container = containerRef.current;
      const displayScale = baseScale * (zoom / 100);
      const rad = (rotate * Math.PI) / 180;

      // Strategy: Capture at frame pixel size first, then upscale to natural resolution
      // This ensures the captured image matches exactly what's displayed

      // Create canvas at frame size (display resolution)
      const frameCanvas = document.createElement('canvas');
      const frameCtx = frameCanvas.getContext('2d', { willReadFrequently: false });
      frameCanvas.width = frame.width;
      frameCanvas.height = frame.height;

      // Calculate where frame is in container
      const containerRect = container.getBoundingClientRect();
      const frameLeft = (containerRect.width - frame.width) / 2;
      const frameTop = (containerRect.height - frame.height) / 2;

      // Calculate image position and size in display pixels
      // Image center is at container center + position offset
      const containerCenterX = containerRect.width / 2;
      const containerCenterY = containerRect.height / 2;
      const imgDisplayWidth = img.naturalWidth * displayScale;
      const imgDisplayHeight = img.naturalHeight * displayScale;
      const imgDisplayLeft = containerCenterX - imgDisplayWidth / 2 + position.x;
      const imgDisplayTop = containerCenterY - imgDisplayHeight / 2 + position.y;

      // Clear frame canvas
      frameCtx.clearRect(0, 0, frameCanvas.width, frameCanvas.height);

      // Draw the visible portion of the image into the frame
      frameCtx.save();

      // Translate to frame center
      frameCtx.translate(frame.width / 2, frame.height / 2);

      // Apply position offset relative to frame center
      const offsetX = (imgDisplayLeft + imgDisplayWidth / 2) - (frameLeft + frame.width / 2);
      const offsetY = (imgDisplayTop + imgDisplayHeight / 2) - (frameTop + frame.height / 2);
      frameCtx.translate(offsetX, offsetY);

      // Rotate
      frameCtx.rotate(rad);

      // Draw image at display size
      frameCtx.drawImage(
        img,
        -imgDisplayWidth / 2,
        -imgDisplayHeight / 2,
        imgDisplayWidth,
        imgDisplayHeight
      );

      frameCtx.restore();

      // Now upscale to natural resolution for quality
      // Calculate upscale factor: natural frame size / display frame size
      const frameNatWidth = frame.width / baseScale;
      const frameNatHeight = frame.height / baseScale;
      const upscaleX = frameNatWidth / frame.width;
      const upscaleY = frameNatHeight / frame.height;
      const upscale = Math.max(upscaleX, upscaleY); // Use max to preserve aspect

      // Create final canvas at natural resolution
      const finalCanvas = document.createElement('canvas');
      const finalCtx = finalCanvas.getContext('2d', { willReadFrequently: false });
      finalCanvas.width = Math.round(frame.width * upscale);
      finalCanvas.height = Math.round(frame.height * upscale);

      // Use nearest neighbor for sharp upscaling (preserves QR code quality)
      finalCtx.imageSmoothingEnabled = false;
      finalCtx.drawImage(frameCanvas, 0, 0, finalCanvas.width, finalCanvas.height);

      // Convert to blob with maximum quality
      finalCanvas.toBlob((blob) => {
        if (onConfirm && blob) {
          // console.log('Captured image:', {
          //   originalNaturalSize: { width: img.naturalWidth, height: img.naturalHeight },
          //   capturedSize: { width: finalCanvas.width, height: finalCanvas.height },
          //   framePixelSize: { width: frame.width, height: frame.height },
          //   displayScale,
          //   zoom,
          //   baseScale,
          //   position,
          //   rotate,
          //   upscale
          // });

          // If it's CCCD, get QR scan area info and pass it
          let qrArea = null;
          if (imageType === 'cccd') {
            qrArea = getQRScanAreaInImage();
            // console.log('QR scan area in image coordinates:', qrArea);
          }

          // Pass edit state back to parent so it can be restored on next edit
          onConfirm(blob, qrArea, {
            zoom,
            rotate,
            position,
            qrScanArea: imageType === 'cccd' ? qrScanArea : null
          });
        } else {
          onClose();
        }
      }, 'image/png', 1.0); // Maximum quality PNG
    } else {
      onClose();
    }
  };

  // Don't return null, show modal but with error message if no image
  // console.log('ImageEditorModal render:', { isOpen, imageSrc, imageType });

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="medium"
      closeOnOverlayClick={true}
    >
      <ModalBody>
        <div className="space-y-4">
          {/* Instructions */}
          <InfoBox
            type="info"
            messages={[
              <span key="instruction">
                <strong>Hướng dẫn:</strong> Sử dụng slider để zoom.
                Kéo ảnh để di chuyển. Sử dụng slider hoặc nút để xoay ảnh.
              </span>
            ]}
            className="text-xs"
          />

          {!imageSrc ? (
            <div className="text-center py-12 text-red-600">
              <p>Không thể tải ảnh. Vui lòng thử lại.</p>
            </div>
          ) : (
            <>
              {/* Image Editor Container */}
              <div
                ref={containerRef}
                className="relative w-full bg-gray-100 border-2 border-gray-300 rounded-lg overflow-hidden"
                style={{
                  height: '350px',
                  cursor: isDragging ? 'grabbing' : 'grab'
                }}
              >
                {/* Frame Overlay */}
                <div
                  className="absolute border-2 border-blue-500 bg-blue-200 bg-opacity-20 pointer-events-none z-10"
                  style={{
                    width: `${frame.width}px`,
                    height: `${frame.height}px`,
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
                  }}
                >
                  {/* Frame Label */}
                  <div className="absolute -top-8 left-0 text-sm font-medium text-blue-600">
                    Khung {imageType === '3x4' ? '3x4' : imageType === 'cccd' ? 'CCCD' : 'Biển số xe'}
                  </div>
                </div>

                {/* QR Scan Area (only for CCCD) */}
                {imageType === 'cccd' && imageSrc && (
                  <div
                    ref={qrAreaRef}
                    className="absolute border-2 border-green-500 bg-green-300 bg-opacity-30 z-20 cursor-move"
                    style={{
                      left: `${qrScanArea.x}px`,
                      top: `${qrScanArea.y}px`,
                      width: `${qrScanArea.width}px`,
                      height: `${qrScanArea.height}px`,
                      boxShadow: '0 0 10px rgba(34, 197, 94, 0.5)'
                    }}
                    onMouseDown={handleQRMouseDown}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-green-700 font-bold text-sm">QR</div>
                    </div>
                  </div>
                )}

                {/* Image */}
                {imageSrc && (
                  <img
                    ref={imageRef}
                    src={imageSrc}
                    alt="Preview"
                    className="absolute select-none"
                    style={{
                      transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) rotate(${rotate}deg) scale(${baseScale * (zoom / 100)})`,
                      transformOrigin: 'center center',
                      left: '50%',
                      top: '50%',
                      maxWidth: 'none',
                      minWidth: '100px',
                      minHeight: '100px',
                      userSelect: 'none',
                      pointerEvents: isDragging ? 'none' : 'auto',
                      display: 'block',
                      zIndex: 5
                    }}
                    onMouseDown={handleMouseDown}
                    onLoad={(e) => {
                      // Center image on load and calculate base scale to fit frame
                      const img = e.target;
                      console.log('Image loaded:', img.naturalWidth, img.naturalHeight, imageSrc);

                      if (containerRef.current && frame) {
                        // Calculate base scale so that image fits completely inside the frame
                        const frameWidth = frame.width;
                        const frameHeight = frame.height;
                        const imgWidth = img.naturalWidth;
                        const imgHeight = img.naturalHeight;

                        // Calculate scale to fit both width and height
                        // Use the smaller scale to ensure image fits completely
                        const scaleX = frameWidth / imgWidth;
                        const scaleY = frameHeight / imgHeight;
                        const fitScale = Math.min(scaleX, scaleY);

                        // Set base scale (zoom 100% will use this scale)
                        setBaseScale(fitScale);

                        // Initialize QR position when image loads (only for CCCD)
                        if (imageType === 'cccd') {
                          const containerWidth = containerRef.current.offsetWidth;
                          const frameCenterX = containerWidth / 2;
                          const frameRight = frameCenterX + frame.width / 2;
                          setQrScanArea(prev => prev.x === 0 && prev.y === 0 ? {
                            x: frameRight - 60 - 15 - 2, // Move left 0.25 times (15px) + a bit left (3px)
                            y: 10 + 60 - 10, // Move down 1 time (60px), then move up a bit (10px)
                            width: 60,
                            height: 60
                          } : prev);
                        }

                        console.log('Calculated base scale to fit frame:', fitScale,
                          'for frame', frameWidth, 'x', frameHeight,
                          'and image', imgWidth, 'x', imgHeight);

                        // Only reset position if this is a new image (not restoring from saved state)
                        // Otherwise, keep the restored position from initialPosition prop
                        if (!isRestoringPositionRef.current) {
                          setPosition({ x: 0, y: 0 });
                        }
                        // If position was restored from props, it's already set, don't reset it
                      } else {
                        // Fallback: set default base scale
                        setBaseScale(1);
                        setPosition({ x: 0, y: 0 });
                      }
                    }}
                    onError={(e) => {
                      console.error('Error loading image:', imageSrc, e);
                    }}
                    draggable={false}
                  />
                )}
              </div>

              {/* Controls */}
              <div className="space-y-3">
                {/* Zoom Control */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Zoom: {zoom}%
                    </label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="small"
                        onClick={() => setZoom(prev => Math.max(50, prev - 10))}
                      >
                        -
                      </Button>
                      <Button
                        variant="outline"
                        size="small"
                        onClick={() => setZoom(prev => Math.min(300, prev + 10))}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="300"
                    value={zoom}
                    onChange={handleZoomChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Rotate Control */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Xoay: {rotate}°
                    </label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="small"
                        onClick={handleRotateLeft}
                        icon={
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        }
                      >
                        Trái 90°
                      </Button>
                      <Button
                        variant="outline"
                        size="small"
                        onClick={handleRotateRight}
                        icon={
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        }
                      >
                        Phải 90°
                      </Button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={rotate}
                    onChange={handleRotateChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </ModalBody>

      <ModalFooter>
        <Button variant="outline" onClick={handleReset}>
          Đặt lại
        </Button>
        <Button variant="outline" onClick={onClose}>
          Hủy
        </Button>
        <Button variant="primary" onClick={handleConfirm}>
          Xác nhận
        </Button>
      </ModalFooter>
    </BaseModal>
  );
};

export default ImageEditorModal;

