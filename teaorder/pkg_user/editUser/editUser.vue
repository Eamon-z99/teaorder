<template>
  <view class="edit-user-container">
    <view class="avatar-section">
      <image :src="form.avatar || defaultAvatar" class="avatar" @click="chooseAvatar" mode="aspectFill" />
      <text class="avatar-tip">点击更换头像</text>
    </view>
    <view class="form-section">
      <view class="input-group">
        <text class="input-label">昵称</text>
        <input v-model="form.nickname" placeholder="请输入昵称" class="input" />
      </view>
      <view class="input-group">
        <text class="input-label">手机号</text>
        <input v-model="form.phone" placeholder="请输入手机号" class="input" type="number" />
      </view>
      <view class="input-group">
        <text class="input-label">签名</text>
        <input v-model="form.signature" placeholder="请输入个性签名" class="input" />
      </view>
    </view>
    <button class="save-btn" @click="saveUserInfo">保存</button>
  </view>
</template>

<script>
export default {
  data() {
    return {
      form: {
        avatar: '',
        nickname: '',
        phone: '',
        signature: ''
      },
      defaultAvatar: '/static/images/default-avatar.png',
      userId: null
    };
  },
  onLoad() {
    const userInfo = uni.getStorageSync('userInfo');
    if (userInfo) {
      this.form.avatar = userInfo.avatar || '';
      this.form.nickname = userInfo.nickname || '';
      this.form.phone = userInfo.phone || '';
      this.form.signature = userInfo.signature || '';
      this.userId = userInfo.id;
    }
  },
  methods: {
    chooseAvatar() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const filePath = res.tempFilePaths[0];
          uni.uploadFile({
            url: 'http://localhost:3000/api/user/upload-avatar',
            filePath: filePath,
            name: 'file',
            success: (uploadRes) => {
              const data = JSON.parse(uploadRes.data);
              if (data.success) {
                this.form.avatar = data.url;
                uni.showToast({ title: '上传成功', icon: 'success' });
              } else {
                uni.showToast({ title: data.message || '上传失败', icon: 'none' });
              }
            },
            fail: () => {
              uni.showToast({ title: '上传失败', icon: 'none' });
            }
          });
        }
      });
    },
    async saveUserInfo() {
      if (!this.form.nickname || !this.form.phone) {
        uni.showToast({ title: '请填写完整信息', icon: 'none' });
        return;
      }
      // 头像上传略（如需后端支持可补充）
      try {
        const res = await uni.request({
          url: 'http://localhost:3000/api/user/update',
          method: 'POST',
          data: {
            user_id: this.userId,
            avatar: this.form.avatar,
            nickname: this.form.nickname,
            phone: this.form.phone,
            signature: this.form.signature
          }
        });
        if (res.data && res.data.success) {
          uni.showToast({ title: '保存成功', icon: 'success' });
          // 更新本地缓存
          const userInfo = uni.getStorageSync('userInfo') || {};
          userInfo.avatar = this.form.avatar;
          userInfo.nickname = this.form.nickname;
          userInfo.phone = this.form.phone;
          userInfo.signature = this.form.signature;
          uni.setStorageSync('userInfo', userInfo);
          setTimeout(() => {
            uni.navigateBack();
          }, 1000);
        } else {
          uni.showToast({ title: res.data.message || '保存失败', icon: 'none' });
        }
      } catch (e) {
        uni.showToast({ title: '网络错误', icon: 'none' });
      }
    }
  }
};
</script>

<style scoped>
.edit-user-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 40rpx 30rpx;
}
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40rpx;
}
.avatar {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  border: 4rpx solid #fff;
  box-shadow: 0 4rpx 24rpx rgba(102,126,234,0.15);
}
.avatar-tip {
  font-size: 24rpx;
  color: #888;
  margin-top: 12rpx;
}
.form-section {
  background: #fff;
  border-radius: 20rpx;
  padding: 40rpx 30rpx;
  box-shadow: 0 4rpx 24rpx rgba(102,126,234,0.08);
  margin-bottom: 40rpx;
}
.input-group {
  margin-bottom: 32rpx;
}
.input-label {
  font-size: 28rpx;
  color: #2c3e50;
  font-weight: bold;
  margin-bottom: 12rpx;
  display: block;
}
.input {
  width: 100%;
  border: 2rpx solid #e8e8e8;
  border-radius: 12rpx;
  padding: 20rpx 16rpx;
  font-size: 28rpx;
  background: #fafafa;
  transition: all 0.3s ease;
}
.input:focus {
  border-color: #667eea;
  background: #fff;
}
.save-btn {
  width: 100%;
  background: linear-gradient(90deg, #667eea, #64b5f6);
  color: #fff;
  border: none;
  border-radius: 12rpx;
  font-size: 32rpx;
  font-weight: bold;
  padding: 28rpx 0;
  box-shadow: 0 4rpx 16rpx rgba(102,126,234,0.15);
}
</style> 