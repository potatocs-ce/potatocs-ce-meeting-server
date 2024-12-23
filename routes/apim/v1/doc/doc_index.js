const router = require('express').Router();
const docController = require('./doc_controller');

const multer = require("multer");
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
})

const upload = multer({
    storage: multerS3({
        s3: s3Client,
        bucket: process.env.AWS_S3_BUCKET,
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldName });
        },
        key: function (req, file, cb) {
            file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
            cb(null, `document/${Date.now().toString()}.${file.originalname}`);
        }
    })
})

// 문서 등록
router.post('/upload/:meetingId', upload.single('file'), docController.createDoc);

// 문서 목록 조회
router.get('/doc_list/:meetingId', docController.getDocList);


router.post('/clear_drawing', docController.clearDrawing)

// 문서 판서 목록 조회
router.get('/doc_drawing_list/:meetingId', docController.getDocDrawingList);

// 문서 조회
router.get('/:doc_id', docController.getDoc);

router.delete('/delete/:_id', docController.deleteDoc);


module.exports = router;
