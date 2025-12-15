const app = getApp();

Page({
  data: {
    userInfo: {},    // 当前用户信息
    newNickname: ""  // 新昵称
  },


  onLoad() {
    const userInfo = app.getUserInfo();
    this.setData({
      userInfo,
      newNickname: userInfo.nickName || "" // 初始化昵称输入框
    });
  },

  // 1. 从相册选择头像
  chooseAvatarFromAlbum() {
    this.chooseAvatar("album");
  },

  // 2. 拍摄照片作为头像
  chooseAvatarFromCamera() {
    this.chooseAvatar("camera");
  },


  chooseAvatar(sourceType) {
    wx.chooseImage({
      count: 1, 
      sizeType: ["compressed"], 
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];

        this.cropAvatar(tempFilePath);
      },
      fail: (err) => {

        if (err.errMsg.includes("deny")) {
          wx.showModal({
            title: "授权失败",
            content: "请在微信设置中允许小程序访问相册/相机",
            success: () => {
              wx.openSetting(); 
            }
          });
        }
      }
    });
  },

  cropAvatar(tempFilePath) {
    wx.cropImage({
      src: tempFilePath,
      crop: { width: 200, height: 200 }, 
      success: (cropRes) => {
        const croppedPath = cropRes.tempFilePath;

        this.saveAvatar(croppedPath);
      }
    });
  },


  saveAvatar(avatarUrl) {
    const newUserInfo = { ...this.data.userInfo, avatarUrl };

    app.globalData.userInfo = newUserInfo;

    wx.setStorageSync("userInfo", newUserInfo);

    this.setData({ userInfo: newUserInfo });

    wx.showToast({ title: "头像修改成功" });
  },


  previewAvatar() {
    const { avatarUrl } = this.data.userInfo;
    if (avatarUrl) {
      wx.previewImage({
        current: avatarUrl,
        urls: [avatarUrl]
      });
    }
  },


  onNicknameInput(e) {
    this.setData({ newNickname: e.detail.value.trim() });
  },


  saveNickname() {
    const { newNickname } = this.data;
    if (!newNickname) {
      wx.showToast({ title: "昵称不能为空", icon: "none" });
      return;
    }
    if (newNickname.length > 10) {
      wx.showToast({ title: "昵称长度不能超过10字", icon: "none" });
      return;
    }

    const newUserInfo = { ...this.data.userInfo, nickName: newNickname };
    app.globalData.userInfo = newUserInfo;
    wx.setStorageSync("userInfo", newUserInfo);
    this.setData({ userInfo: newUserInfo });
    wx.showToast({ title: "昵称修改成功" });
  }
});