module.exports = function (io, socket, app) {
    socket.on('sendChat', (chatData) => {
        socket.to(chatData.room_id).emit('receiveChatData', chatData);
    })

    socket.on('deletChat', (data) => {
        socket.to(data.room_id).emit('refreshChat');
    })


}