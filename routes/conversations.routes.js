const express = require('express');
const router = express.Router();
const { createOrGetConversation, getMyConversations,getConversationById } = require('../controllers/conversations.controller');
const verifyToken = require('../middlewares/auth.middleware');

router.post('/', verifyToken, createOrGetConversation); // crear o devolver conversación existente
router.get('/', verifyToken, getMyConversations);     // listar conversaciones del user
router.get('/:id', verifyToken, getConversationById);
module.exports = router;
