const { GetObjectCommand, S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const mongoose = require('mongoose');
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

exports.createDoc = async (req, res) => {
    console.log(`
    --------------------------------------------------
    router.post('/upload/:meetingId', docController.createDoc);
    --------------------------------------------------`);
    const dbModels = global.DB_MODELS;

    const meetingId = req.params.meetingId;
    const file = req.file;

    try {
        if (!meetingId) {
            return res.status(400).send('invalid meeting id');
        }

        const result = await dbModels.Meeting.findOne({ _id: meetingId });

        if (!result) {
            return res.status(400).send('invalid meeting id');
        }

        const criteria = {
            _id: new mongoose.Types.ObjectId(),
            meetingId: result._id,
            originalFileName: file.originalname,
            fileName: file.filename,
            saveKey: file.key,
            fileSize: file.size
        }

        const doc = await new dbModels.Doc(criteria).save();
        return res.status(201).send({ message: 'document uploaded' });
    } catch (err) {
        console.error(err)
        return res.status(500).send('internal server error');
    }
}

exports.getDocList = async (req, res) => {
    console.log(`
    --------------------------------------------------
    router.post('/doc_list/:meetingId', docController.getDocList);
    --------------------------------------------------`);

    const dbModels = global.DB_MODELS;

    const criteria = {
        meetingId: req.params.meetingId
    }

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
        console.error(err)
        return res.status(500).send('internal server error');
    }
}

// 문서의 판서 정보를 요청하는 api
exports.getDocDrawingList = async (req, res) => {
    console.log(`
    --------------------------------------------------
    router.post('/doc_drawing_list/:meetingId', docController.getDocDrawingList);
    --------------------------------------------------`);
    const dbModels = global.DB_MODELS;
    const criteria = {
        meetingId: req.params.meetingId
    }


    const pipeline = [
        {
            $match: {
                meetingId: req.params.meetingId
            }
        },
        {
            $group: {
                _id: "$docId",
                drawings: {
                    $push: {
                        drawingEvent: '$drawingEvent',
                        page: '$page',
                        userId: '$userId'
                    }
                }
            }
        }
    ]


    try {
        const result = await dbModels.DocDrawing.aggregate(pipeline);

        return res.status(200).send(result);
    } catch (err) {
        console.error(err);
        return res.status(500).send('internal server error');
    }
}


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
            return res.status(404).send({ message: 'no document' })
        }

        const command = new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: docInfo.saveKey
        })

        const response = await s3Client.send(command);
        res.attachment(docInfo.saveKey);

        response.Body.pipe(res);
    } catch (err) {
        console.error(err);
        return res.status(500).send('internal server error');
    }
}


// 문서 삭제
exports.deleteDoc = async (req, res) => {
    console.log(`
    --------------------------------------------------
      router.delete(/delete/:_id, meetingContollder.deleteMeetingPdfFile);
    --------------------------------------------------`);
    const dbModels = global.DB_MODELS;
    console.log(req.params._id)
    try {

        if (!req.params._id) {
            return res.status(400).send('invalid meeting id1');
        }


        result = await dbModels.Doc.findOne({ _id: req.params._id }, { _id: false, saveKey: true, meetingId: true });

        if (!result) {
            return res.status(400).send('invalid meeting id2');
        }


        const deletedDoc = await dbModels.Doc.findOneAndDelete(
            {
                _id: req.params._id
            }
        )

        const command = new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: deletedDoc.saveKey, // 업로드된 파일 경로
        });

        await s3Client.send(command);

        return res.status(200).send({
            message: 'upload file delete',
            meetingId: result.meetingId,
        });


    } catch (err) {
        console.log(err);
        res.status(500).send('internal server error');
    }
}