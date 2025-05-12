import React, { useEffect, useRef, forwardRef } from 'react';

const CameraFeed = forwardRef((props, ref) => {
  const videoRef = useRef(null);

  useEffect(() => {
    async function getCameraStream() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
      }
    }
    getCameraStream();
  }, []);

  return (
    <div>
      <video ref={(node) => {
        videoRef.current = node;
        if (ref) ref.current = node;
      }} autoPlay style={{ width: '100%', maxWidth: '400px' }} />
    </div>
  );
});

export default CameraFeed;