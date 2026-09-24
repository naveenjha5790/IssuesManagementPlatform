import React from "react";
import { Alert, Button, Form, Spinner } from "react-bootstrap";

export default function StatusChange({curUser,activeTicket,setTickets,viewTicketHistory}){
    const [statusUpdate,setStatusUpdate]=React.useState(false);
    const [alertMessage,setAlertMessage]=React.useState({
        type:"",text:""
    });
    const workflow={
        'open':['assigned'],
        'assigned':['in_progress'],
        'in_progress': ['resolved'],
        'resolved': ['closed'],
        'closed':['reopen']
    }
    const isWithinReopenPeriod = () => {
        if (activeTicket.status !== 'closed') return false;
        if (!activeTicket.updatedAt) return true; 

        const closedAt = new Date(activeTicket.updated_at);
        const now = new Date();
        const daysDifference = (now - closedAt) / (1000 * 60 * 60 * 24);
        return daysDifference <= 30;
    };
    async function handleStatusChange(e){
        const newStatus=e.target.value;
        if (!newStatus || !activeTicket) return;
        const ticketId = activeTicket.id;
        if (newStatus==='closed' && !window.confirm("Are you sure want to close this ticket")){
            return;
        }
        if (newStatus === 'reopen' && !window.confirm("Are you sure you want to reopen this ticket?")) {
            e.target.value = "";
            return;
        }

        setStatusUpdate(true);
        try{
            const token=localStorage.getItem("token");
            const response=await fetch(`http://localhost:5000/api/tickets/${ticketId}/status`,{
                method:"PATCH",
                headers:{
                    "content-Type":"application/json",
                    "Authorization":`Bearer ${token}`
                },
                body:JSON.stringify({newStatus})
            });
            const data =await response.json();

            if (!response.ok){
                throw new Error(data.error || "Failed to update ticket status")
            }
            setAlertMessage({type:"success",text:data.message || "Status changed"})
            const UIStatus = newStatus === 'reopen' ? 'open' : newStatus;
            setTickets(prevTickets => prevTickets.map(t=>
            (t.id===ticketId) ?
            {...t,status:UIStatus}:t
            ));
          viewTicketHistory(ticketId);
        }catch(error){
            setAlertMessage({type:"danger",text:error.message || "An unexpected error has occured"})
            e.target.value="";
        }finally{
            setStatusUpdate(false);
        }
        

    }

    const availableNextOptions = workflow[activeTicket.status]  || [];
    const isTicketClosed = activeTicket.status === 'closed';
    const userRole = curUser?.role?.toLowerCase();
    const isUserRestricted = userRole === 'user' && activeTicket?.status === 'resolved' ||(isTicketClosed && isWithinReopenPeriod());
    const isAuthorizedRole = userRole === 'admin' || userRole === 'manager' || userRole === 'technician';

    if (isTicketClosed && !isWithinReopenPeriod){
        return <div className="alert alert-secondary py-2 small text-center mb-3">
            This ticket is closed and can't be reopen as 30 days timeline has passed.
        </div>
    }
    if (!isUserRestricted && !isAuthorizedRole){
        return (
            <div className="alert alert-light py-2 small border text-center text-muted mb-3">
                Current Status: <span className="badge bg-secondary text-capitalize">{activeTicket.status}</span>
            </div>
        )
    }
    if (isAuthorizedRole && (isTicketClosed || activeTicket?.status==="resolved") ){
        return (
            <div className="alert alert-light py-2 small border text-center text-muted mb-3">
                Current Status: <span className="badge bg-secondary text-capitalize">{activeTicket.status}</span>
            </div>
        )
    }
    return (
        <>
       <div className="bg-light p-3 rounded mb-4 border">
        <Form.Group>
            <Form.Label className="small fw-bold text-secondary">
                Advance ticket status workflow
            </Form.Label>
            <div className="d-flex gap-2">
                <Form.Select
                size="sm"
                defaultValue=""
                disabled={statusUpdate || availableNextOptions.length===0}
                onChange={handleStatusChange}
                >
                    <option value="" disabled>
                        Current: {activeTicket.status}
                    </option>
                    {availableNextOptions.map(next=>(
                        <option key={next}
                        value={next}>
                            Move to {next}
                        </option>
                    ))}
                </Form.Select>
                {statusUpdate && <Spinner animation="border"
                size="sm"
                variant="info"
            className="align-self-center" />}
            </div>
        </Form.Group>
       </div>
       {alertMessage.text && (
                <Alert variant={alertMessage.type} onClose={() => setAlertMessage({ type: "", text: "" })} dismissible className="mt-2 mb-3">
                    {alertMessage.text}
                </Alert>)}
                </>
    )
}