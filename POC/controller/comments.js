const { PrismaClient } = require('../generated/prisma');
const Prisma = new PrismaClient();
const {StatusCodes}=require('http-status-codes');
const {notFoundError,BadRequestError, unauthenticatedError}=require('../errors');

const createComments=async (req,res)=>{
    const ticketId=parseInt(req.params.id);
    const {comment}=req.body;
    if (!comment){
        throw new notFoundError("Comment must be there")
    };
    try{
        const ticket=await Prisma.tickets.findUnique({
            where:{id:ticketId}
        });
        if (!ticket){
            throw new notFoundError("Ticket does not exist")
        };
        const newComment=await Prisma.ticket_comments.create({
            data:{
                ticket_id:ticketId,
                author_id:req.user.id,
                comment_text:comment
            }
        })
        return res.status(StatusCodes.OK).json(newComment);


    }catch(error){
        console.log(error);
        return res.status(StatusCodes.UNAUTHORIZEd).json({
            error:"Something is wrong"
        })
    }

}
const showComments=async (req,res)=>{
    const ticketId=parseInt(req.params.id);
    try{
        const com=await Prisma.ticket_comments.findMany({
            where:{ticket_id:ticketId},
            orderBy:{created_at:'desc'},
            include:{
                users:{
                    select:{
                        name:true,
                        role:true
                    }
                }
            }
        });
        if (com.length===0){
            return res.json({
                message:"There are no comments"
            })
        }
        return res.json(com);
    }catch(error){
        console.log(error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            error:"Something is wrong"
        })
    }
}
const updateComments=async (req,res)=>{
    const commentId=parseInt(req.params.id);
    const {comment}=req.body;
    if (!comment){
        throw new notFoundError("Comment must be there")
    }
    try{
        const existingComment=await Prisma.ticket_comments.findUnique({
            where:{id:commentId},
            include:{tickets:true}
        });
        if (!existingComment){
            throw new notFoundError("comment not found")
        };
        if (existingComment.tickets && existingComment.tickets.status==='closed'){
            return res.status(StatusCodes.BAD_REQUEST).json({
                error:"Closed ticket's comment can't be edited"
            });
        }
            if (existingComment.author_id!==req.user.id){
                return res.status(StatusCodes.FORBIDDEN).json({
                    error:"You can'r edit someone else comment"
                })
            };
            const updatedComment=await Prisma.ticket_comments.update({
                where:{id:commentId},
                data:{
                    comment_text:comment
                }
            })
            return res.status(StatusCodes.OK).json(updatedComment)
        
    }
    catch(error){
        console.log(error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            error:"Something went wrong"
        })
    }
}
const deleteComment=async (req,res)=>{
    const commentId=parseInt(req.params.id);
    try{
        const existingComment=await Prisma.ticket_comments.findUnique({
            where:{id:commentId},
            include:{tickets:true}
        });
        if (!existingComment){
            throw new notFoundError("comment not found")
        };
        if (existingComment.tickets && existingComment.tickets.status==='closed'){
            return res.status(StatusCodes.BAD_REQUEST).json({
                error:"Closed ticket's comment can't be deleted"
            });
        }
            if (existingComment.author_id!==req.user.id){
                return res.status(StatusCodes.FORBIDDEN).json({
                    error:"You can'r delete someone else comment"
                })
            }; 
            await Prisma.ticket_comments.delete({
                where:{
                    id:commentId
                }
            });
            return res.status(StatusCodes.OK).json({
                message:"Comment is successfully deleted"
            })

    }catch(error){
        console.log(error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            error:"Something is wrong"
        })
    }
}
module.exports={
    createComments,
    showComments,
    updateComments,
    deleteComment
}