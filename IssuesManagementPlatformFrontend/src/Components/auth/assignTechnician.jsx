import React from "react";
import { Badge, Button, Card, Form, Spinner,Alert } from "react-bootstrap";

export default function AssignTechnnician({ticket,curUser,onAssignSuccess}){
    const [technicians, setTechnicians] = React.useState([]);
    const [selectedTechId, setSelectedTechId] = React.useState("");
    const [loadingTechs, setLoadingTechs] = React.useState(false);
    const [submitting, setSubmitting] = React.useState(false);
    const [alertMessage, setAlertMessage] = React.useState({ type: "", text: "" });

    const ticketId = ticket?.id;
    const isManager = curUser?.role === "Manager";
    React.useEffect(() => {
        if (isManager && ticketId) {
            fetchTechnicians();
        }
        if (ticket?.assigned_to) {
            setSelectedTechId(String(ticket.assigned_to));
        }
    }, [ticketId, isManager, ticket]);
    async function fetchTechnicians(){
        setLoadingTechs(true);
        try{
            const token=localStorage.getItem("token");
            const response=await fetch("http://localhost:5000/api/auth/technician",{
                method:"GET",
                headers:{
                    "content-Type":"application/json",
                    "Authorization":`Bearer ${token}`
                }
            }
            );
            if (!response.ok){
                throw new Error("Failed to load technicians data")

            }
            const data=await response.json();
            setTechnicians(Array.isArray(data) ? data :[]);
        }catch(error){
            setAlertMessage({type:"warning",
                text:error.message || "Some error has occured"
            })
        }finally{
            setLoadingTechs(false);
        }
    }
    async function handleAssignment(e){
        e.preventDefault();
        if (!selectedTechId){
            setAlertMessage({type:"danger",
                text:"Please select a techID to assign tickets"
            });

        }  setSubmitting(true);
        try{
            const token=localStorage.getItem("token");
            const response=await fetch(`http://localhost:5000/api/tickets/${ticketId}/assignment`,{
                method:"PATCH",
                headers:{
                    "content-Type":"application/json",
                    "Authorization":`Bearer ${token}`
                },
                body: JSON.stringify({technicianId:parseInt(selectedTechId)})
            });
            const data=await response.json();
            if (!response.ok){
                throw new Error(data.error || data.message || "Assignment failed")
            }
             const alertType = response.status === 202 ? "info" : "success";
            setAlertMessage({
                type: alertType,
                text: data.message || data.msg || "Technician successfully updated."
            });
            if (onAssignSuccess && data.ticket){
                onAssignSuccess(data.ticket);
            }
        }catch(error){
            setAlertMessage({
                type:"danger",
                text:error.message || "Something went wrong"
            })
        }finally{
            setSubmitting(false);
        }
    }
    if (!isManager) return null;
    return(
        <>
        <Card className="shadow-sm border-primary mt-3">
        <Card.Header className="d-flex bg-primary text-white justify-content-between align-items-center">
            <h5 className="mb-0"
            style={{fontSize:"1rem"}}>Management Console</h5>
            <Badge bg={ticket?.status === "closed" ? "danger" :"light"} 
            text={ticket?.status === "closed" ? "white" : "dark"}>
            Status: {ticket?.status || "open"}
            </Badge>
        </Card.Header>
        <Card.Body>
            <div className="mb-3 bg-light p-2 rounded small text-muted">
                <div><strong>Target Reference: </strong>Ticket #{ticketId}</div>
                <div><strong>Title: </strong>{ticket?.title}</div>
                {ticket?.assigned_to && (
                    <div className="text-info mt-1">
                        <strong>Current Asignment ID::</strong>
                        {ticket.assigned_to}
                        </div>
                )}
            </div>
            {alertMessage.text && (
                    <Alert 
                        variant={alertMessage.type} 
                        dismissible 
                        onClose={() => setAlertMessage({ type: "", text: "" })}
                        className="py-2 small"
                    >
                        {alertMessage.text}
                    </Alert>
                )}
                <Form onSubmit={handleAssignment}>
                    <Form.Group className="mb-3"
                    controlId="technicianSelect">
                        <Form.Label className="fw-bold small text-secondary">
                            Assign Update Technician
                        </Form.Label>
                        <Form.Select
                            value={selectedTechId}
                            onChange={(e) => setSelectedTechId(e.target.value)}
                            disabled={submitting || loadingTechs || ticket?.status === "closed"}
                            className="form-select-sm"
                            required
                        >
                            <option value="">-- Choose Available Technician --</option>
                            {technicians.map((tech) => (
                                <option key={tech.id} value={tech.id}>
                                    {tech.name} (ID: {tech.id}) — {tech.email || "No email"}
                                </option>
                            ))}
                        </Form.Select>
                        {ticket?.status === "closed" && (
                            <Form.Text className="text-danger d-block mt-1 small">
                                * Closed tickets can't be assigned or redistributed
                            </Form.Text>
                        )}
                    </Form.Group>
                    <Button
                        type="submit" 
                        variant="primary" 
                        size="sm"
                        className="w-100 d-flex justify-content-center align-items-center"
                        disabled={submitting || loadingTechs || ticket?.status === "closed" || selectedTechId === String(ticket?.assigned_to)}
                    >
                        {submitting ? (
                            <>
                                <Spinner as="span" animation="border" size="sm" role="status" className="me-2" />
                                Processing Transaction...
                            </>
                        ) : loadingTechs ? (
                            "Loading System Profiles..."
                        ) : ticket?.assigned_to && parseInt(selectedTechId) === ticket.assigned_to ? (
                            "Technician Already Dispatched"
                        ) : ticket?.assigned_to ? (
                            "Reassign Technician"
                        ) : (
                            "Confirm Dispatch Assignment"
                        )}
                    </Button>
                </Form>
        </Card.Body>
        </Card>
        </>
    )

}
