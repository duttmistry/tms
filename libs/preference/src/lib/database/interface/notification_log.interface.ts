import { Document } from 'mongoose';

interface INotificationObject {
    notificationTitle: string;
    isRead: boolean;
    isDeleted: boolean;
}

interface INotificationLog extends Document {
    userId: string;
    notificationObject: INotificationObject[];
    createdAt: Date;
    updatedAt: Date;
}

export { INotificationLog, INotificationObject };


