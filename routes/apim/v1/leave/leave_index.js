const router = require('express').Router();

/*-----------------------------------
	Contollers
-----------------------------------*/
const managerMngmtCtrl = require('./manager-mngmt/manager_controller');
const employeeMngmtCtrl = require('./employee-mngmt/employee_controller');
const leaveMngmtCtrl = require('./leave-mngmt/leave_controller');
const approvalMngmtCtrl = require('./approval-mngmt/approval_controller');

/*-----------------------------------
	Manager Management 매니저 정보 로딩, 찾기, 추가, 삭제
-----------------------------------*/
router.get('/get-manager', managerMngmtCtrl.getManager);
router.get('/find-manager/:id', managerMngmtCtrl.findManager);
router.post('/add-manager', managerMngmtCtrl.addManager);
router.delete('/cancel-pending/:id', managerMngmtCtrl.cancelPending);

/*-----------------------------------
	Employee Management 직원들의 요청 리스트, 수락, 삭제
-----------------------------------*/
// Pending Employee
router.get('/pending-list', employeeMngmtCtrl.getPendingList);
router.delete('/cancel-request/:id', employeeMngmtCtrl.cancelRequest);
router.put('/accept-request', employeeMngmtCtrl.acceptRequest);

// Employee List
router.get('/myEmployee-list', employeeMngmtCtrl.myEmployeeList);
router.get('/employee-info/:id', employeeMngmtCtrl.getEmployeeInfo);
router.put('/put-employee-info', employeeMngmtCtrl.UpdateEmployeeInfo);

// Main Leave Management
router.post('/request-leave', leaveMngmtCtrl.requestLeave);
router.get('/my-status', leaveMngmtCtrl.getMyLeaveStatus);

// Approval Management
router.get('/pending-leave-request', approvalMngmtCtrl.getLeaveRequest);
router.put('/approve-leave-request', approvalMngmtCtrl.approvedLeaveRequest);
module.exports = router;