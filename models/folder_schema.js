const mongoose = require('mongoose');

const folderSchema = mongoose.Schema(
	{
		member_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Member',
			required: true
		},
		
		displayName: {
			type: String
		},
		children: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Space',
			}
		],
		in_order: {
			type: Number
		},
	},
	{
		timestamps: true
	}
);

const Folder = mongoose.model('Folder', folderSchema);

module.exports = Folder;


