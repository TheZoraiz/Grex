const mongoose = require('mongoose')
const Schema = mongoose.Schema

module.exports = mongoose.model('SubmittedForm', new Schema({
    formId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'GroupForm',
    },
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    submittedData: {
        type: String,
        required: true,
    },
}, { timestamps: true, collection: 'submittedForms' }))