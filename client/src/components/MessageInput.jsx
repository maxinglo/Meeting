import React, { useState, useContext } from 'react';
import { Input, Button, makeStyles } from '@fluentui/react-components';
import { AppContext } from '../App';

const useStyles = makeStyles({
  messageInput: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  inputField: {
    flexGrow: 1,
  },
});

const MessageInput = () => {
  const styles = useStyles();
  const [message, setMessage] = useState('');
  const { meetingId, sendMessage } = useContext(AppContext);

  const sendMessageToServer = () => {
    if (message.trim()) {
      if (!meetingId) {
        alert('请先创建或加入会议');
        return;
      }
      sendMessage({
        type: 'text_message',
        meeting_id: meetingId,
        content: message.trim(),
      });
      setMessage('');
    }
  };

  return (
    <div className={styles.messageInput}>
      <Input
        placeholder="输入消息..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            sendMessageToServer();
          }
        }}
        className={styles.inputField}
      />
      <Button onClick={sendMessageToServer} appearance="primary">
        发送
      </Button>
    </div>
  );
};

export default MessageInput;
