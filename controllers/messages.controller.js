const pool = require ('../models/db');

// Obtener mensajes por conversación (paginar si querés con ?limit=&offset=)
const getMessagesByConversation = async (req, res) => {
  try {
    const user_id = req.user.id;
    const conversationId = req.params.conversationId;

    // Verificar que el usuario pertenezca a la conversación
    const check = await pool.query('SELECT * FROM conversations WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)', [conversationId, user_id]);
    if (check.rows.length === 0) {
      return res.status(403).json({ error: 'No autorizado para ver estos mensajes' });
    }

    const messagesRes = await pool.query(
      `SELECT id, sender_id, message, created_at
       FROM messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC`,
      [conversationId]
    );

    res.status(200).json(messagesRes.rows);
  } catch (error) {
    console.error('Error en getMessagesByConversation', error);
    res.status(500).json({ error: 'Error al obtener mensajes' });
  }
};

// Enviar mensaje
const sendMessage = async (req, res) => {
  try {
    const sender_id = req.user.id;
    const { conversation_id, message } = req.body;

    if (!conversation_id || !message) {
      return res.status(400).json({ error: 'conversation_id y message son requeridos' });
    }

    // Verificar que el usuario pertenezca a la conversación
    const check = await pool.query('SELECT * FROM conversations WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)', [conversation_id, sender_id]);
    if (check.rows.length === 0) {
      return res.status(403).json({ error: 'No autorizado para enviar mensajes en esta conversación' });
    }

    const insert = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, message) VALUES ($1, $2, $3) RETURNING id, sender_id, message, created_at`,
      [conversation_id, sender_id, message]
    );

    // opcional: devolver el mensaje insertado
    res.status(201).json({ message: insert.rows[0] });
  } catch (error) {
    console.error('Error en sendMessage', error);
    res.status(500).json({ error: 'Error al enviar mensaje' });
  }
};

module.exports = { getMessagesByConversation, sendMessage };
