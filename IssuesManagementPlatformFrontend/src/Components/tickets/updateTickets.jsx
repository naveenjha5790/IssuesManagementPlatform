import React, { act } from "react";
import { Alert, Button, Form, Modal,Spinner } from "react-bootstrap";

export default function ChangeTickets({curUser,setTickets,viewTicketHistory,activeTicket}){
    const [updateTicket,setUpdateTicket]=React.useState(false);
    const [alertMessage,setAlertMessage]=React.useState({
        type:"",text:""
    })
    const [editForm, setEditForm] = React.useState({
        title: "",
        description: "",
        category: "",
        location_details: ""
    });
    const [submit,setSubmit]=React.useState(false);
   React.useEffect(()=>{
    if (activeTicket){
        setEditForm({
            title: activeTicket.title,
            description: activeTicket.description,
            category: activeTicket.category,
            location_details: activeTicket.location_details
        })
    }
   },[activeTicket])
   function inputHandler(e) {
        const { name, value } = e.target;
        setEditForm(prev => ({
            ...prev,
            [name]: value
        }));
    }

    async function handleUpdation(e){
        e.preventDefault();
        const ticketId=activeTicket.id;
        setSubmit(true);
        try{
            const token=localStorage.getItem("token");
            const response=await fetch(`http://localhost:5000/api/tickets/${ticketId}`,{
                method:"PATCH",
                headers:{
                    "content-Type":"application/json",
                    "Authorization":`Bearer ${token}`
                },
                body: JSON.stringify(editForm)
            })
            const data=await response.json();
            if (!response.ok){
                throw new Error(data.error || "Failed to update tickets")
            }
            setTickets(prevs=>prevs.map(t=>
                (t.id===ticketId) ? {...t,...editForm}:t

            ));
            viewTicketHistory(ticketId);
            setUpdateTicket(false);
            alert("Ticket updated successfully");
        }catch(error){
            setAlertMessage({type:"warning",
                text: error.message || "An unexpected error has occured"}
            )
        }finally{
            setSubmit(false);
        }
    }
    if (!activeTicket) return null;
    const role=curUser?.role;
    const unauthorized=role==='Admin' || role==='Manager' || role==='Technician' || curUser.id!=activeTicket.creator_id;
    if (unauthorized) return null;

    return (
        <>
        <Button
        variant="outline-primary"
        className="w-100 mb-3"
        onClick={()=>setUpdateTicket(true)}>
            Edit Ticket
        </Button>
        <Modal show={updateTicket}
        onHide={()=>!submit && setUpdateTicket(false)}
        centered>
            <Modal.Header closeButton={!submit}>
                <Modal.Title>Update ticket #ref {activeTicket.id}</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleUpdation}>
                <Modal.Body>
                    {alertMessage.text && (
                            <Alert variant={alertMessage.type} onClose={() => setAlertMessage({ type: "", text: "" })} dismissible>
                                {alertMessage.text}
                            </Alert>
                        )}
                        <Form.Group className="mb-3">
                            <Form.Label>Ticket title</Form.Label>
                            <Form.Control
                            type="text"
                            name="title"
                            value={editForm.title}
                            onChange={inputHandler}
                            ></Form.Control>
                            <Form.Label>Ticket Description</Form.Label>
                            <Form.Control 
                           as="textarea"
                            rows={4}
                            name="description"
                            value={editForm.description}
                            onChange={inputHandler}></Form.Control>
                            <Form.Label>Ticket Category</Form.Label>
                            <Form.Control 
                            type="text"
                            name="category"
                            value={editForm.category}
                            onChange={inputHandler}
                            ></Form.Control>
                            <Form.Label>Location</Form.Label>
                            <Form.Control
                            type="text"
                            name="location_details"
                            value={editForm.location_details}
                            onChange={inputHandler}
                            ></Form.Control>
                        </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary"
                    onClick={()=>setUpdateTicket(false)}
                    disabled={submit}>
                        Cancel
                    </Button>
                     <Button variant="primary" type="submit" disabled={submit}>
                            {submit ? <><Spinner animation="border" size="sm" className="me-2" /> Saving Changes...</> : "Save Structural Changes"}
                        </Button>
                </Modal.Footer>
            </Form>
        </Modal>
        </>
    )
}