// src/components/MeetingControls.jsx

import React, { useState, useContext } from 'react';
import {
  Button,
  Input,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  makeStyles,
} from '@fluentui/react-components';
import { AppContext } from '../App';
import ConfirmDialog from './ConfirmDialog'; // 导入通用确认对话框

const useStyles = makeStyles({
  controlsContainer: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
});

const MeetingControls = () => {
  const styles = useStyles();
  const { meetingId, setMeetingId, nickname, participants, creatorId, sendMessage, startLocalStream, stopLocalStream } = useContext(AppContext);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [meetingIdInput, setMeetingIdInput] = useState('');
  const [actionType, setActionType] = useState('');

  // 新增的终止会议确认对话框的控制状态
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const openDialog = (type) => {
    setActionType(type);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setMeetingIdInput('');
  };

  const handleAction = () => {
    if (meetingIdInput.trim()) {
      const meetingId = meetingIdInput.trim();
      sendMessage({
        type: actionType,
        meeting_id: meetingId,
      });
      setMeetingId(meetingId);
      closeDialog();
    }
  };

  const handleTerminateMeeting = () => {
    setIsConfirmDialogOpen(true); // 打开通用的确认对话框
  };

  const confirmTerminateMeeting = () => {
    sendMessage({
      type: 'terminate_meeting',
      meeting_id: meetingId,
    });
    setIsConfirmDialogOpen(false); // 关闭对话框
  };

  const cancelTerminateMeeting = () => {
    setIsConfirmDialogOpen(false); // 取消终止会议并关闭对话框
  };

  // 确定当前用户是否为会议创建者
  const isCreator = creatorId && participants && participants[creatorId] === nickname;

  // 添加摄像头和屏幕共享按钮
  const handleStartCamera = () => {
    startLocalStream('camera');
  };

  const handleStartScreenShare = () => {
    startLocalStream('screen');
  };

  const handleStopStream = () => {
    stopLocalStream();
  };

  return (
    <>
      <div className={styles.controlsContainer}>
        <Button onClick={() => openDialog('create_meeting')}>创建会议</Button>
        <Button onClick={() => openDialog('join_meeting')}>加入会议</Button>
        {meetingId && (
          <>
            {isCreator && (
              <Button appearance="outline" onClick={handleTerminateMeeting}>
                取消会议
              </Button>
            )}
            <span>当前会议ID：{meetingId}</span>
            <span>昵称：{nickname}</span>
          </>
        )}
      </div>

      {/* 添加音视频控制按钮 */}
      <div className={styles.controlsContainer} style={{ marginTop: '10px' }}>
        <Button onClick={handleStartCamera}>开启摄像头</Button>
        <Button onClick={handleStartScreenShare}>共享屏幕</Button>
        <Button onClick={handleStopStream} appearance="outline">停止共享</Button>
      </div>

      {/* 创建/加入会议的对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={(e, data) => setIsDialogOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>{actionType === 'create_meeting' ? '创建会议' : '加入会议'}</DialogTitle>
            <DialogContent>
              <Input
                placeholder="请输入会议ID"
                value={meetingIdInput}
                onChange={(e) => setMeetingIdInput(e.target.value)}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={closeDialog}>取消</Button>
              <Button appearance="primary" onClick={handleAction}>
                确定
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* 通用确认对话框，用于终止会议 */}
      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        title="终止会议"
        content={`是否确定要终止会议 ${meetingId}？`}
        onConfirm={confirmTerminateMeeting}
        onCancel={cancelTerminateMeeting}
      />
    </>
  );
};

export default MeetingControls;
