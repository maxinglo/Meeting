import React, { useContext } from "react";
import {
  Button,
  makeStyles,
  Text,
  Avatar,
  Persona
} from "@fluentui/react-components";
import { Mic16Regular } from "@fluentui/react-icons";
import { AppContext } from "../App";

import { List, ListItem } from "@fluentui/react-list-preview";

const useStyles = makeStyles({
  participantsList: {
    width: "100%",
  },
  participantItem: {
    cursor: "pointer",
    padding: "2px 6px",
    justifyContent: "space-between",
  },
  itemSelected: {
    backgroundColor: '#eaeaea', // 使用颜色代码代替 tokens
  },
  nameAndRole: {
    display: "flex",
    flexDirection: "column",
  },
  name: {
    fontWeight: "semibold",
  },
  role: {
    fontSize: "0.9em",
    color: "#6b6a69",
  },
  buttonWrapper: {
    alignSelf: "center",
  },
  selectedInfo: {
    marginTop: "16px",
  },
});

const ParticipantsList = () => {
  const classes = useStyles();
  const { participants, creatorId, nickname } = useContext(AppContext);

  const handleMute = (name) => {
    alert(`静音 ${name}`);
    // 在这里实现实际的静音功能
  };

  const getRole = (client_id) => {
    if (!creatorId) return '参与者';  // 如果 creatorId 未定义，默认返回 '参与者'
    return client_id.toString() === creatorId.toString() ? '创建者' : '参与者';
  };

  // 将 participants 对象转换为数组
  const participantItems = Object.entries(participants).map(
    ([client_id, name]) => ({
      id: client_id,
      name: name,
      role: getRole(client_id), // 假设每个参与者对象包含 role 属性
    })
  );

  return (
    <div className={classes.participantsList}>
      <Text weight="semibold">与会人员</Text>
      <List navigationMode="items">
        {participantItems.map(({ id, name, role }) => (
          <ListItem
            key={id}
            className={classes.participantItem}
            data-value={id}
            aria-label={name}
          >
            <Persona
              presence={{ status: "available" }}
              name={name}
              avatar={{ color: "colorful" }}
              secondaryText={role}
            />
            <div role="gridcell" className={classes.buttonWrapper}>
              <Button
                aria-label={`Mute ${name}`}
                size="small"
                icon={<Mic16Regular />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleMute(name);
                }}
              />
            </div>
          </ListItem>
        ))}
      </List>
    </div>
  );
};

export default ParticipantsList;
