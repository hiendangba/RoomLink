import * as faceapi from 'face-api.js';

const MODELS_PATH = '/face-api-models';

let modelsLoaded = false;

async function loadModels() {
  if (modelsLoaded) {
    return;
  }

  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_PATH),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_PATH),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_PATH)
  ]);

  modelsLoaded = true;
}

export async function detectFace(imageSource, threshold = 0.8) {
  try {
    await loadModels();

    let image;
    if (imageSource instanceof File || imageSource instanceof Blob) {
      image = await faceapi.bufferToImage(imageSource);
    } else if (typeof imageSource === 'string') {
      image = await faceapi.fetchImage(imageSource);
    } else {
      throw new Error('Invalid image source');
    }

    const detections = await faceapi
      .detectAllFaces(image, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();

    const faces = detections
      .filter(detection => detection.detection.score >= threshold)
      .map(detection => ({
        x1: detection.detection.box.x,
        y1: detection.detection.box.y,
        x2: detection.detection.box.x + detection.detection.box.width,
        y2: detection.detection.box.y + detection.detection.box.height,
        score: detection.detection.score
      }));

    return faces;
  } catch (error) {
    console.error('Error detecting face:', error);
    return [];
  }
}

export async function hasFace(imageSource) {
  try {
    const faces = await detectFace(imageSource, 0.8);
    return faces.length > 0;
  } catch (error) {
    console.error('Error checking face:', error);
    return false;
  }
}
