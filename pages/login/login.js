// 获取小程序全局实例（可调用全局数据/方法）
const app = getApp();

Page({
  // 页面数据（响应式，修改后自动更新界面）
  data: {
    userInfo: null,        // 存储用户信息（头像、昵称）
    isAgreePrivacy: false, // 是否同意隐私政策（默认未勾选）
    showAuthTip: false     // 是否显示授权提示（默认隐藏）
  },

  // 页面加载时执行（只执行一次）
  onLoad() {
    console.log("登录页已加载");
    // 加载时检查本地是否有已保存的用户信息，有则直接显示
    const localUserInfo = wx.getStorageSync("userInfo");
    if (localUserInfo) {
      this.setData({ userInfo: localUserInfo });
    }
  },

  // 勾选/取消隐私政策（checkbox状态变化时触发）
handleAgreeChange(e) {
  const isChecked = e.detail.value.length > 0;
  this.setData({ isAgreePrivacy: isChecked });
  console.log("当前隐私协议勾选状态：", this.data.isAgreePrivacy); // 自动打印
},


  handleGetUserInfo(e) {
const localUserInfo = wx.getStorageSync("userInfo");
  if (localUserInfo) {
    // 已有自定义信息，直接用，不处理微信授权的原生信息
    this.setData({ 
      userInfo: localUserInfo,
      showAuthTip: false  
    });
    app.globalData.userInfo = localUserInfo;
    return;
  }

  // 本地无自定义信息（首次登录），才用微信授权的原生信息
  if (!e.detail.userInfo) {
    this.setData({ showAuthTip: true });
    return;
  }
  const newUserInfo = e.detail.userInfo;

  const isDefaultAvatar = newUserInfo.avatarUrl && (
    newUserInfo.avatarUrl.includes('mmopen/vi_32/') || 
    newUserInfo.avatarUrl.includes('mmopen/vi_40/')
  );
  // 若是默认头像，替换为猫咪.png
  if (isDefaultAvatar) {
    newUserInfo.avatarUrl = '/images/猫咪.png';
  }

  this.setData({ 
    userInfo: newUserInfo,
    showAuthTip: false  
  });
  wx.setStorageSync("userInfo", newUserInfo); // 首次登录存微信原生信息
  app.globalData.userInfo = newUserInfo;      
  },


  handleWechatLogin() {
     console.log("登录按钮被点击了");
    const { isAgreePrivacy, userInfo } = this.data;
    const localUserInfo = wx.getStorageSync("userInfo");

    if (!isAgreePrivacy) {
      wx.showToast({
        title: "请先阅读并同意隐私政策",
        icon: "none",  
        duration: 1500 
      });
      return;
    }


    if (!userInfo) {
      this.setData({ showAuthTip: true });
      return;
    }


    wx.showLoading({ title: "登录中..." });


    wx.login({
      success: (loginRes) => {
        const code = loginRes.code;
        if (!code) {
          wx.hideLoading(); 
          wx.showToast({ title: "登录失败，无法获取凭证", icon: "none" });
          return;
        }


        this.mockLoginRequest(code, userInfo)
          .then((token) => {
           
            wx.setStorageSync("token", token);
            app.globalData.token = token;     
            app.globalData.userInfo = localUserInfo;

 
            wx.hideLoading();
            wx.showToast({ title: "登录成功！" });


            setTimeout(() => {
              wx.switchTab({ url: "/pages/index/index", fail: (err) => {
      console.error("跳转失败：", err); 
    } });
             
            }, 1500); 
          })
          .catch((err) => {

            wx.hideLoading();
            wx.showToast({ title: err.message || "登录失败，请重试", icon: "none" });
          });
      },
      fail: () => {
  
        wx.hideLoading();
        wx.showToast({ title: "登录失败，网络异常", icon: "none" });
      }
    });
  },

 
  mockLoginRequest(code, userInfo) {
    return new Promise((resolve, reject) => {

      setTimeout(() => {

        const mockToken = `wx_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        resolve(mockToken);

      }, 1000);
    });
  }
});