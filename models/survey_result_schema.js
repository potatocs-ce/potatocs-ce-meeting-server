const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const survey_result_Schema = new Schema({
    survey_id: {
        type: mongoose.Schema.Types.ObjectId
    },
    result: {
        type: mongoose.Schema.Types.Mixed
    }
})


survey_result_Schema.set('timestamps', true);

module.exports = mongoose.model("survey_result", survey_result_Schema);