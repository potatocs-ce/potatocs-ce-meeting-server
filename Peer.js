const { ConsumerScore } = require("mediasoup/node/lib/fbs/consumer");

module.exports = class Peer {
	constructor(socket_id, name) {
		this.id = socket_id;
		this.name = name;
		this.transports = new Map();
		this.consumers = new Map();
		this.producers = new Map();
		this.qualityLevels = {
			high: {
				maxBitrate: 900000,
				scaleResolutionDownBy: 1,
				maxFramerate: 30,
			},
			medium: {
				maxBitrate: 300000,
				scaleResolutionDownBy: 2,
				maxFramerate: 24,
			},
			low: {
				maxBitrate: 100000,
				scaleResolutionDownBy: 4,
				maxFramerate: 15,
			},
		};
	}

	async adjustProducerQuality(producer, forceLevel = null) {
		if (producer.kind !== "video") return;

		try {
			// 현재 producer의 상태 확인
			const stats = await producer.getStats();
			const score = producer.score.reduce((acc, val) => acc + val.score, 0) / producer.score.length;

			// 강제 품질 레벨이 지정되었거나 현재 상태에 따라 품질 레벨 결정
			let targetLevel;

			if (forceLevel) {
				targetLevel = this.qualityLevels[forceLevel];
			} else {
				if (score >= 8) {
					targetLevel = this.qualityLevels.high;
				} else if (score >= 5) {
					targetLevel = this.qualityLevels.medium;
				} else {
					targetLevel = this.qualityLevels.low;
				}
			}

			// 현재 비트레이트 확인
			let currentBitrate = 0;
			stats.forEach((stat) => {
				if (stat.bitrate) currentBitrate = stat.bitrate;
			});

			// 품질 조정이 필요한 경우에만 실행
			if (Math.abs(currentBitrate - targetLevel.maxBitrate) > 50000) {
				// simulcast를 사용하는 경우
				if (producer.type === "simulcast") {
					await this.adjustSimulcastLayers(producer, targetLevel);
				} else {
					// 일반 RTP 스트림의 경우
					await producer.setMaxIncomingBitrate(targetLevel.maxBitrate);
				}

				console.log("Producer quality adjusted", {
					producer_id: producer.id,
					score: score,
					new_bitrate: targetLevel.maxBitrate,
					scale: targetLevel.scaleResolutionDownBy,
					framerate: targetLevel.maxFramerate,
				});

				// 품질 변경 이벤트 발생 (클라이언트에 알림 용도)
				this.emit("qualityChanged", {
					producer_id: producer.id,
					quality: {
						bitrate: targetLevel.maxBitrate,
						scale: targetLevel.scaleResolutionDownBy,
						framerate: targetLevel.maxFramerate,
					},
				});
			}
		} catch (error) {
			console.error("Failed to adjust producer quality:", error);
		}
	}

	async adjustSimulcastLayers(producer, targetLevel) {
		try {
			// 현재 활성화된 레이어 확인
			const currentLayers = producer.currentLayers;

			// 목표 품질에 따른 적절한 레이어 선택
			let spatialLayer;
			if (targetLevel === this.qualityLevels.high) {
				spatialLayer = 2; // 고품질 레이어
			} else if (targetLevel === this.qualityLevels.medium) {
				spatialLayer = 1; // 중품질 레이어
			} else {
				spatialLayer = 0; // 저품질 레이어
			}

			// 레이어 변경이 필요한 경우에만 실행
			if (!currentLayers || currentLayers.spatialLayer !== spatialLayer) {
				await producer.setPreferredLayers({
					spatialLayer: spatialLayer,
					temporalLayer: 0,
				});

				// 비트레이트 제한 설정
				await producer.setMaxIncomingBitrate(targetLevel.maxBitrate);
			}
		} catch (error) {
			console.error("Failed to adjust simulcast layers:", error);
		}
	}

	// Producer 생성 시 품질 모니터링 설정
	setupQualityMonitoring(producer) {
		if (producer.kind !== "video") return;

		// 스코어 변경 모니터링
		producer.on("score", (score) => {
			const avgScore = score.reduce((acc, val) => acc + val.score, 0) / score.length;

			// 스코어가 임계값 이하로 떨어질 경우 품질 조정
			if (avgScore < 5) {
				this.adjustProducerQuality(producer);
			}
		});

		// 주기적인 품질 체크 (30초마다)
		setInterval(() => {
			this.checkAndAdjustQuality(producer);
		}, 30000);
	}

	// 주기적인 품질 체크 및 조정
	async checkAndAdjustQuality(producer) {
		try {
			const stats = await producer.getStats();
			let totalPacketLoss = 0;
			let totalBitrate = 0;

			stats.forEach((stat) => {
				if (stat.packetLoss) totalPacketLoss += stat.packetLoss;
				if (stat.bitrate) totalBitrate += stat.bitrate;
			});

			// 패킷 손실이 높거나 비트레이트가 너무 높은 경우 품질 조정
			if (totalPacketLoss > 10 || totalBitrate > 1000000) {
				this.adjustProducerQuality(producer, "medium");
			}
		} catch (error) {
			console.error("Failed to check producer quality:", error);
		}
	}

	addTransport(transport) {
		this.transports.set(transport.id, transport);
	}

	// dtlsParameters(Datagram Transport Layer Security)를 사용하여 보안 연결
	// 서버와 클라이언트 간 미디어 연결
	async connectTransport(transport_id, dtlsParameters) {
		if (!this.transports.has(transport_id)) return;

		await this.transports.get(transport_id).connect({
			dtlsParameters: dtlsParameters,
		});
	}

	// producer는 데이터를 주는 endpoint
	// producer 생성
	// rtpParameter는 RTP 패킷의 코덱, 해상도, 비트레이트 등의 설정을 포함
	// kind는 audio, video, applicatio 등을 포함
	async createProducer(producerTransportId, rtpParameters, kind, screen) {
		// console.log('프로튜서 생성', rtpParameters)
		let producer = await this.transports.get(producerTransportId).produce({
			kind,
			rtpParameters,
			enalbeRtx: true, // RTX 활성화로 패킷 손실 복구 개선
			encodings:
				kind === "video"
					? [
							{ maxBitrate: 100000, scaleResolutionDownBy: 4, maxFramerate: 15 }, // 저품질
							{ maxBitrate: 300000, scaleResolutionDownBy: 2, maxFramerate: 30 }, // 중품질
							{ maxBitrate: 900000, scaleResolutionDownBy: 1, maxFramerate: 30 }, // 고품질
					  ]
					: undefined,
		});

		producer.screen = screen;

		// CPU 사용량 모니터링 추가
		producer.on("score", (score) => {
			console.log(score);
			if (score < 5) {
				// 성능 점수가 낮을 때
				this.adjustProducerQuality(producer);
			}
		});

		this.producers.set(producer.id, producer);

		producer.on(
			"transportclose",
			function () {
				console.log("Producer transport close", { name: `${this.name}`, consumer_id: `${producer.id}` });
				producer.close();
				this.producers.delete(producer.id);
			}.bind(this)
		);

		return producer;
	}

	// consumer는 데이터를 받는 endpoint
	// 비디오 통화에서 상대방의 영상을 수신하기 위해 사용
	async createConsumer(consumer_transport_id, producer_id, rtpCapabilities) {
		let consumerTransport = this.transports.get(consumer_transport_id);

		let consumer = null;
		try {
			consumer = await consumerTransport.consume({
				producerId: producer_id,
				rtpCapabilities,
				paused: false, // producer.kind === 'video'
			});

			// consumer.rtpParameters.encodings[0].maxBitrate = 100000
		} catch (error) {
			console.error("Consume failed", error);
			return;
		}

		// simulcast: 네트워크 상황에 따라 다양한 해상도와 프레임률의 스트림을 제공하기 위함
		if (consumer.type === "simulcast") {
			await consumer.setPreferredLayers({
				spatialLayer: 2,
				temporalLayer: 0,
			});
		}

		this.consumers.set(consumer.id, consumer);

		consumer.on(
			"transportclose",
			function () {
				console.log("Consumer transport close", { name: `${this.name}`, consumer_id: `${consumer.id}` });
				this.consumers.delete(consumer.id);
			}.bind(this)
		);

		consumer.on(
			"layerschange",
			function (layers) {
				consumer.currentLayers;
				// console.log('레이어', layers, consumer.currentLayers)
			}.bind(this)
		);

		return {
			consumer,
			params: {
				producer_id: producer_id,
				id: consumer.id,
				kind: consumer.kind,
				rtpParameters: consumer.rtpParameters,
				type: consumer.type,
				producerPaused: consumer.producerPaused,
			},
		};
	}

	closeProducer(producer_id) {
		try {
			this.producers.get(producer_id).close();
		} catch (e) {
			console.warn(e);
		}

		this.producers.delete(producer_id);
	}

	getProducer(producer_id) {
		return this.producers.get(producer_id);
	}

	close() {
		this.transports.forEach((transport) => transport.close());
	}

	removeConsumer(consumer_id) {
		this.consumers.delete(consumer_id);
	}
};
