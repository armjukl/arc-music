# 🎵 Arc-music

> 现版本为使用GDstudio的api版，如需使用本地音乐版请访问https://github.com/armjukl/arc-music/tree/local
> 目前GDstudio限制同一ip每5分钟50次请求

* 体验网站（部署在vercel）：https://music-player-rosy-nine.vercel.app/

  
一个基于Nextjs的网页音乐播放器，接入GDstudio的api，提供流畅的音乐播放体验。
* pc端:
  ![YqHqIrs5waWqgVeuq0ztcvIiM1BbPaxO](https://cdn.nodeimage.com/i/YqHqIrs5waWqgVeuq0ztcvIiM1BbPaxO.jpg)
  ![V2cmsDHniNr68yW8IUCFiaf7H0DaNyA6](https://cdn.nodeimage.com/i/V2cmsDHniNr68yW8IUCFiaf7H0DaNyA6.jpg)
  
*移动端

|可收缩|可展开|
|---|---|
|![kmCCQ9e12v9vfGYu3Obyx5GzkamcreKY](https://cdn.nodeimage.com/i/kmCCQ9e12v9vfGYu3Obyx5GzkamcreKY.jpg)|![JF6V9FDsM3k54iCSanfKYHYuNkvoYZvY](https://cdn.nodeimage.com/i/JF6V9FDsM3k54iCSanfKYHYuNkvoYZvY.jpg)|



## ✨ 特性
- 🤓 **开箱即用** - 使用浏览器就能听歌
- 🎨 **现代化设计** - 简洁美观的玻璃态设计风格，适配pc和手机设备
- 🎶 **多功能播放** - 支持播放、暂停、上一曲、下一曲、进度控制、歌曲分享（直链）、列表播放、随机播放、歌曲搜索
## 🚀 快速开始

### 1.可以fork本仓库，直接部署到vercel(已测试)，cloudflare，railway等平台未测试，可能请求存在限制
### 2.在服务器上部署
#### 环境要求

- chrome或edge等内核较新的浏览器（webview版本较低及旧版Safari可能存在错）

#### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/armjukl/arc-music.git
cd arc-music
```
2. **自定义配置**

 * 将音乐文件放入 `public/music/` 目录

* 更改背景图
在public/bg/目录下上传图片，在components/MusicPlayer.tsx中441行中修改图片地址，示例
```
 backgroundImage: "url('/bg/3.jpeg')"
```
* 更改首页歌单（待更新）

3. **修改好启动后**
```bash
# 安装npm和nodejs后
npm install
npm run build
npm start
```

3. **访问应用**
* 打开浏览器访问 `http://localhost:3000` 可配置反向代理或cdn



## 🎮 使用方法

### 播放器

- **左随机按钮**：随机选择歌曲播放
- **右随机按钮**：切换单曲循环或随机播放或列表播放


### 播放列表

1. 点击任意歌曲开始播放
2. 使用搜索框快速查找歌曲 


## 📝 开发计划

- [x] 增加GDstudio api获取歌曲
- [ ] bilibili解析
- [ ] 收藏功能
- [ ] 播放历史
- [ ] 夜间模式
- [ ] 莫奈取色

## 📁 主要项目结构

```
arc-music/             
├── components/
│   └── MusicPlayer.tsx    # 主页面
├── pages/
│   ├── index.tsx          # 提供默认跳转
│   ├
│   │   
│   └── _app.tsx     
├── public/
│   ├── bg/            # 背景图片
│   └── music/         # 示例音乐文件
└── README.md
```

## 🐛 问题反馈

如果您遇到任何问题，请通过以下方式反馈：

1. 查看 [Issues](https://github.com/armjukl/arc-music/issues) 页面
2. 创建新的 Issue，描述详细的问题和复现步骤
3.联系qq

## 🙏 致谢

- 感谢所有贡献者
- 感谢GDstudio提供的音乐支持
- 感谢cto.new提供gpt5支持
- 感谢各大音乐网站提供的音乐下载

---

**享受音乐！** 🎧

如果这个项目对您有帮助，请给个 ⭐️ 支持！

## 📝 更新日志

### v0.3.1
- **背景溢出不滚动**：修复背景图缩放导致页面出现水平滚动条的问题，添加 `overflow-hidden` 防止溢出。

### v0.3.0 (latest)
- **收藏列表**：本地保存最多 50 首收藏，采用与播放历史相同的安全元数据白名单；收藏可作为队列重新解析播放链接，并可长按左侧拖动柄排序。
- **播放历史**：可查看和清空最近 50 首成功解析的播放记录；重播时会按原 API、音源和音质重新解析临时播放数据。
- **进度条支持拖动**：鼠标与触摸均可拖动跳转；拖到播放按钮上时按钮变红并显示 `X` 图标，松手即取消跳转。
- **歌词合并显示**：原文与翻译同时呈现，按时间匹配，切换按钮文案调整为"显示/隐藏翻译"，有翻译时自动开启。
- **歌词行增加时间戳**：每行右侧显示对应时间。
- **修复 `fileSizeKb` 单位错误**：补上 `/1024` 转换。
- **滚动歌词优化**：拖动进度条时滚动行为改为 `auto`，避免与拖动手势冲突。
- **音乐 API 模块化**：适配器模式重构，支持多 API 源切换（GDStudio 等）。
- **播放器组件拆分**：将曲库、PC 播放器、移动端播放器、歌曲信息弹窗、类型和工具函数拆分为独立文件，保留原有 PC/移动端 UI 与交互。
- **客户端限流移除**：不再在浏览器端限制请求频率，统一由服务端处理限流。
- **播放历史**：在浏览器本地记录最近播放的歌曲，支持清空和单条删除；历史歌曲可作为播放列表连续播放，且不保存临时播放链接。
