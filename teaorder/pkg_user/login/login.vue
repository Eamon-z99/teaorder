<template>
  <view class="login-container">
    <view class="login-header">
      <image :src="$oss + 'logo/logo.png'" class="logo" mode="aspectFit" />
      <text class="welcome-text">欢迎登录喵茶记</text>
    </view>
    
    <!-- 用户类型选择 -->
    <view class="user-type-selector">
      <view 
        class="type-option" 
        :class="{ active: userType === 'user' }"
        @click="userType = 'user'"
      >
        <text class="type-text">普通用户</text>
      </view>
      <view 
        class="type-option" 
        :class="{ active: userType === 'admin' }"
        @click="userType = 'admin'"
      >
        <text class="type-text">管理员</text>
      </view>
    </view>
    
    <view class="login-form">
      <view class="input-group">
        <text class="input-label">{{ userType === 'admin' ? '用户名' : '手机号' }}</text>
        <input 
          class="input-field" 
          :type="userType === 'admin' ? 'text' : 'number'" 
          v-model="account" 
          :placeholder="userType === 'admin' ? '请输入用户名' : '请输入手机号'" 
          :maxlength="userType === 'admin' ? 50 : 11" 
        />
      </view>
      <view class="input-group">
        <text class="input-label">密码</text>
        <input class="input-field" type="password" v-model="password" placeholder="请输入密码" />
      </view>
      <button class="login-btn" @click="login" :disabled="!account || !password">登录</button>
      <view class="to-register" v-if="userType === 'user'">
        <text>还没有账号？</text>
        <text class="to-register-link" @click="goToRegister">去注册</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      userType: 'user', // 'user' 或 'admin'
      account: '', // 手机号或用户名
      password: ''
    };
  },
  methods: {
    login() {
      if (this.userType === 'user') {
        // 普通用户登录验证
        if (!/^1[3-9]\d{9}$/.test(this.account)) {
          uni.showToast({ title: '手机号格式不正确', icon: 'none' });
          return;
        }
      } else {
        // 管理员登录验证
        if (!this.account.trim()) {
          uni.showToast({ title: '请输入用户名', icon: 'none' });
          return;
        }
      }
      
      if (!this.password) {
        uni.showToast({ title: '请输入密码', icon: 'none' });
        return;
      }
      
      uni.showLoading({ title: '登录中...' });
      
      const url = this.userType === 'admin'
        ? 'http://localhost:3000/api/admin/login'
        : 'http://localhost:3000/api/user/login';
        
      const data = this.userType === 'admin'
        ? { username: this.account, password: this.password }
        : { phone: this.account, password: this.password };
      
      uni.request({
        url: url,
        method: 'POST',
        data: data,
        success: (res) => {
          uni.hideLoading();
          if (res.data && res.data.success) {
            // 存储用户信息和类型
            if (this.userType === 'admin') {
              uni.setStorageSync('adminInfo', res.data.admin);
              // 管理员不存储token
            } else {
              uni.setStorageSync('userInfo', res.data.user);
              // 普通用户存储token
              uni.setStorageSync('token', res.data.token);
            }
            uni.setStorageSync('userType', this.userType);
            
            uni.showToast({ title: '登录成功', icon: 'success' });
            setTimeout(() => {
              if (this.userType === 'admin') {
                // 管理员跳转到管理页面
                uni.redirectTo({ url: '/pkg_admin/dashboard/dashboard' });
              } else {
                // 普通用户跳转到首页
                uni.switchTab({ url: '/pages/home/home' });
              }
            }, 1200);
          } else {
            uni.showToast({ title: res.data.message || '登录失败', icon: 'none' });
          }
        },
        fail: () => {
          uni.hideLoading();
          uni.showToast({ title: '网络错误', icon: 'none' });
        }
      });
    },
    goToRegister() {
      uni.redirectTo({ url: '/pkg_user/register/register' });
    }
  }
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60rpx 40rpx;
}
.login-header {
  text-align: center;
  margin-bottom: 40rpx;
  padding-top: 60rpx;
}
.logo {
  width: 120rpx;
  height: 120rpx;
  margin-bottom: 30rpx;
}
.welcome-text {
  display: block;
  font-size: 44rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 10rpx;
}

/* 用户类型选择器 */
.user-type-selector {
  display: flex;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 16rpx;
  padding: 8rpx;
  margin-bottom: 40rpx;
}
.type-option {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
  border-radius: 12rpx;
  transition: all 0.3s ease;
}
.type-option.active {
  background: #fff;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}
.type-text {
  font-size: 28rpx;
  color: #fff;
  font-weight: 500;
}
.type-option.active .type-text {
  color: #667eea;
}

.login-form {
  background: #fff;
  border-radius: 24rpx;
  padding: 60rpx 40rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
}
.input-group {
  margin-bottom: 40rpx;
}
.input-label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 20rpx;
  font-weight: 500;
}
.input-field {
  width: 100%;
  height: 88rpx;
  border: 2rpx solid #e5e5e5;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 32rpx;
  background: #fafafa;
  box-sizing: border-box;
}
.input-field:focus {
  border-color: #667eea;
  background: #fff;
}
.login-btn {
  width: 100%;
  height: 88rpx;
  background: #667eea;
  color: #fff;
  border: none;
  border-radius: 12rpx;
  font-size: 32rpx;
  font-weight: bold;
  margin-top: 20rpx;
}
.login-btn:disabled {
  background: #ccc;
}
.to-register {
  text-align: center;
  margin-top: 40rpx;
  color: #888;
  font-size: 28rpx;
}
.to-register-link {
  color: #667eea;
  margin-left: 10rpx;
  text-decoration: underline;
  cursor: pointer;
}
</style> 