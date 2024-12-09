const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const member_Schema = mongoose.Schema(
	{
		email: { 
			type: String,
			required: true,
			unique: true,
			lowercase: true,
		},
		password: { 
			type: String,
			required: true, 
			trim: true,
		},
		name: { 
			type: String,
			required: true,
		},
		profile_img: { 
			type: String,
			default: ''
		},
		mobile: { 
			type: String,
			default: ''
		},
		department: { 
			type: String,
			default: '' 
		},
		isManager: { 
			type: Boolean, 
			default: false
		},
		position: { 
			type: String,
			default: ''
		},
		annual_leave: { 
			type: Number,
			default: 0
		},
		sick_leave: { 
			type: Number, 
			default: 0
		},
		replacementday_leave: { 
			type: Number,
			default: 0
		},
		location: { 
			type: String,
			default: ''
		},
		emp_start_date: { 
			type: Date,
			default: null
		},
		emp_end_date: { 
			type: Date,
			default: null
		},
	},
	{
		timestamps: true
	}
);

member_Schema.pre('save', function(next){
    var user = this;

    bcrypt.genSalt(10, function(err, salt) {
        if(err) return next(err)

        bcrypt.hash(user.password, salt, function(err, hash){
            if(err) return next(err)
            user.password = hash
            next()
        })
    });
})

member_Schema.methods.comparePassword = function (password, hash) {
	return new Promise((resolve, reject) => {
		bcrypt.compare(password, hash, (err, result) => {
			if (err) reject(err);
			else resolve(result);
		});
	});
}

const Member = mongoose.model('Member', member_Schema)

module.exports = Member;