const express = require('express');
const pool = require('../config/database'); // 引入连接池
const router = express.Router();

// 获取所有商品
router.get('/', async (req, res) => {
  try {
    const [results] = await pool.query('SELECT * FROM products WHERE status = 1');
    // 兼容前端 img 字段，拼接完整OSS地址
    const ossBase = 'https://tea-uniapp.oss-cn-shenzhen.aliyuncs.com/static/';
    results.forEach(p => {
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
    res.json(results);
  } catch (err) {
    console.error('获取商品失败:', err);
    res.status(500).json({ error: '获取商品失败' });
  }
});

// 根据分类获取商品
router.get('/category/:category', (req, res) => {
  const sql = 'SELECT * FROM products WHERE category = ? AND status = 1 ORDER BY id';
  connection.query(sql, [req.params.category], (err, results) => {
    if (err) {
      console.error('查询商品失败:', err);
      return res.status(500).json({ error: '查询商品失败' });
    }
    res.json(results);
  });
});

// 获取商品分类
router.get('/categories', (req, res) => {
  const sql = 'SELECT DISTINCT category FROM products WHERE status = 1 ORDER BY category';
  connection.query(sql, (err, results) => {
    if (err) {
      console.error('查询分类失败:', err);
      return res.status(500).json({ error: '查询分类失败' });
    }
    res.json(results.map(item => item.category));
  });
});

// 获取热销商品（示例：取前10个，过滤掉小料和购物袋）
router.get('/hot', async (req, res) => {
  try {
    const [results] = await pool.query('SELECT * FROM products WHERE status = 1 ORDER BY id DESC LIMIT 20'); // 先查多一点
    // 拼接图片完整OSS地址
    const ossBase = 'https://tea-uniapp.oss-cn-shenzhen.aliyuncs.com/static/';
    // 过滤掉小料和购物袋
    const excludeKeywords = ['保温袋', '椰果', '珍珠', '小料', '购物袋'];
    const filtered = results.filter(p => !excludeKeywords.some(k => (p.name || '').includes(k)));
    filtered.slice(0, 10).forEach(p => {
      if (p.image_url && !/^https?:\/\//.test(p.image_url)) {
        let url = p.image_url.replace(/^\/+/, '');
        if (url.startsWith('static/')) {
          url = url.slice('static/'.length);
        }
        p.img = ossBase + url;
      } else {
        p.img = p.image_url || '';
      }
    });
    res.json(filtered.slice(0, 10));
  } catch (err) {
    console.error('查询热销商品失败:', err);
    res.status(500).json({ error: '查询热销商品失败' });
  }
});

module.exports = router; 