import React from "react";
import { Card } from "react-bootstrap";

export default function ViewProfile(){
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

    return (
        <>
        <Card className="h-100 shadow-sm border-0 bg-white rounded p-2 m-3">
            <Card.Body className="d-flex flex-column justify-contendt-between p-3">
                <Card.Title className="d-flex align-items-start justify-content-between mb-3">
                    My Profile
                </Card.Title>
                <Card.Text className="text-secondary small mb-2">
                    <strong>Name: </strong>{profileData.name}
                </Card.Text>
                <Card.Text className="text-secondary small mb-2">
                    <strong>Email: </strong>{profileData.email}
                </Card.Text>
                <Card.Text className="text-secondary small mb-2">
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
                </>
    )
}