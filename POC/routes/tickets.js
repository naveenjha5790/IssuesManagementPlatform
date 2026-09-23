const {createTickets, listTickets,listHistory,statusChange,priorityChange,updateTickets,listAllTickets,singleTicket}=require('../controller/tickets');
const {assignTechnician}=require('../controller/assignment');
const {createComments,showComments,updateComments,deleteComment
}=require('../controller/comments')
const {showNotifications,markAllAsRead,markAsRead}=require('../controller/notification')
const {authenticateUser}=require('../middleware/authenticateUser');
const {authorizeStaff}=require('../middleware/authorizeStaff')
const {authorizeUser}=require('../middleware/authorizeUser')
const express=require('express');
const router=express.Router();
router.route('/tickets').post(authenticateUser,authorizeUser,createTickets).get(authenticateUser,listTickets);
router.route('/tickets/:id/history').get(authenticateUser,listHistory);
router.route('/tickets/:id/status').patch(authenticateUser,statusChange);
router.route('/tickets/:id/priority').patch(authenticateUser,authorizeStaff,priorityChange)
router.route('/tickets/:id').patch(authenticateUser,updateTickets);
router.route('/tickets/:id/assignment').patch(authenticateUser,assignTechnician);
router.route('/tickets/all').get(authenticateUser,listAllTickets);
router.route('/tickets/:id/comments').post(authenticateUser,createComments).get(authenticateUser,showComments);
router.route('/comments/:id').patch(authenticateUser,updateComments).delete(authenticateUser,deleteComment);
router.route('/notification').get(authenticateUser,showNotifications);
router.route('/notification/:id/read').patch(authenticateUser,markAsRead)
router.route('/notification/read-all').patch(authenticateUser,markAllAsRead)
router.route('/tickets/:id').get(authenticateUser,singleTicket)
module.exports=router;