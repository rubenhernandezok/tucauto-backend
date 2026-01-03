const pool = require('../models/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


const createUser = async (req, res) => {
    const {name, email, password_hash } = req.body;

    if(!name || !email || !password_hash) {
        return res.status(400).json({error: 'Nombre, email y contraseña son obligatorios'})
    }

    try{
        const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({error: 'El email ya esta registrado'});
        }

        const hashedPassword = await bcrypt.hash(password_hash, 10);

        const result = await pool.query(
            'INSERT INTO users (name, email, password_hash, auth_provider) VALUES ($1, $2, $3, $4) RETURNING id, name, email',
            [name, email, hashedPassword, 'local']
        );

        res.status(201).json({message: 'Usuario creado con exito', user: result.rows[0]});
    } catch (error) {
        console.error('Error al crear usuario', error);
        res.status(500).json({error: 'Error interno del servidor'});
    }
};

const loginUser = async (req, res) => {
    const {email, password_hash} = req.body;

    try{

        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.status(400).json({error: 'Usuario no encontrado'});
        }
        
        const user = result.rows[0];

        const passwordMatch = await bcrypt.compare(password_hash, user.password_hash);
        
        if(!passwordMatch) {
            return res.status(401).json({error:'Contraseña incorrecta'});
        }

        const token = jwt.sign(
            {id: user.id, email: user.email},
            process.env.JWT_SECRET,
            {expiresIn: '1h'}
        );

        res.status(200).json({
            message: 'Login exitoso',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Error en login', error);
        res.status(500).json({error: 'Error interno del servidor'});
    }
};



module.exports = {createUser, loginUser};