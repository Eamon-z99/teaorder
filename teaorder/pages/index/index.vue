<template>
  <view class="page-container">
    <!-- 订单类型标签 -->
    <view class="order-type-tabs">
      <view :class="['order-type-tab', orderType==='self' ? 'active' : '']" @click="setOrderType('self')">自取</view>
      <view :class="['order-type-tab', orderType==='delivery' ? 'active' : '']" @click="setOrderType('delivery')">外卖</view>
    </view>
    <!-- 外卖地址栏 -->
    <view v-if="orderType==='delivery'" class="delivery-address-bar" @click="chooseAddress">
      <view v-if="defaultAddress">
        <text class="addr-main">{{ defaultAddress.name }} {{ defaultAddress.phone }}</text>
        <text class="addr-detail">{{ defaultAddress.detail }} <span class="addr-tag">{{ defaultAddress.tag }}</span> <span v-if="defaultAddress.isDefault" class="addr-default">默认</span></text>
      </view>
      <view v-else class="addr-empty">请选择收货地址</view>
      <text class="addr-arrow">&gt;</text>
    </view>
    <view class="menu-container">
      <!-- 左侧分类栏 -->
      <scroll-view scroll-y class="category-sidebar">
        <view
          v-for="(category, index) in categories"
          :key="index"
          :class="['category-item', activeCategoryIndex === index ? 'active' : '']"
          @click="selectCategory(index)"
        >
          {{ category }}
        </view>
      </scroll-view>

      <!-- 右侧商品列表（虚拟列表+图片懒加载） -->
      <scroll-view scroll-y class="menu-list" :scroll-into-view="targetScrollViewId" @scroll="handleVirtualScroll" scroll-with-animation :scroll-into-view-options="{block:'start',behavior:'smooth'}">
        <view v-for="(group, idx) in groupedMenu" :key="group.name" :id="'c' + idx">
          <view class="category-title">{{ group.name }}</view>
          <view v-for="item in group.visibleItems" :key="item.id" :class="['menu-card', highlightProductId === item.id ? 'highlighted' : '']" @click="goToChoose(item)">
            <image :src="item.img || item.image_url || ($oss + 'logo.png')" class="menu-img" mode="aspectFill" lazy-load />
            <view class="menu-info">
              <text class="menu-name">{{ item.name }}</text>
              <text class="menu-desc">{{ item.desc }}</text>
              <text class="menu-price">￥{{ item.price }}</text>
            </view>
            <view v-if="item.category === '保温袋区'" class="menu-action">
              <button class="num-btn" @click.stop="changeCount(item, -1)">-</button>
              <text class="count">{{ getCount(item) }}</text>
              <button class="num-btn" @click.stop="changeCount(item, 1)">+</button>
            </view>
            <view v-else-if="item.category !== '小料区'" class="menu-action">
              <button class="num-btn" @click.stop="changeCount(item, 1)">+</button>
            </view>
          </view>
        </view>
        <!-- 只在最后插入一次 spacer -->
        <view style="height: 100rpx;background:transparent;"></view>
      </scroll-view>
    </view>

    <!-- 底部购物车栏 -->
    <view class="cart-bar" @click="showCartPopup = true">
      <text>已选 {{ cart.length }} 种 | 共 {{ totalCount }} 杯</text>
      <button class="main-btn" @click.stop="submitOrder">提交订单</button>
    </view>
    <!-- 购物车弹窗 -->
    <view v-if="showCartPopup" class="cart-popup-mask" @click.self="showCartPopup = false">
      <view class="cart-popup">
        <view class="cart-popup-title-row">
          <view class="cart-popup-close-abs" @click="showCartPopup = false">×</view>
          <view class="cart-popup-title">已选商品</view>
          <text class="cart-popup-clear" @click.stop="clearCart">清空</text>
        </view>
        <view v-if="cart.length === 0" class="cart-popup-empty">购物车为空</view>
        <view v-else>
          <view v-for="item in cart" :key="item.id" class="cart-popup-item">
            <image :src="item.img || item.image_url || ($oss + 'logo.png')" class="cart-popup-img" mode="aspectFill" />
            <view class="cart-popup-info">
              <view class="cart-popup-name">{{ item.name }}</view>
              <view class="cart-popup-spec">{{ item.spec }} / {{ item.sweet }} / {{ item.temp }}<span v-if="item.toppings && item.toppings.length"> / {{ Array.isArray(item.toppings) ? item.toppings.join('、') : item.toppings }}</span></view>
              <view class="cart-popup-price">￥{{ item.price }} x {{ item.count }}</view>
            </view>
            <view class="cart-popup-delete" @click.stop="deleteCartItem(item)">删除</view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      categories: [],
      activeCategoryIndex: 0,
      targetScrollViewId: '',
      categoryTops: [],
      isCategoryClick: false,
      menu: [],
      cart: [],
      showCartPopup: false,
      orderType: 'self',
      defaultAddress: null,
      userId: null,
      userInfo: null,
      highlightProductId: null,
      highlightTimeout: null,
      virtualListConfig: {
        itemHeight: 220, // rpx, 约等于每个商品卡片高度
        buffer: 4, // 可视区前后各多渲染几个
        visibleCount: 0 // 运行时计算
      },
      scrollTop: 0
    };
  },
  computed: {
    totalCount() {
      return this.cart.reduce((sum, item) => sum + item.count, 0);
    },
    groupedMenu() {
      // 为每个分组计算虚拟可见商品
      return this.categories.map(category => {
        const items = this.menu.filter(item => item.category === category);
        // 虚拟列表核心：只渲染可视区商品
        let visibleItems = items;
        if (this.virtualListConfig.visibleCount > 0) {
          // 计算当前分组在整体中的起始索引
          const groupIndex = this.categories.indexOf(category);
          let start = 0, end = items.length;
          if (groupIndex === this.activeCategoryIndex) {
            // 只对当前分组做虚拟滚动
            const { itemHeight, buffer, visibleCount } = this.virtualListConfig;
            const groupScrollTop = this.scrollTop;
            start = Math.max(0, Math.floor(groupScrollTop / itemHeight) - buffer);
            end = start + visibleCount + buffer * 2;
            // 修正：滑到最后时固定渲染最后一屏，防止抖动
            if (end >= items.length) {
              end = items.length;
              start = Math.max(0, end - visibleCount - buffer * 2);
            }
            visibleItems = items.slice(start, end);
          }
        }
        return { name: category, items, visibleItems };
      });
    }
  },
  mounted() {
    // 计算可视区能显示多少个商品
    this.$nextTick(() => {
      const menuListHeight = uni.upx2px(1000); // 1000rpx 约等于可视区高度
      const itemHeight = this.virtualListConfig.itemHeight;
      this.virtualListConfig.visibleCount = Math.ceil(menuListHeight / itemHeight) + 2; // 多渲染2个缓冲
    });
  },
  onReady() {
    setTimeout(() => {
      this.calculateCategoryTops();
    }, 200);
  },
  onShow() {
    // 检查登录状态
    this.checkLoginStatus();
    // 获取商品数据
    this.getProducts();
    // 获取购物车数据
    this.getCart();
    // 订单类型
    const type = uni.getStorageSync('orderType') || 'self';
    this.orderType = type;
    // 地址
    if (type === 'delivery') {
      this.getDefaultAddress();
    } else {
      this.defaultAddress = null;
    }
    // 检查是否需要滚动到指定商品
    const scrollToProduct = uni.getStorageSync('scrollToProduct');
    if (scrollToProduct) {
      setTimeout(() => {
        this.scrollToProduct(scrollToProduct);
        uni.removeStorageSync('scrollToProduct');
      }, 200);
    }
    // 监听地址管理页返回，刷新地址
    const pages = getCurrentPages();
    const current = pages[pages.length - 1];
    if (this.orderType === 'delivery') {
      this.getDefaultAddress();
    }
  },
  methods: {
    // 检查登录状态
    checkLoginStatus() {
      let userInfo = uni.getStorageSync('userInfo');
      const token = uni.getStorageSync('token');
      // 兼容userId字段
      if (userInfo && !userInfo.id && userInfo.userId) {
        userInfo.id = userInfo.userId;
        uni.setStorageSync('userInfo', userInfo);
      }
      if (userInfo && token) {
        this.userInfo = userInfo;
        this.userId = userInfo.id;
      } else {
        this.userInfo = null;
        this.userId = null;
      }
    },
    // 获取商品列表
    async getProducts() {
      try {
        const [error, res] = await uni.request({
          url: 'http://localhost:3000/api/product',
          method: 'GET'
        });
        
        if (error) {
          console.error('获取商品请求错误:', error);
          this.menu = [];
          return;
        }
        
        if (res && res.statusCode === 200) {
          // 兼容后端 description 字段为 desc，确保 img 字段带上
          this.menu = res.data.map(item => ({
            ...item,
            desc: item.desc || item.description || '',
            img: item.img // 确保 img 字段带上
          }));
          // 从数据库获取分类
          this.loadCategories();
        } else {
          console.error('获取商品失败:', res);
          this.menu = [];
        }
      } catch (error) {
        console.error('获取商品失败:', error);
        this.menu = [];
      }
    },

    // 从数据库获取分类
    async loadCategories() {
      try {
        const [error, res] = await uni.request({
          url: 'http://localhost:3000/api/admin/categories',
          method: 'GET',
          header: { 'Content-Type': 'application/json' }
        });
        
        if (error) {
          console.error('加载分类请求错误:', error);
          this.categories = ['招牌奶茶', '真鲜果茶', '酸奶奶昔', '小料区', '保温袋区'];
          return;
        }
        
        if (res && res.data && res.data.success) {
          // 只获取启用的分类
          this.categories = res.data.categories
            .filter(cat => cat.status === 1)
            .sort((a, b) => a.sort_order - b.sort_order)
            .map(cat => cat.name);
          
          console.log('从数据库加载的分类:', this.categories);
        } else {
          console.error('加载分类失败:', res?.data?.message);
          // 如果加载失败，使用默认分类
          this.categories = ['招牌奶茶', '真鲜果茶', '酸奶奶昔', '小料区', '保温袋区'];
        }
      } catch (error) {
        console.error('加载分类失败:', error);
        // 如果加载失败，使用默认分类
        this.categories = ['招牌奶茶', '真鲜果茶', '酸奶奶昔', '小料区', '保温袋区'];
      }
    },
    // 获取购物车
    async getCart() {
      if (!this.userId) {
        this.cart = [];
        return;
      }
      
      try {
        const [error, res] = await uni.request({
          url: `http://localhost:3000/api/cart/user/${this.userId}`,
          method: 'GET'
        });
        
        if (error) {
          console.error('获取购物车请求错误:', error);
          this.cart = [];
          return;
        }
        
        if (res && res.statusCode === 200) {
          this.cart = res.data.map(item => ({
            ...item,
            img: item.img, // 确保 img 字段带上
            sweet: item.sweetness,
            temp: item.temperature,
            count: item.quantity,
            toppings: item.toppings ? JSON.parse(item.toppings) : []
          }));
        }
      } catch (error) {
        console.error('获取购物车失败:', error);
        this.cart = [];
      }
    },
    // 获取默认地址
    async getDefaultAddress() {
      try {
        const [error, res] = await uni.request({
          url: `http://localhost:3000/api/address/user/${this.userId}`,
          method: 'GET'
        });
        
        if (error) {
          console.error('获取地址请求错误:', error);
          this.defaultAddress = null;
          return;
        }
        
        if (res && res.statusCode === 200 && res.data.length > 0) {
          this.defaultAddress = res.data.find(addr => addr.is_default) || res.data[0];
        } else {
          this.defaultAddress = null;
        }
      } catch (error) {
        console.error('获取地址失败:', error);
        this.defaultAddress = null;
      }
    },
    setOrderType(type) {
      this.orderType = type;
      uni.setStorageSync('orderType', type);
      if (type === 'delivery') {
        this.getDefaultAddress();
      } else {
        this.defaultAddress = null;
      }
    },
    chooseAddress() {
      // 跳转到地址管理页，选择后返回
      uni.navigateTo({ url: '/pkg_user/address/address?choose=1' });
    },
    calculateCategoryTops() {
      const query = uni.createSelectorQuery().in(this);
      let tops = [];
      query.selectAll('.category-title').boundingClientRect(rects => {
        if (!rects || rects.length === 0) return;
        const initialOffset = rects[0].top;
        rects.forEach(rect => {
          tops.push(rect.top - initialOffset);
        });
        this.categoryTops = tops;
      }).exec();
    },
    selectCategory(index) {
      if (this.isCategoryClick) return;
      this.isCategoryClick = true;
      this.activeCategoryIndex = index;
      this.targetScrollViewId = 'c' + index;
      setTimeout(() => {
        this.isCategoryClick = false;
        this.targetScrollViewId = '';  // 关键：释放滚动
      }, 800);
    },
    handleScroll(e) {
      if (this.isCategoryClick) return;
      const scrollTop = e.detail.scrollTop;
      for (let i = this.categoryTops.length - 1; i >= 0; i--) {
        if (scrollTop >= this.categoryTops[i] - 10) {
          if (this.activeCategoryIndex !== i) {
            this.activeCategoryIndex = i;
          }
          break;
        }
      }
    },
    handleVirtualScroll(e) {
      // 只记录当前 scrollTop，虚拟列表自动响应
      this.scrollTop = e.detail.scrollTop;
      // 仍然保留原有 handleScroll 分类高亮逻辑
      this.handleScroll(e);
    },
    getCount(item) {
      // 修正：保证返回数量为数字且不为null
      const found = this.cart.find(i => i.product_id === item.id);
      return found ? (found.count || found.quantity || 0) : 0;
    },
    async changeCount(item, delta) {
      if (!this.userId) {
        uni.showToast({ title: '请先登录后购买', icon: 'none' });
        setTimeout(() => {
          uni.navigateTo({ url: '/pkg_user/login/login' });
        }, 800);
        return;
      }
      // 小料区直接返回
      if (item.category === '小料区') return;
      // 保温袋区加减
      if (item.category === '保温袋区') {
        let found = this.cart.find(i => i.product_id === item.id);
        if (found) {
          const newQuantity = (found.count || found.quantity || 0) + delta;
          if (newQuantity <= 0) {
            // 删除商品
            try {
              await uni.request({
                url: `http://localhost:3000/api/cart/${found.id}`,
                method: 'DELETE'
              });
              this.cart = this.cart.filter(i => i.product_id !== item.id);
            } catch (error) {
              console.error('删除购物车商品失败:', error);
            }
          } else {
            // 更新数量
            try {
              await uni.request({
                url: `http://localhost:3000/api/cart/${found.id}/quantity`,
                method: 'PUT',
                data: { quantity: newQuantity }
              });
              found.count = newQuantity;
              found.quantity = newQuantity;
            } catch (error) {
              console.error('更新购物车失败:', error);
            }
          }
        } else if (delta > 0) {
          // 添加商品到购物车
          try {
            const res = await uni.request({
              url: 'http://localhost:3000/api/cart',
              method: 'POST',
              data: {
                user_id: this.userId,
                product_id: item.id,
                quantity: 1,
                spec: '',
                sweetness: '',
                temperature: '',
                toppings: [],
                price: Number(item.price || item.product_price || 0) // 修正：保证为数字
              }
            });
            if (res.statusCode === 200) {
              this.cart.push({
                id: res.data.id,
                product_id: item.id,
                quantity: 1,
                count: 1,
                name: item.name,
                price: item.price,
                img: item.img,
                spec: '',
                sweet: '',
                temp: '',
                toppings: []
              });
            }
          } catch (error) {
            console.error('添加到购物车失败:', error);
          }
        }
        return;
      }
      // 其它商品跳转到规格选择页
      if (delta > 0) {
        uni.navigateTo({
          url: `/pkg_product/choose/choose?item=${encodeURIComponent(JSON.stringify(item))}`
        });
      }
    },
    goToChoose(item) {
      // 小料区和保温袋区点击卡片不做任何操作
      if (item.category === '小料区' || item.category === '保温袋区') {
        return;
      }
      // 其他商品跳转到规格选择页
      if (!this.userId) {
        uni.showToast({ title: '请先登录后购买', icon: 'none' });
        setTimeout(() => {
          uni.navigateTo({ url: '/pkg_user/login/login' });
        }, 800);
        return;
      }
      uni.navigateTo({
        url: `/pkg_product/choose/choose?item=${encodeURIComponent(JSON.stringify(item))}`
      });
    },
    async submitOrder() {
      // 跳转到订单确认页
      uni.setStorageSync('cart', this.cart);
      uni.navigateTo({ url: '/pkg_order/confirmOrder/confirmOrder' });
    },
    async clearCart() {
      try {
        await uni.request({
          url: `http://localhost:3000/api/cart/user/${this.userId}`,
          method: 'DELETE'
        });
      this.cart = [];
      this.showCartPopup = false;
      } catch (error) {
        console.error('清空购物车失败:', error);
      }
    },
    scrollToProduct(product) {
      // 找到商品在哪个分类中
      const categoryIndex = this.categories.findIndex(category => {
        return this.menu.some(item => item.id === product.id && item.category === category);
      });
      
      if (categoryIndex !== -1) {
        // 切换到对应分类
        this.activeCategoryIndex = categoryIndex;
        // 高亮商品卡片
        this.highlightProductId = product.id;
        if (this.highlightTimeout) clearTimeout(this.highlightTimeout);
        this.highlightTimeout = setTimeout(() => {
          this.highlightProductId = null;
          this.highlightTimeout = null;
        }, 500);
        // 确保滚动生效
        this.$nextTick(() => {
          this.targetScrollViewId = 'c' + categoryIndex;
          // 滚动到商品位置
          setTimeout(() => {
            this.targetScrollViewId = '';
          }, 800);
        });
      }
    },
    // 首页热销趋势榜商品点击跳转到下单页
    goToProduct(item) {
      this.goToChoose(item);
    },
    deleteCartItem(item) {
      // 删除购物车中的某个商品
      uni.request({
        url: `http://localhost:3000/api/cart/${item.id}`,
        method: 'DELETE',
        success: () => {
          this.cart = this.cart.filter(i => i.id !== item.id);
        },
        fail: (error) => {
          console.error('删除购物车商品失败:', error);
        }
      });
    }
  }
};
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f7f8fa;
}
.menu-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}
.category-sidebar {
  width: 180rpx;
  background-color: #fff;
  height: calc(100vh - 100rpx);
}
.category-item {
  height: 100rpx;
  line-height: 100rpx;
  text-align: center;
  font-size: 28rpx;
  color: #333;
  cursor: pointer;
  border-left: 6rpx solid transparent;
  transition: all 0.2s;
}
.category-item.active {
  background-color: #f7f8fa;
  color: #ffb300;
  font-weight: bold;
  border-left-color: #ffb300;
}
.menu-list {
  flex: 1;
  padding: 0 20rpx;
  box-sizing: border-box;
}
.category-title {
  font-size: 28rpx;
  font-weight: bold;
  padding: 30rpx 0 20rpx;
  color: #333;
}
.menu-card {
  display: flex;
  background: #fff;
  border-radius: 20rpx;
  margin-bottom: 20rpx;
  padding: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}
.menu-img {
  width: 160rpx;
  height: 160rpx;
  border-radius: 16rpx;
  margin-right: 20rpx;
}
.menu-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.menu-name {
  font-size: 32rpx;
  font-weight: bold;
}
.menu-desc {
  font-size: 24rpx;
  color: #888;
  margin: 8rpx 0;
  flex: 1;
}
.menu-price {
  font-size: 32rpx;
  color: #fa5252;
  font-weight: bold;
}
.menu-action {
  display: flex;
  align-items: center;
}
.num-btn {
  width: 44rpx;
  height: 44rpx;
  line-height: 44rpx;
  text-align: center;
  border-radius: 8rpx;
  background: #0099ff;
  color: #fff;
  font-size: 32rpx;
  padding: 0;
  margin: 0 10rpx;
}
.square-btn {
  border-radius: 12rpx;
}
.num-btn[disabled] {
  background: #f2f2f2;
  color: #aaa;
}
.count {
  font-size: 30rpx;
  min-width: 40rpx;
  text-align: center;
}

/* 底部购物车栏 */
.cart-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 30rpx;
  box-shadow: 0 -4rpx 12rpx rgba(0,0,0,0.05);
}
.main-btn {
  margin-right: 1%;
  background: #ffb300;
  color: #fff;
  border-radius: 60rpx;
  font-size: 30rpx;
}
.cart-popup-mask {
  position: fixed;
  left: 0; right: 0; top: 0; bottom: 0;
  background: rgba(0,0,0,0.25);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}
.cart-popup {
  width: 100vw;
  background: #fff;
  border-top-left-radius: 32rpx;
  border-top-right-radius: 32rpx;
  padding: 32rpx 24rpx 24rpx 24rpx;
  max-height: 60vh;
  overflow-y: auto;
  position: relative;
}
.cart-popup-close {
  position: absolute;
  right: 32rpx;
  top: 24rpx;
  font-size: 44rpx;
  color: #bbb;
  z-index: 10;
  font-weight: bold;
  cursor: pointer;
}
.cart-popup-title-row {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 18rpx;
}
.cart-popup-close-abs {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  font-size: 44rpx;
  color: #bbb;
  font-weight: bold;
  cursor: pointer;
  z-index: 2;
}
.cart-popup-title {
  font-size: 32rpx;
  font-weight: bold;
  margin-left: 60rpx;
  margin-right: 20rpx;
  flex: none;
  text-align: left;
}
.cart-popup-clear {
  font-size: 26rpx;
  color: #fa5252;
  margin-left: auto;
  flex: none;
  width: 60rpx;
  text-align: right;
}
.cart-popup-empty {
  text-align: center;
  color: #bbb;
  font-size: 28rpx;
  margin: 60rpx 0;
}
.cart-popup-item {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
}
.cart-popup-img {
  width: 90rpx;
  height: 90rpx;
  border-radius: 16rpx;
  margin-right: 18rpx;
  background: #f5f5f5;
}
.cart-popup-info {
  flex: 1;
}
.cart-popup-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #222;
}
.cart-popup-spec {
  font-size: 24rpx;
  color: #888;
  margin: 4rpx 0 6rpx 0;
}
.cart-popup-price {
  font-size: 26rpx;
  color: #fa5252;
}
.order-type-tabs {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #fff;
  border-radius: 0 0 20rpx 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
  margin-bottom: 12rpx;
}
.order-type-tab {
  flex: 1;
  text-align: center;
  font-size: 30rpx;
  padding: 24rpx 0;
  color: #888;
  font-weight: bold;
  cursor: pointer;
  border-bottom: 4rpx solid transparent;
}
.order-type-tab.active {
  color: #ffb300;
  border-bottom: 4rpx solid #ffb300;
  background: #fffbe6;
}
.delivery-address-bar {
  display: flex;
  flex-direction: column;
  background: #fffbe6;
  border-radius: 16rpx;
  margin: 18rpx 24rpx 0 24rpx;
  padding: 18rpx 24rpx;
  position: relative;
  cursor: pointer;
  margin-bottom: 32rpx;
}
.addr-main {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
}
.addr-detail {
  font-size: 24rpx;
  color: #666;
  margin-top: 6rpx;
}
.addr-tag {
  background: #f0f0f0;
  color: #888;
  font-size: 20rpx;
  padding: 2rpx 8rpx;
  border-radius: 8rpx;
  margin-left: 8rpx;
}
.addr-default {
  background: #ffb300;
  color: #fff;
  font-size: 20rpx;
  padding: 2rpx 8rpx;
  border-radius: 8rpx;
  margin-left: 8rpx;
}
.addr-arrow {
  position: absolute;
  right: 18rpx;
  top: 50%;
  transform: translateY(-50%);
  color: #bbb;
  font-size: 32rpx;
}
.addr-empty {
  color: #bbb;
  font-size: 26rpx;
}
.menu-card.highlighted {
  box-shadow: 0 0 0 6rpx #ffb300, 0 4rpx 12rpx rgba(0,0,0,0.05);
  border: 2rpx solid #ffb300;
  transition: box-shadow 0.2s, border 0.2s;
}
.cart-popup-delete {
  color: #fa5252;
  font-size: 26rpx;
  margin-left: 18rpx;
  cursor: pointer;
  align-self: flex-start;
}
</style>