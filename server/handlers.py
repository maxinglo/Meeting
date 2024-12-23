# server/handlers.py

from abc import ABC, abstractmethod

class BaseHandler(ABC):
    def __init__(self, server):
        self.server = server

    @abstractmethod
    async def handle(self, client_id, message):
        pass

class SetNicknameHandler(BaseHandler):
    async def handle(self, client_id, message):
        nickname = message.get('nickname')
        if nickname:
            old_nickname = self.server.clients[client_id].get('nickname', f'User{client_id}')
            self.server.clients[client_id]['nickname'] = nickname
            print(f"客户端 {client_id} 昵称从 {old_nickname} 变更为 {nickname}")
            await self.server.send_client_data(client_id, {
                'type': 'nickname_set',
                'nickname': nickname
            })
        else:
            await self.server.send_error_message(client_id, "昵称不能为空。")

class CreateMeetingHandler(BaseHandler):
    async def handle(self, client_id, message):
        meeting_id = message.get('meeting_id')
        if meeting_id:
            await self.server.meeting_manager.create_meeting(
                meeting_id, client_id, self.server.clients[client_id]['nickname']
            )
        else:
            await self.server.send_error_message(client_id, "会议ID不能为空。")

class JoinMeetingHandler(BaseHandler):
    async def handle(self, client_id, message):
        meeting_id = message.get('meeting_id')
        if meeting_id:
            await self.server.meeting_manager.add_participant(
                meeting_id, client_id, self.server.clients[client_id]['nickname']
            )
        else:
            await self.server.send_error_message(client_id, "会议ID不能为空。")

class LeaveMeetingHandler(BaseHandler):
    async def handle(self, client_id, message):
        meeting_id = message.get('meeting_id')
        if meeting_id:
            await self.server.meeting_manager.remove_participant(
                meeting_id, client_id
            )
        else:
            await self.server.send_error_message(client_id, "会议ID不能为空。")

class TextMessageHandler(BaseHandler):
    async def handle(self, client_id, message):
        meeting_id = message.get('meeting_id')
        content = message.get('content')
        if meeting_id and content:
            await self.server.meeting_manager.broadcast_text_message(
                meeting_id, client_id, content
            )
        else:
            await self.server.send_error_message(client_id, "会议ID和内容不能为空。")

class TerminateMeetingHandler(BaseHandler):
    async def handle(self, client_id, message):
        meeting_id = message.get('meeting_id')
        if meeting_id:
            await self.server.meeting_manager.terminate_meeting(client_id, meeting_id)
        else:
            await self.server.send_error_message(client_id, "会议ID不能为空。")


class WebRTCOfferHandler(BaseHandler):
    async def handle(self, client_id, message):
        print(f"收到 WebRTC offer 消息：{message}")
        target_id = message.get('target_id')
        offer = message.get('offer')
        if not target_id or not offer:
            await self.server.send_error_message(client_id, "缺少 target_id 或 offer。")
            return

        if target_id not in self.server.clients:
            await self.server.send_error_message(client_id, "目标客户端不存在。")
            return

        # 将 offer 转发给 target 客户端
        await self.server.send_client_data(target_id, {
            'type': 'webrtc_offer',
            'from_id': client_id,
            'offer': offer
        })

class WebRTCAnswerHandler(BaseHandler):
    async def handle(self, client_id, message):
        print(f"WebRTCAnswerHandler: {message}")
        target_id = message.get('target_id')
        answer = message.get('answer')
        if not target_id or not answer:
            await self.server.send_error_message(client_id, "缺少 target_id 或 answer。")
            return

        if target_id not in self.server.clients:
            await self.server.send_error_message(client_id, "目标客户端不存在。")
            return

        # 将 answer 转发给 target 客户端
        await self.server.send_client_data(target_id, {
            'type': 'webrtc_answer',
            'from_id': client_id,
            'answer': answer
        })

class ICECandidateHandler(BaseHandler):
    async def handle(self, client_id, message):
        print(f"处理 ICE candidate 消息：{message}")
        target_id = message.get('target_id')
        candidate = message.get('candidate')
        if not target_id or not candidate:
            await self.server.send_error_message(client_id, "缺少 target_id 或 candidate。")
            return

        if target_id not in self.server.clients:
            await self.server.send_error_message(client_id, "目标客户端不存在。")
            return

        # 将 ICE candidate 转发给 target 客户端
        await self.server.send_client_data(target_id, {
            'type': 'ice_candidate',
            'from_id': client_id,
            'candidate': candidate
        })