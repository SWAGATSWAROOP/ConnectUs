app.post('/google-login', async (req, res) => {
  const { idToken } = req.body;

  try {
    const response = await axios.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
    );

    const { sub, email, name } = response.data;

    let user = await prisma.user.findUnique({
      where: { username: sub },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          username: sub,
          name: name,
          password: '', // Or generate a dummy password
        },
      });
    }

    const token = jwt.sign({ userId: user.id, email: user.username }, JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(200).json({
      message: 'Google login successful',
      user,
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Google authentication failed', error });
  }
});
