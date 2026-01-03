const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload.middleware');
const verifyToken = require('../middlewares/auth.middleware');

const { 
    createVehicleWithImages, 
    getAllVehicles, 
    getVehicleById ,
    getVehicleWithImages,
    deleteVehicle,
    updateVehicle,
    getMyVehicles
      } = require ('../controllers/vehicles.controller');


router.post('/create',verifyToken,upload.array('images', 4), createVehicleWithImages);
router.get('/', getAllVehicles);
router.get('/vehicles-with-images', getVehicleWithImages);
router.get('/my-vehicles', verifyToken, getMyVehicles);

router.get('/:id', getVehicleById);
router.put('/:id',verifyToken, upload.array('images, 4'),updateVehicle )
router.delete('/vehicle/:id,',verifyToken,deleteVehicle)

module.exports = router;