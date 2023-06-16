const kurento = require("kurento-client");
const kurentoClient = null;
const Register = require('./register.js');
const Session = require('./session.js');
const minimst = require("minimist");
const url = require('url');
let userRegister = new Register;

const argv = minimst(process.argv.slice(2), {
    default: {
        as_uri: 'http://15.165.65.162:3000',
        ws_uri: 'ws://15.165.65.162:8888/kurento'
    }
});

var sessions = {};
var candidatesQueue = {};

// var username;
// var roomname;
// var bandwidth;

let meeting_disconnect = null;


let asUrl = url.parse(argv.as_uri);
//let port = asUrl.port;
let wsUrl = url.parse(argv.ws_uri).href;


module.exports = function (wsServer, socket, app) {



    const socketWebRTC = wsServer.of('/socketWebRTC');
    // 룸에 참가.    
    socket.on('userInfo', (data) => {
        const roomName = data.roomName;
        const userName = data.userName;
        socket.userName = userName;
        console.log(roomName)
        
        // 자기 자신 포함 같은 room에 있는 사람들에게 입장했다고 알림
        socketWebRTC.to(roomName).emit("notifier_in", userName);
    });



    //////////////////////////////////////////////////////////
    ////////// 채팅 보내기 //////////////// 
    socket.on('sendChat', (chatData) => {
        // 같은 room (meetingId로 판단)에 있는 사람에게 전송
        socket.join(chatData.meetingId);
        // 자기 자신 포함 같은 room (meetingId로 판단)에 있는 사람들
        socketWebRTC.to(chatData.meetingId).emit("receiveChatData", chatData);
    })
    //////////////////////////////////////////////////////////


    //////////////////////////////////////////////////////////
    // 같은 room에 있는 모든 사람들 채팅 삭제
    socket.on('deleteChat', (data) => {
        // 자신을 제외한 같은 room (meetingId로 판단)에 있는 사람들
        socket.broadcast.to(data).emit("refreshChat");
    })
    //////////////////////////////////////////////////////////

    // socket.on("leaveRoom", (data) => {
    //     socket.leave(data.roomname);
    //     leaveRoom(socket, data, err => {
    //         if (err) {
    //             console.error('leave Room error ' + err);
    //         }
    //     });

    // });

    
    // socket.on("disconnecting", () => {
    //     let userSession = userRegister.getById(socket.id);
    //     if (userSession != undefined) {
    //         if (userSession.roomName != undefined) {
    //             meeting_disconnect = "disconnect during a meeting";
    //             roomname = userSession.roomName;
    //             username = socket.username;
    //         }
    //     }
    // });


    // socket.on("disconnect", async() => {
    //     if (meeting_disconnect != null) {
    //         var data = {
    //             username: username,
    //             roomname: roomname,
    //         }

    //         leaveRoom(socket, data, err => {
    //             if (err) {
    //                 console.error('leave Room error ' + err);
    //             }
    //         });

    //         meeting_disconnect = null;
    //     }
    // });



    //////////////////////////////////////////////////////////
     // 같은 room에 있는 모든 사람들 role 업데이트
    socket.on('roleUpdate', (data) => {
        // 자신을 제외한 같은 room (meetingId로 판단)에 있는 사람들 role 업데이트
        socket.broadcast.to(data).emit("refreshRole");
    })
    //////////////////////////////////////////////////////////


 
    //////////////////////////////////////////////////////////
    // 자신을 제외한 같은 room에 있는 모든 사람들 on / offline 업데이트
    socket.on('updateParticipants', (data) => {
        // 자신을 제외한 같은 room에 있는 모든 사람들 on / offline 업데이트
        socket.broadcast.to(socket.roomName).emit("updateParticipants");
    })
    //////////////////////////////////////////////////////////



}



