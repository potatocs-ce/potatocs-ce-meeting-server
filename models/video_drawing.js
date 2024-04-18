const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let videoDrawingSchema = new Schema({
    _id: mongoose.Schema.Types.ObjectId,
    meeting: {
        type: String
    },
    drawVarArray: [

    ]
})