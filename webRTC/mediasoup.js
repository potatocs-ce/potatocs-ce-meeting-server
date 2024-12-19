const Room = require("../Room");
const Peer = require("../Peer");
const config = require("../config");
const mediasoup = require("mediasoup");
const meeting_controller = require("../routes/apim/v1/meeting/meeting_controller");
let nextMediasoupWortkerIdx = 0;

// room list
/**
 * {
 * room_id: Room {id, name, master, transports, producers, consumers, rtpCapabilities}
 * }
 */

let roomList = new Map();

// all mediasoup workers
/*
worker
- 미디어 스트림의 수신 및 송신
- 미디어 스트림의 믹싱 및 변환
- 미디어 스트림의 보안 및 Qos 보장
*/
let workers = [];

(async () => {
	await createWorkers();
})();

async function createWorkers() {
	const numWorkers = config.mediasoup.numWorkers;

	for (let i = 0; i < numWorkers; i++) {
		let worker = await mediasoup.createWorker({
			// 로그 레벨을 지정
			logLevel: config.mediasoup.worker.logLevel,
			// 로그를 기록할 태그 지정
			logTags: config.mediasoup.worker.logTags,
			// 사용할 포트 범위 지정 <- 예상 사용자 범위 지정
			rtcMinPort: config.mediasoup.worker.rtcMinPort,
			rtcMaxPort: config.mediasoup.worker.rtcMaxPort,
		});

		worker.on("died", () => {
			console.error(`Worker died unexpectedly [pid:${worker.pid}]`);
			setupWorkerRecovery(worker);
		});

		// Worker 리소스 사용량 모니터링
		setInterval(async () => {
			const usage = await worker.getResourceUsage();
			if (usage.cpu > config.mediasoup.worker.maxWorkerLoad) {
				handleWorkerOverload(worker);
			}
		}, 5000);

		workers.push(worker);
	}
}
// Worker 과부하 처리
function handleWorkerOverload(worker) {
	// 새로운 연결 거부
	worker.overloaded = true;

	// 기존 연결 품질 저하
	const rooms = getRoomsForWorker(worker);
	rooms.forEach((room) => {
		room.peers.forEach((peer) => {
			peer.producers.forEach((producer) => {
				if (producer.kind === "video") {
					producer.pause();
					setTimeout(() => producer.resume(), 5000); // 5초 후 재시도
				}
			});
		});
	});
}
module.exports = function (io, socket, app) {
	socket.on("createRoom", async ({ room_id }, callback) => {
		if (roomList.has(room_id)) {
			callback("already exists");
		} else {
			console.log("Create Room", { room_id: room_id });
			let worker = await getMediasoupWorker();
			roomList.set(room_id, new Room(room_id, worker, io));
			callback(room_id);
		}
	});

	socket.on("join", async ({ room_id, name, user_id }, cb) => {
		console.log("User joined", {
			room_id,
			name,
			user_id,
		});

		if (!roomList.has(room_id)) {
			return cb({
				error: "Room does not exist",
			});
		}

		roomList.get(room_id).addPeer(new Peer(socket.id, user_id));

		socket.room_id = room_id;
		socket.user_id = user_id;

		// 소켓에 조인 시도
		socket.join(room_id);

		// 데이터베이스 업데이트
		const dbModels = global.DB_MODELS;

		await dbModels.Meeting.findOneAndUpdate(
			{
				_id: room_id, // meetingId
				"currentMembers.member_id": user_id, // userId
			},
			{
				$set: {
					"currentMembers.$.online": true,
				},
			},
			{
				new: true,
			}
		);

		cb(roomList.get(room_id).toJson());

		socket.to(socket.room_id).emit("user_join", { room_id: socket.room_id, user_id: socket.user_id, name });
	});

	// 새로 들어온 멤버에게 연결 정보 제공
	socket.on("getProducers", () => {
		if (!roomList.has(socket.room_id)) return;
		console.log("Get producers", { name: `${roomList.get(socket.room_id).getPeers().get(socket.id).name}` });

		// send all the current producer to newly joined memer
		let producerList = roomList.get(socket.room_id).getProducerListForPeer();

		socket.emit("newProducers", producerList);
	});

	// 코덱 등 데이터 정보 제공
	socket.on("getRouterRtpCapabilities", (_, callback) => {
		console.log("Get RouterRtpCapabilities", {
			name: `${roomList.get(socket.room_id).getPeers().get(socket.id).name}`,
		});
		// console.log(roomList.get(socket.room_id).getRtpCapabilities())

		try {
			callback(roomList.get(socket.room_id).getRtpCapabilities());
		} catch (e) {
			callback({
				error: e.message,
			});
		}
	});

	// 연결 생성
	socket.on("createWebRtcTransport", async (_, callback) => {
		console.log(createWorkers);
		console.log("Create webrtc transport", {
			name: `${roomList.get(socket.room_id).getPeers().get(socket.id).name}`,
		});

		try {
			const { params } = await roomList.get(socket.room_id).createWebRtcTransport(socket.id);

			callback(params);
		} catch (err) {
			console.error(err);
			callback({
				error: err.message,
			});
		}
	});

	// 연결
	socket.on("connectTransport", async ({ transport_id, dtlsParameters }, callback) => {
		console.log("Connect transport", { name: `${roomList.get(socket.room_id).getPeers().get(socket.id).name}` });

		if (!roomList.has(socket.room_id)) return;
		await roomList.get(socket.room_id).connectPeerTransport(socket.id, transport_id, dtlsParameters);

		callback("success");
	});

	// 발신
	socket.on("produce", async ({ kind, rtpParameters, producerTransportId, screen }, callback) => {
		if (!roomList.has(socket.room_id)) {
			return callback({ error: "not is a room" });
		}

		// console.log(kind, rtpParameters, producerTransportId)
		let producer_id = await roomList
			.get(socket.room_id)
			.produce(socket.id, producerTransportId, rtpParameters, kind, screen);
		// console.log(socket.room_id, socket.)
		console.log("Produce", {
			type: `${kind}`,
			user_id: socket.user_id,
			name: `${roomList.get(socket.room_id).getPeers().get(socket.id).name}`,
			id: `${producer_id}`,
		});

		roomList.get(socket.room_id).getPeers().get(socket.id).screen = screen;

		callback({
			producer_id,
			type: `${kind}`,
			user_id: `${roomList.get(socket.room_id).getPeers().get(socket.id).name}`,
		});
	});

	// 수신
	socket.on("consume", async ({ consumerTransportId, producerId, rtpCapabilities, producer_socket_id }, callback) => {
		let { params, name, screen } = await roomList
			.get(socket.room_id)
			.consume(socket.id, consumerTransportId, producerId, rtpCapabilities, producer_socket_id);
		console.log(
			await roomList
				.get(socket.room_id)
				.consume(socket.id, consumerTransportId, producerId, rtpCapabilities, producer_socket_id)
		);

		console.log("Consuming", {
			name: `${roomList.get(socket.room_id) && roomList.get(socket.room_id).getPeers().get(socket.id).name}`,
			user_id: socket.user_id,
			producer_id: `${producerId}`,
			consumer_id: `${params.id}`,
			encodings: params.rtpParameters,
			screen,
		});
		console.log(roomList.get(socket.room_id).getPeers().get(socket.id).screen);
		const my_name = await global.DB_MODELS.Member.findOne({ _id: name }).select("name");

		callback({ params, user_id: name, name: my_name.name, screen });
	});

	// 이건 뭐지....
	socket.on("resume", async (data, callback) => {
		await consumer.resume();
		callback();
	});

	// 방 정보
	socket.on("getMyRoomInfo", (_, cb) => {
		cb(roomList.get(socket.room_id).toJson());
	});

	// 끊어지면 끊어진 놈 연결 끊기
	socket.on("disconnect", async () => {
		console.log("Disconnect", {
			name: `${roomList.get(socket.room_id) && roomList.get(socket.room_id).getPeers().get(socket.id).name}`,
		});

		if (!socket.room_id) return;

		const dbModels = global.DB_MODELS;

		await dbModels.Meeting.findOneAndUpdate(
			{
				_id: socket.room_id, // meetingId
				"currentMembers.member_id": socket.user_id, // userId
			},
			{
				$set: {
					"currentMembers.$.online": false,
				},
			},
			{
				new: true,
			}
		);

		socket.to(socket.room_id).emit("user_exit", { room_id: socket.room_id, user_id: socket.user_id });

		roomList.get(socket.room_id).removePeer(socket.id);
	});

	// producerClosed
	socket.on("producerClosed", ({ producer_id }) => {
		console.log("Producer close", {
			name: `${roomList.get(socket.room_id) && roomList.get(socket.room_id).getPeers().get(socket.id).name}`,
		});

		roomList.get(socket.room_id).closeProducer(socket.id, producer_id);
	});

	// 방에서 나가기
	socket.on("exitRoom", async (_, callback) => {
		console.log("Exit room", {
			name: `${roomList.get(socket.room_id) && roomList.get(socket.room_id).getPeers().get(socket.id).name}`,
		});

		if (!roomList.has(socket.room_id)) {
			callback({
				error: "not currently in a room",
			});
			return;
		}

		// close transports
		await roomList.get(socket.room_id).removePeer(socket.id);
		// 방에 혼자 있었으면 방도 없애기
		if (roomList.get(socket.room_id).getPeers().size === 0) {
			roomList.delete(socket.room_id);
		}

		const dbModels = global.DB_MODELS;
		await dbModels.Meeting.findOneAndUpdate(
			{
				_id: socket.room_id, // meetingId
				"currentMembers.member_id": socket.user_id, // userId
			},
			{
				$set: {
					"currentMembers.$.online": false,
				},
			},
			{
				new: true,
			}
		);

		socket.to(socket.room_id).emit("user_exit", { room_id: socket.room_id, user_id: socket.user_id });

		socket.room_id = null;

		callback("successfully exited room");
	});

	// role 업데이트
	socket.on("updateRole", async ({ room_id, role, member_id }, callback) => {
		console.log(member_id);
		try {
			const dbModels = global.DB_MODELS;
			await dbModels.Meeting.findOneAndUpdate(
				{
					_id: room_id, // meetingId
					"currentMembers.member_id": member_id, // userId
				},
				{
					$set: {
						"currentMembers.$.role": role,
					},
				},
				{
					new: true,
				}
			);

			socket.to(room_id).emit("refreshRole", { member_id, role });
			callback("success");
		} catch (err) {
			console.error(err);
			callback("fail");
		}
	});

	// emit change
	socket.on("changeStatus", ({ room_id, toggle_video_whiteboard, lastDocNum, pageBuffer }) => {
		socket.to(room_id).emit("changeStatus", { toggle_video_whiteboard, lastDocNum, pageBuffer });
	});
};
/*
worker를 순환시키면서 사용하게 만듭니다.
이는 다수의 worker를 사용해 분산 처리하여 worker를 공평하게 사용할 수 있도록 만들고
worker의 부하를 분산시켜 성능을 향상시킵니다.
특정 worker에 과부하가 걸리는 것을 방지하는 데 활용됩니다.
*/
function getMediasoupWorker() {
	const worker = workers[nextMediasoupWortkerIdx];

	if (++nextMediasoupWortkerIdx === workers.length) nextMediasoupWortkerIdx = 0;

	return worker;
}
