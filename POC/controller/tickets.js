const { PrismaClient } = require('../generated/prisma');
const Prisma = new PrismaClient();
const {StatusCodes}=require('http-status-codes');
const {notFoundError,BadRequestError, unauthenticatedError}=require('../errors');
const { contains } = require('list');
const {createNotification}=require('./notification');
const createTickets=async (req,res)=>{
    const {title,description,category,locationDetails}=req.body;
    if (!title ||!description || !category || !locationDetails){
        throw new notFoundError("These details are necessary to raise a new ticket");
    }
        try{
            const newTicket=await Prisma.tickets.create({
                data:{
                    title,
                    description,
                    category,
                    location_details:locationDetails,
                    status:'open',
                    creator_id:req.user.id
                }
            });
            await Prisma.ticket_history.create({
                data:{
                    ticket_id:newTicket.id,
                    changed_by:req.user.id,
                    field_changed:'status',
                    old_value:'none',
                    new_value:'open'

                }
            });
            
            return res.status(StatusCodes.CREATED).json(newTicket);
        }catch(error){
            console.log(error);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({error:"Failed to create a ticket"});
        }
}

const listTickets=async (req,res)=>{
    const {category,priority,status,
        search,
        page=1,
        limit=10
    }=req.query;
    let filters={};
    if (req.user.role==='User'){
        filters.creator_id=req.user.id;
    }else if (req.user.role==='Technician'){
        filters.assigned_to=req.user.id;
    }
    if (category) filters.category=category;
    if (priority) filters.priority=priority;
    if (status) filters.status=status;

    if (search){
        filters.OR=[
            {title:{contains:search,mode:'insensitive'}},
            {description:{contains:search,mode:'insensitive'}}
        ];
    }
    const pageNum=Math.max(1,parseInt(page));
    const limNum=Math.max(1,parseInt(limit));
    const skipSum=(pageNum-1)*limNum;
    try{
        const [tc,tl]=await Promise.all([
            Prisma.tickets.count({where:filters}),
            Prisma.tickets.findMany({
                where:filters,
                skip:skipSum,
                take:limNum,
                orderBy:{
                    created_at:'asc'
                },
            include: {
                users_tickets_creator_idTousers: {
                    select: { name: true, email: true }
                },
                users_tickets_assigned_toTousers: {
                    select: { name: true, email: true }
                }
            },
            orderBy:{created_at:'desc'}
        })
    ])
        return res.json({
            meta:{
                total_records:tc,
                current_page:pageNum,
                limit:limNum,
                total_pages:Math.ceil(tc/limNum)
            },
            tickets:tl
        });
    }catch(error){
        console.log(error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            error:"Failed to list records"
        })
    }

}
const listHistory=async (req,res)=>{
    const ticketId=parseInt(req.params.id);
    try {
        const history=await Prisma.ticket_history.findMany({
            where:{ticket_id:ticketId},
            orderBy:{changed_at:'asc'},
            include:{
                users:{
                    select:{
                        name:true,
                        email:true,
                        role:true
                    }
                }
            }
        });
        if (history.length===0) {
            const ticketExist=await Prisma.tickets.findUnique({
                where:{id:ticketId}
            });
            if (!ticketExist) return res.status(StatusCodes.NOT_FOUND).json({error:"Ticket does not exist"});
            
        }return res.json(history);
    }catch(error){
        console.log(error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({error:"Something went wrong"})
    }
}
const statusChange=async (req,res)=>{
    const ticketId=parseInt(req.params.id);
    const {newStatus}=req.body;
     const validStatus=['open','assigned','in_progress','resolved','closed','reopen'];
    if (!validStatus.includes(newStatus)){
        return res.status(StatusCodes.BAD_REQUEST).json({error:"Please provide a valid Status"})
    }
    try{
        const ticket=await Prisma.tickets.findUnique({
            where:{id:ticketId}
        });
        if (!ticket){
            return res.status(StatusCodes.NOT_FOUND).json({error:"Ticket does not exist"});
        }
        const curStatus=ticket.status;
        const role=req.user.role;
        if (curStatus==='closed' && newStatus!=='reopen'){
            return res.status(StatusCodes.UNAUTHORIZED).json({error:"Ticket is already closed and except reopen no other status change is allowed"});
        }
        if (curStatus===newStatus){
            return res.status(StatusCodes.CONFLICT).json({error:`The status is already at ${newStatus}`});
        }
        const allowed={
            'open':['assigned'],
            'assigned':['in_progress'],
            'in_progress':['resolved'],
            'resolved':['closed'],
            'closed':['reopen'],
            'reopen':['assigned']
        };
        const validNextStatus=allowed[curStatus] ||[];
        if (!validNextStatus.includes(newStatus)){
            return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({error:`Not allowed to change Status from ${curStatus} to ${newStatus}`});
        };
        if (curStatus === 'closed' && newStatus === 'reopen') {
            const closedDate = await Prisma.ticket_history.findFirst({
                where: {
                    ticket_id: ticketId,
                    field_changed: 'status',
                    new_value: 'closed'
                },
                orderBy: { changed_at: 'desc' }
            });
        const closureDate = closedDate ? new Date(closedDate.changed_at) : new Date(ticket.updated_at);
            const now = new Date();
            const daysDifference = (now - closureDate) / (1000 * 60 * 60 * 24);

            if (daysDifference > 30) {
                return res.status(StatusCodes.BAD_REQUEST).json({ 
                    error: "Tickets closed for more than 30 days cannot be reopened." 
                });
            }
        }
        if (role==='User'){
            if ((curStatus==='resolved' && newStatus==='closed') || (curStatus==='closed' && newStatus==='reopen')){
                    if (ticket.creator_id !== req.user.id) {
                    return res.status(StatusCodes.UNAUTHORIZED).json({ error: "You can only modify your own tickets" });
                }
            }else{
                return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({error:"User is not allowed to perform this operation"});
            }
        };
        const result=await Prisma.$transaction(async (tx)=>{
            const finalStatus = newStatus === 'reopen' ? 'open' : newStatus;
            const updated=await tx.tickets.update({
                where:{id:ticketId},
                data:{status:finalStatus}
            });
            await tx.ticket_history.create({
                data:{
                    ticket_id:ticketId,
                    changed_by:req.user.id,
                    field_changed:'status',
                    old_value:curStatus,
                    new_value:newStatus
                }
            });
            if (newStatus==='resolved'){
                await createNotification({
                    ticketId:updated.id,
                    userId:updated.creator_id,
                    type:"resolutionClosure",
                    message:`Your ticket ${updated.id} has been resolved. You may close the ticket now`
                })
            }else{
            await createNotification({
                ticketId:updated.id,
                userId:updated.creator_id,
                type:'statusChange',
                message:`Your ticket ${updated.id} status has been updated to ${updated.status}`
            })
        }
            return updated;
        });
        return res.status(StatusCodes.OK).json({message:`Tickets successfully moved to state ${newStatus} from ${curStatus}`})
    }catch(error){
        console.log(error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({error:"Something is wrong"})
    }
}
const priorityChange=async (req,res)=>{
    const ticketId=parseInt(req.params.id);
    const {newPriority}=req.body;
    const validPriority=['low','medium','high','urgent'];
    if (!validPriority.includes(newPriority)){
        return res.status(StatusCodes.NOT_ACCEPTABLE).json({
            error:"This value is not acceptable"
        })
    }
    try{
        const ticket=await Prisma.tickets.findUnique({
            where:{id:ticketId}
        });
        if (!ticket){
            return res.status(StatusCodes.NOT_FOUND).json({error:"Ticket does not exist"})
        }
        const result=await Prisma.$transaction(async (ty)=>{
            const updated=await ty.tickets.update({
                where:{id:ticketId},
                data:{
                    priority:newPriority
                }

            });
            await ty.ticket_history.create({
                data:{
                    ticket_id:ticketId,
                    changed_by:req.user.id,
                    field_changed:'priority',
                    old_value:ticket.priority || 'medium',
                    new_value:newPriority
                }
            })
            return updated
        })
        return res.status(StatusCodes.OK).json(result)
    }
    catch(error){
        console.log(error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            error:"Something went wrong"
        })
    }
}
const updateTickets=async (req,res)=>{
    const ticketId=parseInt(req.params.id);
    const {title, description, category,location_details}=req.body;
    const user=req.user;
    const ticket = await Prisma.tickets.findUnique({
        where:{id:ticketId}
    });
    try{
    if (!ticket){
        return res.status(StatusCodes.NOT_FOUND).json({
            error:"Ticket does not exist"
        })
    }
    if (ticket.status==='closed'){
        return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
            error:"A closed ticket can't be updated"
        });
    }
    if (user.role==='User' && ticket.creator_id!==user.id){
        return res.status(StatusCodes.FORBIDDEN).json({
            error:"You can only update your own ticket"
        })
    }
    if (user.role==='Technician' && ticket.assigned_to!==user.id){
        return res.status(StatusCodes.FORBIDDEN).json({
            error:"A technician can only edit a ticket he is assigned"
        })

    }
    const updatedData={};
    const oldEntries=[];

    if (title && title!==ticket.title){
       updatedData.title=title;
       oldEntries.push({
        field_changed:"title",old_value:ticket.title,new_value:title
       })
    };

    if (description && description !== ticket.description){
        updatedData.description=description;
        oldEntries.push({
            field_changed:"description",old_value:'Modified',new_value:'Modified'
        })
    };

    if (category && category !== ticket.category){
        updatedData.category=category;
        oldEntries.push({
            field_changed:"category",old_value:ticket.category,new_value:category
        })
    };

    if (location_details && location_details!== ticket.location_details){
        updatedData.location_details=location_details;
        oldEntries.push({
            field_changed:"location_details",old_value:'updated',new_value:'updated'
        })
    };
    if (Object.keys(updatedData).length===0){
        return res.json({
            message:"No changes detected",ticket
        })
    }
    updatedData.updated_at=new Date();
    const result=await Prisma.$transaction(async (tz)=>{
        const updated=await tz.tickets.update({
            where:{id:ticketId},
            data:updatedData
        });
        for (const log of oldEntries){
        await Prisma.ticket_history.create({
            data:{
                ticket_id:ticketId,
                changed_by:user.id,
                old_value:log.old_value,
                field_changed:log.field_changed,
                new_value:log.new_value
            }
        })
    }
    return updated;
    });
    return res.status(StatusCodes.OK).json({
        message:"Ticket is successfully updated",
        ticket:result
    })
}catch(error){
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error:"Something went wrong"
    });
}

}
const listAllTickets=async (req,res)=>{
    const curUser=req.user;

    if (curUser.role!=='Admin' && curUser.role !=='Manager'){
        throw new unauthenticatedError("Access denied! Regular user not allowed")
    }
    const{
        status,
        title,
        description,
        category,
        assigned_to,
        search,
        page=1,
        limit=10
    }=req.query
    let filters={};
    if (status) filters.status=status;
    if (description) filters.description=description;
    if (title) filters.title=title;
    if (assigned_to) filters.assigned_to=parseInt(assigned_to);

    if (search){
        filters.OR=[
            {title:{contains:search,mode:'insensitive'}},
            {description:{contains:search,mode:'insensitive'}}
        ];
    }
    const pageNum=Math.max(1,parseInt(page));
    const limNum=Math.max(1,parseInt(limit));
    const skipSum=(pageNum-1)*limNum;
    try{
        const [tc,tl]=await Promise.all([
            Prisma.tickets.count({where:filters}),
            Prisma.tickets.findMany({
                where:filters,
                skip:skipSum,
                take:limNum,
                orderBy:{
                    created_at:'asc'
                },
                include:{
                    users_tickets_creator_idTousers:{
                        select:{
                            name:true,
                            email:true
                        }
                    },
                    users_tickets_assigned_toTousers:{
                        select:{
                            name:true,
                            email:true
                        }
                    }
                }
            })
        ])
        return res.json({
            meta:{
                total_records:tc,
                current_page:pageNum,
                limit:limNum,
                total_pages:Math.ceil(tc/limNum)
            },
            tickets:tl
        });
    }catch(error){
        console.log(error);
        throw res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({error:"Something went wrong"});
    }
}
const singleTicket=async (req,res)=>{
    const ticketId = parseInt(req.params.id);

    try {
        const ticket = await Prisma.tickets.findUnique({
        where: { id: ticketId },
        include: {
            users_tickets_creator_idTousers: {
                select: {
                    name: true,
                    role: true
                }
            },
            users_tickets_assigned_toTousers: {
                select: {
                    name: true,
                    role: true
                }
            }
        }
    });

        if (!ticket) {
            return res.status(404).json({ error: "Ticket record not found" });
        }

    
        return res.json(ticket);

    } catch (error) {
        console.error("Error fetching single ticket:", error);
        return res.status(500).json({ error: "Internal server validation failure" });
    }
};

module.exports={
    createTickets,
    listTickets,
    listHistory,
    statusChange,
    priorityChange,
    updateTickets,
    listAllTickets,
    singleTicket
}