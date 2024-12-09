const mongoose = require('mongoose');
const Meeting = require('./meeting_schema');
const Schema = mongoose.Schema;

let videoDrawingSchema = new Schema({

    // 어디에
    meetingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Meeting'
    },
    // 누구에게
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member'
    },
    // 누가
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member'
    },

    //뭘
    drawingEvent: {
        type: Object
    },
    // 스크린 공유 화면에 그렸는지 여부 판단
    screen: {
        type: Boolean
    }
},
    {
        timestamps: true
    })

const VideoDrawing = mongoose.model('VideoDrawing', videoDrawingSchema);

module.exports = VideoDrawing;