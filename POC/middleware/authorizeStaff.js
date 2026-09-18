const {StatusCodes}=require('http-status-codes');
const authorizeStaff=async (req,res,next)=>{
    const allowed=['Technician','Admin','Manager'];
    if (req.user && allowed.includes(req.user.role)){
        return next();
    }
    return res.status(StatusCodes.UNAUTHORIZED).json({error:"You don't have authority to access"});
}
module.exports={
    authorizeStaff
};