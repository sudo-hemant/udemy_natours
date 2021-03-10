const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');


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
    role: {
        type: String,
        enum: {
            values: ['user', 'guide', 'lead-guide', 'admin'],
        },
        default: 'user',
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
                // TODO: 
                // NOTE:    THIS ONLY WORK ON CREATE() AND SAVE(), SO WE NEED TO TAKE CARE WHEN WE UPDATE THE PASS
                return val === this.password;
            },
            message: 'Password doesn\'t match'
        }
    },
    passwordChangedAt: {
        type: Date,
    },
    passwordResetToken: {
        type: String,
    },
    passwordResetExpires: {
        type: Date,
    },
});



// NOTE:    DOCUMENT MIDDLEWARE 

// to check if the password is modified, if it is then we need to store the password in encrypted form
// not in raw form for secruity reasons
userSchema.pre('save', async function (next) {
    // TODO:    isModified
    if (!this.isModified('password')) {
        return next();
    }

    this.password = await bcrypt.hash(this.password, 12);

    // delete the passconfirm field
    this.passwordConfirm = undefined;
    next();
});


// we check if the password is not modified and the document is not being created for the first time,
// if it is, then we don't update the passwordChangedAt property 
// else we update the passwordChangedAt property 
userSchema.pre('save', function(next) {
    if (!this.isModified('password') || this.isNew) {
        return next();
    } 
    this.passwordChangedAt = Date.now() - 1000;

    next();
});




//NOTE:  INSTANCE METHOD

//          to check if the password is correct
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};


// to check if the password was changed after the token is issued, so to not allow user to perform 
//          operation with old token
userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
    if (this.passwordChangedAt) {
        const changedTimeStamp = +(this.passwordChangedAt.getTime() / 1000);
        
        return JWTTimeStamp < changedTimeStamp;
    }

    // false means not changed
    return false;
};


// create password reset token 
userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    // we will not store the raw reset token in our db, so we encrypt it with normal encryption library
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // for 10 minutes
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
};



const User = mongoose.model('user', userSchema);


module.exports = {
    User
}