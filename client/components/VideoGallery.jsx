// src/components/VideoGallery.jsx

import React, { useContext, useEffect, useRef } from 'react';
import { AppContext } from '../App';
import { makeStyles } from '@fluentui/react-components';
import RemoteVideo from './RemoteVideo';

const useStyles = makeStyles({
  videoGallery: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    backgroundColor: '#000',
    padding: '10px',
    overflowY: 'auto',
    height: '100%',
  },
  videoContainer: {
    position: 'relative',
    width: '300px',
    height: '200px',
    backgroundColor: '#333',
    borderRadius: '8px',
    overflow: 'hidden',
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

const VideoGallery = () => {
  const classes = useStyles();
  const { localStream, remoteStreams, nickname, participants } = useContext(AppContext);
  const localVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream instanceof MediaStream) {
      localVideoRef.current.srcObject = localStream;
    } else {
      console.warn('本地流未准备好或不是 MediaStream 类型。');
    }
  }, [localStream]);

  return (
    <div className={classes.videoGallery}>
      {/* 本地视频 */}
      {localStream && (
        <div className={classes.videoContainer}>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className={classes.videoElement}
          ></video>
          <div className={classes.label}>{nickname} (本地)</div>
        </div>
      )}
      {/* 远程视频 */}
      {Object.entries(remoteStreams.current).map(([peer_id, stream]) => {
        const peerName = participants[peer_id] || '远程用户';
        return <RemoteVideo key={peer_id} stream={stream} peerName={peerName} />;
      })}
    </div>
  );
};

export default VideoGallery;
