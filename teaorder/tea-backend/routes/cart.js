const express = require('express');
const pool = require('../config/database');
const router = express.Router();

// 获取用户购物车
router.get('/user/:userId', async (req, res) => {
  const sql = `
    SELECT c.*, p.name, p.image_url 
    FROM cart_items c 
    JOIN products p ON c.product_id = p.id 
    WHERE c.user_id = ?
  `;
  try {
    const [results] = await pool.query(sql, [req.params.userId]);
    // 拼接图片完整OSS地址
    const ossBase = 'https://tea-uniapp.oss-cn-shenzhen.aliyuncs.com/static/';
    results.forEach(item => {
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
    res.json(results);
  } catch (err) {
    console.error('查询购物车失败:', err);
    res.status(500).json({ error: '查询购物车失败' });
  }
});

// 添加到购物车
router.post('/', async (req, res) => {
  const { user_id, product_id, quantity, spec, sweetness, temperature, toppings, price } = req.body;
  const toppingsStr = JSON.stringify(toppings || []);

  const findSql = 'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ? AND spec = ? AND sweetness = ? AND temperature = ? AND toppings = ?';
  const insertSql = 'INSERT INTO cart_items (user_id, product_id, quantity, spec, sweetness, temperature, toppings, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  const updateSql = 'UPDATE cart_items SET quantity = quantity + ?, price = ? WHERE id = ?';

  try {
    const [existingItems] = await pool.query(findSql, [user_id, product_id, spec, sweetness, temperature, toppingsStr]);

    if (existingItems.length > 0) {
      const item = existingItems[0];
      const newQuantity = item.quantity + quantity;
      await pool.query(updateSql, [quantity, price, item.id]);
      res.json({ id: item.id, message: '购物车数量已更新' });
    } else {
      const [result] = await pool.query(insertSql, [user_id, product_id, quantity, spec, sweetness, temperature, toppingsStr, price]);
      res.json({ id: result.insertId, message: '已添加到购物车' });
    }
  } catch (err) {
    console.error('添加到购物车失败:', err);
    res.status(500).json({ error: '添加到购物车失败' });
  }
});

// 更新购物车商品数量
router.put('/:cartItemId/quantity', async (req, res) => {
  const { quantity } = req.body;
  try {
    await pool.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, req.params.cartItemId]);
    res.json({ message: '数量更新成功' });
  } catch (err) {
    console.error('更新购物车数量失败:', err);
    res.status(500).json({ error: '更新购物车数量失败' });
  }
});

// 删除购物车商品
router.delete('/:cartItemId', async (req, res) => {
  try {
    await pool.query('DELETE FROM cart_items WHERE id = ?', [req.params.cartItemId]);
    res.json({ message: '删除成功' });
  } catch (err) {
    console.error('删除购物车商品失败:', err);
    res.status(500).json({ error: '删除购物车商品失败' });
  }
});

// 清空用户购物车
router.delete('/user/:userId', async (req, res) => {
  try {
    await pool.query('DELETE FROM cart_items WHERE user_id = ?', [req.params.userId]);
    res.json({ message: '购物车已清空' });
  } catch (err) {
    console.error('清空购物车失败:', err);
    res.status(500).json({ error: '清空购物车失败' });
  }
});

module.exports = router; 