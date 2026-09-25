import React from "react";
import {Routes,Route, Navigate, useNavigate,Link} from 'react-router-dom';
import Header from "./Header";
import Signup from "./auth/signup";
import Login from "./auth/login";
import { Alert, Button } from "react-bootstrap";
import ShowTickets from "./tickets/showTickets";
import CreateTickets from "./tickets/createTickets";
import ViewProfile from "./auth/viewProfile";
import AdminPrivilage from "./auth/adminPrivilage";
import AssignTechnnician from "./auth/assignTechnician";
import TicketCommentsLayout from "./ticketComment/commentView";
import ViewNotifications from "./notification/viewNotification";
export default function Body(){
    const [users,setUsers]=React.useState(null);
    const [tickets,setTickets]=React.useState([]);
    const [ticketComment,setTicketComment]=React.useState([]);
    const [allUsers, setAllUsers]=React.useState([]);
    const [notifications,setNotifications]=React.useState([]);
    const [ticketHistory,setTicketHistory]=React.useState([]);
    const [showSignup,setShowSignup]=React.useState(false);
    const navigate=useNavigate();

    const handleLogout=()=>{
        setUsers(null);
        localStorage.removeItem("token");
        navigate("/login");

    }
    const isAdmin= users?.role==="Admin";
    const isManager=users?.role==="Manager";
    return (
        <>
        <Header curUser={users}/>
        <div>
        {users && (
          
                <div className="row justify-content-center bg-yellow">
                <div className="col-md-8 text-center">
                    
                <div className="dashboard mb-4" >
                    <div 
  className="position-relative overflow-hidden py-2"
  style={{
    width: "100vw",
    position: "relative",
    left: "50%",
    right: "50%",
    marginLeft: "-50vw",
    marginRight: "-50vw",
    background: "antiquewhite", 
    minHeight: "55px"
  }}
>
  
  <div 
    style={{
      display: 'flex',
      whiteSpace: 'nowrap',
      width: '200vw', 
      animation: 'marqueeSimultaneous 15s linear infinite'
    }}
  >
    <div style={{ width: '100vw', display: 'flex', alignItems: 'center', paddingLeft: '20px' }}>
      <h3 className="logs m-0" style={{ color: "darkcyan" }}>
        Welcome <span>{users.role}, {users.name}</span>
      </h3>
    </div>
    
    <div style={{ width: '100vw', display: 'flex', alignItems: 'center', paddingLeft: '20px' }}>
      <h3 className="logs m-0" style={{ color: "darkcyan" }}>
        Welcome <span>{users.role}, {users.name}</span>
      </h3>
    </div>
  </div>

  <style>{`
    @keyframes marqueeSimultaneous {
      0% {
        transform: translate3d(0, 0, 0);
      }
      100% {
        transform: translate3d(-100vw, 0, 0); 
      }
    }
  `}</style>
</div>
<div className="m-0 justify-content-start mt-3"><Button variant="primary" onClick={handleLogout}
                size="lg" active>
                    Logout:
                </Button></div>
                
                </div>
              
                <div className="dashboard1">
                    <Link to="/getTickets"><Button variant="primary"
                    className="m-4 p-3 align-items-center justify-content-center"
                    size="lg">Get Tickets</Button></Link>
                   {users && users.role === "User" && (
        <Link to="/createTickets">
            <Button variant="warning" size="lg"
            className="m-4 p-3 align-items-center justify-content-center">Create a new ticket</Button>
        </Link>
    )}
                    <Link to="/viewProfile"><Button variant="primary" className="m-4 p-3 align-items-center justify-content-center"
                    size="lg">View Profile</Button></Link>
                    {users && users.role === "Admin" && (
        <Link to="/adminPrivilage">
            <Button variant="primary" size="lg"
            className="m-4 p-3 align-items-center justify-content-center">Change user's role</Button>
        </Link>
    )}
            <Link to="/notifications">
        <Button variant="info" size="lg">🔔 Notifications</Button>
        </Link>

                </div>
                </div>
                </div>
               
            )}
             </div>
             <Routes>
                <Route path="/login"
                element={!users ? (
                    <div className="text-center m-3">
                        {showSignup ? <Signup setUsers={setUsers} />
                       :<Login setUsers={setUsers} />}
                    <Button variant="primary" onClick={()=> setShowSignup(!showSignup)}
                    className="p-3 align-items-center justify-content-center">
                        {showSignup ? "Already have an account ? Log In":"Don't have an account ? Sign Up"}</Button>  
                    </div>
                ):(
                    <Navigate to={isAdmin ?"/admin/dashboard":isManager ? "/manager/dashboard":"/user/dashboard"}
                    replace />
                
                )}
                />
                <Route 
                path="/admin/dashboard"
                element={users && users.role==="Admin" ?(
                    <div className="res13">
                    </div>):
                        <Navigate to="/login" replace />}

                    />
                <Route 
                path="/manager/dashboard"
                element={users && users.role==="Manager" ? (
                    <div className="res13">
                    </div>):<Navigate to="/login" replace />
                }/>
                <Route
                path="/user/dashboard"
                element={users && (users.role === "User" || users.role === "Technician")?(
                        <div className="res13">
                        </div>)
                         : 
                        <Navigate to="/login" replace />}
                        />
                    <Route 
                    path="/getTickets"
                    element={users ? (
                        <div>
                            <ShowTickets curUser={users}
                            tickets={tickets}
                            setTickets={setTickets} />

                        </div>):<Navigate to="/login" replace/>
                    }
                    />
                    <Route 
                    path="/createTickets"
                    element={(users && users?.role?.toLowerCase()==="user") ?(
                        <CreateTickets curUser={users}
                        tickets={tickets}
                        setTickets={setTickets} />):<Navigate to="/login" replace/>

                    }/>
                    <Route
                    path="/viewProfile"
                    element={users ? (
                        <ViewProfile 
                        curUser={users}/>

                    ):<Navigate to="/login" replace/>}
                    />
                    <Route 
                    path="/adminPrivilage"
                    element={users && isAdmin ?(
                        <AdminPrivilage curUser={users}
                        users={allUsers}
                    setUsers={setAllUsers} />):
                <Navigate to="/login" replace />}/>
                    <Route 
            path="/tickets/:id/comments"
            element={users ? (
            <TicketCommentsLayout curUser={users} />
            ) : (
            <Navigate to="/login" replace />
            )}
            />
                <Route 
    path="/notifications"
    element={users ? (
        <ViewNotifications curUser={users} 
        notifications={notifications}
        setNotifications={setNotifications}
            />
    ) : 
        <Navigate to="/login" replace />
    }
/>    

             </Routes>
        </>
    )
}