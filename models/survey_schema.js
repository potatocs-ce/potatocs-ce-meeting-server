const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const survey_Schema = new Schema({
    meetingId: {
        type: mongoose.Schema.Types.ObjectId
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String
    },
    cards: [
        {
            _id: false,
            user_id: {
                type: mongoose.Schema.Types.ObjectId,
            },
            index: {
                type: Number,
                required: true
            },
            item_title: {
                type: String,
            },
            num_of_answer: {
                type: Number,
                required: true
            },
            required: {
                type: Boolean
            },
            item_options: [
                {
                    index: {
                        type: Number,
                        required: true
                    },
                    option: {
                        type: String
                    }
                }
            ]
        }
    ]
})


survey_Schema.set('timestamps', true);

module.exports = mongoose.model("Survey", survey_Schema);