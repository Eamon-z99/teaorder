<template>
  <view class="modern-bg">
    <!-- 主轮播 -->
    <view class="swiper-wrapper">
      <swiper
        class="home-swiper"
        :indicator-dots="false"
        autoplay
        circular
        @change="handleSwiperChange('main', $event)"
      >
        <swiper-item v-for="(img, idx) in swiperImgs" :key="idx">
          <image :src="img" class="swiper-img" mode="aspectFill" />
        </swiper-item>
      </swiper>

      <!-- 平滑移动指示器 -->
      <view class="custom-indicator">
        <view class="indicator-track">
          <view
            class="slider"
            :style="{ transform: 'translateX(' + (currentSwiper.main * 100) + '%)' }"
          ></view>
          <view
            class="bar"
            v-for="(item, index) in swiperImgs"
            :key="'main-bar-' + index"
          ></view>
        </view>
      </view>
    </view>

    <!-- 下方内容 -->
    <view class="home-section">
      <!-- 浮层卡片 -->
      <view class="banner-float-card" @click="goToLogin">
        <image
          src="https://tea-uniapp.oss-cn-shenzhen.aliyuncs.com/static/logo/logo.png"
          class="banner-img"
          mode="aspectFill"
        />
        <view class="banner-text">
          <text class="banner-title">Hi 欢迎来到喵茶记</text>
          <text class="banner-sub">新品上市，会员专享福利</text>
          <view class="login-hint" v-if="!isLoggedIn">
            <text class="login-text">点击登录享受会员福利</text>
            <text class="login-arrow">></text>
          </view>
        </view>
      </view>

      <!-- 新增功能栏 -->
      <view class="home-feature-bar">
        <view class="feature-btn start-order" @click="goToOrder">
          <image src="/static/button/2.png" class="feature-icon" mode="aspectFit" />
          <text>开始点单</text>
        </view>
        <view class="feature-btn delivery" @click="goToDelivery">
          <image src="/static/button/3.png" class="feature-icon" mode="aspectFit" />
          <text>外卖配送</text>
        </view>
      </view>

      <view class="home-card">
        <view class="section-title">
          <text class="hot-text">热销</text>
          <text>趋势榜</text>
          <image src="$oss + 'icon/flame.png'" class="flame-icon" mode="aspectFit"></image>
        </view>
        <scroll-view scroll-x class="hot-scroll-list">
          <view
            v-for="item in recommend"
            :key="item.id"
            class="hot-card"
          >
            <image :src="item.img || item.image_url || ($oss + 'logo.png')" class="hot-img" mode="aspectFill" @click="goToProduct(item)" />
            <view class="hot-info">
              <text class="hot-name">{{ item.name }}</text>
              <text class="hot-price">￥{{ item.price }} 起</text>
            </view>
            <view class="hot-plus-btn" @click="goToChoose(item)">+</view>
          </view>
        </scroll-view>
      </view>

      <!-- 优惠海报轮播 -->
      <view class="home-card" style="padding:0;overflow:hidden;margin-bottom:32rpx;position:relative;">
        <swiper
          class="promo-swiper"
          :indicator-dots="false"
          autoplay
          circular
          :interval="3000"
          :duration="500"
          @change="handleSwiperChange('promo', $event)"
        >
          <swiper-item v-for="(img, idx) in promoImages" :key="'promo-' + idx">
            <image :src="img" class="promo-img" mode="aspectFill" />
          </swiper-item>
        </swiper>

        <!-- 平滑移动指示器（优惠轮播） -->
        <view class="promo-indicator">
          <view class="indicator-track">
            <view
              class="slider"
              :style="{ transform: 'translateX(' + (currentSwiper.promo * 100) + '%)' }"
            ></view>
            <view
              class="bar"
              v-for="(item, index) in promoImages"
              :key="'promo-bar-' + index"
            ></view>
          </view>
        </view>
      </view>

      <view class="home-card">
        <text class="section-title">会员福利</text>
        <view class="benefit-list">
          <view class="benefit-item" v-for="b in benefits" :key="b.title" @click="b.title==='积分兑好礼' && goToPoints()">
            <image :src="b.icon" class="benefit-icon" mode="aspectFit" />
            <text class="benefit-title">{{ b.title }}</text>
            <text class="benefit-desc">{{ b.desc }}</text>
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
      currentSwiper: { main: 0, promo: 0 },
      isLoggedIn: false,
      userInfo: null,
      swiperImgs: [
        this.$oss + 'post/1.png',
        this.$oss + 'post/2.png',
        this.$oss + 'post/3.png',
        this.$oss + 'post/4.png',
        this.$oss + 'post/5.png'
      ],
      promoImages: [
        this.$oss + 'epost/1.png',
        this.$oss + 'epost/2.png',
        this.$oss + 'epost/3.png',
        this.$oss + 'epost/4.png',
        this.$oss + 'epost/5.png'
      ],
      recommend: [], // 热销榜数据，初始为空
      benefits: [
        { title: '会员专享价', desc: '部分饮品享专属优惠', icon: this.$oss + 'basic/1.png' },
        { title: '积分兑好礼', desc: '下单得积分兑好礼', icon: this.$oss + 'basic/2.png' },
        { title: '生日礼遇', desc: '生日当月专属福利', icon: this.$oss + 'basic/3.png' }
      ]
    };
  },
  onShow() {
    this.checkLoginStatus();
    this.getHotProducts();
  },
  methods: {
    checkLoginStatus() {
      const userInfo = uni.getStorageSync('userInfo');
      const token = uni.getStorageSync('token');
      if (userInfo && token) {
        this.isLoggedIn = true;
        this.userInfo = userInfo;
      } else {
        this.isLoggedIn = false;
        this.userInfo = null;
      }
    },
    handleSwiperChange(type, e) {
      this.currentSwiper[type] = e.detail.current;
    },
    getHotProducts() {
      uni.request({
        url: 'http://localhost:3000/api/product/hot',
        method: 'GET',
        success: (res) => {
          if (res.statusCode === 200) {
            this.recommend = res.data;
          }
        },
        fail: (err) => {
          console.error('获取热销榜失败', err);
        }
      });
    },
    goToLogin() {
      uni.navigateTo({
        url: '/pkg_user/login/login'
      });
    },
    goToProduct(item) {
      // 跳转到首页并高亮对应商品
      uni.setStorageSync('scrollToProduct', item);
      uni.switchTab({ url: '/pages/index/index' });
    },
    goToOrder() {
      uni.setStorageSync('orderType', 'self');
      uni.switchTab({ url: '/pages/index/index' });
    },
    goToDelivery() {
      // 跳转到下单页面，并传递外卖标识
      uni.setStorageSync('orderType', 'delivery');
      uni.switchTab({ url: '/pages/index/index' });
    },
    goToChoose(item) {
      // 点击时请求接口查找完整商品信息（含desc/description），拿到后再跳转
      uni.request({
        url: 'http://localhost:3000/api/product',
        method: 'GET',
        success: (res) => {
          if (res.statusCode === 200) {
            const full = res.data.find(p => p.id === item.id);
            const itemWithDesc = {
              ...item,
              desc: (full && (full.desc || full.description)) || ''
            };
            uni.navigateTo({
              url: `/pkg_product/choose/choose?item=${encodeURIComponent(JSON.stringify(itemWithDesc))}`
            });
          } else {
            uni.navigateTo({
              url: `/pkg_product/choose/choose?item=${encodeURIComponent(JSON.stringify(item))}`
            });
          }
        },
        fail: () => {
          uni.navigateTo({
            url: `/pkg_product/choose/choose?item=${encodeURIComponent(JSON.stringify(item))}`
          });
        }
      });
    },
    goToPoints() {
      uni.navigateTo({ url: '/pkg_user/points/points' });
    }
  }
};
</script>

<style scoped>
/* 与之前完全一致，仅指示器部分替换 */
.modern-bg {
  min-height: 100vh;
  background: #fff;
  padding-bottom: 120rpx;
}
.swiper-wrapper { position: relative; }
.home-swiper { width: 100vw; height: 100vw; }
.swiper-img { width: 100%; height: 100%; object-fit: cover; }

/* 平滑移动指示器通用样式 */
.custom-indicator,
.promo-indicator {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 26rpx;
  display: flex;
  justify-content: center;
  z-index: 10;
}
.promo-indicator { bottom: 16rpx; }

.indicator-track {
  display: flex;
  width: 60%;
  height: 6rpx;
  background: rgba(255,255,255,.4);
  border-radius: 3rpx;
  overflow: hidden;
  position: relative;
}
.bar {
  flex: 1;
  height: 100%;
}
.slider {
  position: absolute;
  top: 0;
  left: 0;
  width: 20%;           /* 每个滑块占 1/图片数量 */
  height: 100%;
  background: #ffb300;
  border-radius: 3rpx;
  transition: transform .3s;
}

/* 浮层卡片 */
.banner-float-card {
  margin: -90rpx 0rpx 18rpx;  /* 重点：-120rpx 把卡片往轮播图底部贴 */
  height: 160rpx;
  background: #fff;
  border: 1px solid #f3e6c1;
  border-radius: 24rpx;
  padding: 0 12rpx;
  display: flex;
  align-items: center;
  z-index: 10;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, .08);
  position: relative;
}
.banner-img { width: 120rpx; height: 120rpx; border-radius: 20rpx; box-shadow: 0 4rpx 16rpx #e0ffd6; flex-shrink: 0; }
.banner-text { margin-left: 24rpx; display: flex; flex-direction: column; justify-content: center; }
.banner-title { font-size: 36rpx; font-weight: bold; color: #ffb300; margin-bottom: 6rpx; }
.banner-sub { font-size: 26rpx; color: #666; }

.login-hint {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16rpx;
  padding: 12rpx 20rpx;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 20rpx;
}

.login-text {
  font-size: 24rpx;
  color: #667eea;
}

.login-arrow {
  font-size: 24rpx;
  color: #667eea;
}

.home-section { margin-top: 100rpx; padding: 0 30rpx;  }
.home-card { background: #fff; border-radius: 24rpx; box-shadow: 0 4rpx 24rpx #f3e6c1; margin-bottom: 32rpx; padding: 32rpx 24rpx; }
.section-title { font-size: 32rpx; font-weight: bold; color: #333; margin-bottom: 18rpx; display: flex; align-items: center; }
.hot-text {
  background: linear-gradient(135deg, #ff8a00, #ff5252);
  -webkit-background-clip: text;
  color: transparent;
  position: relative;
  display: inline-block;
  margin-right: 8rpx;
}
.hot-text::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -4rpx;
  width: 100%;
  height: 6rpx;
  background: linear-gradient(135deg, #ff8a00, #ff5252);
  border-radius: 3rpx;
  opacity: 0.6;
  animation: wave 1.5s ease-in-out infinite;
}
.flame-icon {
  width: 28rpx;
  height: 28rpx;
  margin-left: 8rpx;
}
@keyframes wave {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4rpx); }
}
.recommend-list { display: flex; flex-direction: row; overflow-x: auto; white-space: nowrap; }
.recommend-item { display: inline-flex; flex-direction: column; align-items: center; margin-right: 32rpx; }
.recommend-img { width: 120rpx; height: 120rpx; border-radius: 16rpx; background: #f5f5f5; margin-bottom: 8rpx; }
.recommend-name { font-size: 26rpx; color: #333; }
.benefit-list { display: flex; flex-direction: row; justify-content: space-between; margin-top: 18rpx; }
.benefit-item { display: flex; flex-direction: column; align-items: center; width: 32%; }
.benefit-icon { width: 60rpx; height: 60rpx; margin-bottom: 8rpx; }
.benefit-title { font-size: 26rpx; color: #ffb300; font-weight: bold; }
.benefit-desc { font-size: 22rpx; color: #888; text-align: center; }

/* 优惠海报轮播 */
.promo-swiper { width: 100%; height: 280rpx; position: relative; }
.promo-img { width: 100%; height: 100%; display: block; }

.hot-scroll-list {
  display: flex;
  flex-direction: row;
  overflow-x: auto;
  white-space: nowrap;
  padding-bottom: 10rpx;
}
.hot-card {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  width: 220rpx;
  background: #fff;
  border-radius: 18rpx;
  margin-right: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.06);
  padding: 20rpx 16rpx 16rpx 16rpx;
  position: relative;
  vertical-align: top;
}
.hot-img {
  width: 180rpx;
  height: 180rpx;
  border-radius: 12rpx;
  object-fit: cover;
}
.hot-info {
  width: 100%;
  text-align: left;
  margin-top: 12rpx;
}
.hot-name {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  display: block;
}
.hot-price {
  font-size: 24rpx;
  color: #fa5252;
  margin-top: 4rpx;
  display: block;
}
.hot-plus-btn {
  position: absolute;
  right: 18rpx;
  bottom: 18rpx;
  width: 48rpx;
  height: 48rpx;
  background: #ffb300;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  font-weight: bold;
  box-shadow: 0 2rpx 8rpx rgba(255,179,0,0.12);
  z-index: 2;
  cursor: pointer;
}
.home-feature-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border-radius: 18rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
  margin: 24rpx 0 24rpx 0;
  padding: 24rpx 32rpx;
}
.feature-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
  cursor: pointer;
}
.feature-btn + .feature-btn {
  margin-left: 32rpx;
}
.feature-icon {
  width: 64rpx;
  height: 64rpx;
  margin-bottom: 8rpx;
}
.start-order {
  background: #fffbe6;
  border-radius: 12rpx;
  padding: 12rpx 0;
}
.delivery {
  background: #e6f7ff;
  border-radius: 12rpx;
  padding: 12rpx 0;
}
</style>