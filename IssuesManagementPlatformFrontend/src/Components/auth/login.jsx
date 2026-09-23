import React from "react";
import { Alert, Button, Form } from "react-bootstrap";
export default function Login({setUsers}){
    const [alertMessage,setAlertMessage]=React.useState({
        type:"",
        text:""
    });
    const [newLogin,setNewLogin]=React.useState({
        email:"",
        password:""
    });
    const [isLogin,setIsLogin]=React.useState(false);

    function postHandler(use){
        const {name,value}=use.target;
        setNewLogin(prev=>({
            ...prev,[name]:value
        }))
    }
    async function doLogin(use){
        use.preventDefault();
        if (!newLogin.email || !newLogin.password){
            setAlertMessage({
                type:"danger",
                text:"Please provide email and password"
            });
            return;
        }
        setIsLogin(true);
        try{
            const payload={email:newLogin.email,
                password: newLogin.password
            };
            const response=await fetch("http://localhost:5000/api/auth/login",{
                method:"POST",
                headers:{"content-Type":"application/json"},
                body: JSON.stringify(payload)
            });
            const data= await response.json();
            if (!response.ok){
                throw new Error(data.msg || data.message || "Invalid Credentials")
            }
            console.log("Successfully logged in",data);
            const newLogins=data.user || data;
            setUsers(newLogins);
            if (data.token){
                localStorage.setItem("token",data.token);
            }
            setNewLogin({
                email:"",
                password:""
            });
            setAlertMessage({
                type:"success",
                text:"Successfully logged in"
            });
        }catch(error){
            setAlertMessage({type:"danger",
                text:error.message || "Something went wrong"
            })
        }finally{
            setIsLogin(false);
        }
    }
        return (
            <>
            <div className="text-center">
                <Form onSubmit={doLogin}>
                    <Form.Group className="mb-3 p-3">
                        <Form.Control type="email"
                        name="email" 
                        placeholder="Give your registered email id"
                        value={newLogin.email} onChange={postHandler}
                        required></Form.Control>
                        <Form.Control type="password"
                        name="password"
                        placeholder="Give your password"
                        value={newLogin.password} onChange={postHandler}
                        required></Form.Control>
                        <Button variant="warning" type="submit"
                        className="p-4 mt-4">
                            {isLogin ? "Logging In":"Log In"}
                        </Button>
                    </Form.Group>
                </Form>
                {alertMessage.text && (
                    <Alert variant={alertMessage.type}
                    onClose={()=>setAlertMessage({
                        type:"",
                        text:""
                    })} dismissible>
                        {alertMessage.text}
                    </Alert>
                )}
            </div>
            </>
        )
    
}