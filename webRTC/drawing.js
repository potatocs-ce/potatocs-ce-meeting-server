module.exports = function (io, socket, app) {
    // 비디오 위에 그림을 그렸음을 알려주는 소켓 신호
    socket.on('draw:video', async ({ room_id, data, target_id, user_id, meeting_id }) => {

        const dbModels = global.DB_MODELS;

        const criteria = {
            meetingId: meeting_id,
            userId: user_id,
            targetId: target_id,
            drawingEvent: data
        }
        dbModels.VideoDrawing(criteria).save()


        socket.to(room_id).emit('draw:video', { drawingEvent: data, socket_id: socket.id, target_id, user_id });
    })

    // 비디오 화면이 클리어 되었음을 알려주는 socket 신호
    socket.on('draw:video_clear', async ({ room_id, meeting_id, target_id }) => {
        socket.to(room_id).emit('draw:video_clear', { meeting_id, target_id })
    })
}