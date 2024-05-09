module.exports = function (io, socket, app) {
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
}