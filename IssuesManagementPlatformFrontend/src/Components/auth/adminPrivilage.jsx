import React from "react";
import { Button, Card, Form, Spinner,Alert, Badge, Row, Col, Table } from "react-bootstrap";

export default function AdminPrivilage({curUser,users,setUsers}){
    const [targetId,setTargetId]=React.useState("");
    const [newRole,setNewRole]=React.useState("User");
    const [loading,setLoading]=React.useState(false);
    const [load,setLoad]=React.useState(false);
    const [meta, setMeta] = React.useState({ totalRecords: 0, curPage: 1, totalPages: 1 });
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

            if (data.meta){
                
            setMeta({totalRecords:data.meta.totalUsers ||0,
                curPage: data.meta.curPage || 1,
                totalPages: data.meta.totalPages || 1
            })
            }
            
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
const handleSelectUser = (user) => {
        setTargetId(user.id);
        setNewRole(allowedRoles.includes(user.role) ? user.role : "User");
    };
    const selectedUser = Array.isArray(users) ? users.find(u => u.id === targetId || u.id === parseInt(targetId)) : null;

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
       <div className="m-4">
        <Row className="g-4">
            <Col lg={8}>
            <Card className="shadow-sm border-0 h-100">
                <Card.Body className="p-4">
                    <Card.Title className="mb-4 text-dark font-weight-bold">
                        List of All users
                    </Card.Title>
                    {load ? (
                        <div className="text-center my-4 py-4">
                            <Spinner animation="border" variant="primary" size="sm" />
                            <p className="text-muted mt-2 small">Loading users data.....</p>
                        </div>
                    ):(
                        !users || users.length===0 ?(
                            <div className="text-center bg-light rounded border">
                            <p className="text-muted mb-0 small">
                                No Users available
                            </p>
                            </div>
                        ):(
                            <Table responsive hover striped
                            className="align-middle border-light">
                                <thead className="table-light">
                                    <tr> 
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Current Role</th>
                                        <th className="text-end">Features</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user)=>{
                                        const isId=targetId===user.id
                                        return (
                                            <tr key={user.id} 
                                            className={isId ? "table-primary-subtle":""}>
                                                <td>{user.name}</td>
                                                <td><span className={`Badge ${user.role==="Admin"? 'bg-danger' : user.role === 'Manager' ? 'bg-warning text-dark' : user.role === 'Technician' ? 'bg-info text-dark' : 'bg-secondary'}`}>
                                                {user.email}</span>
                                                </td>
                                                <td>
                                                        <span className={`badge ${user.role === 'Admin' ? 'bg-danger' : user.role === 'Manager' ? 'bg-warning text-dark' : user.role === 'Technician' ? 'bg-info text-dark' : 'bg-secondary'}`}>
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td className="text-end">
                                                        <Button
                                                            variant={isId ? "primary" : "outline-primary"} 
                                                            size="sm"
                                                            onClick={() => handleSelectUser(user)}
                                                        >
                                                            {isId ? "Selected" : "Change Role"}
                                                        </Button>
                                                    </td>
                                            </tr>
                                            
                                        )
                                    })}
                                </tbody>
                            </Table>
                        )
                    )}
                </Card.Body>
            </Card>
            </Col>
            <Col lg={4}>
                    <Card className="shadow-sm border-0 sticky-top" >
                        <Card.Body className="p-4">
                            <Card.Title className="mb-4 text-dark font-weight-bold">
                                Change User's Role
                            </Card.Title>
                            
                            <Form onSubmit={updateRole}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="text-muted small">Target User</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        readOnly 
                                        disabled
                                        placeholder="Pick a user from the directory table"
                                        value={selectedUser ? `${selectedUser.name} (${selectedUser.email})` : ""}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label className="small fw-semibold">Assign new role</Form.Label>
                                    <Form.Select 
                                        value={newRole}
                                        onChange={(e) => setNewRole(e.target.value)}
                                        disabled={!targetId}
                                    >
                                        {allowedRoles.map((role) => (
                                            <option key={role} value={role}>
                                                {role}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>

                                <Button 
                                    variant="danger"
                                    type="submit"
                                    className="w-100 p-2 shadow-sm"
                                    disabled={loading || !targetId}
                                >
                                    {loading ? (
                                        <>
                                            <Spinner animation="border" size="sm" className="me-2" />
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
                                    className="mt-4 mb-0 small"
                                >
                                    {alertMessage.text}
                                </Alert>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

        </Row>
       </div>
        
        </>
    )
}