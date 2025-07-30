const connection = require('./config/database');

async function updateDatabase() {
  try {
    console.log('开始更新数据库表结构...');
    
    // 逐个添加字段
    const alterStatements = [
      "ALTER TABLE users ADD COLUMN phone VARCHAR(20)",
      "ALTER TABLE users ADD COLUMN avatar VARCHAR(255) DEFAULT '/static/button/我的.png'",
      "ALTER TABLE users ADD COLUMN last_login DATETIME",
      "ALTER TABLE users ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP",
      "ALTER TABLE users ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
    ];
    
    for (let i = 0; i < alterStatements.length; i++) {
      const statement = alterStatements[i];
      try {
        await new Promise((resolve, reject) => {
          connection.query(statement, (err, result) => {
            if (err) {
              if (err.code === 'ER_DUP_FIELDNAME') {
                console.log(`字段已存在，跳过: ${statement}`);
                resolve();
              } else {
                console.error(`执行失败: ${statement}`, err.message);
                resolve(); // 继续执行其他语句
              }
            } else {
              console.log(`执行成功: ${statement}`);
              resolve();
            }
          });
        });
      } catch (error) {
        console.error(`SQL执行异常:`, error);
      }
    }
    
    // 添加索引
    const indexStatements = [
      "CREATE INDEX idx_users_phone ON users(phone)",
      "CREATE INDEX idx_users_openid ON users(openid)",
      "CREATE INDEX idx_users_created_at ON users(created_at)"
    ];
    
    for (let i = 0; i < indexStatements.length; i++) {
      const statement = indexStatements[i];
      try {
        await new Promise((resolve, reject) => {
          connection.query(statement, (err, result) => {
            if (err) {
              if (err.code === 'ER_DUP_KEYNAME') {
                console.log(`索引已存在，跳过: ${statement}`);
                resolve();
              } else {
                console.error(`执行失败: ${statement}`, err.message);
                resolve();
              }
            } else {
              console.log(`执行成功: ${statement}`);
              resolve();
            }
          });
        });
      } catch (error) {
        console.error(`索引创建异常:`, error);
      }
    }
    
    // 更新现有用户数据
    const updateStatement = `
      UPDATE users SET 
        phone = CONCAT('138', LPAD(id, 8, '0')),
        nickname = CONCAT('用户', LPAD(id, 4, '0')),
        created_at = NOW(),
        last_login = NOW()
      WHERE phone IS NULL OR phone = ''
    `;
    
    try {
      await new Promise((resolve, reject) => {
        connection.query(updateStatement, (err, result) => {
          if (err) {
            console.error('更新用户数据失败:', err.message);
            resolve();
          } else {
            console.log('用户数据更新成功');
            resolve();
          }
        });
      });
    } catch (error) {
      console.error('更新用户数据异常:', error);
    }
    
    console.log('数据库表结构更新完成！');
    
  } catch (error) {
    console.error('更新数据库失败:', error);
  } finally {
    connection.end();
  }
}

// 运行更新
updateDatabase(); 