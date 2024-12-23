import React, { useContext } from 'react';
import { makeStyles } from '@fluentui/react-components';
import MessageInput from './MessageInput';
import MessageBubble from './MessageBubble';
import { AppContext } from '../App';

const useStyles = makeStyles({
  chatWindow: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    borderLeft: '1px solid #ddd',
  },
  chatBox: {
    flexGrow: 1,
    padding: '10px',
    overflowY: 'auto',
    backgroundColor: '#f3f2f1',
    maxHeight: 'calc(100vh - 130px)',
  },
  messageInputContainer: {
    padding: '10px',
    borderTop: '1px solid #ddd',
  },
});

const ChatWindow = () => {
  const styles = useStyles();
  const { messages, nickname } = useContext(AppContext);

  return (
    <div className={styles.chatWindow}>
      <div className={styles.chatBox}>
        {messages.map((msg, index) => {
          let showNicknameAndTimestamp = true;
          if (index > 0) {
            const prevMsg = messages[index - 1];
            const sameSender = msg.sender_nickname === prevMsg.sender_nickname;
            const timeDiff = new Date(msg.timestamp) - new Date(prevMsg.timestamp);
            const withinOneMinute = timeDiff <= 60000; // 60,000 ms = 1 minute
            if (sameSender && withinOneMinute) {
              showNicknameAndTimestamp = false;
            }
          }

          return (
            <MessageBubble
              key={index}
              message={msg}
              isOwnMessage={msg.sender_nickname === nickname}
              showNicknameAndTimestamp={showNicknameAndTimestamp}
            />
          );
        })}
      </div>
      <div className={styles.messageInputContainer}>
        <MessageInput />
      </div>
    </div>
  );
};

export default ChatWindow;
