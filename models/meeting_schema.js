const mongoose = require('mongoose');

const meetingScehma = mongoose.Schema(
	{
        manager: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Member',
        },
        enlistedMembers: [ // 스페이스에 있는 멤버들
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Member',
            }
        ],

        // 실시간 미팅에서 쓰이는 currentMembers
        currentMembers: [
            {
                _id : false, // 추가 : array 내에 object ID 생성 안함
                member_id:{
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Member',
                },
                role: {
                    type: String
                },
                online: {
                    type: Boolean
                }
            }
        ],
        docId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Document',
        },
        meetingTitle: {
            type: String
        },
        isDone: {
            type: Boolean
        },

        // 회의가 pending, open ,close인지 상태를 보여준다.
        status: {
            type: String
        },
        start_date: {
            type: Date
        },
        start_time: {
            type: String
        }
    

	},
	{
		timestamps: true
	}
);

const Meeting = mongoose.model('Meeting', meetingScehma);

module.exports = Meeting;


