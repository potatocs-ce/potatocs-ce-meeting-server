var mongoose = require("mongoose");
const { GetObjectCommand, S3Client, DeleteObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const s3Client = new S3Client({
	region: process.env.AWS_REGION,
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	},
});

exports.meetingInfo = async (req, res) => {
	// API 호출 정보를 콘솔에 출력
	console.log(`
    --------------------------------------------------
      User : 
      API  : Get my Meeting
      router.get(/meetingInfo:meetingId', whiteBoardContollder.meetingInfo);
    --------------------------------------------------`);

	// 글로벌 DB 모델 객체 가져오기
	const dbModels = global.DB_MODELS;

	// 조회 조건 설정
	// 회의 ID를 URL의 params에서 가져와 사용
	const criteria = {
		_id: req.params.meetingId, // 요청받은 회의 ID
	};

	try {
		// 데이터베이스에서 회의 정보를 조회
		let meetingInfo = await dbModels.Meeting.findOne(criteria)
			.populate("enlistedMembers", "-password") // enlistedMembers 필드에 대한 참조 데이터 가져오기 (비밀번호 제외)
			.populate("currentMembers.member_id", "-password"); // currentMembers.member_id에 대한 참조 데이터 가져오기 (비밀번호 제외)

		// 조회된 회의 정보를 콘솔에 출력 (디버깅용)
		console.log(meetingInfo);

		// 조회된 회의 정보를 클라이언트에 반환
		return res.send(meetingInfo);
	} catch (err) {
		// 오류 발생 시 상태 코드 500과 메시지를 반환
		return res.status(500).send("internal server error");
	}
};

exports.getParticipantState = async (req, res) => {
	console.log(`--------------------------------------------------
    API  : Get a role
    router.get('/getParticipantState', MeetingContollder.getParticipantState);
  --------------------------------------------------`);

	console.log("[[getParticipantState]] >>>>>> ", req.params.meetingId);

	const dbModels = global.DB_MODELS;

	try {
		const criteria = {
			_id: req.params.meetingId,
		};

		const currentMembers = await dbModels.Meeting.find(criteria).select("currentMembers");
		// console.log('[[ getParticipantState ]]', currentMembers)
		console.log("-------------------------------------------");

		if (!currentMembers) {
			return res.status(400).send("invalid meeting role");
		}

		return res.status(200).send(currentMembers);
	} catch (err) {
		return res.status(500).send({
			message: "get a meeting role had an error",
		});
	}
};

// 채팅 정보 가져오기
exports.getChat = async (req, res) => {
	console.log(`
--------------------------------------------------
  API  : Get a chat
  router.get('/getChat', MeetingContollder.getChat);
--------------------------------------------------`);

	const dbModels = global.DB_MODELS;

	try {
		const criteria = {
			meetingId: req.params.meetingId,
		};

		// 원하는 값만 query 하기 공백으로 구분
		const MeetingChat = await dbModels.MeetingChat.find(criteria).select(
			"userId chatMember createdAt chatContent images"
		);

		if (!MeetingChat) {
			return res.status(400).send("invalid meeting chat");
		}

		return res.status(200).send(MeetingChat);
	} catch (err) {
		return res.status(500).send({
			message: "creatintg a meeting chat had an error",
		});
	}
};

exports.getVideoDrawings = async (req, res) => {
	console.log(`
    --------------------------------------------------
      API  : getVdieoDrawings
      router.get('/getVdieoDrawings/:meetingId', MeetingContollder.getVideoDrawings);
    --------------------------------------------------`);

	const dbModels = global.DB_MODELS;

	try {
		const meetingId = req.params.meetingId;

		// 원하는 값만 query 하기 공백으로 구분
		const VideoDrawings = await dbModels.VideoDrawing.aggregate([
			{
				$match: {
					meetingId: new mongoose.Types.ObjectId(meetingId),
				},
			},
			{
				$sort: {
					createdAt: 1,
				},
			},
			{
				$group: {
					_id: "$targetId",
					data: {
						$addToSet: {
							drawingEvent: "$drawingEvent",
							userId: "$userId",
							createdAt: "$createdAt",
							screen: "$screen",
						},
					},
				},
			},
			{
				$unwind: "$data",
			},
			{
				$sort: {
					"data.createdAt": 1, // 오름차순으로 정렬하려면 1, 내림차순으로 정렬하려면 -1
				},
			},
			{
				$group: {
					_id: "$_id",
					data: { $push: "$data" },
				},
			},
		]);

		if (!VideoDrawings) {
			return res.status(400).send("invalid meeting chat");
		}

		return res.status(200).send(VideoDrawings);
	} catch (err) {
		console.error(err);
		return res.status(500).send({
			message: "creatintg a meeting chat had an error",
		});
	}
};

exports.clearVideoDrawing = async (req, res) => {
	console.log(`
    --------------------------------------------------
      API  : Create a chat
      router.post('/createChat', MeetingContollder.createChat);
    --------------------------------------------------`);
	const { meetingId, userId } = req.body;
	const dbModels = global.DB_MODELS;

	try {
		await dbModels.VideoDrawing.deleteMany({ meetingId, targetId: userId });

		return res.status(201).send({ message: "success" });
	} catch (err) {
		console.error(err);
		return res.status(500).send({
			message: "clear drawings in video had an error",
		});
	}
};

exports.createChat = async (req, res) => {
	console.log(`
    --------------------------------------------------
      API  : Create a chat
      router.post('/createChat', MeetingContollder.createChat);
    --------------------------------------------------`);
	console.log("[[createChat]] >>>>>> ", req.body);

	// console.log(req.files)
	// db 사용
	const dbModels = global.DB_MODELS;

	// user 이름 불러오기
	const user_name = await dbModels.Member.findOne({ _id: req.body.userId }).select("name");

	// criteria
	try {
		// s3에 처리하고 넘어온 이미지 데이터들 담아둘 변수
		const image_buffer = [];
		// 넘어온 이미지 데이터들을 반복하면서 처리해줌
		await Promise.all(
			req?.files?.map(async (image, index) => {
				const key = "chat_images/" + Date.now().toString() + image.originalname;
				// 여기 s3 처리...
				const command = new PutObjectCommand({
					Bucket: process.env.AWS_S3_BUCKET,
					Key: key,
					Body: image.buffer,
				});

				try {
					const response = await s3Client.send(command);

					const data = JSON.parse(req.body.strings[index]);
					console.log("쉬바", data);
					delete data.dataURL;
					image_buffer.push({ ...data, key });
				} catch (err) {
					console.error(err);
				}
			})
		);

		const criteria = {
			meetingId: req.body.meetingId,
			userId: req.body.userId,
			chatMember: user_name.name,
			chatContent: req.body.chatContent,
			images: image_buffer,
		};

		const Meeting = dbModels.MeetingChat(criteria);
		// console.log("[[ createChat ]] >>>>", Meeting)
		await Meeting.save();

		return res.status(200).send(Meeting);
	} catch (err) {
		console.log(err);
		return res.status(500).send({
			message: "creatintg a meeting chat had an error",
		});
	}
};

exports.getImage = async (req, res) => {
	console.log(`
    --------------------------------------------------
    router.post('/:key', meetingController.getImage);
    --------------------------------------------------
        `);

	const key = req.params.key;
	console.log("====================================================================");
	console.log(key);
	try {
		const command = new GetObjectCommand({
			Bucket: process.env.AWS_S3_BUCKET,
			Key: "chat_images/" + key,
		});

		const response = await s3Client.send(command);
		response.Body.pipe(res);
	} catch (err) {
		console.error(err);
		return res.status(500).send("internal server error");
	}
};
