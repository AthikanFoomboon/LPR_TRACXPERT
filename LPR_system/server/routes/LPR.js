const express = require('express')
const { addFromData } = require('../controllers/LPR')
const { auth, adminCheck } = require('../middleware/auth')
const { listDeviceConnection, EditlistDeviceConnection, RemovelistDeviceConnection } = require('../controllers/cameraStatus')
const routes = express.Router()




routes.post('/addFromData',auth,adminCheck,addFromData)
routes.post('/listDeviceConnection',auth,adminCheck,listDeviceConnection);
routes.post('/edit-listDeviceConnection',auth,adminCheck,EditlistDeviceConnection);
routes.post('/remove-listDeviceConnection',auth,adminCheck,RemovelistDeviceConnection);







module.exports = routes