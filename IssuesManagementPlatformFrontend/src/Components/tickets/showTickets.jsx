import React, { act } from "react";
import { Alert, Badge, Form,  } from "react-bootstrap";
import { data, Link } from "react-router-dom";
import StatusChange from "./statusChange";
import UpdateTickets from "./updatePriority";
import ChangeTickets from "./updateTickets";
import AssignTechnnician from "../auth/assignTechnician";
export default function ShowTickets({curUser,tickets,setTickets}){
    const [loading,setLoading]=React.useState(false);
    const [historyLoading, setHistoryLoading] = React.useState(false);
    const [ticketHistory, setTicketHistory] = React.useState([]);
    const [activeTicketId, setActiveTicketId] = React.useState(null);
    const [alertMessage,setAlertMessage]=React.useState({
        type:"",text:""
    });
    const [submitting,setSubmitting]=React.useState(false);
    const [search, setSearch] = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState("");
    const [meta, setMeta] = React.useState({ totalRecords: 0, curPage: 1, totalPages: 1 });

    React.useEffect(()=>{
        if (curUser){
            getTickets(meta.curPage)
        }
    },[curUser,statusFilter,meta.curPage]);
    async function getTickets(pageNumber = 1) {
    setLoading(true);
    try {
        const token = localStorage.getItem("token");
        const userRole = curUser?.role?.toLowerCase();
        const isManagement = userRole === "admin" || userRole === "manager";

        let params = new URLSearchParams();
        
        if (isManagement) {
            params.append("page", pageNumber);
            params.append("limit", 10);
            if (search) params.append("search", search);
        }
        
        if (statusFilter) params.append("status", statusFilter);

        const baseApiUrl = isManagement
            ? "http://localhost:5000/api/tickets/all"  
            : "http://localhost:5000/api/tickets";     

        const queryString = params.toString();
        const targetUrl = queryString ? `${baseApiUrl}?${queryString}` : baseApiUrl;

        console.log("Frontend dispatching request to URL:", targetUrl);

        const response = await fetch(targetUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error("Failed to load tickets");
        const data = await response.json();

        if (isManagement) {
            setTickets(data.tickets || []);
            if (data.meta) {
                setMeta({
                    totalRecords: data.meta.total_records || 0,
                    curPage: data.meta.current_page || pageNumber,
                    totalPages: data.meta.total_pages || 1
                });
            }
        } else {
            setTickets(Array.isArray(data) ? data : (data.tickets || []));
            setMeta({ totalRecords: Array.isArray(data) ? data.length : 0, curPage: 1, totalPages: 1 });
        }
    }
    catch (error) {
        console.error("Error in getTickets execution loop:", error);
        setAlertMessage({
            type: "danger",
            text: "Something went wrong while loading tickets"
        });
    } finally {
        setLoading(false);
    }
}


    async function viewTicketHistory(id){
        setActiveTicketId(id);
        setSubmitting(true);
        setHistoryLoading(true);
        try{
        const token=localStorage.getItem("token");
        const response=await fetch(`http://localhost:5000/api/tickets/${id}/history`,{
            method:"GET",
            headers:{
                "content-Type":"application/json",
                "Authorization":`Bearer ${token}`
            }
        });
        const data=await response.json();
        if (!response.ok) throw new Error("Unable to fetch ticket history");
        setTicketHistory(data)
    }
    catch(error){
    setAlertMessage({
      type:"danger",
      text:error.message || "Something went wrong"
    })
    }finally{
        setHistoryLoading(false);
    }
    }
    function handleSearchSubmit(e) {
        e.preventDefault();
        setMeta(prev => ({ ...prev, curPage: 1 })); 
        getTickets(1);
    }
    function handleUpdatedTicket(updatedTicket) {

    setTickets(prevTickets => 
        prevTickets.map(t => (t.id === updatedTicket.id ? updatedTicket : t))
    );
  
    getTickets(meta.curPage); 
}

    return ( 
        <div className="container mt-4">
    {alertMessage.text && (
     <Alert variant={alertMessage.type} onClose={() => setAlertMessage({ type: "", text: "" })} dismissible>
              {alertMessage.text}
    </Alert>
                    )}
                    

    <h2 className="mb-4">Ticket Management</h2>
    <Form onSubmit={handleSearchSubmit} className="row g-3 mb-4 align-items-end">
      <div className="col-md-5">
        <Form.Group controlId="searchTicket">
          <Form.Label>Search Tickets</Form.Label>
          <Form.Control
            type="text"
            placeholder="Search by subject or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Form.Group>
      </div>
      <div className="col-md-4">
        <Form.Group controlId="statusFilter">
          <Form.Label>Filter by Status</Form.Label>
          <Form.Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setMeta(prev => ({ ...prev, curPage: 1 }));
            }}
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="assigned">Assigned</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </Form.Select>
          </Form.Group>
        </div>
      <div className="col-md-3">
        <button type="submit" className="btn btn-primary w-100">
          Search
        </button>
      </div>
    </Form>
    <div className="row">
      <div className={activeTicketId ? "col-md-7" : "col-md-12"}>
        <div className="card shadow-sm">
          <div className="card-body">
            <h5 className="card-title mb-3">Tickets</h5>
            
            {loading ? (
              <div className="text-center my-4">
                <div className="spinner-border text-primary" role="status"></div>
              </div>
            ) : tickets.length === 0 ? (
              <p className="text-muted text-center my-4">No tickets found.</p>
            ) : (
              <div className="list-group">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => viewTicketHistory(ticket.id)}
                    className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                      activeTicketId === ticket.id ? "active" : ""
                    }`}
                  >
                    <div>
                      <h6 className="mb-1"><strong>Title:</strong> <span style={{color:"crimson"}}>{ticket.title || "No Subject"}</span></h6>
                      <h6 className="mb-1"><strong>Description:</strong>{ticket.description}</h6>
                      <h6 className="mb-1"><strong>Current Status:</strong> {ticket.status}</h6>
                      <h6 className="mb-1"><strong>Category:</strong> {ticket.category}</h6>
                      <h6 className="mb-1"><strong>Location:</strong>{ticket.locationDetails}</h6>
                      <small className={activeTicketId === ticket.id ? "text-white-50" : "text-muted"}>
                        Ref: #{ticket._id || ticket.id} 
                      </small>
                      <br/>
                      <small className={activeTicketId ===ticket.id ? "text-white-50" : "text-success"}>
                  <strong>Assigned To:</strong> {ticket.users_tickets_assigned_toTousers?.name || "Unassigned"}<br/>
                  <strong>Created by: </strong> {ticket.users_tickets_creator_idTousers?.name}
                      </small>
                      
                    </div>
                    <div>
                        
                    </div>
                    <Badge bg={ticket.status === "open" ? "success" : "secondary"}>
                      {ticket.status}
                    </Badge>
                  </button>
                ))}
              </div>
            )}

           
            {meta.totalPages > 1 && (
              <div className="d-flex justify-content-between align-items-center mt-3">
                <button
                  className="btn btn-sm btn-outline-secondary"
                  disabled={meta.curPage <= 1 || loading}
                  onClick={() => setMeta(prev => ({ ...prev, curPage: prev.curPage - 1 }))}
                >
                  Previous
                </button>
                <span className="small text-muted">
                  Page {meta.curPage} of {meta.totalPages}
                </span>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  disabled={meta.curPage >= meta.totalPages || loading}
                  onClick={() => setMeta(prev => ({ ...prev, curPage: prev.curPage + 1 }))}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>


      {activeTicketId && (
        <div className="col-md-5">
          <div className="card shadow-sm border-info">
            <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0" style={{ fontSize: "1rem" }}>Ticket Audit History</h5>
              <button 
                type="button" 
                className="btn-close btn-close-white" 
                onClick={() => setActiveTicketId(null)}
              ></button>
            </div>
            <div className="card-body">
              <ChangeTickets
              curUser={curUser}
              activeTicket={tickets.find(t=>t.id ===activeTicketId)}
              setTickets={setTickets}
              viewTicketHistory={viewTicketHistory}
              />
              <StatusChange 
              curUser={curUser}
              activeTicket={tickets.find(t=>t.id===activeTicketId)}
              setTickets={setTickets}
              viewTicketHistory={viewTicketHistory}/>

              <UpdateTickets 
              curUser={curUser}
              activeTicket={tickets.find(t=>t.id===activeTicketId)}
              setTickets={setTickets}
              viewTicketHistory={viewTicketHistory}
              />
              <AssignTechnnician 
            ticket={tickets.find(t=>t.id ===activeTicketId)} 
            curUser={curUser} 
            onAssignSuccess={handleUpdatedTicket} 
              />
                <div className="mb-3">
                    <Link
                        to={`/tickets/${activeTicketId}/comments`} 
                        className="btn btn-warning btn-sm w-100 fw-bold shadow-sm d-flex align-items-center justify-content-center"
                    >
                     See Comments
                    </Link>
                </div>
              {historyLoading ? (
                <div className="text-center my-4">
                  <div className="spinner-border spinner-border-sm text-info" role="status"></div>
                </div>
              ) : ticketHistory?.length === 0 ? (
                <p className="text-muted text-center my-3">No history logs recorded for this ticket.</p>
              ) : (
                <ul className="list-unstyled mb-0" style={{ fontSize: "0.9rem" }}>
                  {ticketHistory?.map((log, index) => (
                    <li key={index} className="border-bottom pb-2 mb-2">
                      <div className="d-flex justify-content-between">
                        <strong>Field Updated: {log.field_changed}</strong>
                        <span className="text-muted text-xs">
                          {log.changed_at ? new Date(log.changed_at).toLocaleDateString() : ""}
                        </span>
                      </div>
                      <p className="text-muted mb-0">changed from {log.old_value} to {log.new_value}</p>
                      {log.users ? (
  <small className="text-info d-block mt-1">
    By: <strong>{log.users.name}</strong> ({log.users.role})
  </small>
) : (
  <small className="text-muted d-block mt-1">
    By: System / Unknown User (ID: {log.changed_by})
  </small>
)}
      
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
   
  </div>
    )}