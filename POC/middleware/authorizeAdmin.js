const {StatusCodes}=require('http-status-codes')
const authorizeAdmin=(req,res,next)=>{
    if (req.user && req.user.role==='Admin'){
        return next();
    }
    return res.status(StatusCodes.UNAUTHORIZED).json({error:"Access denied, This is for Super Admin privilages."});
}
module.exports={authorizeAdmin};