module.exports = function (wsServer, socket, app) {
  const dbModels = global.DB_MODELS;

  const socketWebRTC = wsServer.of("/socketWebRTC");

  socket.on("join:room", (meetingId) => {
    console.log("join Room:", meetingId);
    socket.join(meetingId);
    socket.meetingId = meetingId;
  });

  /**
   *  새로운 document 생성 시 진입
   *  - room 안의 모든 User에게 전송 (보낸 사람 포함)
   *  - code 통일성을 위해서!
   */
  socket.on("check:documents", (meetingRoomId) => {
    // console.log(meetingRoomId)
    socketWebRTC.to(meetingRoomId).emit("check:documents");
  });

  socket.on("draw:teacher", async (data) => {
    // console.log('client --------> server draw event')
    socket.broadcast.to(socket.meetingId).emit("draw:teacher", data);
    // console.log(data)
    const drawData = {
      pageNum: data.pageNum,
      drawingEvent: data.drawingEvent,
    };

    // tool이 포인터이면 드로잉 이벤를 저장하지 않는다.
    var res = {};
    if (data.drawingEvent.tool.type != "pointer") {
      res = await dbModels.Doc.findOneAndUpdate(
        { _id: data.docId },
        { $push: { drawingEventSet: drawData } }
      );
    }
  });

  socket.on("clearDrawingEvents", async (data) => {
    // res = await dbModels.Doc.findOne({ '_id': data.docId }, {'_id':false,'meetingId':true})

    socket.broadcast.to(socket.meetingId).emit("clearDrawingEvents", data);

    result = await dbModels.Doc.findOneAndUpdate(
      {
        _id: data.docId,
        // 'drawingEventSet.pageNum' : req.query.currentPage
      },
      {
        $pull: {
          drawingEventSet: {
            pageNum: data.currentPage,
          },
        },
      }
    );
  });

  socket.on("change:pdfNum", (data) => {
    console.log(data);
    socket.broadcast.to("testRoom").emit("change:pdfNum", data);
  });

  /*-------------------------------------------`
        doc 전환 하는 경우 sync
     ---------------------------------------------*/
  socket.on("sync:doc", (data) => {
    console.log("page to sync: ", data.docId);
    socket.broadcast.to(data.meetingId).emit("sync:docChange", data.docId);
  });

  /*-------------------------------------------
        page 전환 하는 경우 sync
     ---------------------------------------------*/
  socket.on("sync:page", (data) => {
    console.log("doc to sync: ", data.docId);
    console.log("page to sync: ", data.pageNum);
    socket.broadcast.to(data.meetingId).emit("sync:pageChange", data);
  });

  /*-------------------------------------------
        doc. List (문서 목록으로) 하는 경우 sync
     ---------------------------------------------*/
  socket.on("sync:FileList", (data) => {
    console.log("back to FileList sync: ");
    socket.broadcast.to(data.meetingId).emit("sync:backToFileList");
  });
};
