<template>
  <view class="users-container">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <input 
        class="search-input" 
        v-model="searchKeyword" 
        placeholder="搜索用户昵称或手机号"
        @confirm="onSearch"
      />
    </view>

    <!-- 用户列表 -->
    <view class="users-list">
      <view 
        class="user-item" 
        v-for="user in users" 
        :key="user.id"
      >
        <view class="user-avatar">
          <image :src="user.avatar || '/static/images/default-avatar.png'" mode="aspectFill" />
        </view>
        
        <view class="user-info">
          <view class="user-name">{{ user.nickname || '匿名用户' }}</view>
          <view class="user-phone">{{ user.phone || '无手机号' }}</view>
          <view class="user-meta">
            <text class="meta-item">积分: {{ user.points || 0 }}</text>
            <text class="meta-item">注册: {{ formatDate(user.created_at) }}</text>
          </view>
        </view>
        
        <view class="user-actions">
          <button class="action-btn" @click="viewUserDetail(user.id)">详情</button>
        </view>
      </view>
    </view>

    <!-- 加载更多 -->
    <view class="load-more" v-if="hasMore">
      <button class="load-more-btn" @click="loadMore" :disabled="loading">
        {{ loading ? '加载中...' : '加载更多' }}
      </button>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-if="users.length === 0 && !loading">
      <text class="empty-text">暂无用户</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      users: [],
      searchKeyword: '',
      currentPage: 1,
      hasMore: true,
      loading: false,
      pageSize: 10
    };
  },
  onLoad() {
    this.loadUsers();
  },
  methods: {
    // 加载用户列表
    loadUsers(reset = true) {
      if (reset) {
        this.users = [];
        this.currentPage = 1;
        this.hasMore = true;
      }
      if (this.loading || !this.hasMore) return;
      this.loading = true;
      let url = `http://localhost:3000/api/admin/users?page=${this.currentPage}&limit=${this.pageSize}`;
      if (this.searchKeyword) {
        url += `&keyword=${encodeURIComponent(this.searchKeyword)}`;
      }
      uni.request({
        url,
        method: 'GET',
        success: (res) => {
          if (res.data && res.data.success) {
            const newUsers = res.data.users;
            if (reset) {
              this.users = newUsers;
            } else {
              this.users = [...this.users, ...newUsers];
            }
            this.hasMore = newUsers.length === this.pageSize;
            this.currentPage++;
          } else {
            uni.showToast({ title: res.data.message || '加载失败', icon: 'none' });
          }
        },
        fail: () => {
          uni.showToast({ title: '网络错误', icon: 'none' });
        },
        complete: () => {
          this.loading = false;
        }
      });
    },
    // 搜索用户
    onSearch() {
      this.loadUsers(true);
    },
    // 加载更多
    loadMore() {
      this.loadUsers(false);
    },
    // 查看用户详情
    viewUserDetail(userId) {
      uni.navigateTo({
        url: `/pkg_admin/users/userDetail?userId=${userId}`
      });
    },
    // 格式化日期
    formatDate(dateStr) {
      if (!dateStr) return '未知';
      const date = new Date(dateStr);
      return date.toLocaleDateString();
    }
  }
};
</script>

<style scoped>
.users-container {
  min-height: 100vh;
  background: #f5f5f5;
}

.search-bar {
  background: #fff;
  padding: 20rpx;
  border-bottom: 1rpx solid #e5e5e5;
}

.search-input {
  width: 100%;
  height: 70rpx;
  border: 2rpx solid #e5e5e5;
  border-radius: 12rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  background: #f8f9fa;
}

.users-list {
  padding: 20rpx;
}

.user-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.user-avatar {
  width: 100rpx;
  height: 100rpx;
  flex-shrink: 0;
}

.user-avatar image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.user-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.user-phone {
  font-size: 26rpx;
  color: #666;
}

.user-meta {
  display: flex;
  gap: 20rpx;
}

.meta-item {
  font-size: 24rpx;
  color: #999;
}

.user-actions {
  flex-shrink: 0;
}

.action-btn {
  padding: 12rpx 24rpx;
  background: #667eea;
  color: #fff;
  border: none;
  border-radius: 8rpx;
  font-size: 26rpx;
}

.load-more {
  padding: 40rpx 20rpx;
  text-align: center;
}

.load-more-btn {
  padding: 20rpx 40rpx;
  background: #fff;
  border: 2rpx solid #667eea;
  color: #667eea;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.load-more-btn:disabled {
  background: #f5f5f5;
  border-color: #ccc;
  color: #999;
}

.empty-state {
  padding: 100rpx 20rpx;
  text-align: center;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}
</style> 