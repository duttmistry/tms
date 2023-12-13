import mongoose , { Schema } from 'mongoose';

const actionEmailTemplateBindSchema = new Schema({
    actionId: { type: Schema.Types.ObjectId, ref: 'Action', required: true },
    emailTemplateId: { type: Schema.Types.ObjectId, ref: 'Template', required: true },
    isActive : { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const ActionEmailTemplateBind = mongoose.model('ActionEmailTemplateBind', actionEmailTemplateBindSchema);

export default ActionEmailTemplateBind;