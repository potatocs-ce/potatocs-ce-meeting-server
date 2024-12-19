const { GetObjectCommand, S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const mongoose = require("mongoose");
const s3Client = new S3Client({
	region: process.env.AWS_REGION,
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	},
});
exports.createDoc = async (req, res) => {
	// API 호출 정보를 콘솔에 출력
	console.log(`
    --------------------------------------------------
    router.post('/upload/:meetingId', docController.createDoc);
    --------------------------------------------------`);

	// 글로벌 DB 모델 객체 가져오기
	const dbModels = global.DB_MODELS;

	// URL 파라미터에서 meetingId 가져오기
	const meetingId = req.params.meetingId;

	// 업로드된 파일 정보 가져오기 (Multer 등의 미들웨어에서 제공)
	const file = req.file;

	try {
		// meetingId가 없는 경우 잘못된 요청으로 간주하고 상태 코드 400 반환
		if (!meetingId) {
			return res.status(400).send("invalid meeting id");
		}

		// 데이터베이스에서 meetingId에 해당하는 회의 정보 조회
		const result = await dbModels.Meeting.findOne({ _id: meetingId });

		// 회의 정보가 없는 경우 잘못된 요청으로 간주하고 상태 코드 400 반환
		if (!result) {
			return res.status(400).send("invalid meeting id");
		}

		// 문서 생성에 필요한 정보 설정
		const criteria = {
			_id: new mongoose.Types.ObjectId(), // 새로 생성된 문서의 고유 ID
			meetingId: result._id, // 회의 ID
			originalFileName: file.originalname, // 업로드된 파일의 원래 이름
			fileName: file.filename, // 저장된 파일 이름
			saveKey: file.key, // 파일 저장 경로 또는 키
			fileSize: file.size, // 파일 크기 (바이트)
		};

		// 문서 데이터를 데이터베이스에 저장
		const doc = await new dbModels.Doc(criteria).save();

		// 상태 코드 201 반환 및 업로드 성공 메시지 전송
		return res.status(201).send({ message: "document uploaded" });
	} catch (err) {
		// 서버 내부 오류 발생 시 상태 코드 500 반환
		console.error(err); // 오류를 콘솔에 기록
		return res.status(500).send("internal server error");
	}
};

exports.getDocList = async (req, res) => {
	console.log(`
    --------------------------------------------------
    router.post('/doc_list/:meetingId', docController.getDocList);
    --------------------------------------------------`);

	const dbModels = global.DB_MODELS;

	const criteria = {
		meetingId: req.params.meetingId,
	};

	try {
		// const docResult = await dbModels.Doc.aggregate([
		//     {
		//         $match: {
		//             meetingId: req.params.meetingId
		//         }
		//     },
		//     {
		//         $lookup: {
		//             from: 'drawings',
		//             localField: '_id',
		//             foreignField: 'docId',
		//             as: 'drawings'
		//         }
		//     }, {
		//         $project: {
		//             saveKey: 0, meetingId: 0
		//         }
		//     }
		// ])

		const docResult = await dbModels.Doc.find(criteria).select({ saveKey: 0, meetingId: 0 });

		return res.status(200).send(docResult);
	} catch (err) {
		console.error(err);
		return res.status(500).send("internal server error");
	}
};

// 문서의 판서 정보를 요청하는 api
exports.getDocDrawingList = async (req, res) => {
	// API 호출 정보를 콘솔에 출력
	console.log(`
    --------------------------------------------------
    router.post('/doc_drawing_list/:meetingId', docController.getDocDrawingList);
    --------------------------------------------------`);

	// 글로벌 DB 모델 객체 가져오기
	const dbModels = global.DB_MODELS;

	// MongoDB Aggregation 파이프라인 설정
	const pipeline = [
		{
			// 첫 번째 단계: 특정 회의(meetingId)에 해당하는 문서 데이터를 필터링
			$match: {
				meetingId: req.params.meetingId, // URL 파라미터에서 meetingId 가져오기
			},
		},
		{
			// 두 번째 단계: 문서 ID(docId)별로 데이터를 그룹화
			$group: {
				_id: "$docId", // 그룹화 기준: 문서 ID
				drawings: {
					// drawings 배열에 필요한 필드를 추가
					$push: {
						drawingEvent: "$drawingEvent", // 드로잉 이벤트 정보
						page: "$page", // 페이지 정보
						userId: "$userId", // 사용자 ID 정보
					},
				},
			},
		},
	];

	try {
		// Aggregation 실행: 드로잉 데이터를 그룹화하여 가져옴
		const result = await dbModels.DocDrawing.aggregate(pipeline);
		console.log(result);
		// 결과를 클라이언트에 반환 (상태 코드 200)
		return res.status(200).send(result);
	} catch (err) {
		// 오류 발생 시 상태 코드 500과 메시지 반환
		console.error(err); // 오류를 콘솔에 기록
		return res.status(500).send("internal server error");
	}
};

exports.getDoc = async (req, res) => {
	console.log(`
    --------------------------------------------------
    router.post('/:doc_id', docController.getDoc);
    --------------------------------------------------`);

	const dbModels = global.DB_MODELS;
	const doc_id = req.params.doc_id;

	try {
		const docInfo = await dbModels.Doc.findById(doc_id).lean();
		if (!docInfo) {
			return res.status(404).send({ message: "no document" });
		}

		const command = new GetObjectCommand({
			Bucket: process.env.AWS_S3_BUCKET,
			Key: docInfo.saveKey,
		});

		const response = await s3Client.send(command);
		res.attachment(docInfo.saveKey);

		response.Body.pipe(res);
	} catch (err) {
		console.error(err);
		return res.status(500).send("internal server error");
	}
};

// 문서 삭제
exports.deleteDoc = async (req, res) => {
	console.log(`
    --------------------------------------------------
      router.delete(/delete/:_id, meetingContollder.deleteMeetingPdfFile);
    --------------------------------------------------`);
	const dbModels = global.DB_MODELS;
	console.log(req.params._id);
	try {
		if (!req.params._id) {
			return res.status(400).send("invalid meeting id1");
		}

		result = await dbModels.Doc.findOne({ _id: req.params._id }, { _id: false, saveKey: true, meetingId: true });

		if (!result) {
			return res.status(400).send("invalid meeting id2");
		}

		const deletedDoc = await dbModels.Doc.findOneAndDelete({
			_id: req.params._id,
		});

		// 판서 정보 삭제
		await dbModels.DocDrawing.deleteMany({ docId: req.params._id });

		const command = new DeleteObjectCommand({
			Bucket: process.env.AWS_S3_BUCKET,
			Key: deletedDoc.saveKey, // 업로드된 파일 경로
		});

		await s3Client.send(command);

		return res.status(200).send({
			message: "upload file delete",
			meetingId: result.meetingId,
		});
	} catch (err) {
		console.log(err);
		return res.status(500).send("internal server error");
	}
};

exports.clearDrawing = async (req, res) => {
	console.log(`
    --------------------------------------------------
      router.post(/clear_drawing, meetingContoller.clearDrawing);
    --------------------------------------------------`);
	const dbModels = global.DB_MODELS;
	const { meetingId, docId, page } = req.body;
	try {
		await dbModels.DocDrawing.deleteMany({ docId, page });
		const pipeline = [
			{
				$match: {
					meetingId,
				},
			},
			{
				$group: {
					_id: "$docId",
					drawings: {
						$push: {
							drawingEvent: "$drawingEvent",
							page: "$page",
							userId: "$userId",
						},
					},
				},
			},
		];
		const result = await dbModels.DocDrawing.aggregate(pipeline);

		return res.status(200).send(result);
	} catch (err) {
		console.error(err);
		return res.status(500).send("internal server error");
	}
};
