const mongoose = require('mongoose');
const Schema = mongoose.Schema;


let drawingSchema = new Schema({
    meetingId: {
        type: String
    },
    // drawVarArray: [{
    //     drawingEventSet: {}, // ~~ 페이지별 draw evnet 모음todo  object array
    //     studentGuideDrawingEventSet: {}, // 1:1에서의 학생 drawing event
    //     teacherGuideDrawingEventSet: {}, // 1:1에서의 선생님 drawing event
    //     blindDrawingEventSet: [] // blind의 drawing event
    // }]
    docId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doc'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member'
    },
    page: {
        type: Number
    },
    drawingEvent: {
        type: Object
    }
}, {
    timestamps: true,
    collection: 'drawings'
})

module.exports = mongoose.model('Drawing', drawingSchema)