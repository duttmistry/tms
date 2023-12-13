import mongoose , { Schema } from 'mongoose';

const actionSchema = new Schema({
    name: { type: String, required: true },
    isActive : { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Action = mongoose.model('Action', actionSchema);

export default Action;
