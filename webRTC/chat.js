module.exports = function (io, socket, app) {
    socket.on('sendChat', (chatData, callback) => {
        socket.to(chatData.room_id).emit('receiveChatData', chatData);

        callback(chatData)
    })

    socket.on('deletChat', (data) => {
        socket.to(data.room_id).emit('refreshChat');
    })


}