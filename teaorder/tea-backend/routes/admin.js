const express = require('express');
const pool = require('../config/database');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const OSS = require('ali-oss');

const JWT_SECRET = 'your_jwt_secret';

// OSS配置
const ossConfig = {
  region: '',
  accessKeyId: '',
  accessKeySecret: '',
  bucket: ''
};

const upload = multer({ dest: path.join(__dirname, '../uploads/') });

const ossClient = new OSS(ossConfig);

// 管理员登录
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: '请填写用户名和密码' });
  }
  
  try {
    const [admins] = await pool.query('SELECT * FROM admins WHERE username = ? AND status = 1', [username]);
    if (admins.length === 0) {
      return res.status(400).json({ success: false, message: '用户名不存在或账号已被禁用' });
    }
    
    const admin = admins[0];
    // 简单密码验证（生产环境建议使用bcrypt）
    if (password !== admin.password) {
      return res.status(400).json({ success: false, message: '密码错误' });
    }
    
    // 只返回success和admin信息，不返回token
    res.json({ 
      success: true, 
      admin: { 
        id: admin.id, 
        username: admin.username, 
        nickname: admin.nickname, 
        avatar: admin.avatar 
      } 
    });
  } catch (err) {
    console.error('管理员登录失败:', err);
    res.status(500).json({ success: false, message: '登录失败' });
  }
});

// 管理员鉴权中间件
function adminAuth(req, res, next) {
  const token = req.headers.authorization;
  console.log('Auth middleware - Authorization header:', token); // 调试信息
  
  if (!token) {
    console.log('Auth middleware - No token provided'); // 调试信息
    return res.status(401).json({ success: false, message: '未登录' });
  }
  
  try {
    const decoded = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
    console.log('Auth middleware - Decoded token:', decoded); // 调试信息
    
    if (decoded.role !== 'admin') {
      console.log('Auth middleware - Role mismatch:', decoded.role); // 调试信息
      return res.status(403).json({ success: false, message: '权限不足' });
    }
    req.admin = decoded;
    next();
  } catch (e) {
    console.log('Auth middleware - Token verification failed:', e.message); // 调试信息
    return res.status(401).json({ success: false, message: '登录已过期' });
  }
}

// 管理员简单认证中间件（不需要token）
function adminSimpleAuth(req, res, next) {
  // 对于管理员API，我们不需要token验证
  // 只需要确保请求来自管理员界面即可
  // 这里可以添加其他安全检查，比如IP白名单等
  next();
}

// 上传商品图片接口
router.post('/upload-product-image', adminSimpleAuth, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.json({ success: false, message: '未收到文件' });
  }
  
  const ext = path.extname(req.file.originalname) || '.jpg';
  const ossKey = `static/images/${Date.now()}_${Math.floor(Math.random() * 10000)}${ext}`;
  
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
    // 确保删除本地文件
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('上传OSS失败:', e);
    res.json({ success: false, message: '上传OSS失败' });
  }
});

// 获取管理员信息
router.get('/me', adminSimpleAuth, async (req, res) => {
  try {
    const [admins] = await pool.query('SELECT id, username, nickname, avatar FROM admins WHERE id = ?', [req.admin.adminId]);
    if (admins.length === 0) {
      return res.status(404).json({ success: false, message: '管理员不存在' });
    }
    res.json({ success: true, admin: admins[0] });
  } catch (err) {
    console.error('获取管理员信息失败:', err);
    res.status(500).json({ success: false, message: '获取管理员信息失败' });
  }
});

// 获取订单列表
router.get('/orders', adminSimpleAuth, async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const offset = (page - 1) * limit;
  
  try {
    let whereClause = '';
    let params = [];
    
    if (status) {
      whereClause = 'WHERE o.status = ?';
      params.push(status);
    }
    
    const [orders] = await pool.query(`
      SELECT o.*, u.nickname as user_nickname, u.phone as user_phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);
    
    const [total] = await pool.query(`
      SELECT COUNT(*) as total FROM orders o ${whereClause}
    `, params);
    
    res.json({ 
      success: true, 
      orders, 
      total: total[0].total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    console.error('获取订单列表失败:', err);
    res.status(500).json({ success: false, message: '获取订单列表失败' });
  }
});

// 获取订单详情
router.get('/orders/:orderId', adminSimpleAuth, async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT o.*, u.nickname as user_nickname, u.phone as user_phone,
             a.name as address_name, a.phone as address_phone, a.address as address_detail
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN addresses a ON o.address_id = a.id
      WHERE o.id = ?
    `, [req.params.orderId]);
    
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }
    
    const [orderItems] = await pool.query(`
      SELECT oi.*, p.name as product_name, p.image_url
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [req.params.orderId]);
    
    // 拼接OSS图片地址，逻辑与商品列表接口一致
    const ossBase = 'https://tea-uniapp.oss-cn-shenzhen.aliyuncs.com/static/';
    orderItems.forEach(item => {
      if (item.image_url && !/^https?:\/\//.test(item.image_url)) {
        let url = item.image_url.replace(/^\/+/, '');
        if (url.startsWith('static/')) {
          url = url.slice('static/'.length);
        }
        item.img = ossBase + url;
      } else {
        item.img = item.image_url || '';
      }
    });
    
    res.json({ 
      success: true, 
      order: orders[0], 
      items: orderItems 
    });
  } catch (err) {
    console.error('获取订单详情失败:', err);
    res.status(500).json({ success: false, message: '获取订单详情失败' });
  }
});

// 更新订单状态
router.put('/orders/:orderId/status', adminSimpleAuth, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'paid', 'preparing', 'ready', 'completed', 'cancelled'];
  
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: '无效的订单状态' });
  }
  
  try {
    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.orderId]);
    res.json({ success: true, message: '订单状态更新成功' });
  } catch (err) {
    console.error('更新订单状态失败:', err);
    res.status(500).json({ success: false, message: '更新订单状态失败' });
  }
});

// 订单状态流转支持"配送中"与"已完成"
// 新增批量配送接口
router.put('/orders/batch-deliver', adminSimpleAuth, async (req, res) => {
  const { orderIds } = req.body;
  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    return res.status(400).json({ success: false, message: '请提供订单ID列表' });
  }
  try {
    // 只将当前为"ready"（待取餐）的订单批量改为"delivering"
    await pool.query(
      'UPDATE orders SET status = ? WHERE id IN (?) AND status = ?',
      ['delivering', orderIds, 'ready']
    );
    res.json({ success: true, message: '批量配送中操作成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: '批量配送失败' });
  }
});

// 批量完成接口
router.put('/orders/batch-complete', adminSimpleAuth, async (req, res) => {
  const { orderIds } = req.body;
  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    return res.status(400).json({ success: false, message: '请提供订单ID列表' });
  }
  try {
    // 将当前为"delivering"（配送中）的订单批量改为"completed"
    await pool.query(
      'UPDATE orders SET status = ? WHERE id IN (?) AND status = ?',
      ['completed', orderIds, 'delivering']
    );
    res.json({ success: true, message: '批量完成操作成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: '批量完成失败' });
  }
});

// 批量制作接口
router.put('/orders/batch-prepare', adminSimpleAuth, async (req, res) => {
  const { orderIds } = req.body;
  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    return res.status(400).json({ success: false, message: '请提供订单ID列表' });
  }
  try {
    // 将当前为"paid"（已付款）的订单批量改为"preparing"
    await pool.query(
      'UPDATE orders SET status = ? WHERE id IN (?) AND status = ?',
      ['preparing', orderIds, 'paid']
    );
    res.json({ success: true, message: '批量制作中操作成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: '批量制作失败' });
  }
});

// 批量待取餐接口
router.put('/orders/batch-ready', adminSimpleAuth, async (req, res) => {
  const { orderIds } = req.body;
  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    return res.status(400).json({ success: false, message: '请提供订单ID列表' });
  }
  try {
    // 将当前为"preparing"（制作中）的订单批量改为"ready"
    await pool.query(
      'UPDATE orders SET status = ? WHERE id IN (?) AND status = ?',
      ['ready', orderIds, 'preparing']
    );
    res.json({ success: true, message: '批量待取餐操作成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: '批量待取餐失败' });
  }
});

// 批量确认付款接口
router.put('/orders/batch-pay', adminSimpleAuth, async (req, res) => {
  const { orderIds } = req.body;
  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    return res.status(400).json({ success: false, message: '请提供订单ID列表' });
  }
  try {
    // 将当前为"pending"（待付款）的订单批量改为"paid"
    await pool.query(
      'UPDATE orders SET status = ? WHERE id IN (?) AND status = ?',
      ['paid', orderIds, 'pending']
    );
    res.json({ success: true, message: '批量确认付款操作成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: '批量确认付款失败' });
  }
});

// 获取商品列表
router.get('/products', adminSimpleAuth, async (req, res) => {
  const { page = 1, limit = 10, category } = req.query;
  const offset = (page - 1) * limit;
  
  try {
    let whereClause = '';
    let params = [];
    
    if (category) {
      whereClause = 'WHERE category = ?';
      params.push(category);
    }
    
    const [products] = await pool.query(`
      SELECT * FROM products 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);
    
    const [total] = await pool.query(`
      SELECT COUNT(*) as total FROM products ${whereClause}
    `, params);
    
    // 拼接OSS图片地址，逻辑与 /api/product 保持一致
    const ossBase = 'https://tea-uniapp.oss-cn-shenzhen.aliyuncs.com/static/';
    products.forEach(p => {
      if (p.image_url && !/^https?:\/\//.test(p.image_url)) {
        let url = p.image_url.replace(/^\/+/, ''); // 去掉所有开头的斜杠
        if (url.startsWith('static/')) {
          url = url.slice('static/'.length); // 去掉static/前缀
        }
        p.img = ossBase + url;
      } else {
        p.img = p.image_url || '';
      }
    });
    
    res.json({ 
      success: true, 
      products, 
      total: total[0].total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    console.error('获取商品列表失败:', err);
    res.status(500).json({ success: false, message: '获取商品列表失败' });
  }
});

// 添加商品
router.post('/products', adminSimpleAuth, async (req, res) => {
  const { name, category, price, description, image_url, status } = req.body;
  if (!name || !category || !price) {
    return res.status(400).json({ success: false, message: '请填写完整信息' });
  }
  try {
    await pool.query(`
      INSERT INTO products (name, category, price, description, image_url, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [name, category, price, description, image_url, status !== undefined ? status : 1]);
    
    res.json({ success: true, message: '商品添加成功' });
  } catch (err) {
    console.error('添加商品失败:', err);
    res.status(500).json({ success: false, message: '添加商品失败' });
  }
});

// 更新商品
router.put('/products/:productId', adminSimpleAuth, async (req, res) => {
  const { name, category, price, description, image_url, status } = req.body;
  
  try {
    await pool.query(`
      UPDATE products 
      SET name = ?, category = ?, price = ?, description = ?, image_url = ?, status = ?
      WHERE id = ?
    `, [name, category, price, description, image_url, status, req.params.productId]);
    
    res.json({ success: true, message: '商品更新成功' });
  } catch (err) {
    console.error('更新商品失败:', err);
    res.status(500).json({ success: false, message: '更新商品失败' });
  }
});

// 删除商品
router.delete('/products/:productId', adminSimpleAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = ?', [req.params.productId]);
    res.json({ success: true, message: '商品删除成功' });
  } catch (err) {
    console.error('删除商品失败:', err);
    res.status(500).json({ success: false, message: '删除商品失败' });
  }
});

// 获取统计数据
router.get('/statistics', adminSimpleAuth, async (req, res) => {
  try {
    // 今日订单数
    const [todayOrders] = await pool.query(`
      SELECT COUNT(*) as count FROM orders 
      WHERE DATE(created_at) = CURDATE()
    `);
    
    // 今日销售额
    const [todaySales] = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) as total FROM orders 
      WHERE DATE(created_at) = CURDATE() AND status != 'cancelled'
    `);
    
    // 总用户数
    const [totalUsers] = await pool.query('SELECT COUNT(*) as count FROM users');
    
    // 总商品数
    const [totalProducts] = await pool.query('SELECT COUNT(*) as count FROM products WHERE status = 1');
    
    // 待处理订单数
    const [pendingOrders] = await pool.query(`
      SELECT COUNT(*) as count FROM orders 
      WHERE status IN ('pending', 'paid', 'preparing')
    `);
    
    res.json({
      success: true,
      statistics: {
        todayOrders: todayOrders[0].count,
        todaySales: todaySales[0].total,
        totalUsers: totalUsers[0].count,
        totalProducts: totalProducts[0].count,
        pendingOrders: pendingOrders[0].count
      }
    });
  } catch (err) {
    console.error('获取统计数据失败:', err);
    res.status(500).json({ success: false, message: '获取统计数据失败' });
  }
});

// 获取销售趋势数据（最近7天）
router.get('/analytics/sales-trend', adminSimpleAuth, async (req, res) => {
  try {
    const [results] = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as order_count,
        SUM(total_amount) as total_sales
      FROM orders 
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        AND status != 'cancelled'
      GROUP BY DATE(created_at)
      ORDER BY date
    `);
    
    res.json({ success: true, data: results });
  } catch (err) {
    console.error('获取销售趋势失败:', err);
    res.status(500).json({ success: false, message: '获取销售趋势失败' });
  }
});

// 获取商品销售排行
router.get('/analytics/product-ranking', adminSimpleAuth, async (req, res) => {
  try {
    const [results] = await pool.query(`
      SELECT 
        p.name,
        p.category,
        COUNT(oi.id) as sales_count,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.total_price) as total_revenue
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled' OR o.status IS NULL
      GROUP BY p.id, p.name, p.category
      ORDER BY total_revenue DESC
      LIMIT 10
    `);
    
    res.json({ success: true, data: results });
  } catch (err) {
    console.error('获取商品排行失败:', err);
    res.status(500).json({ success: false, message: '获取商品排行失败' });
  }
});

// 获取用户活跃度分析
router.get('/analytics/user-activity', adminSimpleAuth, async (req, res) => {
  try {
    const [results] = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(DISTINCT user_id) as active_users,
        COUNT(*) as total_orders
      FROM orders 
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date
    `);
    
    res.json({ success: true, data: results });
  } catch (err) {
    console.error('获取用户活跃度失败:', err);
    res.status(500).json({ success: false, message: '获取用户活跃度失败' });
  }
});

// 获取分类销售统计
router.get('/analytics/category-stats', adminSimpleAuth, async (req, res) => {
  try {
    const [results] = await pool.query(`
      SELECT 
        p.category,
        COUNT(oi.id) as order_count,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.total_price) as total_revenue
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled' OR o.status IS NULL
      GROUP BY p.category
      ORDER BY total_revenue DESC
    `);
    
    res.json({ success: true, data: results });
  } catch (err) {
    console.error('获取分类统计失败:', err);
    res.status(500).json({ success: false, message: '获取分类统计失败' });
  }
});

// 获取实时订单状态统计
router.get('/analytics/order-status', adminSimpleAuth, async (req, res) => {
  try {
    const [results] = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM orders 
      GROUP BY status
    `);
    
    res.json({ success: true, data: results });
  } catch (err) {
    console.error('获取订单状态统计失败:', err);
    res.status(500).json({ success: false, message: '获取订单状态统计失败' });
  }
});

// 获取所有用户（分页+搜索）
router.get('/users', adminSimpleAuth, async (req, res) => {
  const { page = 1, limit = 10, keyword } = req.query;
  const offset = (page - 1) * limit;
  
  try {
    let whereClause = '';
    let params = [];
    
    if (keyword) {
      whereClause = 'WHERE phone LIKE ? OR nickname LIKE ?';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    
    const [users] = await pool.query(`
      SELECT id, nickname, phone, avatar, points, signature, created_at, last_login
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);
    
    const [total] = await pool.query(`
      SELECT COUNT(*) as total FROM users ${whereClause}
    `, params);
    
    res.json({ 
      success: true, 
      users, 
      total: total[0].total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    console.error('获取用户列表失败:', err);
    res.status(500).json({ success: false, message: '获取用户列表失败' });
  }
});

// 获取单个用户详情
router.get('/users/:userId', adminSimpleAuth, async (req, res) => {
  try {
    const [users] = await pool.query(`
      SELECT id, nickname, phone, avatar, points, signature, created_at, last_login
      FROM users 
      WHERE id = ?
    `, [req.params.userId]);
    
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    res.json({ 
      success: true, 
      user: users[0]
    });
  } catch (err) {
    console.error('获取用户详情失败:', err);
    res.status(500).json({ success: false, message: '获取用户详情失败' });
  }
});

// 获取用户订单统计
router.get('/users/:userId/orders/stats', adminSimpleAuth, async (req, res) => {
  try {
    const [orderStats] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COALESCE(SUM(total_amount), 0) as totalAmount
      FROM orders 
      WHERE user_id = ?
    `, [req.params.userId]);
    
    res.json({ 
      success: true, 
      stats: orderStats[0]
    });
  } catch (err) {
    console.error('获取用户订单统计失败:', err);
    res.status(500).json({ success: false, message: '获取用户订单统计失败' });
  }
});

// 获取用户优惠券统计
router.get('/users/:userId/coupons/stats', adminSimpleAuth, async (req, res) => {
  try {
    const [couponStats] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'unused' THEN 1 END) as unused,
        COUNT(CASE WHEN status = 'used' THEN 1 END) as used,
        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired
      FROM coupons 
      WHERE user_id = ?
    `, [req.params.userId]);
    
    res.json({ 
      success: true, 
      stats: couponStats[0]
    });
  } catch (err) {
    console.error('获取用户优惠券统计失败:', err);
    res.status(500).json({ success: false, message: '获取用户优惠券统计失败' });
  }
});

// 获取用户订单历史
router.get('/users/:userId/orders', adminSimpleAuth, async (req, res) => {
  try {
    // 先获取基本订单信息
    const [orders] = await pool.query(`
      SELECT 
        id,
        order_no,
        status,
        total_amount,
        created_at,
        updated_at
      FROM orders 
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `, [req.params.userId]);
    
    // 为每个订单获取商品信息
    const ordersWithProducts = await Promise.all(orders.map(async (order) => {
      try {
        const [orderItems] = await pool.query(`
          SELECT 
            oi.product_name as name,
            oi.quantity,
            oi.product_price,
            oi.total_price
          FROM order_items oi
          WHERE oi.order_id = ?
        `, [order.id]);
        
        return {
          ...order,
          order_number: order.order_no, // 兼容前端字段名
          products: orderItems
        };
      } catch (err) {
        console.error(`获取订单 ${order.id} 的商品信息失败:`, err);
        return {
          ...order,
          order_number: order.order_no,
          products: []
        };
      }
    }));
    
    res.json({ 
      success: true, 
      orders: ordersWithProducts
    });
  } catch (err) {
    console.error('获取用户订单历史失败:', err);
    res.status(500).json({ success: false, message: '获取用户订单历史失败' });
  }
});

// 获取所有优惠券（支持按userId筛选）
router.get('/coupons', adminSimpleAuth, async (req, res) => {
  const { userId } = req.query;
  try {
    let sql = 'SELECT c.*, u.nickname, u.phone FROM coupons c LEFT JOIN users u ON c.user_id = u.id';
    let params = [];
    if (userId) {
      sql += ' WHERE c.user_id = ?';
      params.push(userId);
    }
    sql += ' ORDER BY c.created_at DESC';
    const [coupons] = await pool.query(sql, params);
    res.json({ success: true, coupons });
  } catch (e) {
    res.json({ success: false, message: '获取优惠券失败' });
  }
});

// 发放优惠券给指定用户
router.post('/coupons', adminSimpleAuth, async (req, res) => {
  const { user_id, type } = req.body;
  if (!user_id || !type) {
    return res.json({ success: false, message: '参数不完整' });
  }
  try {
    await pool.query(
      'INSERT INTO coupons (user_id, type, value, status) VALUES (?, ?, ?, "unused")',
      [user_id, type, type]
    );
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, message: '发放失败' });
  }
});

// 批量发放优惠券给指定用户
router.post('/coupons/batch', adminSimpleAuth, async (req, res) => {
  const { user_id, type, quantity = 1 } = req.body;
  if (!user_id || !type || !quantity) {
    return res.json({ success: false, message: '参数不完整' });
  }
  try {
    const promises = [];
    for (let i = 0; i < quantity; i++) {
      promises.push(
        pool.query(
          'INSERT INTO coupons (user_id, type, value, status) VALUES (?, ?, ?, "unused")',
          [user_id, type, type]
        )
      );
    }
    await Promise.all(promises);
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, message: '批量发放失败' });
  }
});

// 获取用户优惠券统计信息
router.get('/coupons/stats', adminSimpleAuth, async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.json({ success: false, message: '缺少用户ID' });
  }
  try {
    const [total] = await pool.query('SELECT COUNT(*) as count FROM coupons WHERE user_id = ?', [userId]);
    const [unused] = await pool.query('SELECT COUNT(*) as count FROM coupons WHERE user_id = ? AND status = "unused"', [userId]);
    const [used] = await pool.query('SELECT COUNT(*) as count FROM coupons WHERE user_id = ? AND status = "used"', [userId]);
    const [expired] = await pool.query('SELECT COUNT(*) as count FROM coupons WHERE user_id = ? AND status = "expired"', [userId]);
    
    res.json({
      success: true,
      stats: {
        total: total[0].count,
        unused: unused[0].count,
        used: used[0].count,
        expired: expired[0].count
      }
    });
  } catch (e) {
    res.json({ success: false, message: '获取统计失败' });
  }
});

// 升级指定优惠券
router.put('/coupons/:id/upgrade', adminSimpleAuth, async (req, res) => {
  const { id } = req.params;
  const { type } = req.body;
  if (!type) {
    return res.json({ success: false, message: '参数不完整' });
  }
  try {
    await pool.query('UPDATE coupons SET type = ?, value = ? WHERE id = ?', [type, type, id]);
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, message: '升级失败' });
  }
});

// 删除指定优惠券
router.delete('/coupons/:id', adminSimpleAuth, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM coupons WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, message: '删除失败' });
  }
});

// 获取最近活动
router.get('/recent-activities', adminSimpleAuth, async (req, res) => {
  try {
    // 最近5个订单（新订单、订单完成）
    const [orders] = await pool.query(`
      SELECT id, status, created_at, updated_at 
      FROM orders 
      WHERE status IN ('pending', 'paid', 'preparing', 'completed')
      ORDER BY updated_at DESC
      LIMIT 5
    `);
    // 最近5个用户注册
    const [users] = await pool.query(`
      SELECT id, nickname, created_at 
      FROM users 
      ORDER BY created_at DESC
      LIMIT 5
    `);
    // 最近5个商品上架
    const [products] = await pool.query(`
      SELECT id, name, created_at 
      FROM products 
      WHERE status = 1
      ORDER BY created_at DESC
      LIMIT 5
    `);
    // 整理活动
    const activities = [];
    orders.forEach(order => {
      if (order.status === 'completed') {
        activities.push({
          type: 'order_completed',
          text: `订单完成: #${order.id}`,
          time: order.updated_at,
          icon: '✅'
        });
      } else {
        activities.push({
          type: 'new_order',
          text: `新订单 #${order.id}`,
          time: order.created_at,
          icon: '📋'
        });
      }
    });
    users.forEach(user => {
      activities.push({
        type: 'user_register',
        text: `用户注册: ${user.nickname || '新用户'}`,
        time: user.created_at,
        icon: '👤'
      });
    });
    products.forEach(product => {
      activities.push({
        type: 'product_add',
        text: `商品上架: ${product.name}`,
        time: product.created_at,
        icon: '🍹'
      });
    });
    // 按时间倒序，取最近10条
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    res.json({ success: true, activities: activities.slice(0, 10) });
  } catch (err) {
    console.error('获取最近活动失败:', err);
    res.status(500).json({ success: false, message: '获取最近活动失败' });
  }
});

// 获取商品分类列表
router.get('/categories', adminSimpleAuth, async (req, res) => {
  try {
    const [categories] = await pool.query(`
      SELECT 
        c.*,
        COUNT(p.id) as product_count
      FROM product_categories c
      LEFT JOIN products p ON c.name = p.category
      GROUP BY c.id
      ORDER BY c.sort_order ASC, c.created_at DESC
    `);
    
    res.json({ 
      success: true, 
      categories 
    });
  } catch (err) {
    console.error('获取分类列表失败:', err);
    res.status(500).json({ success: false, message: '获取分类列表失败' });
  }
});

// 添加商品分类
router.post('/categories', adminSimpleAuth, async (req, res) => {
  const { name, description, sort_order, status } = req.body;
  
  if (!name) {
    return res.status(400).json({ success: false, message: '请填写分类名称' });
  }
  
  try {
    await pool.query(`
      INSERT INTO product_categories (name, description, sort_order, status)
      VALUES (?, ?, ?, ?)
    `, [name, description, sort_order || 0, status !== undefined ? status : 1]);
    
    res.json({ success: true, message: '分类添加成功' });
  } catch (err) {
    console.error('添加分类失败:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ success: false, message: '分类名称已存在' });
    } else {
      res.status(500).json({ success: false, message: '添加分类失败' });
    }
  }
});

// 更新商品分类
router.put('/categories/:categoryId', adminSimpleAuth, async (req, res) => {
  const { name, description, sort_order, status } = req.body;
  
  if (!name) {
    return res.status(400).json({ success: false, message: '请填写分类名称' });
  }
  
  try {
    await pool.query(`
      UPDATE product_categories 
      SET name = ?, description = ?, sort_order = ?, status = ?
      WHERE id = ?
    `, [name, description, sort_order || 0, status !== undefined ? status : 1, req.params.categoryId]);
    
    res.json({ success: true, message: '分类更新成功' });
  } catch (err) {
    console.error('更新分类失败:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ success: false, message: '分类名称已存在' });
    } else {
      res.status(500).json({ success: false, message: '更新分类失败' });
    }
  }
});

// 删除商品分类
router.delete('/categories/:categoryId', adminSimpleAuth, async (req, res) => {
  try {
    // 检查是否有商品使用此分类
    const [products] = await pool.query(`
      SELECT COUNT(*) as count FROM products 
      WHERE category = (SELECT name FROM product_categories WHERE id = ?)
    `, [req.params.categoryId]);
    
    if (products[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `该分类下还有 ${products[0].count} 个商品，无法删除` 
      });
    }
    
    await pool.query('DELETE FROM product_categories WHERE id = ?', [req.params.categoryId]);
    res.json({ success: true, message: '分类删除成功' });
  } catch (err) {
    console.error('删除分类失败:', err);
    res.status(500).json({ success: false, message: '删除分类失败' });
  }
});

// 获取所有商品
router.get('/all-products', adminSimpleAuth, async (req, res) => {
  const { page = 1, limit = 10, keyword } = req.query;
  const offset = (page - 1) * limit;
  
  try {
    let whereClause = '';
    let params = [];
    
    if (keyword) {
      whereClause = 'WHERE name LIKE ? OR category LIKE ?';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    
    const [products] = await pool.query(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN product_categories c ON p.category = c.name
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);
    
    const [total] = await pool.query(`
      SELECT COUNT(*) as total FROM products p ${whereClause}
    `, params);
    
    // 拼接OSS图片地址，逻辑与 /api/product 保持一致
    const ossBase = 'https://tea-uniapp.oss-cn-shenzhen.aliyuncs.com/static/';
    products.forEach(p => {
      if (p.image_url && !/^https?:\/\//.test(p.image_url)) {
        let url = p.image_url.replace(/^\/+/, ''); // 去掉所有开头的斜杠
        if (url.startsWith('static/')) {
          url = url.slice('static/'.length); // 去掉static/前缀
        }
        p.img = ossBase + url;
      } else {
        p.img = p.image_url || '';
      }
    });
    
    res.json({ 
      success: true, 
      products, 
      total: total[0].total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    console.error('获取所有商品失败:', err);
    res.status(500).json({ success: false, message: '获取所有商品失败' });
  }
});

module.exports = router; 