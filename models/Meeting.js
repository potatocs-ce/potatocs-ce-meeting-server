const mongoose = require('mongoose');

const meetingSchema = mongoose.Schema(
	{
    _id: {
      type : mongoose.Schema.Types.ObjectId
    },
		meetingName: { 
      type: String 
    },
    meetingCreator: { 
      type: String 
    },
		member: [{ 
      type: String 
    }],

    banMember: [{ 
      type: String 
    }],


		requestedDate: Date,
		confirmedDate: Date
	},
	{
		timestamps: true
	}
);

const whiteBoardMeeting = mongoose.model('whiteBoardMeeting', meetingSchema);

module.exports = whiteBoardMeeting;


