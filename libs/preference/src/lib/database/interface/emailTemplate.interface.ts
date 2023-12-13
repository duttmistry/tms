import { Document } from "mongoose";

export interface IEmailTemplate extends Document {
    name: string;
    subject: string;
    content: string;
    createdBy: string;
    updatedBy: string; 
    createdAt: Date;
    updatedAt: Date;
}

