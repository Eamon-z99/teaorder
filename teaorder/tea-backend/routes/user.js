const express = require('express');
const pool = require('../config/database');
const router = express.Router();
const jwt = require('jsonwebtoken');
const svgCaptcha = require('svg-captcha');
const bcrypt = require('bcryptjs');
const OSS = require('ali-oss');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const JWT_SECRET = 'your_jwt_secret';

// 内存存储验证码（生产建议用redis）
const captchaStore = {};

// 获取验证码图片
router.get('/captcha', (req, res) => {
  const captcha = svgCaptcha.create({ noise: 2, size: 4, color: true, background: '#f2f3f5' });
  const captchaId = Date.now() + Math.random().toString(36).slice(2, 8);
  captchaStore[captchaId] = captcha.text;
  // 5分钟后自动删除
  setTimeout(() => { delete captchaStore[captchaId]; }, 5 * 60 * 1000);
  res.json({ captchaId, data: captcha.data });
});

// 用户注册
router.post('/register', async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ success: false, message: '请填写完整信息' });
  }
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    return res.status(400).json({ success: false, message: '手机号格式不正确' });
  }
  
  try {
    // 检查手机号是否已注册
    const [users] = await pool.query('SELECT * FROM users WHERE phone = ?', [phone]);
    if (users.length > 0) {
      return res.status(400).json({ success: false, message: '手机号已注册' });
    }
    
    // 密码加密
    const hash = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (phone, password, created_at, last_login) VALUES (?, ?, NOW(), NOW())', [phone, hash]);
    
    res.json({ success: true, message: '注册成功' });
  } catch (err) {
    console.error('注册失败:', err);
    res.status(500).json({ success: false, message: '注册失败' });
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ success: false, message: '请填写手机号和密码' });
  }
  
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE phone = ?', [phone]);
    if (users.length === 0) {
      return res.status(400).json({ success: false, message: '用户不存在' });
    }
    
    const user = users[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ success: false, message: '密码错误' });
    }
    
    // 生成JWT
    const token = jwt.sign({ userId: user.id, phone: user.phone }, JWT_SECRET, { expiresIn: '7d' });
    // 更新登录时间
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
    
    res.json({ success: true, token, user: { id: user.id, phone: user.phone, nickname: user.nickname, avatar: user.avatar, signature: user.signature } });
  } catch (err) {
    console.error('登录失败:', err);
    res.status(500).json({ success: false, message: '登录失败' });
  }
});

// 注册骑手
router.post('/register-rider', async (req, res) => {
  const { user_id, name, phone, id_card } = req.body;
  if (!user_id || !name || !phone || !id_card) {
    return res.json({ success: false, message: '参数不完整' });
  }
  try {
    await pool.query(
      'UPDATE users SET is_rider=1, rider_name=?, rider_phone=?, rider_id_card=? WHERE id=?',
      [name, phone, id_card, user_id]
    );
    res.json({ success: true, message: '注册成功' });
  } catch (e) {
    res.json({ success: false, message: '注册失败' });
  }
});

// 用户信息更新
router.post('/update', async (req, res) => {
  const { user_id, avatar, nickname, phone, signature } = req.body;
  if (!user_id || !nickname || !phone) {
    return res.json({ success: false, message: '参数不完整' });
  }
  try {
    await pool.query(
      'UPDATE users SET avatar=?, nickname=?, phone=?, signature=? WHERE id=?',
      [avatar, nickname, phone, signature, user_id]
    );
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, message: '保存失败' });
  }
});

// JWT鉴权中间件（示例）
function auth(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ success: false, message: '未登录' });
  try {
    const decoded = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ success: false, message: '登录已过期' });
  }
}

// 示例：获取当前用户信息
router.get('/me', auth, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, phone, nickname FROM users WHERE id = ?', [req.user.userId]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    res.json({ success: true, user: users[0] });
  } catch (err) {
    console.error('获取用户信息失败:', err);
    res.status(500).json({ success: false, message: '获取用户信息失败' });
  }
});

// 获取用户积分
router.get('/points/:userId', async (req, res) => {
  try {
    const [users] = await pool.query('SELECT points FROM users WHERE id = ?', [req.params.userId]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    res.json({ points: users[0].points });
  } catch (err) {
    console.error('获取积分失败:', err);
    res.status(500).json({ success: false, message: '获取积分失败' });
  }
});

// 获取用户优惠券
router.get('/coupons/:userId', async (req, res) => {
  try {
    const [coupons] = await pool.query('SELECT * FROM coupons WHERE user_id = ? ORDER BY created_at DESC', [req.params.userId]);
    res.json(coupons);
  } catch (err) {
    console.error('获取优惠券失败:', err);
    res.status(500).json({ success: false, message: '获取优惠券失败' });
  }
});

// 积分兑换优惠券
router.post('/exchange-coupon', async (req, res) => {
  const { user_id, points, value } = req.body;

  try {
    const [users] = await pool.query('SELECT points FROM users WHERE id = ?', [user_id]);
    if (users.length === 0 || users[0].points < points) {
      return res.status(400).json({ success: false, message: '积分不足' });
    }

    await pool.query('UPDATE users SET points = points - ? WHERE id = ?', [points, user_id]);
    await pool.query('INSERT INTO coupons (user_id, type, value) VALUES (?, ?, ?)', [user_id, `${value}元`, value]);

    res.json({ success: true, message: '兑换成功' });
  } catch (err) {
    console.error('兑换优惠券失败:', err);
    res.status(500).json({ success: false, message: '兑换失败' });
  }
});

const ossConfig = {
  region: 'oss-cn-shenzhen',
  accessKeyId: '',
  accessKeySecret: '',
  bucket: 'tea-uniapp'
};

// 获取OSS直传签名
router.get('/oss-sign', async (req, res) => {
  const client = new OSS(ossConfig);
  const dir = 'static/avatar/';
  const filename = dir + Date.now() + '_' + Math.floor(Math.random() * 10000) + '.jpg';
  try {
    const result = await client.signatureUrl(filename, {
      method: 'PUT',
      expires: 300 // 5分钟
    });
    res.json({
      success: true,
      url: result,
      key: filename
    });
  } catch (e) {
    res.json({ success: false, message: '签名失败' });
  }
});

const upload = multer({ dest: path.join(__dirname, '../uploads/') });

const ossClient = new OSS({
  region: 'oss-cn-shenzhen',
  accessKeyId: '',
  accessKeySecret: '',
  bucket: 'tea-uniapp'
});

// 上传头像接口
router.post('/upload-avatar', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.json({ success: false, message: '未收到文件' });
  }
  const ext = path.extname(req.file.originalname) || '.jpg';
  const ossKey = `static/avatar/${Date.now()}_${Math.floor(Math.random() * 10000)}${ext}`;
  try {
    // 上传到OSS
    const result = await ossClient.put(ossKey, req.file.path, {
      headers: {
        'x-oss-object-acl': 'public-read'
      }
    });
    // 删除本地临时文件
    fs.unlinkSync(req.file.path);
    res.json({
      success: true,
      url: result.url,
      key: ossKey
    });
  } catch (e) {
    fs.unlinkSync(req.file.path);
    res.json({ success: false, message: '上传OSS失败' });
  }
});

module.exports = router; 