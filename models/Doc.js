const mongoose = require('mongoose');
const Schema = mongoose.Schema;


let docSchema = new Schema({
  _id: mongoose.Schema.Types.ObjectId,
  meetingId: {
    type: String
  },

  originalFileName: {
    type: String
  },
  fileName: {
    type: String
  },
  uploadUser: {
    type: String,
    // required: true, unique: true 
  },
  saveKey: {
    type: String
  },
  fileSize: {
    type: String
  },
  drawingEventSet: [
    {
      _id: false,
      pageNum: { type: Number },
      drawingEvent: {
        type: Object
        // point: [],
        // timeDiff: { type: Number },
        // tool: {
        //   color: {
        //     type: String
        //   },
        //   type: {
        //     type: String
        //   },
        //   width: {
        //     type: Number
        //   },
        // },

      }

    }
  ],
}, {
  timestamps: true,
  collection: 'docs'
})

module.exports = mongoose.model('Doc', docSchema)