import mongoose , { Schema } from 'mongoose';

const TemplateSchema = new Schema({ 
    name: { type: String, required: true },
    subject: { type: String, required: true },
    content: { type: String, required: true },
    notificationMessage: { type: String, required: true },
    chatMessage: { type: String, required: true },
    createdBy: { type: String,  required: true },
    isActive : { type: Boolean, default: true },
    updatedBy: { type: String,  required : false},
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Template = mongoose.model('Template', TemplateSchema);

export default Template;