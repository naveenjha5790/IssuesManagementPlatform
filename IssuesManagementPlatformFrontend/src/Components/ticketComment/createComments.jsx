import React from "react";
import { Alert, Button, Form } from "react-bootstrap";

export default function CreateComments({ticketComment,setTicketComment,curUser,ticket}){
    const [create,setCreate]=React.useState(false);
    const [newComment,setNewComment]=React.useState({
        comment_text:""
    });
    const [alertMessage, setAlertMessage]=React.useState({
        type:"",
        text:""
    })
    const [submit,setSubmit]=React.useState(false);
    function handleChange(st){
    const {name,value}=st.target;
    setNewComment((prevs)=>({
        ...prevs,
        [name]:value
    }));
  }
    async function inputHandler(e){
        e.preventDefault();
        const ticketId=ticket.id;

         if (!newComment.comment_text.trim()) return;
        setSubmit(true);
        try{
            const token=localStorage.getItem("token");
            const response=await fetch(`http://localhost:5000/api/tickets/${ticketId}/comments`,{
                method:"POST",
                headers:{
                    "content-Type":"application/json",
                    "Authorization":`Bearer ${token}`
                },
                body: JSON.stringify({comment:newComment.comment_text})
            })
            const data= await response.json();
            if (!response.ok) throw new Error("Failed to comment! please try again");
            setAlertMessage({
                type:"success",
                text:"Your comment is successfully made"
            });
            const placedCommentObj = data.comment || data.com || {
                id: data.id || Date.now(),
                comment: newComment.comment_text,
                comment_text:newComment.comment_text,
                created_at: new Date().toISOString(),
                users: {
                    name: curUser?.name || "Me",
                    role: curUser?.role || "User"
                }
            };
            setTicketComment((prevComments) => [placedCommentObj, ...prevComments]);
            
            setNewComment({
                comment_text:""
            })
        }catch(error){
            setAlertMessage({
                type:"danger",
                text:error.message || "Something went wrong"
            });
        }finally{
            setSubmit(false);
        }
    }
    return (
        <>
        <div className="bg-success text-white p-3 mt-4 rounded">
            <h4 style={{color:"floralwhite"}}>
                Add Comment
            </h4>
            <Form onSubmit={inputHandler}
            className="mb-3">
                <Form.Group className="mb-1">
                    <div>
                        <Form.Label>Message: </Form.Label>
                        <Form.Control as="textarea"
                        rows={3}
                        name="comment_text"
                        value={newComment.comment_text}
                        onChange={handleChange}
                        className="mb-1"
                        required></Form.Control>
                    </div>
                    <Button type="submit"
                    disabled={submit}
                    variant="warning">
                        {submit ? "Saving your comment":"Add a new comment"}
                    </Button>
                </Form.Group>
            </Form>
            {alertMessage.text && (
                        <Alert variant={alertMessage.type} onClose={() => setAlertMessage({ type: "", text: "" })} dismissible>
                            {alertMessage.text}
                        </Alert>
                    )}
        </div>
        </>
    )
    }
