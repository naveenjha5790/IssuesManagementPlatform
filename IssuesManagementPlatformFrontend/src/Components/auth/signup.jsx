import React from "react";
import {Alert, Button, Form} from 'react-bootstrap';
export default function Signup({setUsers}){
    const [newUser,setNewUser]=React.useState({
        email:"",
        name:"",
        password:""
    });
    const [isSignUp,setIsSignUp]=React.useState(false);
    const [alertMessage,setAlertMessage]=React.useState({
        type:"",text:""
    });
    function postHandler(use){
        const {name,value}=use.target;
        setNewUser(prev=>({
            ...prev,[name]:value
        }))
    };

    async function handleNewUser(use){
        use.preventDefault();

        if (!newUser.name || !newUser.email || !newUser.password){
            setAlertMessage({type:"danger",
                text:"Email, Name and Password are required to sign In"
            });
            return;

        }
        setIsSignUp(true);
        try{
            const payload={
                name:newUser.name,
                email: newUser.email,
                password: newUser.password
            };
            const response=await fetch("http://localhost:5000/api/auth/signup",{
                method:"POST",
                headers:{"content-Type":"application/json"},
                body:JSON.stringify(payload)
            });
            const data=await response.json();
            console.log("User created successfully");
            const newestUser=data.user || data;
            setNewUser({
                name:"",email:"",password:""
            });
            setAlertMessage({type:"success",text:"You have successfully signed in. Now Log In to access"});
        }catch(error){
            setAlertMessage({type:"danger",text:"Request failed. Please try again"})
        }finally{
            setIsSignUp(false)
        }
    }
        return (
            <>
            <div className="text-center m-3">
                <Form onSubmit={handleNewUser}>
                    <Form.Group className="mb-3 p-3">
                        <Form.Control type="text" name="name"
                        placeholder="Give your full name"
                        value={newUser.name} onChange={postHandler}
                        className="mb-3 p-3" required>
                        </Form.Control>
                        <Form.Control type="email" name="email"
                        placeholder="Give your emailID"
                        value={newUser.email} onChange={postHandler}
                        className="mb-3 p-3" required>
                        </Form.Control>
                        <Form.Control type="password" name="password"
                        placeholder="Give a strong password of minimum 8 length"
                        value={newUser.password} onChange={postHandler} required
                        className="mb-3 p-3">
                        </Form.Control>
                        <Button variant="warning" type="submit">
                            {isSignUp ? "Signing Up" :"Sign Up"}
                        </Button>
                    </Form.Group>
                </Form>
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