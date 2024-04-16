// es5 문법으로 사용
const express = require('express');

// express 정의
const app = express();
const cors = require('cors')
// https 
const https = require('httpolyglot')
// mediasoup 불러오기
const fs = require('fs')
const path = require('path')
const config = require('./config')
const mediasoup = require('mediasoup');
const options = {
    key: fs.readFileSync(path.join(__dirname, config.sslKey), 'utf-8'),
    cert: fs.readFileSync(path.join(__dirname, config.sslCrt), 'utf-8')
}
const { Server } = require("socket.io");

const Room = require('./Room')
const Peer = require('./Peer')


app.use(express.static(path.join(__dirname, './dist/angular_mediasoup2/browser')))

const allowedOrigins = ['http://localhost:4200', 'http://localhost:4300', 'http://192.168.0.5:4200', 'http://192.168.0.5:4300', 'http://192.168.0.42:4200', 'http://192.168.0.42:4300', 'https://buildingtalks.com'];

app.use(cors({
    origin: allowedOrigins,
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

const httpsServer = https.createServer(options, app)
httpsServer.listen(3000, '0.0.0.0', () => {
    console.log('Listening on https://' + config.listenIp + ':' + config.listenPort)
})
// 소켓

const io = new Server(httpsServer, {
    cors: {
        origin: "*"
    },
    path: '/socket/'
})

// all mediasoup workers
/*
worker
- 미디어 스트림의 수신 및 송신
- 미디어 스트림의 믹싱 및 변환
- 미디어 스트림의 보안 및 Qos 보장
*/
let workers = [];
let nextMediasoupWortkerIdx = 0;

// room list 
/**
 * {
 * room_id: Room {id, name, master, transports, producers, consumers, rtpCapabilities}
 * }
 */

let roomList = new Map();

(async () => {
    await createWorkers()
})()

async function createWorkers() {
    let { numWorkers } = config.mediasoup;

    for (let i = 0; i < numWorkers; i++) {
        let worker = await mediasoup.createWorker({
            // 로그 레벨을 지정
            logLevel: config.mediasoup.worker.logLevel,
            // 로그를 기록할 태그 지정 
            logTags: config.mediasoup.worker.logTags,
            // 사용할 포트 범위 지정 <- 예상 사용자 범위 지정
            rtcMinPort: config.mediasoup.worker.rtcMinPort,
            rtcMaxPort: config.mediasoup.worker.rtcMaxPort
        })

        worker.on('died', () => {
            console.error('mediasoup worker died, exiting in 2 seconds... [pid:%d]', worker.pid)
            setTimeout(() => process.exit(1), 2000)
        })
        workers.push(worker)
    }
}

io.on('connection', (socket) => {
    socket.on('createRoom', async ({ room_id }, callback) => {
        if (roomList.has(room_id)) {
            callback('already exists')
        } else {
            console.log('Create Room', { room_id: room_id })
            let worker = await getMediasoupWorker()
            roomList.set(room_id, new Room(room_id, worker, io))
            callback(room_id)
        }
    })

    socket.on('join', ({ room_id, name }, cb) => {
        console.log('User joined', {
            room_id,
            name
        })

        if (!roomList.has(room_id)) {
            return cb({
                error: "Room does not exist"
            })
        }

        roomList.get(room_id).addPeer(new Peer(socket.id, name))
        socket.room_id = room_id;

        cb(roomList.get(room_id).toJson())
    })

    // 새로 들어온 멤버에게 연결 정보 제공
    socket.on('getProducers', () => {
        if (!roomList.has(socket.room_id)) return
        console.log('Get producers', { name: `${roomList.get(socket.room_id).getPeers().get(socket.id).name}` })

        // send all the current producer to newly joined memer
        let producerList = roomList.get(socket.room_id).getProducerListForPeer()

        socket.emit('newProducers', producerList)
    })

    // 코덱 등 데이터 정보 제공
    socket.on('getRouterRtpCapabilities', (_, callback) => {
        console.log('Get RouterRtpCapabilities', {
            name: `${roomList.get(socket.room_id).getPeers().get(socket.id).name}`
        })
        // console.log(roomList.get(socket.room_id).getRtpCapabilities())

        try {
            callback(roomList.get(socket.room_id).getRtpCapabilities())
        } catch (e) {
            callback({
                error: e.message
            })
        }
    })

    // 연결 생성
    socket.on('createWebRtcTransport', async (_, callback) => {
        console.log('Create webrtc transport', {
            name: `${roomList.get(socket.room_id).getPeers().get(socket.id).name}`
        })

        try {
            const { params } = await roomList.get(socket.room_id).createWebRtcTransport(socket.id)

            callback(params)
        } catch (err) {
            console.error(err)
            callback({
                error: err.message
            })
        }
    })

    // 연결
    socket.on('connectTransport', async ({ transport_id, dtlsParameters }, callback) => {
        console.log('Connect transport', { name: `${roomList.get(socket.room_id).getPeers().get(socket.id).name}` })

        if (!roomList.has(socket.room_id)) return
        await roomList.get(socket.room_id).connectPeerTransport(socket.id, transport_id, dtlsParameters)

        callback('success');
    })

    // 발신
    socket.on('produce', async ({ kind, rtpParameters, producerTransportId }, callback) => {
        if (!roomList.has(socket.room_id)) {
            return callback({ error: 'not is a room' })
        }

        console.log(kind, rtpParameters, producerTransportId)
        let producer_id = await roomList.get(socket.room_id).produce(socket.id, producerTransportId, rtpParameters, kind);

        console.log('Produce', {
            type: `${kind}`,
            name: `${roomList.get(socket.room_id).getPeers().get(socket.id).name}`,
            id: `${producer_id}`
        })

        callback({
            producer_id, type: `${kind}`, name: `${roomList.get(socket.room_id).getPeers().get(socket.id).name}`
        })
    })

    // 수신
    socket.on('consume', async ({ consumerTransportId, producerId, rtpCapabilities, producer_socket_id }, callback) => {
        let { params, name } = await roomList.get(socket.room_id).consume(socket.id, consumerTransportId, producerId, rtpCapabilities, producer_socket_id)

        console.log('파람파람', params)
        console.log('Consuming', {
            name: `${roomList.get(socket.room_id) && roomList.get(socket.room_id).getPeers().get(socket.id).name}`,
            producer_id: `${producerId}`,
            consumer_id: `${params.id}`,
            encodings: params.rtpParameters
        })

        callback({ params, name })
    })

    // 이건 뭐지....
    socket.on('resume', async (data, callback) => {
        await consumer.resume()
        callback()
    })

    // 방 정보 
    socket.on('getMyRoomInfo', (_, cb) => {
        cb(roomList.get(socket.room_id).toJson())
    })

    // 끊어지면 끈허진 놈 연결 끊기
    socket.on('disconnect', () => {
        console.log('Disconnect', {
            name: `${roomList.get(socket.room_id) && roomList.get(socket.room_id).getPeers().get(socket.id).name}`
        })

        if (!socket.room_id) return
        roomList.get(socket.room_id).removePeer(socket.id)
    })

    // producerClosed
    socket.on('producerClosed', ({ producer_id }) => {
        console.log('Producer close', {
            name: `${roomList.get(socket.room_id) && roomList.get(socket.room_id).getPeers().get(socket.id).name}`
        })

        roomList.get(socket.room_id).closeProducer(socket.id, producer_id)
    })

    // 방에서 나가기
    socket.on('exitRoom', async (_, callback) => {
        console.log('Exit room', {
            name: `${roomList.get(socket.room_id) && roomList.get(socket.room_id).getPeers().get(socket.id).name}`
        })

        if (!roomList.has(socket.room_id)) {
            callback({
                error: 'not currently in a room'
            })
            return
        }

        // close transports
        await roomList.get(socket.room_id).removePeer(socket.id)
        // 방에 혼자 있었으면 방도 없애기
        if (roomList.get(socket.room_id).getPeers().size === 0) {
            roomList.delete(socket.room_id)
        }

        socket.room_id = null

        callback('successfully exited room')
    })
})

/*
worker를 순환시키면서 사용하게 만듭니다.
이는 다수의 worker를 사용해 분산 처리하여 worker를 공평하게 사용할 수 있도록 만들고
worker의 부하를 분산시켜 성능을 향상시킵니다.
특정 worker에 과부하가 걸리는 것을 방지하는 데 활용됩니다.
*/
function getMediasoupWorker() {
    const worker = workers[nextMediasoupWortkerIdx]

    if (++nextMediasoupWortkerIdx === workers.length) nextMediasoupWortkerIdx = 0

    return worker
}