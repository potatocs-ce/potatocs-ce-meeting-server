module.exports = class Session {

    constructor(socket, userName, roomName, userId) {
        this.id = socket.id;
        this.socket = socket;
        this.name = userName;
        this.roomName = roomName;
        this.userId = userId;
        // this.bandwidth = bandwidth;
        this.bandwidth = 100;
        this.outgoingMedia = null;
        this.incomingMedia = {};
        this.iceCandidateQueue = {};
    }


    // data.sender === this.userId
    // 잘못되면 이거  data.sender === this.name로 바꿔라
    addIceCandidate(data, candidate) {
        // self
        if (data.sender === this.userId) {
            // have outgoing media.
            if (this.outgoingMedia) {
                // console.log(' add candidate to self : ' + data.sender);
                this.outgoingMedia.addIceCandidate(candidate);
            } else {
                // save candidate to ice queue.
                console.log(' still does not have outgoing endpoint for ' + data.sender);
                this.iceCandidateQueue[data.sender].push({
                    data: data,
                    candidate: candidate
                });
            }
        } else {
            // others
            let webRtc = this.incomingMedia[data.sender];
            if (webRtc) {
                //console.log(this.name + ' add candidate to from ' + data.sender);
                webRtc.addIceCandidate(candidate);
            } else {
                //         console.log(this.name +' still does not have endpoint for '+data.sender);
                if (!this.iceCandidateQueue[data.sender]) {
                    this.iceCandidateQueue[data.sender] = [];
                }
                this.iceCandidateQueue[data.sender].push({
                    data: data,
                    candidate: candidate
                });
            }
        }
    }

    sendMessage(data) {
        if (this.socket) {
            this.socket.emit(data.id, data);
        } else {
            console.error('socket is null');
        }
    }


    setOutgoingMedia(outgoingMedia) {
        this.outgoingMedia = outgoingMedia;
    }

    setRoomName(roomName) {
        this.roomName = roomName;
    }
    setUserName(userName) {
        this.name = userName;
    }
    setBandWidth(bandwidth) {
        this.bandwidth = bandwidth;
    }
    setUserId(userId) {
        this.userId = userId;
    }

}