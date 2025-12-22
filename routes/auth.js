const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// User registration
router.post('/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: 'User already exists',
        field: existingUser.email === email ? 'email' : 'username'
      });
    }

    // Create new user (password should be hashed in production)
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password // In production, use bcrypt to hash this
      },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true
      }
    });

    res.status(201).json({ 
      message: 'User created successfully',
      user 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || user.password !== password) { // In production, use bcrypt.compare
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token (implement in production)
    res.json({ 
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;