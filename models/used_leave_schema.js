const mongoose = require('mongoose');

const usedLeaveSchema = mongoose.Schema(
	{
		requestor: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Member',
		},
		leaveType: {
			type: String,
		},
		leaveDuration: {
			type: Number,
		}
	},
	{
		timestamps: true
	}
);

const UsedLeave = mongoose.model('UsedLeave', usedLeaveSchema);

module.exports = UsedLeave;


