const jwt=require('jsonwebtoken');
const {unauthenticatedError}=require('../errors');
const authenticateUser=async (req,res,next)=>{
    const authHeader=req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')){
        throw next(new unauthenticatedError('Authentication Invalid'));
    }
    const token=authHeader.split(' ')[1];
    try{
        const payload=jwt.verify(token,process.env.JWT_SECRET);
        req.user={
            id:payload.userId || payload.id || payload._id,
            name:payload.name,
            role:payload.role
        };
        next();
    }
    catch (error){
        throw next(new unauthenticatedError("Authentication Failed"));
    }
    
}
module.exports={authenticateUser};