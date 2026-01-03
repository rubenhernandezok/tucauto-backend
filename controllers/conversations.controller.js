const pool = require('../models/db');

// Crear una conversación (si ya existe devuelve la existente)
const createOrGetConversation = async (req, res) => {
  try {
    const buyer_id = req.user.id;
    const { vehicle_id, seller_id } = req.body;

    if (!vehicle_id || !seller_id) {
      return res.status(400).json({ error: 'vehicle_id y seller_id son requeridos' });
    }

    if (buyer_id === seller_id) {
      return res.status(400).json({ error: 'No podés iniciar conversación con vos mismo' });
    }

    const findQuery = `
      SELECT * FROM conversations
      WHERE buyer_id = $1 AND seller_id = $2 AND vehicle_id = $3
      LIMIT 1
    `;
    const findRes = await pool.query(findQuery, [buyer_id, seller_id, vehicle_id]);

    if (findRes.rows.length > 0) {
      return res.status(200).json({ conversation: findRes.rows[0] });
    }

    const insertQuery = `
      INSERT INTO conversations (buyer_id, seller_id, vehicle_id)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const insertRes = await pool.query(insertQuery, [buyer_id, seller_id, vehicle_id]);

    res.status(201).json({ conversation: insertRes.rows[0] });
  } catch (error) {
    console.error('Error en createOrGetConversation', error);
    res.status(500).json({ error: 'Error interno al crear conversación' });
  }
};


// Obtener conversaciones del usuario (buyer o seller)
const getMyConversations = async (req, res) => {
  try {
    const user_id = req.user.id;

    const query = `
      SELECT 
        c.*,
        v.title AS vehicle_title,
        v.price AS vehicle_price,
        v.id AS vehicle_id,
        u_b.name AS buyer_name,
        u_s.name AS seller_name,
        
        -- último mensaje
        (
          SELECT m.message 
          FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC
          LIMIT 1
        ) AS last_message,
        
        -- fecha del último mensaje
        (
          SELECT m.created_at
          FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC
          LIMIT 1
        ) AS last_message_at

      FROM conversations c
      JOIN vehicles v ON v.id = c.vehicle_id
      JOIN users u_b ON u_b.id = c.buyer_id
      JOIN users u_s ON u_s.id = c.seller_id

      WHERE c.buyer_id = $1 OR c.seller_id = $1

      ORDER BY 
        COALESCE(
          (
            SELECT m.created_at 
            FROM messages m 
            WHERE m.conversation_id = c.id 
            ORDER BY m.created_at DESC 
            LIMIT 1
          ),
          c.created_at
        ) DESC
    `;

    const result = await pool.query(query, [user_id]);
    res.status(200).json(result.rows);

  } catch (error) {
    console.error('Error en getMyConversations', error);
    res.status(500).json({ error: 'Error al obtener conversaciones' });
  }
};



const getConversationById = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { id } = req.params; // conversation_id

    const query = `
      SELECT 
        c.*,
        v.title AS vehicle_title,
        v.id AS vehicle_id,
        u_b.name AS buyer_name,
        u_s.name AS seller_name
      FROM conversations c
      JOIN vehicles v ON v.id = c.vehicle_id
      JOIN users u_b ON u_b.id = c.buyer_id
      JOIN users u_s ON u_s.id = c.seller_id
      WHERE c.id = $1
      LIMIT 1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Conversación no encontrada" });
    }

    const conv = result.rows[0];

    // Determinar con quién está hablando el usuario
    let other_user_name =
      user_id === conv.buyer_id ? conv.seller_name : conv.buyer_name;

    res.json({
      ...conv,
      other_user_name
    });

  } catch (error) {
    console.error("Error en getConversationById", error);
    res.status(500).json({ error: "Error al obtener conversación" });
  }
};


module.exports = { createOrGetConversation, getMyConversations,getConversationById };
