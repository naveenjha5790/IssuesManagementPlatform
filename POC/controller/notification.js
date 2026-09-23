const { PrismaClient } = require('../generated/prisma');
const Prisma = new PrismaClient();
const {StatusCodes}=require('http-status-codes');
const {notFoundError,BadRequestError, unauthenticatedError}=require('../errors');

const createNotification=async ({ticketId, userId, type,message})=>{
    if (!userId) return null;
    try{
        return await Prisma.notification.create({
            data:{
                ticket_id:ticketId,
                user_id:userId,
                type:type,
                message:message,
                is_read:false
            }
        });
    } catch(error){
        console.log(error);
        return resizeBy.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            error:"Something went wrong"
        });
    }
}
const showNotifications=async (req,res)=>{
    const userId=req.user.id;
    const {unreadOnly}=req.query;
    try{
       let search={user_id:userId}
        if (unreadOnly==='true'){
            search.is_read=false;
        }
        const alerts=await Prisma.notification.findMany({
            where:search,
            orderBy:{id:'desc'}
        })
        if (alerts.length===0){
            return res.json({
                message:"You have no notifcations to see"
            })
        }
        return res.status(StatusCodes.OK).json(alerts)
    }catch(error){
        console.log(error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            error:"Something is wrong"
        })
    }
}
const markAsRead=async (req,res)=>{
    const notificationId=parseInt(req.params.id);
    const userId=req.user.id;
    try{
        const alert=await Prisma.notification.findUnique({
            where:{id:notificationId}
        });
        if (!alert){
            throw new notFoundError("Notification does not exist")
        }
        if (alert.user_id!==userId){
            return res.status(StatusCodes.UNAUTHORIZED).json({
                error:"Access denied! you are not allowed access"
            })
        }
        const updateNotification=await Prisma.notification.update({
            where:{id:notificationId},
            data:{is_read:true}
        })
        return res.status(StatusCodes.OK).json(updateNotification);
    }catch(error){
        console.log(error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            error:"Something is wrong"
        })
    }
}
const markAllAsRead=async (req,res)=>{
    const userId=req.user.id;
    try{
        const updateAll=await Prisma.notification.updateMany({
            where:{
                user_id:userId,
                is_read:false
            },
            data:{
                is_read:true
            }
        });
        return res.status(StatusCodes.OK).json({
            message:`cleared ${updateAll.count} unread notifications`
        })
    }catch(error){
        console.log(error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            error:"Something went wrong"
        })
    }
}
module.exports={
    createNotification,
    showNotifications,
    markAllAsRead,
    markAsRead
}
