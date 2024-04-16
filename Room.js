const config = require('./config')

module.exports = class Room {
    constructor(room_id, worker, io) {
        this.id = room_id
        const mediaCodecs = config.mediasoup.router.mediaCodecs
        worker.createRouter({
            mediaCodecs
        }).then(function (router) {
            this.router = router
        }.bind(this))
        this.peers = new Map()
        this.io = io
    }

    addPeer(peer) {
        console.log(peer, '피어')
        this.peers.set(peer.id, peer)
        console.log(this.peers)
    }

    getProducerListForPeer() {
        console.log('이게 실행이 돼야 하는데 ', this.peers)
        let producerList = [];
        console.log(this.peers)
        this.peers.forEach((peer) => {
            peer.producers.forEach((producer) => {

                producerList.push({
                    producer_id: producer.id,
                    producer_socket_id: peer.id,
                    name: peer.name
                })
            })
        })
        return producerList
    }

    getRtpCapabilities() {
        return this.router.rtpCapabilities
    }

    async createWebRtcTransport(socket_id) {
        const { maxIncomingBitrate, initialAvailableOutgoingBitrate } = config.mediasoup.webRtcTransport

        const transport = await this.router.createWebRtcTransport({
            listenIps: config.mediasoup.webRtcTransport.listenIps,
            enableUdp: true,
            enableTcp: true,
            preferUdp: true,
            initialAvailableOutgoingBitrate
        })
        if (maxIncomingBitrate) {
            try {
                await transport.setMaxIncommingBitrate(maxIncomingBitrate)
            } catch (error) { }
        }

        transport.on('close', () => {
            console.log('Transport close', { name: this.peers.get(socket_id).name })
        })

        console.log("Adding transport", { transportId: transport.id })
        this.peers.get(socket_id).addTransport(transport)
        return {
            params: {
                id: transport.id,
                iceParameters: transport.iceParameters,
                iceCandidates: transport.iceCandidates,
                dtlsParameters: transport.dtlsParameters
            }
        }
    }

    async connectPeerTransport(socket_id, transport_id, dtlsParameters) {
        if (!this.peers.has(socket_id)) return

        await this.peers.get(socket_id).connectTransport(transport_id, dtlsParameters)
    }

    async produce(socket_id, producerTransportId, rtpParameters, kind) {
        return new Promise(
            async function (resolve, reject) {
                let producer = await this.peers.get(socket_id).createProducer(producerTransportId, rtpParameters, kind)
                console.log('프로듀서!!!!', producer)
                resolve(producer.id)
                this.broadCast(socket_id, 'newProducers', [
                    {
                        producer_id: producer.id,
                        producer_socket_id: socket_id
                    }
                ])
            }.bind(this)
        )
    }


    async consume(socket_id, consumer_transport_id, producer_id, rtpCapabilities, producer_socket_id) {
        // handle nulls
        if (
            !this.router.canConsume({
                producerId: producer_id,
                rtpCapabilities
            })
        ) {
            console.error('can not consume')
            return
        }
        // console.log(producer_socket_id)
        // console.log('와우', this.peers.get(producer_socket_id).name)
        let { consumer, params } = await this.peers.get(socket_id).createConsumer(consumer_transport_id, producer_id, rtpCapabilities)
        // console.log(consumer, params, this.peers, producer_id, producer_socket_id)
        consumer.on(
            'producerclose',
            function () {
                console.log('Consumer closed due to producerclose event', {
                    name: `${this.peers.get(socket_id).name}`,
                    consumer_id: `${consumer.id}`
                })
                this.peers.get(socket_id).removeConsumer(consumer.id)
                //tell client consumer is dead
                this.io.to(socket_id).emit('consumerClosed', {
                    consumer_id: consumer.id
                })
            }.bind(this)
        )
        return { params, name: this.peers.get(producer_socket_id).name }
    }

    async removePeer(socket_id) {
        this.peers.get(socket_id).close()
        this.peers.delete(socket_id)
    }

    closeProducer(socket_id, producer_id) {
        this.peers.get(socket_id).closeProducer(producer_id)
    }

    broadCast(socket_id, name, data) {
        for (let otherID of Array.from(this.peers.keys()).filter((id) => id !== socket_id)) {
            this.send(otherID, name, data)
        }
    }

    send(socket_id, name, data) {
        console.log('왔다 왔다!!!!!', socket_id)
        this.io.to(socket_id).emit(name, data)
    }

    getPeers() {
        return this.peers
    }

    toJson() {
        return {
            id: this.id,
            peers: JSON.stringify([...this.peers])
        }
    }
}