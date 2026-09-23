import React from "react";
import { Badge, Alert, Spinner, Card,Button } from "react-bootstrap";
import UpdateComment from "./updateComment";
export default function ShowComments({ticket,setTicketComment,curUser,ticketComment}){
    const [load,setLoad]=React.useState(false);
    const [alertMessage,setAlertMessage]=React.useState({
            type:"",text:""
        });
        const [submitting,setSubmitting]=React.useState(false);
        const [editingCommentId, setEditingCommentId] = React.useState(null);
         const ticketId=ticket?.id;
        async function getComment(id){
           if (!id) return;
            setLoad(true);
            try{
                const token=localStorage.getItem("token");
                const response=await fetch(`http://localhost:5000/api/tickets/${ticketId}/comments`,{
                method:"GET",
                headers:{
                    "content-Type":"application/json",
                    "Authorization":`Bearer ${token}`
                },
                
            })
            const data= await response.json();
            if (!response.ok) throw new Error("Failed to load comments");
            if (Array.isArray(data)) {
                setTicketComment(data);
            } else if (data && data.message) {
                setTicketComment([]); 
            } else {
                setTicketComment([]);
            }

            }catch(error){
                setAlertMessage({
                    type:"danger",
                    text:error.message || "Something went wrong"
                });
            }finally{
                setLoad(false);
            }
        }
        React.useEffect(() => {
        if (curUser && ticketId) {
            getComment(ticketId);
        }
    }, [curUser, ticketId]);
    function handleComment(cmtId,upText){
        setTicketComment(prevs=>prevs.map(c=>
            c.id===cmtId ? {...c,comment:upText}:c
        ));
        setEditingCommentId(null);
    }
    function handleDelete(cmtId){
        setTicketComment(prevs=>
            prevs.filter(cd=> cd.id !==cmtId)
        )
        setEditingCommentId(null);
    }
    return (
        <div className="mt-3">
            <h5 className="mb-3 text-secondary d-flex align-items-center">
               Comments
                {Array.isArray(ticketComment) && ticketComment.length > 0 && (
                    <Badge bg="secondary" size="sm" className="ms-2">
                        {ticketComment.length}
                    </Badge>
                )}
            </h5>

    
            {alertMessage.text && (
                <Alert variant={alertMessage.type} className="py-2 small">
                    {alertMessage.text}
                </Alert>
            )}

           
            {load ? (
                <div className="text-center my-4">
                    <Spinner animation="border" variant="primary" size="sm" />
                    <p className="text-muted small mt-1">Fetching message thread...</p>
                </div>
            ) : !ticketComment || ticketComment.length === 0 ? (
                <div className="text-center py-4 px-2 bg-light rounded border border-dashed">
                    <p className="text-muted mb-0 small">No remarks or commentary registered to this ticket.</p>
                </div>
            ) : (
            
                <div className="comments-stream" style={{ maxHeight: "400px", overflowY: "auto" }}>
                    {ticketComment.map((com) => {
                        const comId = com.id || com._id;
                        
                        const authorName = com.users?.name || "System Contributor";
                        const authorRole = com.users?.role || "Staff";
                         const isMyComment = com.author_id === curUser?.id 
                        return (
                            <Card key={comId} className="mb-2 border-light shadow-sm">
                                <Card.Body className="py-2 px-3">
                                    <div className="d-flex justify-content-between align-items-center mb-1 border-bottom pb-1">
                                        <span className="fw-bold text-primary" style={{ fontSize: "0.85rem" }}>
                                            {authorName} 
                                            <span className="text-muted fw-normal ms-1 small">
                                                ({authorRole})
                                            </span>
                                        </span>
                                        <span className="text-muted" style={{ fontSize: "0.7rem" }}>
                                            {com.created_at || com.createdAt 
                                                ? new Date(com.created_at || com.createdAt).toLocaleString() 
                                                : ""}
                                        </span>
                                        {isMyComment && editingCommentId!==comId && (
                                            <Button 
                                                    variant="link" 
                                                    className="p-0 text-decoration-none text-info small" 
                                                    style={{ fontSize: "0.75rem" }}
                                                    onClick={() => setEditingCommentId(comId)}
                                                >
                                                    [Edit]
                                                </Button>
                                        )}
                                    </div>
                                    {editingCommentId===comId ?(
                                        <UpdateComment 
                                        cmtId={comId}
                                        initial={com.comment_text}
                                        onUpdateSuccess={handleComment}
                                        cancel={()=>setEditingCommentId(null)}
                                        onDeleteSuccess={handleDelete}
                                        />
                                    ):<p className="mb-0 text-dark" style={{ fontSize: "0.9rem", whiteSpace: "pre-line" }}>
                                        {com.comment_text}
                                    </p>}
                                    
                                </Card.Body>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>

    )
}