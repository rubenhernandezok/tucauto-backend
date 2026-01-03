const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res)=> {
    res.send('API Tucauto funcionando');
});

const vehicleRoutes = require('./routes/vehicle.routes');
app.use('/api/vehicles', vehicleRoutes);

const usersRoutes = require ('./routes/users.routes');
app.use('/api/users',usersRoutes );

const favoritesRoutes = require ('./routes/favorites.routes');
app.use('/api/favorites', favoritesRoutes);

const adminRoutes = require('./routes/admin.routes');
app.use('/admin', adminRoutes);

const conversationsRoutes = require('./routes/conversations.routes');
app.use('/api/conversations', conversationsRoutes);

const messagesRoutes = require('./routes/messages.routes');
app.use('/api/messages', messagesRoutes);


const pool = require('./models/db')

app.get('/api/vehicles', async (req, res) =>{
    try{
        const result = await pool.query('SELECT * FROM vehicles');
        res.json(result.rows);
    } catch (error) {
        console.error("Error al obtener vehiculos:", error);
        res.status(500).json({error: 'Error del servidor'});
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});