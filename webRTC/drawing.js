module.exports = function (io, socket, app) {
    // 비디오 위에 그림을 그렸음을 알려주는 소켓 신호
    socket.on('draw:video', async ({ room_id, data, target_id, user_id, meeting_id, screen }) => {

        const dbModels = global.DB_MODELS;

        const criteria = {
            meetingId: meeting_id,
            userId: user_id,
            targetId: target_id,
            drawingEvent: data,
            screen: screen
        }
        dbModels.VideoDrawing(criteria).save()


        socket.to(room_id).emit('draw:video', { drawingEvent: data, socket_id: socket.id, target_id, user_id, screen });
    })


    socket.on('draw:document', async ({ room_id, data, user_id, meeting_id, doc_id, pageNum }) => {
        const dbModels = global.DB_MODELS;

        // doc랑 페이지 번호도 필요...

        const criteria = {
            meetingId: meeting_id,
            userId: user_id,
            docId: doc_id,
            page: pageNum,
            drawingEvent: data
        }
        dbModels.DocDrawing(criteria).save();


        socket.to(room_id).emit('draw:document', { drawingEvent: data, socket_id: socket.id, user_id, doc_id, pageNum })
    })

    // 비디오 화면이 클리어 되었음을 알려주는 socket 신호
    socket.on('draw:video_clear', async ({ room_id, meeting_id, target_id }) => {
        socket.to(room_id).emit('draw:video_clear', { meeting_id, target_id })
    })


    socket.on('draw:doc_clear', async ({ meetingId, result, docId, page }) => {


        socket.to(meetingId).emit('draw:doc_clear', { result, docId, page });
    })
}

