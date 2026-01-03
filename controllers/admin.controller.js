const pool = require ('../models/db');

const getAllUsers = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error al obtener usuarios", error);
        res.status(500).json({error: 'Error interno del servidor'});
        
    }
};

const getAllVehicles = async (req,res) => {

    try {
        const result = await pool.query(
           `SELECT v.*, 
                u.name AS user_name,
                COALESCE(
                    (
                        SELECT url FROM vehicle_images vi
                        WHERE vi.vehicle_id = v.id
                        ORDER BY vi.id ASC
                        LIMIT 1
                    ), null
                ) AS main_image
            FROM vehicles v
            JOIN users u ON v.user_id = u.id
            ORDER BY v.created_at DESC` 
        );

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al obtener publicaciones', error);
        res.status(500).json({error: 'Error interno del servidor'});
    }
};

const adminSoftDeleteVehicle = async (req, res) => {
    const {id} = req.params;

    try {
        await pool.query(
            'UPDATE vehicles SET is_deleted = true WHERE id = $1',
            [id]
        );
        res.status(200).json({message: 'Publicacion eliminada por el administrador'});
    } catch (error) {
        console.error('Error al eliminar publicacion como admin', error);
        res.status(500).json({error: 'Error interno del servidor'});
    }
};

module.exports = { getAllUsers, getAllVehicles, adminSoftDeleteVehicle};
