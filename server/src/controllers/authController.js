const authService = require('../services/authService');

const register = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;
    const user = await authService.register({ username, email, password, role });
    res.status(201).json({
      success: true,
      data: { user },
      message: 'Registrasi berhasil. Menunggu persetujuan admin.',
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.userId);
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { bio, avatar_url } = req.body;
    const user = await authService.updateProfile(req.user.userId, { bio, avatar_url });
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, updateProfile };