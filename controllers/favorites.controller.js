const e = require('express');
const pool = require ('../models/db');

const addFavorite = async (req, res) => {
    const user_id = req.user.id;
    const {vehicle_id} = req.params;

    try {
        const checkVehicle = await pool.query(
         'SELECT * FROM vehicles WHERE id = $1 AND is_deleted = false',
            [vehicle_id]   
        );

        if(checkVehicle.rows.length === 0) {
            return res.status(404).json({error: 'Vehiculo no encontrado'});
        }

        checkFavorite = await pool.query(
            'SELECT * FROM favorites WHERE user_id = $1 AND vehicle_id = $2',
            [user_id, vehicle_id]
        );
        if(checkFavorite.rows.length > 0) {
            return res.status(400).json({error: 'Ya esta en tus favoritos'});
        }


        await pool.query(
            'INSERT INTO favorites (user_id, vehicle_id) VALUES ($1, $2)',
            [user_id, vehicle_id]
        );

        res.status(200).json({message:'Agreado a favoritos'});
    } catch (error) {
        console.error('Error al agregar a favoritos', error);
        res.status(500).json({error: 'Error interno del servidor'});
    }
};

const removeFavorite = async(req, res) => {
    const user_id = req.user.id;
    const {vehicle_id} = req.params;

    try {
        await pool.query(
           'DELETE FROM favorites WHERE user_id = $1 AND vehicle_id = $2',
            [user_id, vehicle_id] 
        );

        res.status(200).json({message: 'Eliminado de favoritos'});
    } catch (error) {
        console.error('Error al eliminar de favoritos', error);
        res.status(500).json({error: 'Error interno del servidor'});
    }
};

const getUserFavorites = async (req, res) => {
    const user_id = req.user.id;

    try {
        const result = await pool.query(
             `
            SELECT 
                v.*, 
                COALESCE(
                    (
                        SELECT url 
                        FROM vehicle_images vi 
                        WHERE vi.vehicle_id = v.id 
                        ORDER BY vi.id ASC 
                        LIMIT 1
                    ), null
                ) AS main_image
            FROM favorites f
            JOIN vehicles v ON f.vehicle_id = v.id
            WHERE f.user_id = $1 AND v.is_deleted = false
            ORDER BY v.created_at DESC
            `,
            [user_id]
        );

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al obtener favoritos', error);
        res.status(500).json({error: 'Error interno del servidor'});
        
    }
};

module.exports = {addFavorite,removeFavorite,getUserFavorites};