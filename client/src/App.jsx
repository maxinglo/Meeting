// src/App.jsx

import React, { useEffect, useState, createContext, useRef } from 'react';
import {
  FluentProvider,
  teamsLightTheme,
  Title3,
  makeStyles,
  Button,
  Input,
  DialogTitle, DialogBody, DialogContent, DialogSurface, Dialog, DialogActions
} from '@fluentui/react-components';
import {
  useId,
  Toaster,
  useToastController,
  Toast,
  ToastTitle,
  ToastBody,
  ToastFooter,
  Link
} from '@fluentui/react-components';
import MeetingControls from './components/MeetingControls';
import ChatWindow from './components/ChatWindow';
import ParticipantsList from './components/ParticipantsList';
import VideoGallery from './components/VideoGallery'; // 新增的组件，用于显示视频
import './assets/styles.css';
import TestCamera from "./components/TestCamera";

export const AppContext = createContext();

const useStyles = makeStyles({
  appContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
  },
  header: {
    flexShrink: 0,
    padding: '10px 20px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #ddd',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  content: {
    flexGrow: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  mainArea: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  sidebar: {
    width: '250px',
    borderLeft: '1px solid #ddd',
    padding: '10px',
    backgroundColor: '#f9f9f9',
    overflowY: 'auto',
  },
  videoArea: {
    flexGrow: 1,
    display: 'flex',
    flexWrap: 'wrap',
    padding: '10px',
    backgroundColor: '#000',
  },
});

const App = () => {
  const styles = useStyles();
  const [meetingId, setMeetingId] = useState('');
  const [nickname, setNickname] = useState('');
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState({});
  const [creatorId, setCreatorId] = useState(null);
  const [isNicknameDialogOpen, setIsNicknameDialogOpen] = useState(true);
  const [nicknameInput, setNicknameInput] = useState('');

  const [ws, setWs] = useState(null);
  const peerConnections = useRef({}); // peer_id: RTCPeerConnection
  const localStream = useRef(null); // 本地媒体流
  const remoteStreams = useRef({}); // peer_id: MediaStream
  const [clientId, setClientId] = useState(null); // 新增用于存储自己的 client_id

  // Toast 控制器
  const toasterId = useId('toaster');
  const { dispatchToast, dismissToast } = useToastController(toasterId);
  const toastId = useId("confirm-join-meeting");

  useEffect(() => {
    // 建立WebSocket连接
    const socket = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:12345/ws'); // 使用环境变量

    socket.onopen = () => {
      console.log('WebSocket连接已打开');
      setWs(socket);
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('收到服务器消息:', message);

      if (message.type === 'client_id') {
        setClientId(message.client_id);
        return;
      }

      if (message.type === 'text_message') {
        setMessages((prevMessages) => [...prevMessages, message]);
      } else if (message.type === 'meeting_created') {
        setMeetingId(message.meeting_id);
        // 使用 Toast 提示用户
        dispatchToast(
          <Toast>
            <ToastTitle>会议创建成功</ToastTitle>
            <ToastBody>是否立即参与会议 {message.meeting_id}?</ToastBody>
            <ToastFooter>
              <Link onClick={() => {
                // 发送加入会议请求
                sendMessage({
                  type: 'join_meeting',
                  meeting_id: message.meeting_id,
                });
                dismissToast(toastId);
              }}>入会议</Link>
              <Link onClick={() => {dismissToast(toastId);}}>稍后加入</Link>
            </ToastFooter>
          </Toast>,
          { toastId, intent: 'success' }
        );
      } else if (message.type === 'meeting_terminated') {
        dispatchToast(
          <Toast>
            <ToastTitle>会议已终止</ToastTitle>
            <ToastBody>会议 {message.meeting_id} 已被创建者终止。</ToastBody>
          </Toast>,
          { intent: 'error' }
        );
        setMeetingId('');
        setParticipants({});
        setCreatorId(null);
        // 关闭所有 peer connections
        closeAllPeerConnections();
      } else if (message.type === 'participants_update') {
        setParticipants(message.participants);
        setCreatorId(message.creator_id);  // 确保设置 creatorId
      } else if (message.type === 'nickname_set') {
        setNickname(message.nickname);
      } else if (message.type === 'error') {
        dispatchToast(
          <Toast>
            <ToastTitle>错误</ToastTitle>
            <ToastBody>{`错误：${message.message}`}</ToastBody>
          </Toast>,
          { intent: 'error' }
        );
      } else if (message.type === 'webrtc_offer') {
        handleWebRTCOffer(message);
      } else if (message.type === 'webrtc_answer') {
        handleWebRTCAnswer(message);
      } else if (message.type === 'ice_candidate') {
        handleICECandidate(message);
      } else {
        console.log(`收到未知类型的服务器消息：${event.data}`);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket连接已关闭');
      // 清理所有连接
      closeAllPeerConnections();
    };

    socket.onerror = (error) => {
      console.error('WebSocket错误:', error);
    };

    return () => {
      socket.close();
      closeAllPeerConnections();
    };
  }, []);

  const sendMessage = (message) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket未连接');
    }
  };

  const handleSetNickname = () => {
    if (nicknameInput.trim()) {
      sendMessage({
        type: 'set_nickname',
        nickname: nicknameInput.trim(),
      });
      setNicknameInput('');
      setIsNicknameDialogOpen(false);
    } else {
      // 显示警告 Toast
      dispatchToast(
        <Toast>
          <ToastTitle>警告</ToastTitle>
          <ToastBody>昵称不能为空。</ToastBody>
        </Toast>,
        { intent: 'warning' }
      );
    }
  };

  // WebRTC 处理函数

  const handleWebRTCOffer = async (message) => {
    const { from_id, offer } = message;
    console.log(`收到来自 ${from_id} 的 WebRTC Offer`);

    const peerConnection = createPeerConnection(from_id);

    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      sendMessage({
        type: 'webrtc_answer',
        target_id: from_id,
        answer: peerConnection.localDescription,
      });
    } catch (error) {
      console.error('处理 Offer 时出错:', error);
    }
  };

  const handleWebRTCAnswer = async (message) => {
    const { from_id, answer } = message;
    console.log(`收到来自 ${from_id} 的 WebRTC Answer`);

    const peerConnection = peerConnections.current[from_id];
    if (!peerConnection) {
      console.error('对应的 RTCPeerConnection 未找到。');
      return;
    }

    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('设置远程描述时出错:', error);
    }
  };

  const handleICECandidate = async (message) => {
    const { from_id, candidate } = message;
    console.log(`收到来自 ${from_id} 的 ICE Candidate`);

    const peerConnection = peerConnections.current[from_id];
    if (!peerConnection) {
      console.error('对应的 RTCPeerConnection 未找到。');
      return;
    }

    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('添加 ICE Candidate 时出错:', error);
    }
  };

  const createPeerConnection = (peer_id) => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        // 如果需要 TURN 服务器，可在此添加
      ],
    };

    const peerConnection = new RTCPeerConnection(configuration);

    // 处理 ICE Candidate
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sendMessage({
          type: 'ice_candidate',
          target_id: peer_id,
          candidate: event.candidate,
        });
      }
    };

    // 处理远程流
    peerConnection.ontrack = (event) => {
      console.log(`收到来自 ${peer_id} 的远程流`);
      if (!remoteStreams.current[peer_id]) {
        remoteStreams.current[peer_id] = new MediaStream();
      }
      remoteStreams.current[peer_id].addTrack(event.track);
      // 触发重新渲染
      setParticipants(prev => ({ ...prev }));
    };

    // 将本地流添加到连接中
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream.current);
      });
    }

    peerConnections.current[peer_id] = peerConnection;

    return peerConnection;
  };

  const closeAllPeerConnections = () => {
    for (const peer_id in peerConnections.current) {
      peerConnections.current[peer_id].close();
      delete peerConnections.current[peer_id];
    }
    remoteStreams.current = {};
  };

  // 初始化本地媒体流（摄像头）
  const startLocalStream = async (mediaType) => {
    try {
      // 停止现有流（如果有）
      stopLocalStream();

      let stream;
      if (mediaType === 'camera') {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } else if (mediaType === 'screen') {
        stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      }
      localStream.current = stream;

      // 更新所有现有 peer connections
      for (const peer_id in peerConnections.current) {
        stream.getTracks().forEach(track => {
          peerConnections.current[peer_id].addTrack(track, stream);
        });
      }

      // 触发重新渲染
      setParticipants(prev => ({ ...prev }));
    } catch (error) {
      console.error('获取媒体流时出错:', error);
      dispatchToast(
        <Toast>
          <ToastTitle>错误</ToastTitle>
          <ToastBody>{`获取媒体流失败：${error.message}`}</ToastBody>
        </Toast>,
        { intent: 'error' }
      );
    }
  };

  // 停止本地媒体流
  const stopLocalStream = () => {
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
      localStream.current = null;
      // 移除所有 peer connections 的 tracks
      for (const peer_id in peerConnections.current) {
        const senders = peerConnections.current[peer_id].getSenders();
        senders.forEach(sender => {
          if (sender.track) {
            peerConnections.current[peer_id].removeTrack(sender);
          }
        });
      }
      // 触发重新渲染
      setParticipants(prev => ({ ...prev }));
    }
  };

  // 在 useEffect 中监听 participants 的变化，建立与新参与者的连接
  useEffect(() => {
    if (!meetingId || !clientId) return; // 如果未加入会议或未获取 clientId，则不处理

    const existingPeerIds = Object.keys(peerConnections.current);
    const currentPeerIds = Object.keys(participants);

    // 找出新增的 peer_id
    const newPeerIds = currentPeerIds.filter(id => !existingPeerIds.includes(id.toString()) && id.toString() !== clientId.toString());

    newPeerIds.forEach(peer_id => {
      // 创建 RTCPeerConnection 并发起 WebRTC 协商
      const peerConnection = createPeerConnection(peer_id);

      // 创建 offer
      peerConnection.createOffer()
        .then(offer => peerConnection.setLocalDescription(offer))
        .then(() => {
          sendMessage({
            type: 'webrtc_offer',
            target_id: peer_id,
            offer: peerConnection.localDescription,
          });
        })
        .catch(error => {
          console.error('创建或设置本地描述时出错:', error);
        });
    });

    // 处理离开的参与者
    const departedPeerIds = existingPeerIds.filter(id => !currentPeerIds.includes(id.toString()));
    departedPeerIds.forEach(peer_id => {
      if (peerConnections.current[peer_id]) {
        peerConnections.current[peer_id].close();
        delete peerConnections.current[peer_id];
        delete remoteStreams.current[peer_id];
      }
    });

  }, [participants, meetingId, clientId]);

  // 确保本地视频流在UI中始终可见
  useEffect(() => {
    if (localStream.current) {
      const videoElement = document.getElementById('localVideo');
      if (videoElement) {
        videoElement.srcObject = localStream.current;
      }
    }
  }, [localStream.current]);

  return (
    <FluentProvider theme={teamsLightTheme}>
      <AppContext.Provider value={{
        meetingId, setMeetingId, nickname, setNickname,
        messages, setMessages, participants, setParticipants,
        creatorId, setCreatorId, sendMessage,
        peerConnections, localStream, remoteStreams,
        startLocalStream, stopLocalStream
      }}>
        <div className={styles.appContainer}>
          <header className={styles.header}>
            <Title3>视频会议客户端</Title3>
            <MeetingControls />
          </header>
          <div className={styles.content}>
            <aside className={styles.sidebar}>
              <ParticipantsList />
            </aside>
            <div className={styles.mainArea}>
              <ChatWindow/>
              <VideoGallery/>
            </div>
          </div>
        </div>

        {/* 昵称设置对话框 */}
        <Dialog open={isNicknameDialogOpen}>
          <DialogSurface>
            <DialogBody>
              <DialogTitle>设置昵称</DialogTitle>
              <DialogContent>
                <Input
                  placeholder="请输入您的昵称"
                  value={nicknameInput}
                  onChange={(e) => setNicknameInput(e.target.value)}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={handleSetNickname} appearance="primary">
                  确定
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>

        {/* Toast 容器 */}
        <Toaster toasterId={toasterId} />
      </AppContext.Provider>
    </FluentProvider>
  );
};

export default App;
