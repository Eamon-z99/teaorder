const express = require('express');
const pool = require('../config/database');
const router = express.Router();

// 获取用户地址列表
router.get('/user/:userId', async (req, res) => {
  const sql = 'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC';
  try {
    const [results] = await pool.query(sql, [req.params.userId]);
    res.json(results);
  } catch (err) {
    console.error('查询地址失败:', err);
    res.status(500).json({ error: '查询地址失败' });
  }
});

// 新增地址
router.post('/', async (req, res) => {
  const { user_id, name, phone, address, tag, is_default, lat, lng } = req.body;
  const sql = 'INSERT INTO addresses (user_id, name, phone, address, tag, is_default, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  
  try {
    if (is_default) {
      await pool.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [user_id]);
    }
    const [result] = await pool.query(sql, [user_id, name, phone, address, tag, is_default, lat, lng]);
    res.json({ id: result.insertId, message: '地址添加成功' });
  } catch (err) {
    console.error('新增地址失败:', err);
    res.status(500).json({ error: '新增地址失败' });
  }
});

// 更新地址
router.put('/:addressId', async (req, res) => {
  const { name, phone, address, tag, is_default, user_id, lat, lng } = req.body;
  const sql = 'UPDATE addresses SET name = ?, phone = ?, address = ?, tag = ?, is_default = ?, lat = ?, lng = ? WHERE id = ?';

  try {
    if (is_default) {
      await pool.query('UPDATE addresses SET is_default = 0 WHERE user_id = ? AND id != ?', [user_id, req.params.addressId]);
    }
    await pool.query(sql, [name, phone, address, tag, is_default, lat, lng, req.params.addressId]);
    res.json({ message: '地址更新成功' });
  } catch (err) {
    console.error('更新地址失败:', err);
    res.status(500).json({ error: '更新地址失败' });
  }
});

// 设置默认地址
router.put('/:addressId/default', async (req, res) => {
  const { user_id } = req.body;
  try {
    await pool.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [user_id]);
    await pool.query('UPDATE addresses SET is_default = 1 WHERE id = ? AND user_id = ?', [req.params.addressId, user_id]);
    res.json({ message: '设置默认地址成功' });
  } catch (err) {
    console.error('设置默认地址失败:', err);
    res.status(500).json({ error: '设置默认地址失败' });
  }
});

// 删除地址
router.delete('/:addressId', async (req, res) => {
  try {
    await pool.query('DELETE FROM addresses WHERE id = ?', [req.params.addressId]);
    res.json({ message: '删除成功' });
  } catch (err) {
    console.error('删除地址失败:', err);
    res.status(500).json({ error: '删除地址失败' });
  }
});

module.exports = router; 