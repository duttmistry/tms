import mongoose , { Schema } from 'mongoose';

const InstanceVariableSchema = new Schema({
    name: { type: String, required: true }
});

const InstanceVariable = mongoose.model('InstanceVariable', InstanceVariableSchema);

export default InstanceVariable;