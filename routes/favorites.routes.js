const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/auth.middleware');

const {
    addFavorite,
    removeFavorite,
    getUserFavorites
} = require('../controllers/favorites.controller');

router.use(verifyToken);

router.post('/:vehicle_id', addFavorite);

router.delete('/:vehicle_id',removeFavorite);

router.get('/',getUserFavorites);

module.exports = router;