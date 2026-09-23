import React from "react";
import { Alert, Button, Form, NavItem, Spinner } from "react-bootstrap";

export default function UpdateComment({cmtId,initial,onUpdateSuccess,cancel,onDeleteSuccess}){
    const [edit,setEdit]=React.useState(initial || []);
    const [submit,setSubmit]=React.useState(false);
    const [alertMessage,setAlertMessage]=React.useState({
        type:"",
        text:""
    })
    const [isDelete,setIsDelete]=React.useState(false)

    async function handleUpdate(e) {
        e.preventDefault();
        if (!edit.trim()) return;
        setSubmit(true);
        try{
            const token=localStorage.getItem("token");
            const response=await fetch(`http://localhost:5000/api/comments/${cmtId}`,{
                method:"PATCH",
                headers:{
                    "content-Type":"application/json",
                    "Authorization":`Bearer ${token}`
                },
                body: JSON.stringify({comment_text:edit})
            
            })
            const data=await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to update comment")
                if (onUpdateSuccess){
                    onUpdateSuccess(cmtId,edit)
                }
            }
            catch(error){
                setAlertMessage({
                    type:"danger",
                    text:error.message ||"Something went wrong"
                })
            }finally{
                setSubmit(false)
            }
    }
    async function handleDelete(){
        if (!cmtId) return;
        const confirm=window.confirm(`Are you sure want to delete this comment`);
        if (!confirm) return;
        setIsDelete(true);
        try{
            const token=localStorage.getItem("token");
            const response=await fetch(`http://localhost:5000/api/comments/${cmtId}`,{
                method:"DELETE",
                headers:{
                    "content-Type":"application/json",
                    "Authorization":`Bearer ${token}`
                }
            });
            if (!response.ok){
                throw new Error("Failed to delete resource")
            }
            if (onDeleteSuccess){
                onDeleteSuccess(cmtId)
            }
            
        }catch(error){
            setAlertMessage({
                type:"warning",
                text:error.message || "Something went wrong"
            })
        }finally{
            setIsDelete(false);
        }
    }const isProcess=submit || isDelete;
    return (
        <Form onSubmit={handleUpdate}
        className="mt-1 p-2 bg-light rounded border">
            <Form.Group className="mb-1"
            controlId={`editComment- ${cmtId}`}>
                <Form.Control
                as="textarea"
                rows={2}
                value={edit}
                onChange={(e)=>setEdit(e.target.value)}
                className="form-control-sm mb-1"
                disabled={submit}
                />
                
            </Form.Group>
            {alertMessage.text && (
                        <Alert variant={alertMessage.type} onClose={() => setAlertMessage({ type: "", text: "" })} dismissible>
                            {alertMessage.text}
                        </Alert>
                    )}
                    <div className="d-flex gap-2 justify-content-end">
                        <Button 
                    variant="link" 
                    className="p-0 text-decoration-none text-danger small fw-bold"
                    style={{ fontSize: "0.75rem" }}
                    onClick={handleDelete}
                    disabled={isProcess}
                >
                    {isDelete ? "Deleting..." : "🗑️ Delete Comment"}
                </Button>
                        <Button 
                        variant="secondary"
                        size="sm"
                        className="py-0 px-2 small"
                        onClick={cancel}
                        disabled={submit}
                        >Cancel</Button>
                        <Button 
                    type="submit" 
                    variant="success" 
                    size="sm" 
                    className="py-0 px-2 small"
                    style={{ fontSize: "0.75rem" }}
                    disabled={submit || !edit.trim() || edit === initial}
                >
                    {submit ? <Spinner animation="border" size="sm" className="me-1" /> : "Save"}
                </Button>
                    </div>
        </Form>
    )
}