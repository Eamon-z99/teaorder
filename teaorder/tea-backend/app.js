// app.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// 导入路由
const productRouter = require('./routes/product');
const addressRouter = require('./routes/address');
const orderRouter = require('./routes/order');
const cartRouter = require('./routes/cart');
const userRouter = require('./routes/user');
const adminRouter = require('./routes/admin');

const app = express();

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 路由
app.use('/api/product', productRouter);
app.use('/api/address', addressRouter);
app.use('/api/order', orderRouter);
app.use('/api/cart', cartRouter);
app.use('/api/user', userRouter);
app.use('/api/admin', adminRouter);

// 测试路由
app.get('/', (req, res) => {
  res.json({ message: 'Tea Backend API is running!' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API Base URL: http://localhost:${PORT}/api`);
});