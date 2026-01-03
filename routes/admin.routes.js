const express = require ('express');
const router = express.Router();
const {getAllUsers, getAllVehicles, adminSoftDeleteVehicle } = require('../controllers/admin.controller');
const verifyToken = require('../middlewares/auth.middleware');
const isAdmin = require ('../middlewares/isAdmin.middleware');

router.use(verifyToken, isAdmin);

router.get('/users', getAllUsers);
router.get('/vehicles', getAllVehicles);
router.delete('/vehicle/:id', adminSoftDeleteVehicle);


module.exports = router;