import React, { useState } from 'react';
import { Text } from '@fluentui/react-components';
import { makeStyles } from '@fluentui/react-components';

const useStyles = makeStyles({
  messageContainer: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '10px',
    alignItems: 'flex-start',
  },
  nickname: {
    fontWeight: 'semibold',
    marginBottom: '2px',
  },
  timestamp: {
    fontSize: '0.8em',
    color: '#6b6a69',
    marginRight: '5px',
    marginLeft: '5px',
    opacity: 0.7,
  },
  messageBubble: {
    padding: '10px',
    borderRadius: '10px',
    maxWidth: '60%',
    wordWrap: 'break-word',
    position: 'relative',
    transition: 'background-color 0.3s',
  },
  ownMessage: {
    backgroundColor: '#0078d4',
    color: '#fff',
    alignSelf: 'flex-end',
  },
  otherMessage: {
    backgroundColor: '#e5e5e5',
    color: '#000',
    alignSelf: 'flex-start',
  },
  NicknameAndTimestamp: {
    display: 'flex',
    flexDirection: 'row',
  }
});

const MessageBubble = ({ message, isOwnMessage, showNicknameAndTimestamp }) => {
  const styles = useStyles();
  const [showHoverTimestamp, setShowHoverTimestamp] = useState(false);
  let hoverTimer = null;

  const handleMouseEnter = () => {
    if (showNicknameAndTimestamp) {
      hoverTimer = setTimeout(() => {
        setShowHoverTimestamp(true);
      }, 10); // 0.01秒延迟，可根据需要调整
    }
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimer);
    setShowHoverTimestamp(false);
  };

  return (
    <div
      className={styles.messageContainer}
      style={{ alignItems: isOwnMessage ? 'flex-end' : 'flex-start' }}
    >
      {!isOwnMessage && showNicknameAndTimestamp && (
        <div className={styles.NicknameAndTimestamp}>
          <Text weight="semibold" className={styles.nickname}>
            {message.sender_nickname}
          </Text>
          {showHoverTimestamp && (
            <Text className={styles.timestamp}>{message.timestamp}</Text>
          )}
        </div>
      )}
      {isOwnMessage && showNicknameAndTimestamp && (
        <div className={styles.NicknameAndTimestamp}>
          {showHoverTimestamp && (
            <Text className={styles.timestamp}>{message.timestamp}</Text>
          )}
          <Text weight="semibold" className={styles.nickname}>
            {message.sender_nickname}
          </Text>
        </div>
      )}
      <div
        className={`${styles.messageBubble} ${
          isOwnMessage ? styles.ownMessage : styles.otherMessage
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Text>{message.content}</Text>
      </div>
    </div>
  );
};

export default MessageBubble;
