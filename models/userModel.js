const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'User must have a name'],
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        validate: {
            validator: function (val) {
                const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                return val.match(emailRegex)
            },
            message: 'please enter valid email address',
        }
    },
    photo: {
        type: String,
    },
    password: {
        type: String,
        required: [true, 'please enter a password'],
        minlength: [8, 'A password must have atleast 8 characters'],
        select: false,
    },
    passwordConfirm: {
        type: String,
        required: [true, 'please confirm your password'],
        validate: {
            validator: function (val) {
                // NOTE:    THIS ONLY WORK ON CREATE() AND SAVE(), SO WE NEED TO TAKE CARE WHEN WE UPDATE THE PASS
                return val === this.password;
            },
            message: 'Password doesn\'t match'
        }
    },
    passwordChangedAt: {
        type: Date,
    }
});



// NOTE:    DOCUMENT MIDDLEWARE 
userSchema.pre('save', async function (next) {

    if (!this.isModified('password')) {
        return next();
    }

    this.password = await bcrypt.hash(this.password, 12);

    // delete the passconfirm field
    this.passwordConfirm = undefined;
    next();
});




// NOTE:    INSTANCE METHOD
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
}


userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
    if (this.passwordChangedAt) {
        const changedTimeStamp = +(this.passwordChangedAt.getTime() / 1000);
        
        return JWTTimeStamp < changedTimeStamp;
    }

    // false means not changed
    return false;
}



const User = mongoose.model('user', userSchema);


module.exports = {
    User
}