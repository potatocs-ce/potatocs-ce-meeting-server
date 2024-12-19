const os = require("os");
const ifaces = os.networkInterfaces();

const getLocalIp = () => {
	let localIp = "127.0.0.1";
	Object.keys(ifaces).forEach((ifname) => {
		for (const iface of ifaces[ifname]) {
			// Ignore IPv6 and 127.0.0.1
			if (iface.family !== "IPv4" || iface.internal !== false) {
				continue;
			}
			// Set the local ip to the first IPv4 address found and exit the loop
			localIp = iface.address;
			return;
		}
	});
	return localIp;
};

module.exports = {
	listenIp: "0.0.0.0",
	listenPort: 3300,
	sslCrt: "./ssl/cert.pem",
	sslKey: "./ssl/key.pem",

	mediasoup: {
		// Worker settings
		numWorkers: Object.keys(os.cpus()).length,
		worker: {
			rtcMinPort: 40000,
			rtcMaxPort: 49999,
			// Worker 당 최대 처리량 설정
			maxWorkerLoad: 70, // 70% CPU 사용률 제한
			logLevel: "warn",
			logTags: [
				"info",
				"ice",
				"dtls",
				"rtp",
				"srtp",
				"rtcp",
				// 'rtx',
				// 'bwe',
				// 'score',
				// 'simulcast',
				// 'svc'
			],
		},
		// Router settings
		router: {
			mediaCodecs: [
				{
					kind: "audio",
					mimeType: "audio/opus",
					clockRate: 48000,
					channels: 2,
				},
				{
					kind: "video",
					mimeType: "video/VP8",
					clockRate: 90000,
					parameters: {
						"x-google-start-bitrate": "1000",
						// 'x-google-max-bitrate': 500,
					},
				},
				{
					kind: "video",
					mimeType: "video/H264",
					clockRate: 90000,
					parameters: {
						"packetization-mode": 1,
						"profile-level-id": "42e01f",
						"level-asymmetry-allowed": 1,
						"x-google-start-bitrate": "1000",
					},
				},
			],
		},
		// WebRtcTransport settings
		webRtcTransport: {
			listenIps: [
				{
					ip: "0.0.0.0",
					announcedIp: getLocalIp(), // replace by public IP address
				},
			],
			initialAvailableOutgoingBitrate: 800000, // 초기 가용 비트레이트
			minimumAvailableOutgoingBitrate: 300000, // 최소 비트레이트
			maxIncomingBitrate: 1500000, // 최대 수신 비트레이트
			// maxOutgoingBitrate: 1000000, // 최대 송신 비트레이트
			maxOutgoingBitrate: 500000, // 최대 송신 비트레이트
		},
	},
};
