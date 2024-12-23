// src/components/RemoteVideo.jsx

import React, { useEffect, useRef } from 'react';
import { makeStyles } from '@fluentui/react-components';

const useStyles = makeStyles({
  videoContainer: {
    position: 'relative',
    width: '300px',
    height: '200px',
    backgroundColor: '#333',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  videoElement: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  label: {
    position: 'absolute',
    bottom: '5px',
    left: '5px',
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: '2px 5px',
    borderRadius: '3px',
    fontSize: '12px',
  },
});

const RemoteVideo = ({ stream, peerName }) => {
  const classes = useStyles();
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      if (stream instanceof MediaStream) {
        videoRef.current.srcObject = stream;
      } else {
        console.warn('提供给 RemoteVideo 的 stream 不是 MediaStream 类型。');
      }
    }
  }, [stream]);

  return (
    <div className={classes.videoContainer}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={classes.videoElement}
      ></video>
      <div className={classes.label}>{peerName || '远程用户'}</div>
    </div>
  );
};

export default RemoteVideo;
