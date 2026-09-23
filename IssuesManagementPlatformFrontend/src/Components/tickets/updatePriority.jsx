import React from "react";
import { Form,Alert, Spinner } from "react-bootstrap";

export default function UpdateTickets({curUser,activeTicket,setTickets,viewTicketHistory}){
    const [priorityChange,setPriorityChange]=React.useState(false);
    const [alertMessage,setAlertMessage]=React.useState({
        type:"",text:""
    });
     if (!activeTicket) return null;
    const allowed=['low','medium','high','urgent'];
     const isAuthorizedRole=curUser?.role?.toLowerCase()==="manager";

        if (!isAuthorizedRole){
            return <div className="alert alert-secondary py-2 small text-center mb-3">
                Only manager can change priority
            </div>
        }

    async function handlePriorityChange(e){
        const newPriority=e.target.value;
        if (!newPriority) return null;
        const ticketId = activeTicket.id;
        setPriorityChange(true);
        try{
            const token=localStorage.getItem("token");
            const response=await fetch(`http://localhost:5000/api/tickets/${ticketId}/priority`,{
                method:"PATCH",
                headers:{
                    "content-Type":"application/json",
                    "Authorization":`Bearer ${token}`
                },
                body: JSON.stringify({newPriority})
                
            })
            const data=await response.json();
            if (!response.ok){
                throw new Error(data.error || "Failed to update priority");
            }
            setAlertMessage({type:"success",
                text:data.message || "Priority successfully updated"
            });
            setTickets(prevs=>
                prevs.map(t=>
                (t.id===ticketId) ? {...t,priority: newPriority} :t
                )
            );
            viewTicketHistory(ticketId);
        }catch(error){
            setAlertMessage({
                type:"danger",text:error.message || 
                "An unexpected error has occured"
            })
             e.target.value = "";
        }finally{
            setPriorityChange(false);
        }
        
       
    }
    return(
        <>
        <div className="bg-light p-3 rounded mb-4 border">
            <Form.Group>
                <Form.Label className="small fw-bold text-secondary">
            Change Priority
                </Form.Label>
                <div className="d-flex gap-2">
                    <Form.Select
                    size="sm"
                    defaultValue="medium"
                    disabled={priorityChange}
                    onChange={handlePriorityChange}
                    >
                        <option value="" disabled>
                            Current: {activeTicket.priority}
                        </option>
                        {allowed.map(next=>(
                            <option key={next}
                            value={next}>
                                Change to {next}
                            </option>
                        ))}
                    </Form.Select>
                    {priorityChange && <Spinner animation="border" size="sm" variant="warning" className="align-self-center" />}
                </div>
            </Form.Group>
            {alertMessage.text && (
                    <Alert 
                        variant={alertMessage.type} 
                        onClose={() => setAlertMessage({ type: "", text: "" })} 
                        dismissible 
                        className="mt-3 mb-0 py-2 small"
                    >
                        {alertMessage.text}
                    </Alert>
                )}
        </div>
        </>
    )
}