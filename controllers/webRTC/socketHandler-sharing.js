const kurento = require("kurento-client");
const kurentoClient = null;
const Register = require('./register.js');
const Session = require('./session.js');
const minimst = require("minimist");
const url = require('url');
let userRegister = new Register;

const argv = minimst(process.argv.slice(2), {
    default: {
        as_uri: process.env.KURENTO_AS_URI,
        ws_uri: process.env.KURENTO_WS_URI
    }
});

var sessions = {};
var candidatesQueue = {};

// var userid;
// var username;
// var roomname;
var bandwidth;

let rooms = {};

let meeting_disconnect = null;

let asUrl = url.parse(argv.as_uri);
//let port = asUrl.port;
let wsUrl = url.parse(argv.ws_uri).href;


module.exports = function (wsServer, socket, app) {



    const socketWebRTC = wsServer.of('/socketWebRTC');
    // 룸에 참가.
    socket.on('userInfo', (data) => {
        console.log('-------- userInfo --------')
        console.log('[data]', data)
        
        // roomname = data.roomName;
        // username = data.userName;
        // userid = data.userid;
        console.log('roomName : ' + data.roomName)
        console.log('userName : ' + data.userName)
        bandwidth = 100;
        console.log('bandwidth : ' + bandwidth)
        console.log('----------------')
        // RoomList(data);
        socket.join(data.roomName);
        socket.username = data.userName;
        socket.userid = data.userId;
        socket.roomName = data.roomName;

        joinRoom(socket, data.roomName, err => {
            if (err) {
                console.error('join Room error ' + err);
            }
        });

        socketWebRTC.emit("roomList_change", Rooms);

        // socket.emit("userId", userid);
        
    });

    socket.on('changeBitrate', (data) => {
        // roomname = data.roomname;
        // username = socket.username;
        // bandwidth = data.bitrate

        let userSession = userRegister.getById(socket.id);
        userSession.setBandWidth(data.bitrate);
        renegotiation(socket);
        console.log('[ bandwidth ]', data.bitrate)
    })

    socket.on("receiveVideoFrom", (data) => {
        receiveVideoFrom(socket, data.sender, data.sdpOffer, (error) => {
            if (error) {
                console.error(error);
            }
        });
    });

    socket.on("onIceCandidate", (data) => {
        addIceCandidate(socket, data, (error) => {
            if (error) {
                console.error(error);
            }
        });
    });

    socket.on("Screen_Sharing", async () => {
        console.log('Screen_Sharing')
        renegotiation(socket);
    });
    socket.on("video_device_change", async () => {
        console.log('video_device_change')
        renegotiation2(socket);
    });

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
                
    //         }
    //     }
    // });


    //////////////////////////////////////////////////////////
    // socket disconnect 시 user online 유무, 나갔다고 알림
    socket.on("disconnect", async () => {

        // if (meeting_disconnect != null) {
            var data = {
                userid: socket.userid,
                roomName: socket.roomName,
                userName: socket.userName
            }
           

            /////////////////////////////////////////////////////
            // 소켓 disconnect 시 해당 유저 online : true -> false
            const dbModels = global.DB_MODELS;

            // meetingId를 이용하여 field 찾고 찾은 field에서 값 수정
            // $는 배열의 몇 번째인지 index와 같은 역할
            const getOnlineFalse = await dbModels.Meeting.findOneAndUpdate(
                {
                    _id: socket.roomName, // meetingId
                    'currentMembers.member_id' : socket.userid, // userId
                },
                {
                    $set: {
                        'currentMembers.$.online' : false
                    }
                },
                {
                    new: true
                }
            )
            // console.log('[[ getOnlineFalse ]]', getOnlineFalse)      
            ///////////////////////////////////////////////////// 


            /////////////////////////////////////////////////////
            // 자신을 제외한 같은 room (meetingId로 판단)에 있는 사람들에게
            // 나갔다고 notifier
            socket.broadcast.to(data.roomName).emit("notifier_out",socket.username);
            //////////////////////////////////////////////////////
            
            leaveRoom(socket.id, err => {
                if (err) {
                    console.error('leave Room error ' + err);
                }
            });

            console.log('user disconnect!', socket.username) 
            
            meeting_disconnect = null;
        // }
    });
}





function renegotiation(socket) {
    let userSession = userRegister.getById(socket.id);

    var room = rooms[userSession.roomName];

    var usersInRoom = room.participants;

    //화면 공유하는 클라의 나가는 끝점 해제 
    userSession.outgoingMedia.release();

    //화면 공유하는 클라의 영상을 받는 다른 클라들의 들어오는 끝점 해제
    for (var i in usersInRoom) {
        var user = usersInRoom[i];
        if (user.id === userSession.id) {
            continue;
        }
        user.incomingMedia[userSession.userId].release();
        delete user.incomingMedia[userSession.userId];
        usersInRoom[i].sendMessage({
            id: 'updateremoteVideo',
            userId: userSession.userId
        });



    }


    room.pipeline.create('WebRtcEndpoint', (error, outgoingMedia) => {
        if (error) {
            if (Object.keys(room.participants).length === 0) {
                room.pipeline.release();
            }
            return callback(error);
        }
        //userSession.setBandWidth(bandwidth);
        bandwidth = userSession.bandwidth;
        outgoingMedia.setMaxVideoRecvBandwidth(bandwidth);
        outgoingMedia.setMinVideoRecvBandwidth(bandwidth);
        userSession.setOutgoingMedia(outgoingMedia);

        console.log(' [ webRtc bandwidth ]', bandwidth)

        let iceCandidateQueue = userSession.iceCandidateQueue[userSession.userId];
        if (iceCandidateQueue) {
            while (iceCandidateQueue.length) {
                let message = iceCandidateQueue.shift();
                console.error('user: ' + userSession.id + ' collect candidate for outgoing media');
                userSession.outgoingMedia.addIceCandidate(message.candidate);
            }
        }

        userSession.outgoingMedia.on('OnIceCandidate', event => {
            let candidate = kurento.register.complexTypes.IceCandidate(event.candidate);
            userSession.sendMessage({
                id: 'iceCandidate',
                userId: userSession.userId,
                candidate: candidate
            });
        });

        let usersInRoom = room.participants;
        let existingUsers = [];
        for (let i in usersInRoom) {
            if (usersInRoom[i].userId != userSession.userId) {
                existingUsers.push(usersInRoom[i].userId);
            }
        }

        socket.emit('Screen_Sharing', '');

        for (let i in usersInRoom) {
            if (usersInRoom[i].userId != userSession.userId) {
                usersInRoom[i].sendMessage({
                    id: 'newParticipantArrived',
                    name: userSession.name,
                    userId: userSession.userId
                });
            }
        }

    });

}

function renegotiation2(socket) {
    let userSession = userRegister.getById(socket.id);

    var room = rooms[userSession.roomName];

    var usersInRoom = room.participants;

    //화면 공유하는 클라의 나가는 끝점 해제 
    userSession.outgoingMedia.release();

    //화면 공유하는 클라의 영상을 받는 다른 클라들의 들어오는 끝점 해제
    for (var i in usersInRoom) {
        var user = usersInRoom[i];
        if (user.id === userSession.id) {
            continue;
        }
        user.incomingMedia[userSession.userId].release();
        delete user.incomingMedia[userSession.userId];
        usersInRoom[i].sendMessage({
            id: 'updateremoteVideo',
            userId: userSession.userId
        });



    }


    room.pipeline.create('WebRtcEndpoint', (error, outgoingMedia) => {
        if (error) {
            if (Object.keys(room.participants).length === 0) {
                room.pipeline.release();
            }
            return callback(error);
        }
        //userSession.setBandWidth(bandwidth);
        bandwidth = userSession.bandwidth;
        outgoingMedia.setMaxVideoRecvBandwidth(bandwidth);
        outgoingMedia.setMinVideoRecvBandwidth(bandwidth);
        userSession.setOutgoingMedia(outgoingMedia);

        console.log(' [ webRtc bandwidth ]', bandwidth)

        let iceCandidateQueue = userSession.iceCandidateQueue[userSession.userId];
        if (iceCandidateQueue) {
            while (iceCandidateQueue.length) {
                let message = iceCandidateQueue.shift();
                console.error('user: ' + userSession.id + ' collect candidate for outgoing media');
                userSession.outgoingMedia.addIceCandidate(message.candidate);
            }
        }

        userSession.outgoingMedia.on('OnIceCandidate', event => {
            let candidate = kurento.register.complexTypes.IceCandidate(event.candidate);
            userSession.sendMessage({
                id: 'iceCandidate',
                userId: userSession.userId,
                candidate: candidate
            });
        });

        let usersInRoom = room.participants;
        let existingUsers = [];
        for (let i in usersInRoom) {
            if (usersInRoom[i].userId != userSession.userId) {
                existingUsers.push(usersInRoom[i].userId);
            }
        }

        socket.emit('video_device_change', '');

        for (let i in usersInRoom) {
            if (usersInRoom[i].userId != userSession.userId) {
                usersInRoom[i].sendMessage({
                    id: 'newParticipantArrived',
                    
                    userId: userSession.userId
                });
            }
        }

    });

}

const Rooms = [];
const RoomNumClient = [];

function RoomList(data) {
    const meeting_info = {
        meeting_master: data.meeting_master,
        meeting_name: data.meeting_name,
        meeting_date: data.meeting_date,
        meeting_time: data.meeting_time,
        meeting_num: RoomNumClient[data.meeting_name],
    }
    Rooms.push(meeting_info);
    return Rooms;
}

function leaveRoom(socketId, callback) {
    // isHangup = true;
    // HangUp_user = data.userid;
    // roomname = data.roomname;
    // RoomNumClient[roomname] -= 1;

    // const index = Rooms.findIndex(obj => obj.meeting_name == roomname);
    // Rooms[index].meeting_num = RoomNumClient[roomname];

    // wsServer.emit("roomList_change", Rooms);

    // let meeting_num = Rooms[index].meeting_num;

    // wsServer.to(roomname).emit("meeting_num", meeting_num);


    let userSession = userRegister.getById(socketId);

    if (!userSession) {
        return;
    }

    let room = rooms[userSession.roomName];

    if (!room) {
        return;
    }

    console.log('notify all user that ' + userSession.name + ' is leaving the room ' + userSession.roomName);

    let usersInRoom = room.participants;
    delete usersInRoom[userSession.userId];
    userSession.outgoingMedia.release();

    for (let i in userSession.incomingMedia) {
        userSession.incomingMedia[i].release();
        delete userSession.incomingMedia[i];
    }

    const data = {
        id: 'participantLeft',
        userId: userSession.userId
    };
    for (let i in usersInRoom) {
        let user = usersInRoom[i];
        // release viewer from this
        user.incomingMedia[userSession.userId]?.release();
        delete user.incomingMedia[userSession.userId];
        // notify all user in the room
        user.sendMessage(data);
    }

    // Release pipeline and delete room when room is empty
    if (Object.keys(room.participants).length == 0) {
        room.pipeline.release();
        delete rooms[userSession.roomName];
    }
    // delete userSession.roomName;
    userRegister.unregister(socketId)
}

function joinRoom(socket, roomName, callback) {

    // get room 
    getRoom(roomName, (error, room) => {
        if (error) {
            console.log('error');
            callback(error);
            return;
        }
        // join user to room
        join(socket, room, (err, user) => {

            console.log('join success : ' + socket.username);
            console.log('join success userid : ' + socket.userid);
            console.log('join success roomName : ' + socket.roomName);
            if (err) {
                callback(err);
                return;
            }
            callback();
        });
    });
}

function getRoom(roomName, callback) {
    let room = rooms[roomName];
    if (room == null) {
        console.log('create new room : ' + roomName);
        try {
            console.log('111111111111')
            getKurentoClient((error, kurentoClient) => {
                if (error) {
                    return callback(error);
                }
                console.log('222222222')
                kurentoClient.create('MediaPipeline', (error, pipeline) => {
                    if (error) {
                        return callback(error);
                    }
                    room = {
                        name: roomName,
                        pipeline: pipeline,
                        participants: {},
                        kurentoClient: kurentoClient
                    };
    
                    rooms[roomName] = room;
                    callback(null, room);
                });
            });
        } catch (error) {
            console.log(error)
        }
        

    } else {
        console.log('get existing room : ' + roomName);
        callback(null, room);
    }
}

function join(socket, room, callback) {
    let userName = socket.username;
    let userId = socket.userid;

    let userSession = new Session(socket, userName, room.name, userId);
    userRegister.register(userSession);


    room.pipeline.create('WebRtcEndpoint', (error, outgoingMedia) => {
        if (error) {
            console.error('no participant in room');
            if (Object.keys(room.participants).length === 0) {
                room.pipeline.release();
            }
            return callback(error);
        }
        userSession.setBandWidth(bandwidth);

        outgoingMedia.setMaxVideoRecvBandwidth(bandwidth);
        outgoingMedia.setMinVideoRecvBandwidth(bandwidth);
        userSession.setOutgoingMedia(outgoingMedia);

        let iceCandidateQueue = userSession.iceCandidateQueue[userSession.userId];

        if (iceCandidateQueue) {
            while (iceCandidateQueue.length) {
                let message = iceCandidateQueue.shift();
                console.error('user: ' + userSession.id + ' collect candidate for outgoing media');
                userSession.outgoingMedia.addIceCandidate(message.candidate);
            }
        }

        userSession.outgoingMedia.on('OnIceCandidate', event => {

            let candidate = kurento.register.complexTypes.IceCandidate(event.candidate);
            userSession.sendMessage({
                id: 'iceCandidate',
                // name: userSession.name,
                userId: userSession.userId,
                candidate: candidate
            });
        });
        let usersInRoom = room.participants;
        for (let i in usersInRoom) {

            // if (usersInRoom[i].name != userSession.name) {
            // 문제 시 name로 바꿔라
            if (usersInRoom[i].userId != userSession.userId) {
                usersInRoom[i].sendMessage({
                    id: 'newParticipantArrived',
                    name: userSession.name,
                    userId: userSession.userId,
                });
            }
        }

        let existingUsers = [];
        console.log('usersInRoom--------')
        console.log(usersInRoom)
        console.log('--------------------')
        for (let i in usersInRoom) {
             // if (usersInRoom[i].name != userSession.name) {
            // 문제 시 name로 바꿔라
            if (usersInRoom[i].userId != userSession.userId) {
                existingUsers.push({
                    userId : usersInRoom[i].userId,
                    name : usersInRoom[i].name
                });
            }
        }
        console.log('existingUsers-----------------------------')
        console.log(existingUsers)
        userSession.sendMessage({
            id: 'existingParticipants',
            data: existingUsers,
            roomName: room.name,
            userId: userId
        });
        // 문제 시 userSession.name로 바꿔라
        room.participants[userSession.userId] = userSession;

        callback(null, userSession);
    });
}

function receiveVideoFrom(socket, senderUserId, sdpOffer, callback) {

    let userSession = userRegister.getById(socket.id);
    // let sender = userRegister.getByUserId(senderUserId);

    let sender = userRegister.getByRoomAndId(senderUserId, socket.roomName)
   
 
    getEndpointForUser(userSession, sender, (error, endpoint) => {
        try {
            // if (error) {
            //     console.error(error);
            //     callback(error);
            // }
    
            endpoint.processOffer(sdpOffer, (error, sdpAnswer) => {
                console.log(`process offer from ${sender.userId} to ${userSession.userId}`);
                if (error) {
                    return callback(error);
                }
                let data = {
                    id: 'receiveVideoAnswer',
                    userId: sender.userId,
                    sdpAnswer: sdpAnswer
                };
                userSession.sendMessage(data);
    
                endpoint.gatherCandidates(error => {
                    if (error) {
                        return callback(error);
                    }
                });
    
                return callback(null, sdpAnswer);
            });    
        } catch (error) {
                console.error(error);
                callback(error);
        }
        
    });
}


function getKurentoClient(callback) {
    kurento(wsUrl, (error, kurentoClient) => {
        if (error) {
            let message = 'Could not find media server at address ${wsUrl}';
            return callback(message + 'Exiting with error ' + error);
        }
        callback(null, kurentoClient);
    });
}

function addIceCandidate(socket, message, callback) {
    let user = userRegister.getById(socket.id);
    if (user != null) {
        // assign type to IceCandidate
        let candidate = kurento.register.complexTypes.IceCandidate(message.candidate);
        user.addIceCandidate(message, candidate);
        callback();
    } else {
        console.error(`ice candidate with no user receive : ${message.sender}`);
        callback(new Error("addIceCandidate failed"));
    }
}
function getEndpointForUser(userSession, sender, callback) {

    try {
        if (userSession.userId === sender.userId) {
            return callback(null, userSession.outgoingMedia);
        }
    
        let incoming = userSession.incomingMedia[sender.userId];
        console.log(userSession.userId + "    " + sender.userId);
        if (incoming == null) {
            console.log(`user : ${userSession.id} create endpoint to receive video from : ${sender.id}`);
            getRoom(userSession.roomName, (error, room) => {
                if (error) {
                    console.error(error);
                    callback(error);
                    return;
                }
                room.pipeline.create('WebRtcEndpoint', (error, incoming) => {
                    if (error) {
                        if (Object.keys(room.participants).length === 0) {
                            room.pipeline.release();
                        }
                        console.error('error: ' + error);
                        callback(error);
                        return;
                    }
    
                    console.log(`user: ${userSession.userId} successfully create pipeline`);
                    incoming.setMaxVideoRecvBandwidth(bandwidth);
                    incoming.setMinVideoRecvBandwidth(bandwidth);
                    userSession.incomingMedia[sender.userId] = incoming;
    
    
                    // add ice candidate the get sent before endpoints is establlished
                    let iceCandidateQueue = userSession.iceCandidateQueue[sender.userId];
                    if (iceCandidateQueue) {
                        while (iceCandidateQueue.length) {
                            let message = iceCandidateQueue.shift();
                            console.log(`user: ${userSession.userId} collect candidate for ${message.data.sender}`);
                            incoming.addIceCandidate(message.candidate);
                        }
                    }
    
                    incoming.on('OnIceCandidate', event => {
    
                        let candidate = kurento.register.complexTypes.IceCandidate(event.candidate);
                        userSession.sendMessage({
                            id: 'iceCandidate',
                            userId: sender.userId,
                            candidate: candidate
                        });
                    });
    
                    sender.outgoingMedia.connect(incoming, error => {
                        if (error) {
                            console.log(error);
                            callback(error);
                            return;
                        }
                        callback(null, incoming);
                    });
                });
            })
        } else {
            console.log(`user: ${userSession.name} get existing endpoint to receive video from: ${sender.name}`);
            sender.outgoingMedia.connect(incoming, error => {
                if (error) {
                    callback(error);
                }
                callback(null, incoming);
            });
        }
    } catch (error) {
        console.log(error)
    }
    
}


