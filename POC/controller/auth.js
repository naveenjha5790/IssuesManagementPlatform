const {StatusCodes}=require('http-status-codes')
const bcrypt=require('bcryptjs');
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const jwt=require('jsonwebtoken');
const { unauthenticatedError } = require('../errors');
const signup=async (req,res)=>{
    const {email,name,password}=req.body;
     if (!email.includes('@')) {
        return res.status(StatusCodes.NOT_ACCEPTABLE).json({ error: "Please enter a valid email address." });
    }

    if (!password || password.length < 8) {
        return res.status(StatusCodes.LENGTH_REQUIRED).json({ error: "Password must be at least 8 characters long." });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = await prisma.users.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role:'User'
            }
        });

        return res.status(StatusCodes.OK).json({ message: "Registration successful!" });
    } catch (error) {
        console.error(error);
        return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({ error: "Registration failed due to a database error." });
    }
}
const adminPrivilage=async (req,res)=>{
    const {targetId,newRole}=req.body;
    const allowedRoles=['Admin','User','Manager','Technician'];
    if (!allowedRoles.includes(newRole)){
        return res.status(StatusCodes.UNAUTHORIZED).json({error:"Invalid role Assignemnt Requested"});
    }
    try{
        const updatedUser=await prisma.users.update({
            where :{id:parseInt(targetId)},
            data:{role:newRole}
        });
        return res.json({
            message:`Successfully updated role`,
            user:{
                email:updatedUser.email,newRole:updatedUser.role
            }
        })
    }
    catch (error){
        if (error.code === 'P2025') { 
            return res.status(StatusCodes.NOT_FOUND).json({ error: "User account not found." });
        }
        console.error(error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Failed to update user privileges." });
    }
}
const login=async (req,res)=>{
    const {email,password}=req.body;
    if (!email || !password){
        return res.status(StatusCodes.UNAUTHORIZED).json({error:"Invalid credentials"});
    }
    try{
        const user=await prisma.users.findUnique({
            where:{email:email}
        });
        if (!user){
            return res.status(StatusCodes.UNAUTHORIZED).json({error:"invalid credentials"})
        }
        const isPasswordValid=await bcrypt.compare(password,user.password);
        if (!isPasswordValid){
            return res.status(StatusCodes.UNAUTHORIZED).json({error:"Invalid Credentials"});
        }
        const tokenPayload={
            id:user.id,
            email:user.email,
            role:user.role
        }
        const token=jwt.sign(tokenPayload,process.env.JWT_SECRET,{expiresIn:'8h'});
        res.cookie('authToken', token, {
            httpOnly: true,    
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'lax',    
            maxAge: 28800000    
        });

        return res.json({
            message: "Login successful!",
            token:token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
}catch(err){
    console.log(err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error:"Something went wrong"
    })
}
}
const viewProfile=async (req,res)=>{
    try{
        const user=await prisma.users.findUnique({
            where:{id: req.user.id},
            select:{
                email:true,
                name:true,
                role:true
            }
        })
        if (!user) res.status(StatusCodes.NOT_FOUND).json({error:"User does not exist"});
        res.status(StatusCodes.OK).json(user);
    }catch(error){
        console.log(error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({error:"Something is wrong"});
    }
}
const listAllUsers=async(req ,res)=>{
    const curUser=req.user;
    if (curUser.role !=='Admin' && curUser.role!=='Manager'){
        throw new unauthenticatedError("Access denied! You can not access this feature")
    }
    const {role,
        search,
        page=1,
        limit=10
    }=req.query;

    let filters={};
    if (role){
        const validRoles=['User','Admin','Manager','Technician'];
        if (validRoles.includes(role)){
            filters.role=role;
        }else{
            return res.status(StatusCodes.BAD_REQUEST).json({error:"Invalid role"})
        }
    }

    if (search){
        filters.OR=[
            {name:{contains:search,mode:'insensitive'}},
            {email:{contains:search,mode:'insensitive'}}
        ];
    }
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const skipNum = (pageNum - 1) * limitNum;

    try{
        const [tc,ul]=await Promise.all([
            prisma.users.count({where:filters}),
            prisma.users.findMany({
                where:filters,
                skip:skipNum,
                take:limitNum,
                orderBy:{id:'asc'},
                select:{
                    id:true,
                    name:true,
                    email:true,
                    role:true
                }
            })
        ])
        return res.json({
            meta:{
                total_records:tc,
                current_page:pageNum,
                limit:limitNum,
                total_pages:Math.ceil(tc/limitNum)
            },
            users:ul
        });
    }
    catch(error){
        console.log(error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            error:"Something went wrong"
        })
    }

}
module.exports={
    signup,
    adminPrivilage,
    login,
    viewProfile,
    listAllUsers
}