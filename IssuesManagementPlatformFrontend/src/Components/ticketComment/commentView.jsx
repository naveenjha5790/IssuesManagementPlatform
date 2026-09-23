import React from "react";
import { useParams, Link } from "react-router-dom";
import { Spinner, Alert, Card } from "react-bootstrap";
import ShowComments from "./showComment";
import CreateComments from "./createComments";

export default function TicketCommentsLayout({ curUser }) {
    const { id } = useParams(); 
    const [ticket, setTicket] = React.useState(null);
    const [ticketComment, setTicketComment] = React.useState([]); 
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");

    React.useEffect(() => {
        async function fetchTicketHeader() {
            setLoading(true);
            setError("");
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(`http://localhost:5000/api/tickets/${id}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });
                if (!response.ok) throw new Error("Could not load target ticket specs.");
                const data = await response.json();
                setTicket(data);
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        if (id) fetchTicketHeader();
    }, [id]);

    if (loading) {
        return (
            <div className="text-center my-5">
                <Spinner animation="border" variant="primary" />
                <p className="text-muted small mt-2">Opening conversation workspace...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mt-4 text-center">
                <Alert variant="danger">{error}</Alert>
                <Link to="/getTickets" className="btn btn-secondary btn-sm">← Back to Tickets</Link>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <Link to="/getTickets" className="btn btn-sm btn-outline-secondary mb-3">
                ← Back to Ticket Panel
            </Link>

            <div className="row">
            
                <div className="col-md-5 mb-4">
                    <Card className="shadow-sm border-secondary mb-3">
                        <Card.Header className="bg-dark text-white fw-bold py-2">
                            Ticket Context Reference #{id}
                        </Card.Header>
                        <Card.Body className="py-2 px-3">
                            <Card.Title className="fw-bold mb-1">{ticket?.title || "Untitled Issue"}</Card.Title>
                            <Card.Text className="text-muted small mb-1">{ticket?.description || "No description provided."}</Card.Text>
                        </Card.Body>
                    </Card>

         
                    <CreateComments 
                        ticket={{ id: id }} 
                        curUser={curUser} 
                        ticketComment={ticketComment}
                        setTicketComment={setTicketComment}
                    />
                </div>

               
                <div className="col-md-7">
                    <div className="bg-white p-3 border rounded shadow-sm">
                        <ShowComments 
                            ticket={{ id: id }} 
                            curUser={curUser} 
                            ticketComment={ticketComment} 
                            setTicketComment={setTicketComment} 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
