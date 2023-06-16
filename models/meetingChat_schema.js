const mongoose = require('mongoose');

const meetingChatScehma = mongoose.Schema(
	{
		meetingId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Document',
		},
		userId: {
			type: mongoose.Schema.Types.ObjectId,
            ref: 'Member',
		},
        chatMember: {
            type: String,
        },
		chatContent: {
			type: String,
		},     
	},
	{
		timestamps: true
	}
);

const MeetingChat = mongoose.model('MeetingChat', meetingChatScehma);

module.exports = MeetingChat;


