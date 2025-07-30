<template>
  <view class="register-container">
    <view class="register-header">
      <image :src="$oss + 'logo/logo.png'" class="logo" mode="aspectFit" />
      <text class="register-title">注册新账号</text>
    </view>
    <view class="register-form">
      <view class="input-group">
        <text class="input-label">手机号</text>
        <input class="input-field" type="number" v-model="phone" placeholder="请输入手机号" maxlength="11" />
      </view>
      <view class="input-group">
        <text class="input-label">密码</text>
        <input class="input-field" type="password" v-model="password" placeholder="请输入密码" />
      </view>
      <button class="register-btn" @click="register" :disabled="!phone || !password">注册</button>
      <view class="to-login">
        <text>已有账号？</text>
        <text class="to-login-link" @click="goToLogin">去登录</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      phone: '',
      password: ''
    };
  },
  methods: {
    register() {
      if (!/^1[3-9]\d{9}$/.test(this.phone)) {
        uni.showToast({ title: '手机号格式不正确', icon: 'none' });
        return;
      }
      if (this.password.length < 6) {
        uni.showToast({ title: '密码至少6位', icon: 'none' });
        return;
      }
      uni.showLoading({ title: '注册中...' });
      uni.request({
        url: 'http://localhost:3000/api/user/register',
        method: 'POST',
        data: {
          phone: this.phone,
          password: this.password
        },
        success: (res) => {
          uni.hideLoading();
          if (res.data && res.data.success) {
            uni.showToast({ title: '注册成功', icon: 'success' });
            setTimeout(() => {
              uni.redirectTo({ url: '/pkg_user/login/login' });
            }, 1200);
          } else {
            uni.showToast({ title: res.data.message || '注册失败', icon: 'none' });
          }
        },
        fail: () => {
          uni.hideLoading();
          uni.showToast({ title: '网络错误', icon: 'none' });
        }
      });
    },
    goToLogin() {
      uni.redirectTo({ url: '/pkg_user/login/login' });
    }
  }
};
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60rpx 40rpx;
}
.register-header {
  text-align: center;
  margin-bottom: 60rpx;
  padding-top: 60rpx;
}
.logo {
  width: 120rpx;
  height: 120rpx;
  margin-bottom: 30rpx;
}
.register-title {
  display: block;
  font-size: 44rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 10rpx;
}
.register-form {
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
.register-btn {
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
.register-btn:disabled {
  background: #ccc;
}
.to-login {
  text-align: center;
  margin-top: 40rpx;
  color: #888;
  font-size: 28rpx;
}
.to-login-link {
  color: #667eea;
  margin-left: 10rpx;
  text-decoration: underline;
  cursor: pointer;
}
</style> 