const router = require('express').Router();
const whiteBoardController = require('./whiteBoard_controller');

// multer 설정 -----------------------------------------------
const multer = require('multer');
const multerS3 = require('multer-s3');
const s3 = global.AWS_S3.s3;
const bucket = global.AWS_S3.bucket;

// Multer File upload settings
const DIR = './public/uploads/';

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, DIR);
    },
    filename: (req, file, callback) => {
        let datetimestamp = Date.now();
        let originalFileName = file.originalname;
        originalFileName = originalFileName.split('.');
        let originalName = originalFileName[originalFileName.length - 1];
        callback(null, file.fieldname + '_' + datetimestamp + '.' + originalName);
    }
});

// Multer Mime Type Validation
const upload = multer({
    // storage: storage,
    // limits: {
    //     fileSize: 1024 * 1024 * 16
    // },
    // fileFilter: (req, file, cb) => {
    //     if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
    //         cb(null, true);
    //     } else {
    //         cb(null, false);
    //         return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    //     }
    // }

    storage: multerS3({
		s3, // == s3: s3
		bucket,
		acl: 'public-read',
		contentType: multerS3.AUTO_CONTENT_TYPE,
		key: (req, file, cb) => {
			if (req.files && req.files.length > 0) {
				cb(null, `pdf/${Date.now()}.${file.originalname}`);
			} else {
				// 사진은 없고 텍스트만 있을 때는 어떻게 넘어가야하는지?? todo!!
			}
		}
    })
});


/* 미팅정보등록 */
router.get('/meetingInfo/:meetingId', whiteBoardController.meetingInfo);

/* 참가한 회의 정보 불러오기 */
router.get('/documentInfo/:meetingId', whiteBoardController.documentInfo);

/* 1개의 document(pdf) 불러오기 */
router.get('/document/:_id', whiteBoardController.document);

/* 파일 업로드 */
router.post('/upload/:meetingId', upload.any(), whiteBoardController.upload);

/* 파일 삭제 */
router.delete('/deleteMeetingPdfFile', whiteBoardController.deleteMeetingPdfFile);

/* 드로잉 이벤트 삭제 */
router.delete('/deleteDrawingEvent', whiteBoardController.deleteDrawingEvent);

/* 미팅 삭제 시 s3에 있는 파일 삭제 */
router.delete('/deleteMeetingPdfFile', whiteBoardController.deleteMeetingPdfFile)


module.exports = router;
