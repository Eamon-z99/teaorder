<template>
  <view class="choose-container">
    <!-- 商品大图 -->
    <view class="top-img-wrap">
      <image :src="item.img || item.image_url || ($oss + 'logo.png')" class="product-img-full" mode="aspectFill" />
    </view>

    <!-- 商品信息 -->
    <view class="product-info">
      <view class="product-name">{{ item.name || '商品名称' }}</view>
      <view class="product-desc">{{ item.desc || '暂无描述' }}</view>
      <view class="divider"></view>
    </view>

    <!-- 规格 -->
    <view class="option-group">
      <view class="option-title">规格</view>
      <view class="option-list">
        <view v-for="spec in specs" :key="spec"
              :class="['option-btn', selectedSpec === spec ? 'selected' : '']"
              @click="selectedSpec = spec">{{ spec }}</view>
      </view>
    </view>

    <!-- 甜度 -->
    <view class="option-group">
      <view class="option-title">甜度</view>
      <view class="option-list">
        <view v-for="sweet in sweets" :key="sweet"
              :class="['option-btn', selectedSweet === sweet ? 'selected' : '']"
              @click="selectedSweet = sweet">{{ sweet }}</view>
      </view>
    </view>

    <!-- 温度 -->
    <view class="option-group">
      <view class="option-title">温度</view>
      <view class="option-list">
        <view v-for="temp in temps" :key="temp"
              :class="['option-btn', selectedTemp === temp ? 'selected' : '']"
              @click="selectedTemp = temp">{{ temp }}</view>
      </view>
    </view>

    <!-- 小料 -->
    <view class="option-group">
      <view class="option-title">添加小料</view>
      <view class="option-list">
        <view v-for="topping in toppings" :key="topping.name"
              :class="['option-btn', selectedToppings.includes(topping.name) ? 'selected' : '']"
              @click="toggleTopping(topping.name)">
          {{ topping.name }} (+￥{{ topping.price }})
        </view>
      </view>
    </view>

    <!-- 已选规格描述 -->
    <view class="summary">{{ summary }}</view>

    <!-- 价格 + 数量 -->
    <view class="price-qty-line">
      <text class="footer-price">￥{{ totalPrice }}</text>
      <view class="qty-box">
        <button class="square-btn" @click="changeCount(-1)" :disabled="count<=1">-</button>
        <text class="qty-num">{{ count }}</text>
        <button class="square-btn" @click="changeCount(1)">+</button>
      </view>
    </view>

    <!-- 加入购物车（蓝色按钮） -->
    <button class="add-cart-btn" @click="addToCart">加入购物车</button>
  </view>
</template>

<script>
export default {
  data() {
    return {
      item: {},
      specs: ['大杯', '中杯'],
      sweets: ['全糖', '七分糖', '五分糖'],
      temps: ['正常冰', '少冰', '常温', '热'],
      toppings: [
        { name: '珍珠', price: 2 },
        { name: '椰果', price: 2 }
      ],
      selectedSpec: '大杯',
      selectedSweet: '全糖',
      selectedTemp: '正常冰',
      selectedToppings: [],
      count: 1
    };
  },
  onLoad(options) {
    if (options.item) this.item = JSON.parse(decodeURIComponent(options.item));
  },
  computed: {
    totalPrice() {
      let base = Number(this.item.price || 0);
      this.selectedToppings.forEach(name => {
        const t = this.toppings.find(t => t.name === name);
        if (t) base += t.price;
      });
      return base * this.count;
    },
    summary() {
      const toppingStr = this.selectedToppings.length
        ? `, 小料：${this.selectedToppings.join('、')}`
        : '';
      return `${this.selectedSpec} / ${this.selectedSweet} / ${this.selectedTemp}${toppingStr}`;
    }
  },
  methods: {
    toggleTopping(name) {
      const idx = this.selectedToppings.indexOf(name);
      idx > -1 ? this.selectedToppings.splice(idx, 1) : this.selectedToppings.push(name);
    },
    changeCount(delta) {
      if (this.count + delta < 1) return;
      this.count += delta;
    },
    addToCart() {
      const singleCupPrice = (() => {
        let base = Number(this.item.price || 0);
        this.selectedToppings.forEach(name => {
          const t = this.toppings.find(t => t.name === name);
          if (t) base += t.price;
        });
        return base;
      })();
      const cartItem = {
        ...this.item,
        spec: this.selectedSpec,
        sweet: this.selectedSweet,
        temp: this.selectedTemp,
        toppings: this.selectedToppings,
        count: this.count,
        price: singleCupPrice, // 单杯含小料价
        totalPrice: singleCupPrice * this.count
      };
      // 调用后端API添加到购物车
      uni.request({
        url: 'http://localhost:3000/api/cart',
        method: 'POST',
        data: {
          user_id: uni.getStorageSync('userInfo')?.id, // 登录用户ID
          product_id: this.item.id,
          quantity: this.count,
          spec: this.selectedSpec,
          sweetness: this.selectedSweet,
          temperature: this.selectedTemp,
          toppings: this.selectedToppings,
          price: singleCupPrice // 单杯含小料价
        },
        success: (res) => {
          if (res.statusCode === 200) {
      uni.showToast({ title: '已加入购物车', icon: 'success' });
      setTimeout(() => uni.navigateBack(), 800);
          } else {
            uni.showToast({ title: '添加失败', icon: 'none' });
          }
        },
        fail: (error) => {
          console.error('添加到购物车失败:', error);
          uni.showToast({ title: '添加失败', icon: 'none' });
        }
      });
    }
  }
};
</script>

<style scoped>
.choose-container {
  background: #fff;
  min-height: 100vh;
  padding-bottom: 220rpx;
}
.top-img-wrap {
  width: 100vw;
  line-height: 0;
}
.product-img-full {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  display: block;
}
.product-info {
  padding: 32rpx 32rpx 0;
}
.product-name {
  font-size: 42rpx;
  font-weight: 700;
  color: #222;
}
.product-desc {
  font-size: 28rpx;
  color: #666;
  margin: 12rpx 0 8rpx;
}
.divider {
  height: 2rpx;
  background: #000;
  margin: 24rpx 0;
}
.option-group {
  margin: 40rpx 32rpx 0;
}
.option-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #222;
  margin-bottom: 20rpx;
}
.option-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx 20rpx; /* 约5mm间距 */
}
.option-btn {
  padding: 8rpx 24rpx;
  border: 1rpx solid #e5e5e5;
  border-radius: 0;
  background: #fff;
  font-size: 26rpx;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: unset;
  min-height: unset;
  margin: 0;
  line-height: 1.2;
  height: auto;
  transition: border-color .2s, color .2s, background .2s;
}
.option-btn.selected {
  border-color: #66ccff;
  background: #fff;
  color: #333;
}

.summary {
  margin: 40rpx 32rpx;
  font-size: 28rpx;
  color: #222;
  font-weight: 500;
}

/* 价格 + 数量 */
.price-qty-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32rpx;
  margin-bottom: 20rpx;
}
.footer-price {
  font-size: 44rpx;
  font-weight: 700;
  color: #fa5252;
}
.qty-box {
  display: flex;
  align-items: center;
}
.square-btn {
  width: 60rpx;
  height: 60rpx;
  border-radius: 10rpx;
  border: 2rpx solid #ffb300;
  background: #fff;
  font-size: 36rpx;
  color: #ffb300;
  display: flex;
  align-items: center;
  justify-content: center;
}
.qty-num {
  font-size: 32rpx;
  color: #222;
  min-width: 60rpx;
  text-align: center;
  margin: 0 16rpx;
}

/* 蓝色加入购物车按钮 */
.add-cart-btn {
  margin: 0 32rpx 40rpx;
  background: #0099ff;
  color: #fff;
  border-radius: 10rpx;
  font-size: 34rpx;
  font-weight: 600;
  height: 88rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,153,255,.3);
  border: none;
}
.add-cart-btn:active {
  opacity: 0.85;
}
</style>