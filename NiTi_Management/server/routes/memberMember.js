const express = require('express')
const routes = express.Router()
const { adminCheck, auth } = require('../middleware/auth')
const { getMemberData, listMemberData, removeMemberData, updateMemberData, exportMemberData } = require('../controllers/memberData')


routes.post('/addMemberData',auth,adminCheck,getMemberData)
routes.post('/listMemberData',auth,adminCheck,listMemberData)
routes.post('/remove-memberData_API',auth,adminCheck,removeMemberData)
routes.post('/updateMemberData',auth,adminCheck,updateMemberData)
routes.post('/export-member-data',auth,adminCheck, exportMemberData);



module.exports = routes