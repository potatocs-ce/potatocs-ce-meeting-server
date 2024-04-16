const { ConsumerScore } = require("mediasoup/node/lib/fbs/consumer")

module.exports = class Peer {
    constructor(socket_id, name) {
        this.id = socket_id
        this.name = name
        this.transports = new Map()
        this.consumers = new Map()
        this.producers = new Map()
    }

    addTransport(transport) {
        this.transports.set(transport.id, transport)
    }

    // dtlsParameters(Datagram Transport Layer Security)를 사용하여 보안 연결
    // 서버와 클라이언트 간 미디어 연결
    async connectTransport(transport_id, dtlsParameters) {
        if (!this.transports.has(transport_id)) return

        await this.transports.get(transport_id).connect({
            dtlsParameters: dtlsParameters
        })
    }

    // producer는 데이터를 주는 endpoint
    // producer 생성
    // rtpParameter는 RTP 패킷의 코덱, 해상도, 비트레이트 등의 설정을 포함
    // kind는 audio, video, applicatio 등을 포함
    async createProducer(producerTransportId, rtpParameters, kind) {
        // console.log('프로튜서 생성', rtpParameters)
        let producer = await this.transports.get(producerTransportId).produce({
            kind,
            rtpParameters
        })

        this.producers.set(producer.id, producer)

        producer.on(
            'transportclose',
            function () {
                console.log('Producer transport close', { name: `${this.name}`, consumer_id: `${producer.id}` })
                producer.close()
                this.producers.delete(producer.id)
            }.bind(this)
        )

        return producer
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
                paused: false // producer.kind === 'video'
            })

            // consumer.rtpParameters.encodings[0].maxBitrate = 100000
        } catch (error) {
            console.error('Consume failed', error)
            return
        }

        // simulcast: 네트워크 상황에 따라 다양한 해상도와 프레임률의 스트림을 제공하기 위함
        if (consumer.type === 'simulcast') {
            await consumer.setPreferredLayers({
                spatialLayer: 2,
                temporalLayer: 0
            })

        }

        this.consumers.set(consumer.id, consumer)

        consumer.on(
            'transportclose',
            function () {
                console.log('Consumer transport close', { name: `${this.name}`, consumer_id: `${consumer.id}` })
                this.consumers.delete(consumer.id)
            }.bind(this)
        )

        consumer.on('layerschange', function (layers) {
            consumer.currentLayers
            console.log('레이어', layers, consumer.currentLayers)

        }.bind(this))

        return {
            consumer,
            params: {
                producer_id: producer_id,
                id: consumer.id,
                kind: consumer.kind,
                rtpParameters: consumer.rtpParameters,
                type: consumer.type,
                producerPaused: consumer.producerPaused
            }
        }
    }

    closeProducer(producer_id) {
        try {
            this.producers.get(producer_id).close()
        } catch (e) {
            console.warn(e)
        }

        this.producers.delete(producer_id)
    }

    getProducer(producer_id) {
        return this.producers.get(producer_id)
    }

    close() {
        this.transports.forEach((transport) => transport.close())
    }

    removeConsumer(consumer_id) {
        this.consumers.delete(consumer_id)
    }
}