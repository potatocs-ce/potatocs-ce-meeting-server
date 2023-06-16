const mongoose = require('mongoose');

const managerSchema = mongoose.Schema(
	{
		myManager: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Member',
			required: true
		},
		myId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Member',
			required: true
		},
		accepted: {
			type: Boolean,
			required: true
		},
		requestedDate: Date,
		confirmedDate: Date
	},
	{
		timestamps: true
	}
);

const Manager = mongoose.model('Manager', managerSchema);

module.exports = Manager;


