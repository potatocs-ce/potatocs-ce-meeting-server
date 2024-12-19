const config = require("./config");

module.exports = class Room {
	constructor(room_id, worker, io) {
		this.id = room_id;
		const mediaCodecs = config.mediasoup.router.mediaCodecs;
		worker
			.createRouter({
				mediaCodecs,
			})
			.then(
				function (router) {
					this.router = router;
				}.bind(this)
			);
		this.peers = new Map();
		this.io = io;
	}

	addPeer(peer) {
		this.peers.set(peer.id, peer);
	}

	getProducerListForPeer() {
		let producerList = [];

		this.peers.forEach((peer) => {
			peer.producers.forEach((producer) => {
				producerList.push({
					producer_id: producer.id,
					producer_socket_id: peer.id,
					name: peer.name,
					screen: producer.screen,
				});
			});
		});
		return producerList;
	}

	getRtpCapabilities() {
		return this.router.rtpCapabilities;
	}

	// Worker 부하 확인
	async getWorkerLoad() {
		try {
			// 성능 최적화: 1초 이내 재요청시 캐시된 값 반환
			const now = Date.now();
			if (this.cachedUsage && now - this.lastUsageCheck < 1000) {
				return this.cachedUsage;
			}

			const usage = await this.worker.getResourceUsage();

			// CPU 사용률 계산 (백분율)
			const cpuUsage = usage.cpu / 100;

			// 메모리 사용률 계산 (백분율)
			const memoryUsage = (usage.mem.heapUsed / usage.mem.heapTotal) * 100;

			// Worker의 전반적인 부하 계산 (CPU와 메모리 사용률의 가중 평균)
			const workerLoad = cpuUsage * 0.7 + memoryUsage * 0.3;

			// 결과 캐시
			this.cachedUsage = workerLoad;
			this.lastUsageCheck = now;

			return workerLoad;
		} catch (error) {
			console.error("Worker load check failed:", error);
			return 0; // 에러 발생 시 기본값 반환
		}
	}

	async createWebRtcTransport(socket_id) {
		const { maxIncomingBitrate, initialAvailableOutgoingBitrate } = config.mediasoup.webRtcTransport;

		// Worker 부하 확인
		const workerLoad = await this.getWorkerLoad();
		if (workerLoad > config.mediasoup.worker.maxWorkerLoad) {
			throw new Error("Server is currently overloaded");
		}

		const transport = await this.router.createWebRtcTransport({
			listenIps: config.mediasoup.webRtcTransport.listenIps,
			enableUdp: true,
			enableTcp: true,
			preferUdp: true,
			initialAvailableOutgoingBitrate,
			minimumAvailableOutgoingBitrate: config.mediasoup.webRtcTransport.minimumAvailableOutgoingBitrate,
			maxIncomingBitrate,
			maxOutgoingBitrate: config.mediasoup.webRtcTransport.maxOutgoingBitrate,
		});
		if (maxIncomingBitrate) {
			try {
				await transport.setMaxIncommingBitrate(maxIncomingBitrate);
			} catch (error) {}
		}

		transport.on("close", () => {
			console.log("Transport close", { name: this.peers.get(socket_id).name });
		});

		console.log("Adding transport", { transportId: transport.id });
		this.peers.get(socket_id).addTransport(transport);

		// 네트워크 상태 모니터링
		transport.on("icestatechange", (iceState) => {
			if (iceState === "disconnected") {
				this.handleTransportDisconnection(transport, socket_id);
			}
		});

		return {
			params: {
				id: transport.id,
				iceParameters: transport.iceParameters,
				iceCandidates: transport.iceCandidates,
				dtlsParameters: transport.dtlsParameters,
			},
		};
	}

	async connectPeerTransport(socket_id, transport_id, dtlsParameters) {
		if (!this.peers.has(socket_id)) return;

		await this.peers.get(socket_id).connectTransport(transport_id, dtlsParameters);
	}

	async produce(socket_id, producerTransportId, rtpParameters, kind, screen) {
		return new Promise(
			async function (resolve, reject) {
				// console.log(screen)
				let producer = await this.peers
					.get(socket_id)
					.createProducer(producerTransportId, rtpParameters, kind, screen);
				// console.log('프로듀서!!!!', producer)
				resolve(producer.id);
				this.broadCast(socket_id, "newProducers", [
					{
						producer_id: producer.id,
						producer_socket_id: socket_id,
					},
				]);
			}.bind(this)
		);
	}

	async consume(socket_id, consumer_transport_id, producer_id, rtpCapabilities, producer_socket_id) {
		// handle nulls
		if (
			!this.router.canConsume({
				producerId: producer_id,
				rtpCapabilities,
			})
		) {
			console.error("can not consume");
			return;
		}
		// console.log(producer_socket_id)
		// console.log('와우', this.peers.get(producer_socket_id).name)
		let { consumer, params } = await this.peers
			.get(socket_id)
			.createConsumer(consumer_transport_id, producer_id, rtpCapabilities);
		// console.log(consumer, params, this.peers, producer_id, producer_socket_id)
		consumer.on(
			"producerclose",
			function () {
				console.log("Consumer closed due to producerclose event", {
					name: `${this.peers.get(socket_id).name}`,
					consumer_id: `${consumer.id}`,
				});
				this.peers.get(socket_id).removeConsumer(consumer.id);
				//tell client consumer is dead
				this.io.to(socket_id).emit("consumerClosed", {
					consumer_id: consumer.id,
				});
			}.bind(this)
		);

		return {
			params,
			name: this.peers.get(producer_socket_id).name,
			screen: this.peers.get(producer_socket_id).producers.get(producer_id).screen,
		};
	}

	async removePeer(socket_id) {
		this.peers.get(socket_id).close();
		this.peers.delete(socket_id);
	}

	closeProducer(socket_id, producer_id) {
		this.peers.get(socket_id).closeProducer(producer_id);
	}

	broadCast(socket_id, name, data) {
		for (let otherID of Array.from(this.peers.keys()).filter((id) => id !== socket_id)) {
			this.send(otherID, name, data);
		}
	}

	send(socket_id, name, data) {
		// console.log('왔다 왔다!!!!!', socket_id)
		this.io.to(socket_id).emit(name, data);
	}

	getPeers() {
		return this.peers;
	}

	toJson() {
		return {
			id: this.id,
			peers: JSON.stringify([...this.peers]),
		};
	}
};
