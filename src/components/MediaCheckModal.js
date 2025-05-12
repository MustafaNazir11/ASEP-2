import React, { useEffect, useRef, useState } from 'react';
import '../styles/Modal.css';

const MediaCheckModal = ({ onClose, onSuccess }) => {
  const videoRef = useRef(null);
  const [error, setError] = useState('');
  const [mediaStream, setMediaStream] = useState(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setMediaStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Camera or microphone access denied or not available.');
      });

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleProceed = () => {
    if (!error) {
      onSuccess();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content dark-theme">
        <h2>Media Check</h2>
        {error ? (
          <p className="error">{error}</p>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              muted
              className="video-preview"
            />
            <p>✅ Camera and microphone detected successfully.</p>
          </>
        )}
        <div className="modal-buttons">
          <button onClick={onClose}>Cancel</button>
          <button onClick={handleProceed} disabled={!!error}>
            Proceed to Exam
          </button>
        </div>
      </div>
    </div>
  );
};

export default MediaCheckModal;
