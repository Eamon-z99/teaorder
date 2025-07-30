<template>
  <view class="products-container">
    <!-- 顶部操作栏 -->
    <view class="top-bar">
      <view class="search-box">
        <input 
          class="search-input" 
          v-model="searchKeyword" 
          placeholder="搜索商品名称"
          @input="onSearch"
        />
      </view>
      <button class="add-btn" @click="goToAddProduct">添加商品</button>
    </view>

    <!-- 分类筛选 -->
    <view class="category-filter">
      <view class="filter-tabs">
        <view 
          class="filter-tab" 
          :class="{ active: currentCategory === '' }"
          @click="filterByCategory('')"
        >
          全部
        </view>
        <view 
          class="filter-tab" 
          :class="{ active: currentCategory === '招牌奶茶' }"
          @click="filterByCategory('招牌奶茶')"
        >
          招牌奶茶
        </view>
        <view 
          class="filter-tab" 
          :class="{ active: currentCategory === '真鲜果茶' }"
          @click="filterByCategory('真鲜果茶')"
        >
          真鲜果茶
        </view>
        <view 
          class="filter-tab" 
          :class="{ active: currentCategory === '酸奶奶昔' }"
          @click="filterByCategory('酸奶奶昔')"
        >
          酸奶奶昔
        </view>
        <view 
          class="filter-tab" 
          :class="{ active: currentCategory === '小料区' }"
          @click="filterByCategory('小料区')"
        >
          小料区
        </view>
      </view>
    </view>

    <!-- 商品列表 -->
    <view class="products-list">
      <view 
        class="product-item" 
        v-for="product in products" 
        :key="product.id"
      >
        <view class="product-image">
          <image :src="product.img || product.image_url || '/static/images/default-product.png'" mode="aspectFill" />
          <view class="status-badge" :class="product.status ? 'active' : 'inactive'">
            {{ product.status ? '上架' : '下架' }}
          </view>
        </view>
        
        <view class="product-info">
          <view class="product-name">{{ product.name }}</view>
          <view class="product-category">{{ product.category }}</view>
          <view class="product-price">¥{{ product.price }}</view>
        </view>
        
        <view class="product-actions">
          <button class="action-btn edit" @click="editProduct(product)">编辑</button>
          <button 
            class="action-btn toggle" 
            :class="product.status ? 'off' : 'on'"
            @click="toggleProductStatus(product)"
          >
            {{ product.status ? '下架' : '上架' }}
          </button>
          <button class="action-btn delete" @click="deleteProduct(product.id)">删除</button>
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
    <view class="empty-state" v-if="products.length === 0 && !loading">
      <text class="empty-text">暂无商品</text>
      <button class="empty-btn" @click="goToAddProduct">添加第一个商品</button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      products: [],
      searchKeyword: '',
      currentCategory: '',
      currentPage: 1,
      hasMore: true,
      loading: false
    };
  },
  onLoad() {
    this.loadProducts();
  },
  methods: {
    // 加载商品列表
    loadProducts(reset = true) {
      if (reset) {
        this.products = [];
        this.currentPage = 1;
        this.hasMore = true;
      }
      
      if (this.loading || !this.hasMore) return;
      
      this.loading = true;
      let url = `http://localhost:3000/api/admin/products?page=${this.currentPage}&limit=10`;
      if (this.currentCategory) {
        url += `&category=${encodeURIComponent(this.currentCategory)}`;
      }
      
      uni.request({
        url: url,
        method: 'GET',
        success: (res) => {
          if (res.data && res.data.success) {
            const newProducts = res.data.products;
            if (reset) {
              this.products = newProducts;
            } else {
              this.products = [...this.products, ...newProducts];
            }
            
            this.hasMore = newProducts.length === 10;
            this.currentPage++;
          }
        },
        fail: () => {
          uni.showToast({ title: '加载商品失败', icon: 'none' });
        },
        complete: () => {
          this.loading = false;
        }
      });
    },
    
    // 搜索商品
    onSearch() {
      // 这里可以实现搜索功能，暂时简单重新加载
      this.loadProducts(true);
    },
    
    // 按分类筛选
    filterByCategory(category) {
      this.currentCategory = category;
      this.loadProducts(true);
    },
    
    // 加载更多
    loadMore() {
      this.loadProducts(false);
    },
    
    // 跳转到添加商品页面
    goToAddProduct() {
      uni.navigateTo({ url: '/pkg_admin/products/add' });
    },
    
    // 编辑商品
    editProduct(product) {
      uni.navigateTo({ 
        url: `/pkg_admin/products/edit?productId=${product.id}` 
      });
    },
    
    // 切换商品状态
    toggleProductStatus(product) {
      const newStatus = !product.status;
      uni.request({
        url: `http://localhost:3000/api/admin/products/${product.id}`,
        method: 'PUT',
        header: {
          'Content-Type': 'application/json'
        },
        data: {
          name: product.name,
          category: product.category,
          price: product.price,
          description: product.description,
          image_url: product.image_url,
          status: newStatus
        },
        success: (res) => {
          if (res.data && res.data.success) {
            uni.showToast({ 
              title: newStatus ? '商品已上架' : '商品已下架', 
              icon: 'success' 
            });
            // 更新本地数据
            product.status = newStatus;
          } else {
            uni.showToast({ title: res.data.message || '操作失败', icon: 'none' });
          }
        },
        fail: () => {
          uni.showToast({ title: '网络错误', icon: 'none' });
        }
      });
    },
    
    // 删除商品
    deleteProduct(productId) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这个商品吗？删除后无法恢复。',
        success: (res) => {
          if (res.confirm) {
            uni.request({
              url: `http://localhost:3000/api/admin/products/${productId}`,
              method: 'DELETE',
              header: {
                'Content-Type': 'application/json'
              },
              success: (res) => {
                if (res.data && res.data.success) {
                  uni.showToast({ title: '删除成功', icon: 'success' });
                  // 重新加载商品列表
                  this.loadProducts(true);
                } else {
                  uni.showToast({ title: res.data.message || '删除失败', icon: 'none' });
                }
              },
              fail: () => {
                uni.showToast({ title: '网络错误', icon: 'none' });
              }
            });
          }
        }
      });
    }
  }
};
</script>

<style scoped>
.products-container {
  min-height: 100vh;
  background: #f5f5f5;
}

.top-bar {
  background: #fff;
  padding: 20rpx;
  display: flex;
  gap: 20rpx;
  align-items: center;
  border-bottom: 1rpx solid #e5e5e5;
}

.search-box {
  flex: 1;
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

.add-btn {
  padding: 16rpx 24rpx;
  background: #667eea;
  color: #fff;
  border: none;
  border-radius: 12rpx;
  font-size: 28rpx;
  white-space: nowrap;
}

.category-filter {
  background: #fff;
  padding: 20rpx;
  border-bottom: 1rpx solid #e5e5e5;
}

.filter-tabs {
  display: flex;
  gap: 20rpx;
  overflow-x: auto;
}

.filter-tab {
  padding: 16rpx 24rpx;
  border-radius: 20rpx;
  font-size: 28rpx;
  color: #666;
  background: #f8f9fa;
  white-space: nowrap;
  transition: all 0.3s ease;
}

.filter-tab.active {
  background: #667eea;
  color: #fff;
}

.products-list {
  padding: 32rpx;
}
.product-item {
  background: #fff;
  border-radius: 18rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
  display: flex;
  gap: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  align-items: center;
  transition: box-shadow 0.2s;
}
.product-item:hover {
  box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.10);
}
.product-image {
  position: relative;
  width: 120rpx;
  height: 120rpx;
  flex-shrink: 0;
}
.product-image image {
  width: 120rpx;
  height: 120rpx;
  border-radius: 16rpx;
  object-fit: cover;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.08);
  background: #f6f6f6;
}
.status-badge {
  position: absolute;
  top: -10rpx;
  right: -10rpx;
  padding: 6rpx 16rpx;
  border-radius: 12rpx;
  font-size: 22rpx;
  font-weight: 500;
  background: #e3f2fd;
  color: #1976d2;
  box-shadow: 0 2rpx 8rpx rgba(25,118,210,0.08);
}
.status-badge.active {
  background: #d4edda;
  color: #388e3c;
}
.status-badge.inactive {
  background: #fff3cd;
  color: #ff9800;
}
.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}
.product-name {
  font-size: 34rpx;
  font-weight: bold;
  color: #222;
}
.product-category {
  font-size: 24rpx;
  color: #667eea;
  background: rgba(102, 126, 234, 0.08);
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
  align-self: flex-start;
}
.product-price {
  font-size: 28rpx;
  color: #ff6b35;
  font-weight: bold;
}
.product-description {
  font-size: 24rpx;
  color: #888;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.product-actions {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  flex-shrink: 0;
}
.action-btn {
  border-radius: 12rpx;
  font-size: 26rpx;
  padding: 14rpx 28rpx;
  margin-right: 0;
  background: linear-gradient(90deg, #667eea 0%, #64b5f6 100%);
  color: #fff;
  border: none;
  box-shadow: 0 2rpx 8rpx rgba(102,126,234,0.08);
  transition: background 0.2s;
}
.action-btn.edit {
  background: linear-gradient(90deg, #667eea 0%, #64b5f6 100%);
}
.action-btn.toggle.on {
  background: linear-gradient(90deg, #28a745 0%, #a8e063 100%);
}
.action-btn.toggle.off {
  background: linear-gradient(90deg, #ffc107 0%, #ffe082 100%);
  color: #333;
}
.action-btn.delete {
  background: linear-gradient(90deg, #ff6b6b 0%, #ffb199 100%);
}
.load-more-btn, .empty-btn {
  border-radius: 12rpx;
  background: #f5f6fa;
  color: #667eea;
  font-size: 26rpx;
  padding: 14rpx 28rpx;
  border: none;
  margin-top: 16rpx;
}
.load-more-btn:disabled {
  background: #f5f5f5;
  border-color: #ccc;
  color: #999;
}
.empty-state {
  padding: 120rpx 0 40rpx 0;
  text-align: center;
  color: #bbb;
  font-size: 30rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 30rpx;
  display: block;
}

.empty-btn {
  padding: 20rpx 40rpx;
  background: #667eea;
  color: #fff;
  border: none;
  border-radius: 12rpx;
  font-size: 28rpx;
}
</style> 