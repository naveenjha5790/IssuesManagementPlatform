const {signup,adminPrivilage,login,viewProfile,listAllUsers}=require('../controller/auth');
const {authenticateUser}=require('../middleware/authenticateUser');
const {authorizeAdmin}=require('../middleware/authorizeAdmin')
const express=require('express');
const router=express.Router();
router.post('/signup',signup);
router.post('/login',login)
router.route('/adminPrivilage').patch(authenticateUser,authorizeAdmin,adminPrivilage);
router.route('/viewProfile').get(authenticateUser,viewProfile);
router.route('/users').get(authenticateUser,listAllUsers)
module.exports=router;