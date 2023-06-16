const mongoose = require('mongoose');

const leaveRequestSchema = mongoose.Schema(
	{
		requestor: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Member',
		},
		approver: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Member',
		},
		leaveType: {
			type: String,
		},
		leaveDuration: {
			type: Number,
		},
		leave_start_date: {
			type: Date,
		},
		leave_end_date: {
			type: Date,
		},
		leave_reason: {
			type: String,
		},
		status: {
			type: String,
		},
	},
	{
		timestamps: true
	}
);

const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema);

module.exports = LeaveRequest;


