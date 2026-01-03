const pool = require('../models/db');
const supabase = require('../supabaseClient');



const createVehicleWithImages = async (req, res) => {
    try {
        const {
            title,
            description,
            type,
            brand,
            model,
            year,
            price
        } = req.body;

        const user_id = req.user.id;

        // 1. Crear el vehículo en la base de datos
        const vehicleResult = await pool.query(
            `INSERT INTO vehicles (title, description, type, brand, model, year, price, user_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [title, description, type, brand, model, year, price, user_id]
        );

        const vehicle = vehicleResult.rows[0];
        const vehicle_id = vehicle.id;

        // 2. Procesar imágenes si existen
        const files = req.files;
        const urls = [];

        if (files && files.length > 0) {
            if (files.length > 4) {
                return res.status(400).json({ error: 'Máximo 4 imágenes por vehículo' });
            }

            for (const file of files) {
                const fileName = `${vehicle_id}/${Date.now()}_${file.originalname}`;

                const { error: uploadError } = await supabase.storage
                    .from('vehiculos-imagenes')
                    .upload(fileName, file.buffer, {
                        contentType: file.mimetype,
                    });

                if (uploadError) {
                    console.error(uploadError);
                    return res.status(500).json({ error: 'Error al subir imagen en Supabase' });
                }

                const { data: publicData } = supabase.storage
                    .from('vehiculos-imagenes')
                    .getPublicUrl(fileName);

                const publicUrl = publicData.publicUrl;

                // Guardar URL en la DB
                await pool.query(
                    'INSERT INTO vehicle_images (vehicle_id, url) VALUES ($1, $2)',
                    [vehicle_id, publicUrl]
                );

                urls.push(publicUrl);
            }
        }

        // 3. Devolver el resultado con las imágenes
        res.status(201).json({
            message: 'Publicación creada exitosamente',
            vehicle,
            images: urls
        });

    } catch (error) {
        console.error('Error al crear vehículo con imágenes', error);
        res.status(500).json({ error: 'Error al crear la publicación con imágenes' });
    }
};

const getAllVehicles = async (req, res) => {
  const { type, brand, model, year, minPrice, maxPrice, limit = 10, offset = 0 } = req.query;

  const filters = [];
  const values = [];
  let index = 1;

  if (type) { filters.push(`vehicles.type = $${index++}`); values.push(type); }
  if (brand) { filters.push(`vehicles.brand = $${index++}`); values.push(brand); }
  if (model) { filters.push(`vehicles.model = $${index++}`); values.push(model); }
  if (year) { filters.push(`vehicles.year = $${index++}`); values.push(year); }
  if (minPrice) { filters.push(`vehicles.price >= $${index++}`); values.push(minPrice); }
  if (maxPrice) { filters.push(`vehicles.price <= $${index++}`); values.push(maxPrice); }

  filters.push(`vehicles.is_deleted = false`);
  const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

  try {
    const query = `
  SELECT 
    vehicles.*,
    users.name AS user_name,
    (
      SELECT url 
      FROM vehicle_images vi 
      WHERE vi.vehicle_id = vehicles.id 
      ORDER BY vi.id ASC
      LIMIT 1
    ) AS main_image
  FROM vehicles
  JOIN users ON vehicles.user_id = users.id
  ${whereClause}
  ORDER BY vehicles.created_at DESC
  LIMIT $${index++} OFFSET $${index}
`;

    values.push(limit);
    values.push(offset);

    const result = await pool.query(query, values);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al obtener los vehículos filtrados', error);
    res.status(500).json({ error: 'Error al obtener los vehículos' });
  }
};

const getVehicleById = async (req, res) => {
    const {id} = req.params;

    try {
        const vehicleResult = await pool.query(
     `SELECT vehicles.*, users.name AS user_name
      FROM vehicles
      JOIN users ON vehicles.user_id = users.id
      WHERE vehicles.id = $1 AND vehicles.is_deleted = false
    `, [id]);

    if (vehicleResult.rows.length === 0) {

        return res.status(400).json({error: 'Vehiculo no encontrado'});
    }

    const vehicle = vehicleResult.rows[0];

    //aca implemntamos las imagenes xd
    const imagesResult = await pool.query(
        'SELECT url FROM vehicle_images WHERE vehicle_id = $1',
        [id]
    );

    vehicle.images = imagesResult.rows.map(row => row.url);

        res.status(200).json(vehicle);
    } catch (error) {
        console.error('Error al obtener el vehiculo por ID', error);
        res.status(500).json({error: 'Error interno del servidor'});
    }
}



const getVehicleWithImages = async (req, res) => 
    {
        try {
            const result = await pool.query(`
            SELECT DISTINCT ON (v.id) 
                v.*, 
                u.name AS user_name,
                i.url AS image_url
            FROM vehicles v
            JOIN users u ON v.user_id = u.id
            LEFT JOIN vehicle_images i ON v.id = i.vehicle_id
            ORDER BY v.id, i.id
        `);
        
        res.status(200).json(result.rows);
        } catch (error) {
            console.error('Error al obtener vehiculos con imagen', error);
            res.status(500).json({error: 'Error al obtener las publicaciones'});
        }
    };


const deleteVehicle = async (req, res) => {
    const {id} = req.params;
    const userId = req.user.id;

    try {
        const result = await pool.query(
         `SELECT * FROM vehicles WHERE id = $1 AND user_id = $2`,
         [id, userId]
        );

        if ( result.rows.length === 0) {
            return res.status(404).json({error:'Vehiculo no encontrado o no autorizado'});
        }

        await pool.query(
             `UPDATE vehicles SET is_deleted = true WHERE id = $1`,
             [id]
        );

        res.status(200).json({message: 'Publicacion eliminada correctamente(Soft delete)'});
    } catch (error) {
            console.error('Error al eliminar vehículo', error);
            res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const updateVehicle = async (req, res) => {
    const {id} = req.params;
    const {
        title,
        description,
        type,
        brand,
        model,
        year,
        price
    } = req.body;

    const user_id = req.user.id;

    try {
        const vehicleResult = await pool.query(
            'SELECT * FROM vehicles WHERE id = $1 AND user_id = $2 AND is_deleted = false',
            [id, user_id] 
        );

        if(vehicleResult.rows.length === 0) {
            return res.status(404).json({error: 'Vehiculo no encontrado o no autorizado'});
        }

        await pool.query(
            `UPDATE vehicles
             SET title = $1, description = $2, type = $3, brand = $4, model = $5, year = $6, price = $7
             WHERE id = $8`,
            [title, description, type, brand, model, year, price, id]
        );

        const files = req.files;
        if(files && files.length > 0) {
            // 1. Borrar imágenes anteriores del registro (y podríamos borrar de Supabase si lo deseás)
            await pool.query('DELETE FROM vehicle_images WHERE vehicle_id = $1', [id]);

            // 2. Subir nuevas imágenes
            for (const file of files) {
                const fileName = `${id}/${Date.now()}_${file.originalname}`;

                const { error: uploadError } = await supabase.storage
                    .from('vehiculos-imagenes')
                    .upload(fileName, file.buffer, {
                        contentType: file.mimetype,
                    });

                if (uploadError) {
                    console.error(uploadError);
                    return res.status(500).json({ error: 'Error al subir imagen a Supabase' });
                }

                const { data: publicData } = supabase.storage
                    .from('vehiculos-imagenes')
                    .getPublicUrl(fileName);

                const publicUrl = publicData.publicUrl;

                await pool.query(
                    'INSERT INTO vehicle_images (vehicle_id, url) VALUES ($1, $2)',
                    [id, publicUrl]
                );
        }
    }
    res.status(200).json({message: 'Publicacion actualizada correctamente'});
    } catch (error) {
        console.error('Error al actualizar publicacion', error);
        res.status(500).json({error: 'Error interno del servidor'});
    }
};

const getMyVehicles = async (req, res) => {

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
            FROM vehicles v
            WHERE v.user_id = $1 AND v.is_deleted = false
            ORDER BY v.created_at DESC
        `, [user_id]
        );

        res.status(200).json(result.rows);

    } catch (error) {
         console.error('Error al obtener mis publicaciones', error);
         res.status(500).json({error: 'Error al obtener tus publicaciones'});
    }
}


module.exports = {getAllVehicles, getVehicleById,createVehicleWithImages,getVehicleWithImages,deleteVehicle,updateVehicle, getMyVehicles};