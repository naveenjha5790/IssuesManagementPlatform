const {StatusCodes}=require('http-status-codes')
const authorizeUser=(req,res,next)=>{
    if (req.user && req.user.role==='User'){
        return next();
    }
    return res.status(StatusCodes.UNAUTHORIZED).json({error:"Access denied, This is for users."});
}
module.exports={authorizeUser};