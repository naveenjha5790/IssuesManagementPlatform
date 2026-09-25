import React from "react";
import { Card } from "react-bootstrap";
import { Link } from "react-router-dom";

export default function ViewProfile({curUser}){
    const [profileData,setProfileData]=React.useState(null);
    const [loading,setLoading]=React.useState(true);
    const [alertMessage,setAlertMessage]=React.useState({type:"",text:""});

    React.useEffect(()=>{
        async function fetchProfile() {
            try{
                const token=localStorage.getItem("token");
                const response=await fetch("http://localhost:5000/api/auth/viewProfile",{
                    method:"GET",
                    headers:{
                        "content-Type":"application/json",
                        "Authorization":`Bearer ${token}`
                    }
                });
                const data=await response.json();
                if (response.ok){
                    setProfileData(data);
                }else{
                    setAlertMessage({type:"danger",text:data.message || "failed to load account profile"})
                }
            }catch(error){
                console.log(error)
                    setAlertMessage({type:"danger",text:error})
            }finally{
                setLoading(false);
            }
        }
        fetchProfile();
    },[])
    if (loading) return <p style={{textAlign:"center",color:"black"}}>Loading profile details</p>;
    if (!profileData) return <p style={{textAlign:"center",color:"black"}}>Failed to load profile</p>;
    const dashboardRoutes = {
    admin: "/admin/dashboard",
    manager: "/manager/dashboard",
    technician: "/technician/dashboard",
    user: "/user/dashboard"
};
const userRole = curUser?.role?.toLowerCase() || "user";
const targetDashboard = dashboardRoutes[userRole] || "/getTickets";

    return (
        <>
       <div className="d-flex flex-column align-items-center w-100">
        <Link to={targetDashboard} className="btn btn-outline-danger mb-3">
                  Back to dashboard
              </Link>
        <Card className="h-100 shadow-sm border-success bg-light rounded p-2 m-3 d-flex justify-content-center"
        style={{width:"450px"}}>
            <Card.Body className="d-flex flex-column justify-content-center p-3">
                <Card.Title className="d-flex align-items-start justify-content-between mb-3 text-danger">
                    My Profile
                </Card.Title>
                <Card.Text className="text-primary small mb-2">
                    <strong>Name: </strong>{profileData.name}
                </Card.Text>
                <Card.Text className="text-link small mb-2">
                    <strong>Email: </strong>{profileData.email}
                </Card.Text>
                <Card.Text className="text-success small mb-2">
                    <strong>Role: </strong>{profileData.role}
                </Card.Text>
            </Card.Body>
        </Card>
        {alertMessage.text && (
                    <Alert variant={alertMessage.type}
                    onClose={()=> setAlertMessage({type:"",text:""})}
                    dismissible>
                        {alertMessage.text}
                    </Alert>
                )}
                </div>
                </>
    )
}