const app = getApp();

Page({

  data: {
    pageState: 'loading',
  },

  onLoad(options) {
    this.init();
  },

  init() {
    if (!app.judgeNetworkConnection()) {
      this.setData({
        pageState: 'nonet',
      })
      return;
    }
    // 请求数据
  },

  onRetry() {
    this.setData({ pageState: 'loading' }, () => {
      this.init();
    });
  },

})