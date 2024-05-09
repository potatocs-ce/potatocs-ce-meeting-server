module.exports = function (io, socket, app) {

    socket.on('check:documents', (meetingRoomId) => {
        // console.log(meetingRoomId)
        socket.to(meetingRoomId).emit('check:documents');
    })
}