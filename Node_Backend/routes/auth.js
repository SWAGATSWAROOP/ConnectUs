const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const app = express();
app.use(express.json());

const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET;

router.get('/check', (req, res) => {
  res.send('Auth API is working');
});

router.post('/signup', async (req, res) => {
  const { name, username, password } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ msg: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,           
        username,
        password: hashedPassword,
      },
    });

    const token = jwt.sign({ id: newUser.id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.Name, 
        username: newUser.username,
      },
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).send('Server error');
  }
});

router.post('/signin', async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password || !name) {
      return res.status(400).json({ msg: 'Please provide all required fields' });
    }
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
      },
    });
  } catch (err) {
    console.error('Signin error:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
