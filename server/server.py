# server/server.py

import os
import asyncio
from aiohttp import web
import json
from aiohttp_cors import setup as cors_setup, ResourceOptions
from meeting_manager import MeetingManager
from handlers import BaseHandler, SetNicknameHandler, CreateMeetingHandler, JoinMeetingHandler, \
    LeaveMeetingHandler, TextMessageHandler, TerminateMeetingHandler, WebRTCOfferHandler, WebRTCAnswerHandler, \
    ICECandidateHandler


class Server:
    def __init__(self, host='0.0.0.0', port=12345):
        self.app = web.Application()
        self.host = host
        self.port = port
        self.meeting_manager = MeetingManager(self)
        self.clients = {}  # client_id: {'ws': ws, 'nickname': nickname, 'peer_connections': {peer_id: RTCPeerConnection}}

        # 设置路由
        self.app.router.add_get('/ws', self.websocket_handler)

        # 允许CORS
        cors = cors_setup(self.app, defaults={
            "*": ResourceOptions(
                allow_credentials=True,
                expose_headers="*",
                allow_headers="*",
            )
        })

        # 初始化消息处理器映射
        self.handlers = {
            'set_nickname': SetNicknameHandler(self),
            'create_meeting': CreateMeetingHandler(self),
            'join_meeting': JoinMeetingHandler(self),
            'leave_meeting': LeaveMeetingHandler(self),
            'text_message': TextMessageHandler(self),
            'terminate_meeting': TerminateMeetingHandler(self),
            'webrtc_offer': WebRTCOfferHandler(self),
            'webrtc_answer': WebRTCAnswerHandler(self),
            'ice_candidate': ICECandidateHandler(self),
            # 在此处添加新的消息类型及其处理器
        }

    async def websocket_handler(self, request):
        ws = web.WebSocketResponse()
        await ws.prepare(request)

        client_id = id(ws)
        self.clients[client_id] = {'ws': ws, 'nickname': f'User{client_id}', 'peer_connections': {}}
        print(f"新客户端连接：{client_id}")

        try:
            async for msg in ws:
                if msg.type == web.WSMsgType.TEXT:
                    await self.handle_client_message(client_id, msg.data)
                elif msg.type == web.WSMsgType.ERROR:
                    print(f'客户端 {client_id} 连接关闭，异常 {ws.exception()}')
        finally:
            await self.disconnect_client(client_id)
        return ws

    async def handle_client_message(self, client_id, data):
        """处理来自客户端的消息。"""
        try:
            print(f"收到来自客户端 {client_id} 的消息：{data}")
            message = json.loads(data)
            await self.route_message(client_id, message)
        except json.JSONDecodeError:
            print("收到无法解析的数据")
            await self.send_error_message(client_id, "无法解析的消息格式。")

    async def route_message(self, client_id, message):
        """根据消息类型将其路由到相应的处理函数。"""
        msg_type = message.get('type')
        handler = self.handlers.get(msg_type)
        if handler:
            await handler.handle(client_id, message)
        else:
            print(f"未知的消息类型：{msg_type}")
            await self.send_error_message(client_id, "未知的消息类型。")

    async def send_client_data(self, client_id, data):
        """向客户端发送数据。"""
        if client_id in self.clients:
            ws = self.clients[client_id]['ws']
            try:
                await ws.send_str(json.dumps(data))
            except Exception as e:
                print(f"无法向客户端 {client_id} 发送数据：{e}")

    async def send_error_message(self, client_id, error_message):
        """向客户端发送错误消息。"""
        await self.send_client_data(client_id, {
            'type': 'error',
            'message': error_message
        })

    async def disconnect_client(self, client_id):
        """处理客户端断开连接的情况。"""
        if client_id in self.clients:
            nickname = self.clients[client_id].get('nickname', f'User{client_id}')
            ws = self.clients[client_id]['ws']
            await ws.close()
            del self.clients[client_id]
            print(f"客户端 {client_id} ({nickname}) 已断开连接。")
            # 从所有会议中移除该客户端
            await self.meeting_manager.remove_client_from_all_meetings(client_id)

    def run(self):
        """运行服务器。"""
        web.run_app(self.app, host=self.host, port=self.port)


if __name__ == '__main__':
    server = Server()
    server.run()
