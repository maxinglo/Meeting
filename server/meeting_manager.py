# server/meeting_manager.py

import time

class MeetingManager:
    def __init__(self, server):
        self.server = server
        self.meetings = {}  # 键：meeting_id，值：{'creator_id': creator_id, 'participants': {client_id: nickname}}

    async def create_meeting(self, meeting_id, creator_id, nickname):
        """创建新的会议。"""
        if meeting_id in self.meetings:
            print(f"会议 {meeting_id} 已存在。")
            await self.server.send_error_message(creator_id, "会议已存在。")
            return
        self.meetings[meeting_id] = {
            'creator_id': creator_id,
            'participants': {creator_id: nickname}
        }
        print(f"会议 {meeting_id} 已创建，由客户端 {creator_id} ({nickname}) 创建。")
        await self.server.send_client_data(creator_id, {
            'type': 'meeting_created',
            'meeting_id': meeting_id
        })
        # 广播参与者更新
        await self.broadcast_participants(meeting_id)

    async def add_participant(self, meeting_id, client_id, nickname):
        """将客户端添加到会议中。"""
        if meeting_id not in self.meetings:
            print(f"会议 {meeting_id} 不存在。")
            await self.server.send_error_message(client_id, "会议不存在。")
            return
        if client_id in self.meetings[meeting_id]['participants']:
            print(f"客户端 {client_id} 已经在会议 {meeting_id} 中。")
            await self.server.send_error_message(client_id, "您已经在该会议中。")
            return
        self.meetings[meeting_id]['participants'][client_id] = nickname
        print(f"客户端 {client_id} ({nickname}) 已加入会议 {meeting_id}。")
        await self.server.send_client_data(client_id, {
            'type': 'joined_meeting',
            'meeting_id': meeting_id,
            'participants': self.meetings[meeting_id]['participants']
        })
        # 通知其他参与者
        await self.broadcast_participants(meeting_id)

    async def remove_participant(self, meeting_id, client_id):
        """将客户端从会议中移除。"""
        if meeting_id in self.meetings and client_id in self.meetings[meeting_id]['participants']:
            nickname = self.meetings[meeting_id]['participants'][client_id]
            del self.meetings[meeting_id]['participants'][client_id]
            print(f"客户端 {client_id} ({nickname}) 已退出会议 {meeting_id}。")
            if client_id in self.server.clients:
                await self.server.send_client_data(client_id, {
                    'type': 'left_meeting',
                    'meeting_id': meeting_id
                })
            # 通知其他参与者
            await self.broadcast_participants(meeting_id)
            # 如果会议没有参与者了，终止会议
            if not self.meetings[meeting_id]['participants']:
                await self.terminate_meeting_by_id(meeting_id)
        else:
            print(f"客户端 {client_id} 不在会议 {meeting_id} 中。")
            await self.server.send_error_message(client_id, "您不在该会议中。")

    async def terminate_meeting_by_id(self, meeting_id):
        """终止指定的会议（通过会议ID）。"""
        if meeting_id in self.meetings:
            participants = self.meetings[meeting_id]['participants']
            del self.meetings[meeting_id]
            print(f"会议 {meeting_id} 已终止。")
            # 通知所有参与者
            for client_id in participants:
                if client_id in self.server.clients:
                    await self.server.send_client_data(client_id, {
                        'type': 'meeting_terminated',
                        'meeting_id': meeting_id
                    })
        else:
            print(f"会议 {meeting_id} 不存在。")

    async def terminate_meeting(self, client_id, meeting_id):
        """终止指定的会议，仅允许会议创建者执行。"""
        meeting = self.meetings.get(meeting_id)
        if not meeting:
            await self.server.send_error_message(client_id, "会议不存在。")
            return
        if meeting['creator_id'] != client_id:
            await self.server.send_error_message(client_id, "只有会议创建者可以终止会议。")
            return
        await self.terminate_meeting_by_id(meeting_id)

    async def broadcast_text_message(self, meeting_id, sender_id, content):
        """将文本消息广播给会议中的所有参与者，包括发送者，带时间戳。"""
        participants = self.get_participants(meeting_id)
        if participants:
            timestamp = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
            sender_nickname = participants.get(sender_id, f'User{sender_id}')
            message = {
                'type': 'text_message',
                'sender_id': sender_id,
                'sender_nickname': sender_nickname,
                'content': content,
                'timestamp': timestamp
            }
            for client_id in participants:
                if client_id in self.server.clients:
                    await self.server.send_client_data(client_id, message)
        else:
            print(f"会议 {meeting_id} 不存在或没有参与者。")

    async def remove_client_from_all_meetings(self, client_id):
        """将客户端从所有会议中移除。"""
        for meeting_id in list(self.meetings.keys()):
            if client_id in self.meetings[meeting_id]['participants']:
                await self.remove_participant(meeting_id, client_id)

    async def broadcast_participants(self, meeting_id):
        """广播当前会议的参与者列表给所有参与者。"""
        participants = self.get_participants(meeting_id)
        if participants:
            creator_id = self.meetings[meeting_id]['creator_id']
            message = {
                'type': 'participants_update',
                'meeting_id': meeting_id,
                'participants': participants,
                'creator_id': creator_id
            }
            for client_id in participants:
                if client_id in self.server.clients:
                    await self.server.send_client_data(client_id, message)

    def get_participants(self, meeting_id):
        """获取会议的参与者列表。"""
        return self.meetings.get(meeting_id, {}).get('participants', None)
