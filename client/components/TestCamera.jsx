// src/components/TestCamera.jsx

import React, { useEffect, useRef } from 'react';

const TestCamera = () => {
  const videoRef = useRef(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('获取媒体流时出错:', error);
        alert(`获取媒体流失败：${error.message}`);
      }
    };

    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div>
      <h2>摄像头测试</h2>
      <video ref={videoRef} autoPlay muted playsInline style={{ width: '500px', height: '400px' }}></video>
    </div>
  );
};

export default TestCamera;
