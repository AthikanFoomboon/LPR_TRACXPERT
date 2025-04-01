const express = require('express')
const routes = express.Router()
const {register, login, currentUser} = require('../controllers/auth')
const { adminCheck, auth, getUserToken } = require('../middleware/auth')


routes.post('/login',login)
routes.post('/register',register)
routes.post('/current-user',auth,currentUser);
routes.post('/current-admin',auth,adminCheck,currentUser);
routes.post('/getUserToken',getUserToken);
routes.get('/root',(req,res)=>{
    res.send('success fully api')
});

module.exports = routes