const mysql = require('mysql2');

// 创建连接池
const pool = mysql.createPool({
  connectionLimit: 10,   // 连接池最大连接数
  host: 'localhost',
  user: 'root',
  password: '123456',  // 这里是你数据库的正确密码
  database: 'tea',
  charset: 'utf8mb4',
  waitForConnections: true, // 池中无可用连接则等待
  queueLimit: 0             // 不限制排队请求数
});

// 测试连接池是否可用 (可选，但建议保留)
pool.getConnection((err, connection) => {
  if (err) {
    console.error('MySQL连接池创建失败:', err);
    return;
  }
  console.log('MySQL数据库连接池创建成功');
  connection.release(); // 释放连接
});

// 导出 promise 化的连接池，这样路由文件里的 async/await 才能正常工作
module.exports = pool.promise(); 