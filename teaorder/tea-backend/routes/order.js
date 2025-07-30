const express = require('express');
const pool = require('../config/database');
const router = express.Router();

// 获取用户订单列表
router.get('/user/:userId', async (req, res) => {
  const sql = `
    SELECT o.*, a.name as address_name, a.phone as address_phone, a.address as address_detail, a.tag as address_tag
    FROM orders o 
    LEFT JOIN addresses a ON o.address_id = a.id 
    WHERE o.user_id = ? 
    ORDER BY o.created_at DESC
  `;
  try {
    const [results] = await pool.query(sql, [req.params.userId]);
    res.json(results);
  } catch (err) {
    console.error('查询订单失败:', err);
    res.status(500).json({ error: '查询订单失败' });
  }
});

// 获取订单基本信息
router.get('/:orderId/info', async (req, res) => {
  const sql = `
    SELECT o.*, a.name as address_name, a.phone as address_phone, a.address as address_detail, a.tag as address_tag
    FROM orders o 
    LEFT JOIN addresses a ON o.address_id = a.id 
    WHERE o.id = ?
  `;
  try {
    const [results] = await pool.query(sql, [req.params.orderId]);
    if (results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).json({ error: '订单不存在' });
    }
  } catch (err) {
    console.error('查询订单失败:', err);
    res.status(500).json({ error: '查询订单失败' });
  }
});

// 获取订单详情
router.get('/:orderId/items', async (req, res) => {
  const itemsSql = `
    SELECT oi.*, p.image_url, p.description
    FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `;
  const couponSql = 'SELECT c.* FROM orders o LEFT JOIN coupons c ON o.coupon_id = c.id WHERE o.id = ?';

  try {
    const [items] = await pool.query(itemsSql, [req.params.orderId]);
    // 拼接图片完整OSS地址
    const ossBase = 'https://tea-uniapp.oss-cn-shenzhen.aliyuncs.com/static/';
    items.forEach(item => {
      if (item.image_url && !/^https?:\/\//.test(item.image_url)) {
        let url = item.image_url.replace(/^\/+/, '');
        if (url.startsWith('static/')) {
          url = url.slice('static/'.length);
        }
        item.img = ossBase + url;
      } else {
        item.img = item.image_url || '';
      }
      if (item.toppings === null || item.toppings === undefined || item.toppings === '') {
        item.toppings = '[]';
      }
    });

    const [couponRes] = await pool.query(couponSql, [req.params.orderId]);
    res.json({ items: items, coupon: couponRes && couponRes[0] ? couponRes[0] : null });
  } catch (err) {
    console.error('查询订单详情失败:', err);
    res.status(500).json({ error: '查询订单详情失败' });
  }
});

// 创建订单
router.post('/', async (req, res) => {
  const { user_id, order_type, total_amount, address_id, remark, items, coupon_id } = req.body;
  const orderNo = 'TEA' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
  
  const connection = await pool.getConnection(); // 从连接池获取一个连接用于事务

  try {
    await connection.beginTransaction(); // 开始事务

    let finalAmount = total_amount;
    if (coupon_id) {
      const [coupons] = await connection.query('SELECT * FROM coupons WHERE id = ? AND user_id = ? AND status = "unused" FOR UPDATE', [coupon_id, user_id]);
      if (coupons.length === 0) throw new Error('优惠券无效');
      const coupon = coupons[0];
      finalAmount = Math.max(0, total_amount - coupon.value);
    }
    
    const orderSql = 'INSERT INTO orders (order_no, user_id, order_type, total_amount, address_id, coupon_id, remark) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const [orderResult] = await connection.query(orderSql, [orderNo, user_id, order_type, finalAmount, address_id, coupon_id || null, remark]);
    const orderId = orderResult.insertId;

    const itemPromises = items.map(item => {
      const quantity = item.quantity || item.count || 1;
      const price = Number(item.price) || 0;
      const totalPrice = item.totalPrice != null ? item.totalPrice : price * quantity;
      const itemSql = 'INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, spec, sweetness, temperature, toppings, total_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
      return connection.query(itemSql, [
        orderId, item.product_id, item.name, price, quantity,
        item.spec, item.sweet, item.temp, JSON.stringify(item.toppings || []), totalPrice
      ]);
    });
    await Promise.all(itemPromises);

    await connection.query('UPDATE users SET points = points + ? WHERE id = ?', [Math.floor(finalAmount), user_id]);
    if (coupon_id) {
      await connection.query('UPDATE coupons SET status = "used", used_at = NOW() WHERE id = ?', [coupon_id]);
    }
    
    await connection.commit(); // 提交事务
    
    res.json({ order_id: orderId, order_no: orderNo, message: '订单创建成功' });

  } catch (err) {
    await connection.rollback(); // 回滚事务
    console.error('创建订单失败:', err);
    res.status(500).json({ error: '创建订单失败', message: err.message });
  } finally {
    connection.release(); // 释放连接回连接池
  }
});

// 更新订单状态
router.put('/:orderId/status', async (req, res) => {
  const { status } = req.body;
  try {
    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.orderId]);
    res.json({ message: '订单状态更新成功' });
  } catch (err) {
    console.error('更新订单状态失败:', err);
    res.status(500).json({ error: '更新订单状态失败' });
  }
});

module.exports = router; 