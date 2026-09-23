import React from "react";
import { Alert, Badge, Button, Card, Form, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";

export default function ViewNotifications({curUser,notifications, setNotifications}){
    const [load,setLoad]=React.useState(false);
    const [alertMessage,setAlertMessage]=React.useState({
        type:"",
        text:""
    });
    const [unreadOnly,setUnreadOnly]=React.useState(false);
    const [action,setAction]=React.useState(false);

    async function loadNotifications() {
        setLoad(true);
        try{
            const token=localStorage.getItem("token");
            const response=await fetch(`http://localhost:5000/api/notification`,{
                method:"GET",
                headers:{
                    "content-Type":"application/json",
                    "Authorization":`Bearer ${token}`
                }
            })
            const data=await response.json();
            if (!response.ok) throw new Error("Could not fetch notifications");
            if (Array.isArray(data)){
                setNotifications(data)
            }else if (data && data.message){
                setNotifications([])
            }else{
                setNotifications([])
            }
        }catch(error){
            setAlertMessage({
                type:"danger",
                text:error.message ||"Something went wrong"
            });
        }finally{
            setLoad(false);
        }
    }
    React.useEffect(()=>{
        if (curUser){
            loadNotifications();
        }
    },[curUser,unreadOnly])

    async function markAsRead(notId){
        try{
            const token=localStorage.getItem("token");
            const response=await fetch(`http://localhost:5000/api/notification/${notId}/read`,{
                method:"PATCH",
                header:{
                    "Authorization":`Bearer ${token}`
                }
            });
            setNotifications(prev=>prev.map(notifns=>
                notifns.id===notId ?{...notifns,is_read:true}:notifns
            ))
        }
        catch(error){
            setAlertMessage({
                type:"danger",
                text:"Something went wrong"
            })
        }
    }
    async function markAllAsRead(){
        if (notifications.filter(a=>
            !a.is_read).length===0) return;
            setAction(true);
          
        try{
            const token=localStorage.getItem("token");
            const response=await fetch("http://localhost:5000/api/notification/read-all",{
                method:"PATCH",
                headers:{
                    "Authorization":`Bearer ${token}`
                }
            });
            const data=await response.json();
            if (!response.ok) throw new Error("Unable to update notifications");
            setNotifications(prevs=>prevs.map(a=>({...a,is_read:true})));
            if (unreadOnly){
                setNotifications([])
            }
        }catch(error){
            setAlertMessage({
                type:"",
                text:"Something went wrong"
            })
        }finally{
            setAction(false);
        }
    }
    const unreadCount = notifications.filter(a => !a.is_read).length;
    const dashboardRoutes = {
  admin: "/admin/dashboard",
  manager: "/manager/dashboard",
  technician: "/technician/dashboard",
  user: "/getTickets"
};

const userRole = curUser?.role?.toLowerCase() || "user";
const targetDashboard = dashboardRoutes[userRole] || "/getTickets";
    return (
    <>
        <div className="container mt-4">
             <Link to={targetDashboard} className="btn btn-outline-warning mb-3">
        Back to dashboard
    </Link>

            
            <Card className="shadow-sm border-0">
                <Card.Header className="bg-dark text-white d-flex flex-wrap justify-content-between align-items-center py-3 gap-2">
                    <h5 className="mb-0 fw-bold d-flex align-items-center">
                        Notifications
                        {curUser.role === "Manager" && (
                            <Badge bg="warning" className="ms-2 text-dark">Manager Master View</Badge>
                        )}
                    </h5>
                    <div className="d-flex align-items-center gap-3">
                        {unreadCount > 0 && (
                            <Button 
                                variant="outline-warning"
                                size="sm"
                                onClick={markAllAsRead}
                                disabled={action}
                                className="fw-bold py-2 px-3"
                            >
                                {action ? "Marking All as Read" : "Mark All as Read"}
                            </Button>
                        )}
                        
                    </div>
                </Card.Header>
                
                <Card.Body>
                    {alertMessage.text && (
                        <Alert variant={alertMessage.type} onClose={() => setAlertMessage({ type: "", text: "" })} 
                        dismissible>
                        {alertMessage.text}
                        </Alert>
                    )}
                    
                    {load ? (
                        <div className="text-center my-4">
                            <Spinner animation="border" variant="primary" size="sm" />
                            <p className="text-muted small mt-1">Loading Notifications</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <p className="text-muted text-center py-4 bg-light rounded mb-0">
                            There is no notification to show.
                        </p>
                    ) : (
                        <div className="notifications-list">
                            {notifications.map(item => {
                                let cardBg = "light";
                                if (!item.is_read) cardBg = "white border-start border-4 border-primary shadow-sm";
                                if (item.type === "assignment" && !item.is_read) cardBg = "white border-start border-4 border-warning shadow-sm";
                                
                                return (
                                    <Card
                                        key={item.id}
                                        className={`mb-2 ${cardBg}`}
                                        onClick={() => !item.is_read && markAsRead(item.id)}
                                        style={{ cursor: !item.is_read ? "pointer" : "default" }}
                                    >
                                        <Card.Body className="py-2 px-3 d-flex justify-content-between align-items-center">
                                            <div>
                                                <div className="d-flex align-items-center gap-2 mb-1">
                                                    <Badge 
                                                        bg={
                                                            item.type === "technicianUpdate" ? "warning" : 
                                                            item.type === "statusChange" ? "info" : "secondary"
                                                        } 
                                                        className={`px-2 py-1 text-capitalize ${item.type === "new ticket" ? "text-dark" : "text-white"}`}
                                                    >
                                                        {item.type || "System Update"}
                                                    </Badge>
                                                    
                                                    {curUser.role === "Manager" && item.users?.name && (
                                                        <span className="text-muted small font-monospace">
                                                            [Target: {item.users.name} ({item.users.role || ""})]
                                                        </span>
                                                    )}
                                                </div>
                                                <p className={`mb-0 small ${!item.is_read ? "text-dark fw-bold" : "text-muted"}`} style={{ whiteSpace: 'pre-wrap' }}>
                                                    {item.message || "Operational parameter altered."}
                                                </p>
                                            </div>
                                            <span className="text-muted text-end" style={{ fontSize: "0.7rem", minWidth: "80px" }}>
                                                Ticket: #{item.ticketId || item.ticket_id}
                                            </span>
                                        </Card.Body>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </Card.Body>
            </Card>
        </div>
    </>
);

}