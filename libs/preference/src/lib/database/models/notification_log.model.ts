import * as mongoose from 'mongoose';

const notificationObjectSchemaTask = new mongoose.Schema({
    task_id : { type: Number, required: true },
    notificationTitle: { type: String, required: true },
    action_user : { type: String, required: true },
    employeeImage : { type: String, required: true , default : null },
    isRead: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const notificationObjectSchemaLeave = new mongoose.Schema({
    leave_id : { type: Number, required: true },
    notificationTitle: { type: String, required: true },
    action_user : { type: String, required: true },
    employeeImage : { type: String, required: true , default : null },
    isRead: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const notificationLogSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    notificationObjectSchemaTask : [notificationObjectSchemaTask],
    notificationObjectSchemaLeave : [notificationObjectSchemaLeave]
});

const NotificationLog = mongoose.model('NotificationLog', notificationLogSchema);

export default NotificationLog;
