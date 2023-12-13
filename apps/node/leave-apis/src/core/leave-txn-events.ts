import { EventEmitter } from 'events';
import { CreditTransection, DeditTransection } from './leave-txn-service';
import LeaveService from '../app/api/leave/services/leave.service';
import LeaveSubjectsService from '../app/api/leave_subjects/services/leave_subjects.service';
import { constants } from 'buffer';
const eventEmitter = new EventEmitter();
const leaveService = new LeaveService();
const leaveSubjectsService = new LeaveSubjectsService();

enum MyEnum {
  CL = 'CL',
  PL = 'PL',
  LWP = 'LWP',
}

//#region [ADD LEAVE BY USER]
eventEmitter.on('addLeaveByUser', async (from_date, to_date, leave_type, leave_subject, user_id, loggedInUserId) => {
  const getUserName = await leaveService._getUserDetails({ id: loggedInUserId });

  const getSubject =
    typeof leave_subject === 'number' ? await leaveSubjectsService._getLeaveSubjectById({ id: leave_subject }) : { title: leave_subject };

  const getBalance = await leaveService._getleaveBalance({ user_id: user_id });

  const EventObject = leave_type.map((type) => {
    const leaveBalance = getBalance.find((lb) => lb.leave_type === type.leave_type);

    return {
      user_id: leaveBalance.user_id,
      leave_type: leaveBalance.leave_type,
      credit: null,
      debit: Number(type.leave_days),
      after_balance: leaveBalance.current_balance,
      remarks:
        user_id === loggedInUserId
          ? `Leave applied by you : Leave Dates: ${from_date} - ${to_date} | Subject: ${getSubject.title}`
          : `Leave applied by ${getUserName.first_name} ${getUserName.last_name} : Leave Dates: ${from_date} - ${to_date} | Subject: ${getSubject.title}`,
      created_by: user_id,
      created_date: new Date(),
    };
  });

  // credit leave by system logic here

  await DeditTransection(EventObject);
});
//#endregion   [ADD LEAVE BY USER]

//#region [ADD LEAVE BY USER]
eventEmitter.on('updateLeaveByUser', async (from_date, to_date, old_leave_type, new_leave_type, leave_subject, user_id, loggedInUserId) => {
  // add leave by user logic here
  const getUserName = await leaveService._getUserDetails({ id: loggedInUserId });

  const getSubject =
    typeof leave_subject === 'number' ? await leaveSubjectsService._getLeaveSubjectById({ id: leave_subject }) : { title: leave_subject };

  const newBalance = await leaveService._getleaveBalance({ user_id: user_id });

  let EventObject = newBalance.map((balance) => {
    const oldLeaveType = old_leave_type.find((OL) => OL.leave_type === balance.leave_type);
    const newLeaveType = new_leave_type.find((NL) => NL.leave_type === balance.leave_type);

    return {
      user_id: balance.user_id,
      leave_type: balance.leave_type,
      credit: oldLeaveType ? oldLeaveType.leave_days : null,
      debit: newLeaveType ? newLeaveType.leave_days : null,
      after_balance: balance.current_balance,
      remarks:
        user_id === loggedInUserId
          ? `Leave updated by you : Leave Dates : ${from_date} - ${to_date} | Subject: ${getSubject.title}`
          : `Leave updated by ${getUserName.first_name} ${getUserName.last_name} : Leave Dates: ${from_date} - ${to_date} | Subject: ${getSubject.title}`,
      created_by: loggedInUserId,
      created_date: new Date(),
    };
  });

  // credit leave by system logic here
  await DeditTransection(EventObject);
});
//#endregion   [ADD LEAVE BY USER]

//#region [CANCEL LEAVE BY USER]
eventEmitter.on('cancelLeaveByUser', async (from_date, to_date, leave_type, leave_subject, user_id, loggedInUserId) => {
  // Delete leave by user logic here
  const getUserName = await leaveService._getUserDetails({ id: loggedInUserId });

  const getSubject =
    typeof leave_subject === 'number' ? await leaveSubjectsService._getLeaveSubjectById({ id: leave_subject }) : { title: leave_subject };

  const creditBalance = await leaveService._getleaveBalance({ user_id: user_id });

  const EventObject = leave_type.map((type) => {
    const leaveBalance = creditBalance.find((lb) => lb.leave_type === type.leave_type);
    return {
      user_id: leaveBalance.user_id,
      leave_type: leaveBalance.leave_type,
      credit: Number(type.leave_days),
      debit: null,
      after_balance: leaveBalance.current_balance,
      remarks:
        user_id === loggedInUserId
          ? `Leave canceled by you : Leave Dates: ${from_date} - ${to_date} | Subject: ${getSubject.title}`
          : `Leave canceled by ${getUserName.first_name} ${getUserName.last_name} : Leave Dates: ${from_date} - ${to_date} | Subject: ${getSubject.title}`,
      created_by: loggedInUserId,
      created_date: new Date(),
    };
  });

  // credit leave by system logic here
  await CreditTransection(EventObject);
});
//#endregion  [CANCEL LEAVE BY USER]2

//#region [CREDIT LEAVE BY SYSTEM]
eventEmitter.on('creditLeaveBySuperiority', async (addedLeave, leaveType, leaveComment, employee_id, user_id) => {
  // credit leave by system logic here
  console.log('creditLeaveBySuperiority');
  const getBalance = await leaveService._getleaveBalance({ user_id: employee_id, leave_type: leaveType });

  const EventObject = getBalance.map((res) => {
    return {
      user_id: res.user_id,
      leave_type: leaveType,
      credit: addedLeave,
      debit: null,
      after_balance: res.current_balance,
      remarks: leaveComment,
      created_by: user_id,
      created_date: new Date(),
    };
  });

  // credit leave by system logic here
  await CreditTransection(EventObject);
});
//#endregion [CREDIT LEAVE BY SYSTEM]

//#region [CREDIT LEAVE BY SUPERIORITY]
eventEmitter.on('updateLeaveBySuperiority', async (oldData, currentData, leave_type, Comments, employee_id, user_id) => {
  const getBalance = await leaveService._getleaveBalance({ user_id: employee_id });
  const getUserName = await leaveService._getUserDetails({ id: user_id });

  console.log('oldData', oldData);
  console.log('currentData', currentData);

  // console.log('getBalance', getBalance);
  console.log('Comments', Comments);
  console.log('employee_id', employee_id);
  console.log('getUserName', getUserName);

  const balanceData = getBalance.find((lb) => lb.leave_type.toString() === leave_type);
  const creditData = currentData - oldData;

  const EventObject = {
    user_id: balanceData.user_id,
    leave_type: balanceData.leave_type,
    credit: creditData > 0 ? creditData : null,
    debit: creditData < 0 ? Math.abs(creditData) : null,
    after_balance: balanceData.current_balance,
    remarks: `Manual adjustment has been made on ${balanceData.leave_type} from ${oldData} to ${currentData} by ${getUserName.first_name} ${getUserName.last_name}, Additional Info: ${Comments}`,
    created_by: user_id,
    created_date: new Date(),
  };

  // credit leave by system logic here
  await CreditTransection([EventObject]);
});
//#endregion  [CREDIT LEAVE BY SUPERIORITY]

//#region [CANCEL LEAVE BY SUPERIORITY]
eventEmitter.on('cancelLeaveBySuperiority', async (from_date, to_date, leave_type, leave_subject, user_id, loggedInUserId) => {
  // Delete leave by user logic here
  const getUserName = await leaveService._getUserDetails({ id: loggedInUserId });

  const getSubject =
    typeof leave_subject === 'number' ? await leaveSubjectsService._getLeaveSubjectById({ id: leave_subject }) : { title: leave_subject };

  const creditBalance = await leaveService._getleaveBalance({ user_id: user_id });

  const EventObject = leave_type.map((type) => {
    const leaveBalance = creditBalance.find((lb) => lb.leave_type === type.leave_type);

    return {
      user_id: leaveBalance.user_id,
      leave_type: leaveBalance.leave_type,
      credit: Number(type.leave_days),
      debit: null,
      after_balance: leaveBalance.current_balance,
      remarks:
        user_id === loggedInUserId
          ? `Leave rejected by you : Leave Dates: ${from_date} - ${to_date} | Subject: ${getSubject.title}`
          : `Leave rejected by ${getUserName.first_name} ${getUserName.last_name} : Leave Dates: ${from_date} - ${to_date} | Subject: ${getSubject.title}`,
      created_by: loggedInUserId,
      created_date: new Date(),
    };
  });

  // credit leave by system logic here
  await CreditTransection(EventObject);
});
//#endregion  [CANCEL LEAVE BY SUPERIORITY]

//#region [APPROVED LEAVE BY SUPERIORITY]
eventEmitter.on('approveLeaveBySuperiority', async (from_date, to_date, leave_type, leave_subject, user_id, loggedInUserId) => {
  const getUserName = await leaveService._getUserDetails({ id: loggedInUserId });

  const getSubject =
    typeof leave_subject === 'number' ? await leaveSubjectsService._getLeaveSubjectById({ id: leave_subject }) : { title: leave_subject };

  const creditBalance = await leaveService._getleaveBalance({ user_id: user_id });

  const EventObject = leave_type.map((type) => {
    const leaveBalance = creditBalance.find((lb) => lb.leave_type === type.leave_type);

    return {
      user_id: leaveBalance.user_id,
      leave_type: leaveBalance.leave_type,
      credit: null,
      debit: null,
      after_balance: leaveBalance.current_balance,
      remarks:
        user_id === loggedInUserId
          ? `Leave approved by you : Leave Dates: ${from_date} - ${to_date} | Subject: ${getSubject.title}`
          : `Leave approved by ${getUserName.first_name} ${getUserName.last_name} : Leave Dates: ${from_date} - ${to_date} | Subject: ${getSubject.title}`,
      created_by: loggedInUserId,
      created_date: new Date(),
    };
  });

  // credit leave by system logic here
  await CreditTransection(EventObject);
});
//#endregion  [APPROVED LEAVE BY SUPERIORITY]

export default eventEmitter;
