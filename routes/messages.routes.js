const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/auth.middleware');
const { getMessagesByConversation, sendMessage } = require('../controllers/messages.controller');

router.get('/:conversationId', verifyToken, getMessagesByConversation); // obtener mensajes
router.post('/', verifyToken, sendMessage); // enviar mensaje (body: conversation_id, message)

module.exports = router;
