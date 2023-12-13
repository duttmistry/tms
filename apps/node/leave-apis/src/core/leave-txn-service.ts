import { WhereOptions } from 'sequelize';
import db from '../app/database/models';

const _leaveHistoryTransection = db.LeaveTransectionHistory;

export const CreditTransection = async (CreditData: any) => {
  return new Promise((resolve) => {
    const data = _leaveHistoryTransection.bulkCreate(CreditData);
    resolve(data);
  });
};

export const DeditTransection = async (DeditData: any) => {
  return new Promise((resolve) => {
    const data = _leaveHistoryTransection.bulkCreate(DeditData);
    resolve(data);
  });
};
