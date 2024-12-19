module.exports = function (io, socket, app) {
	// 클라이언트가 'sendChat' 이벤트를 보낼 때 처리
	socket.on("sendChat", (chatData, callback) => {
		// 해당 방(room_id)에 있는 다른 클라이언트들에게 채팅 데이터를 전달
		socket.to(chatData.room_id).emit("receiveChatData", chatData);

		// 클라이언트에게 콜백을 통해 채팅 데이터를 전달
		callback(chatData);
	});

	// 클라이언트가 'deletChat' 이벤트를 보낼 때 처리
	socket.on("deletChat", (data) => {
		// 해당 방(room_id)에 있는 다른 클라이언트들에게 채팅을 새로고침(refresh)하도록 알림
		socket.to(data.room_id).emit("refreshChat");
	});
};
