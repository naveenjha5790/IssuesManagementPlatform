import { Navbar, Container } from "react-bootstrap"
export default function Header({curUser}){
    const roleName=curUser?.role;
    return (
        <Navbar bg="danger" variant="dark" expand="lg" className="shadow-sm py-3 mb-4"
        fixed="top"
        style={{zIndex:"1050"}}>
      <Container className="d-flex justify-content-between align-items-center">
        
        <Navbar.Brand href="/" className="fw-bold fs-4">
          Issues Management Platform
        </Navbar.Brand>
        {curUser && (
          <Navbar.Text className="text-white fw-bold fs-4 ms-auto pe-2">
            {roleName === "Admin" ? "Admin Dashboard" : 
             roleName === "Manager" ? "Manager Dashboard" : 
             roleName === "User" ? "User Dashboard" : 
             `${roleName} Dashboard`}
          </Navbar.Text>
        )}

      </Container>
    </Navbar>
    )
}