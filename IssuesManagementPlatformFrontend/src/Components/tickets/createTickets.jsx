import React from "react";
import { Button, Form ,Alert} from "react-bootstrap";
import { Link } from "react-router-dom";

export default function CreateTickets({curUser,tickets,setTickets}){
  const [newTickets, setNewTickets]=React.useState({
    title:"",
    description:"",
    category:"",
    locationDetails:""
  });
  const [alertMessage,setAlertMessage]=React.useState({
    type:"",text:""
  }) ;
  const [submitting,setSubmitting]=React.useState(false);
  function handleChange(st){
    const {name,value}=st.target;
    setNewTickets((prevs)=>({
        ...prevs,
        [name]:value
    }));
  }
  async function inputHandler(reso) {
    reso.preventDefault();
    setSubmitting(true);
    try{
        const token=await localStorage.getItem("token")
            const response=await fetch("http://localhost:5000/api/tickets",{
                method:"POST",
                headers:{
                    "content-Type":"application/json",
                    "Authorization":`Bearer ${token}`
                },
                body:JSON.stringify(newTickets)
            });
            const data=await response.json();
            if (!response.ok) throw new Error("Failed to create a new Ticket");
            setAlertMessage({
                type:"success",
                text:"Successfully created a new ticket"
            });
            setNewTickets({
                title:"",
                description:"",
                category:"",
                locationDetails:""
            });
        
    }catch(error){
        console.log(error);
        setAlertMessage({
            type:"danger",
            text:error.message
        })
    }finally{
        setSubmitting(false);
    }
    
  }
  const isUser=curUser?.role?.toLowerCase()==="user";
  return (
   <div className="d-flex justify-content-center align-items-center w-100">
    {isUser && (
         <div className="mt-2 w-100 d-flex flex-column align-items-center">
            <div style={{maxWidth:"600px",width:"100%"}}>
        <Link to="/user/dashboard" className="btn btn-outline-success mb-3">
        Back to dashboard
    </Link>
    </div>
        <div className="bg-danger text-white p-3 mt-1 rounded"
        style={{maxWidth:"600px",width:"100%"}}
        >
            
            <h4 style={{color:"floralwhite"}}>
                Add New Ticket
            </h4>
            <Form onSubmit={inputHandler} className="mb-3">
                <Form.Group className="mb-1">
                <div>
                    <Form.Label>Title:</Form.Label>
                    <Form.Control type="text" name="title"
                    value={newTickets.title}
                    onChange={handleChange}
                    className="mb-1"
                    required></Form.Control>
                </div>
                <div>
                    <Form.Label>Description: </Form.Label>
                    <Form.Control type="text"
                    name="description"
                    value={newTickets.description}
                    onChange={handleChange}
                    className="mb-1"
                    required></Form.Control>
                </div>
                <div>
                    <Form.Label>Category</Form.Label>
                    <Form.Control type="text"
                    name="category"
                    placeholder="E.g Electrical, Electronics, Network Issue, Plumbing etc"
                    onChange={handleChange}
                    value={newTickets.category}
                    required></Form.Control>
                </div>
                <div>
                    <Form.Label>Location Details </Form.Label>
                    <Form.Control 
                    type="text"
                    name="locationDetails"
                    value={newTickets.locationDetails}
                    onChange={handleChange}
                    required></Form.Control>
                </div>
                <Button type="submit"
                disabled={submitting}
                variant="warning"
                className="mt-3">
                    {submitting ? "Saving Your Ticket" :"Add a new ticket"}
                </Button>

            </Form.Group>
            </Form>
            {alertMessage.text && (
                        <Alert variant={alertMessage.type} onClose={() => setAlertMessage({ type: "", text: "" })} dismissible>
                            {alertMessage.text}
                        </Alert>
                    )}
        </div>
        </div>
    )}
    </div>
  )
}