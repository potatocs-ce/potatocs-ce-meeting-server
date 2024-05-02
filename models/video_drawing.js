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
    }
})

const VideoDrawing = mongoose.model('VideoDrawing', videoDrawingSchema);

module.exports = VideoDrawing;