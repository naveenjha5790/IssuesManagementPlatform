import React from "react";
import { Button, Card, Form, Spinner,Alert, Badge } from "react-bootstrap";

export default function AdminPrivilage({curUser,users,setUsers}){
    const [targetId,setTargetId]=React.useState("");
    const [newRole,setNewRole]=React.useState("User");
    const [loading,setLoading]=React.useState(false);
    const [load,setLoad]=React.useState(false);
    const [alertMessage,setAlertMessage]=React.useState({
        type:"",text:""})
        const allowedRoles=["Manager","Technician","User"];
        React.useEffect(() => {
    if (users && users.length > 0) {
      setTargetId(users[0].id);
    }
  }, [users]);
React.useEffect(() => {
    async function fetchAllUsers() {
        setLoad(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("http://localhost:5000/api/auth/users", { 
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });
            const data = await response.json();
            
            if (response.ok) {
                setUsers(Array.isArray(data) ? data : data.users || []);
            }
        } catch (error) {
            console.error("Failed to fetch user directory:", error);
        }finally{
            setLoad(false);
        }
    }
    
    fetchAllUsers();
}, [setUsers]);

        async function updateRole(st){
            st.preventDefault();
            if (!targetId){
                setAlertMessage({type:"danger",
                    text:"Please enter a valid user"});
                return;
            }
            setLoading(true);
            try{
                const token=localStorage.getItem("token");
                const payload={targetId,newRole};
                const response=await fetch("http://localhost:5000/api/auth/adminPrivilage",{
                    method:"PATCH",
                    headers:{
                        "content-Type":"application/json",
                        "Authorization":`Bearer ${token}`
                    },
                    body:JSON.stringify(payload)
                });
                const data=await response.json();
                 if (!response.ok){
                    throw new Error (data.error || "Failed to modify Role");

                 }
                 setAlertMessage({
                    type:"success",
                    text:`${data.message}: user (${data.user.email} is now assigned as ${data.user.newRole})`
                 })
                 if (Array.isArray(users)) {
                setUsers(prevUsers => prevUsers.map(u => 
                    u.id === parseInt(targetId) || u.id === targetId ? { ...u, role: newRole } : u
                ));
            }
            }
            catch(error){
                setAlertMessage({
                    type:"danger",
                    text:error.message || "An unexpected error has occured"
                });
            }finally{
                    setLoading(false);
                }
            
        }
    return (
        <>
        <div className="d-flex justify-content-center align-items-center m-4">
            <Card style={{maxWidth:"450px",width:"100%"}}
            className="shadow-sm border-0">
                <Card.Body className="p-4">
                    <Card.Title className="mb-4 text-dark font-weight-bold">
                        Modify User's Role
                    </Card.Title>
                    <Form onSubmit={updateRole}>
                        <Form.Group className="mb-3">
                            <Form.Label>Select Target User</Form.Label>
                        <Form.Select 
                        value={targetId}
                        onChange={(e) => setTargetId(e.target.value)}
                        required>
                            {!users || users.length ===0 ?(
                                <option value="">No users available</option>
                            ):(
                                users.map((user)=>(
                                    <option key={user.id} 
                                    value={user.id}>
                                        {user.name} ({user.email}) — Current: {user.role}
                                    </option>
                                ))
                            )}
                        </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-4">
                            <Form.Label>Assign new role</Form.Label>
                            <Form.Select 
                            value={newRole}
                            onChange={(e)=> setNewRole(e.target.value)}>
                                {allowedRoles.map((role)=>(
                                    <option key={role} value={role}>
                                        {role}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Button 
                        variant="danger"
                        type="submit"
                        className="w-100 p-2"
                        disabled={loading || !targetId}
                        >
                            {loading ? (
                                <>
                                <Spinner animation="border"
                                size="sm" className="me-2" />
                  Updating Permissions...
                </>
              ) : (
                "Commit Privilege Escalation"
    
                            )}
                        </Button>
                    </Form>
                    {alertMessage.text && (
            <Alert
              variant={alertMessage.type}
              onClose={() => setAlertMessage({ type: "", text: "" })}
              dismissible
              className="mt-4 mb-0"
            >
              {alertMessage.text}
            </Alert>
                    )}
                </Card.Body>
            </Card>
        </div>
        
        </>
    )
}