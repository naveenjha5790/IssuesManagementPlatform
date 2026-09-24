const { PrismaClient } = require('../generated/prisma');
const Prisma = new PrismaClient();
const {StatusCodes}=require('http-status-codes');
const {notFoundError,unauthenticatedError,BadRequestError}=require('../errors');
const {createNotification}=require('./notification');
const assignTechnician=async (req,res)=>{
    const ticketId=parseInt(req.params.id);
    const {technicianId}=req.body;
    const curUser=req.user;

    if (curUser.role!=='Manager'){
        throw new unauthenticatedError("Only Manager can assign technician");
    }
    if (!technicianId){
        throw new notFoundError("Techician Id is neccesary for assignment")
    }
    try{
        const ticket=await Prisma.tickets.findUnique({
            where:{id:ticketId}
        });
        if (!ticket){
            throw new notFoundError("Ticket does not exist")
        }
        if (ticket.status==='closed'){
            return res.status(StatusCodes.BAD_REQUEST).json({
                error:"Closed ticket can not be assigned to anyone"
            })
        }
        const findTech=await Prisma.users.findUnique({
            where:{id:technicianId}
        });
        if (!findTech || findTech.role!=='Technician'){
            return res.status(StatusCodes.BAD_REQUEST).json({
                error:"Need a technician for a ticket to be assigned"
            })
        }
        const wasUnassigned = ticket.assigned_to === null;
        const oldTechnicianId = ticket.assigned_to; 
        const old=ticket.assigned_to ? String(ticket.assigned_to):'unassigned';
        const newTech=String(technicianId);
        
        if (ticket.assigned_to===parseInt(technicianId)){
            return res.status(StatusCodes.ACCEPTED).json({
                msg:"This technician is already assigned"
            })
        }
        const result=await Prisma.$transaction(async (ta)=>{
            let updatePayload={assigned_to:parseInt(technicianId)};

            let statusEntry=null;
            if (ticket.status==='open'){
                updatePayload.status='assigned'
            
             statusEntry={
                ticket_id:ticketId,
                changed_by:curUser.id,
                field_changed:'status',
                old_value:'open',
                new_value:'assigned'
            }
        }
            if (ticket.status==='reopen'){
                updatePayload.status='assigned'
            let statusEntry=null;
             statusEntry={
                ticket_id:ticketId,
                changed_by:curUser.id,
                field_changed:'status',
                old_value:'reopen',
                new_value:'assigned'
            }
           
            }
            const updateTicket=await ta.tickets.update({
                where:{id:ticketId},
                data:updatePayload
            });
            await ta.ticket_history.create({
                data:{
                    ticket_id:ticketId,
                    changed_by:curUser.id,
                    field_changed:'assigned_to',
                    old_value:old,
                    new_value:newTech
                }
                
            })
            if (statusEntry){
                await ta.ticket_history.create({
                    data:statusEntry
                })
            }
            return updateTicket;
        });
        await createNotification({
            ticketId:result.id,
            userId:result.assigned_to,
            type:'assignment',
            message:`You have been assigned the ticket with id ${result.id}`
        });
        if (wasUnassigned){
            await createNotification({
                ticketId:result.id,
                userId:result.creator_id,
                type:'statusChange',
                message:`Ticket with id ${result.id} of ${result.creator_id} has staus updated to assigned`
            })
        }else{
            await createNotification({
                ticketId:result.id,
                userId:oldTechnicianId,
                type:'technicianUpdate',
                message:`You have been unassigned from ticket with id ${result.id}`
            })
        }
        await createNotification({
            ticketId:result.id,
            userId:result.creator_id,
            type:'statusChange',
            message:`Your ticket with id ${result.id} has been updated techician named ${findTech.name}`
        })
        return res.json({
            message:wasUnassigned ?"Ticket successfully assigned":"Ticket technician succesfully changed",
            ticket:result
        })
    }
    catch(error){
        console.log(error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            error:"Something went wrong"
        });
    }
}
const listTechnicians = async (req, res) => {
     const curUser=req.user;
    if (curUser.role!=='Manager'){
        throw new unauthenticatedError("Only Manager can assign technician");
    }
  
    const techs = await Prisma.users.findMany({
        where: { role: 'Technician' }
    });
    return res.json(techs); 
};

module.exports={
    assignTechnician,
    listTechnicians
}