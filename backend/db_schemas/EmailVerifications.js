const mongoose = require('mongoose')
const Schema = mongoose.Schema

module.exports = mongoose.model('EmailVerification', new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    verificationToken: String,
    
}, { timestamps: true, collection: 'emailVerifications' }))