import { SupportedModels as faceDetection } from '@tensorflow-models/face-detection';


export const startProctoring = async (videoElement, onAlert) => {
  const detector = await faceDetection.createDetector(faceDetection.SupportedPackages.mediapipeFacemesh);
  
  const detectFaces = async () => {
    const faces = await detector.estimateFaces(videoElement);
    if (faces.length > 1) {
      onAlert('Multiple faces detected!');
    } else if (faces.length === 0) {
      onAlert('No face detected!');
    }
    requestAnimationFrame(detectFaces);
  };

  detectFaces();
};