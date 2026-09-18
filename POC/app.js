require('dotenv').config()
const express=require('express');
const app=express();
const auth1=require('./routes/auth');
const tickets=require('./routes/tickets')
const port=process.env.PORT || 5000;
app.use(express.json());
app.use('/api/auth',auth1);
app.use('/api',tickets)
app.listen(port,()=>{
    console.log(`Server is listening on port number ${port}`)
});