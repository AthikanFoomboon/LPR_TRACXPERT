const express = require('express');
const router = express.Router();
const gateController = require('../controllers/gateController');

// API สำหรับอัปเดตสถานะประตู
router.post('/status', (req, res) => {
    const { status } = req.body;
    if (!status || (status !== "open" && status !== "closed")) {
        return res.status(400).json({ message: "Invalid status" });
    }
    const updatedStatus = gateController.updateGateStatus(status);
    res.json({ isOpen: updatedStatus });
});

module.exports = router;
