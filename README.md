# 🎵 Arc-music

> 现版本为使用GDstudio的api版，如需使用本地音乐版请访问https://github.com/armjukl/arc-music/tree/local
> 可自行部署bilibili音源后端（Music API Hub）
> 目前GDstudio限制同一ip每5分钟50次请求

* 体验网站（部署在vercel）：https://music-player-rosy-nine.vercel.app/

  
一个基于 Next.js 的网页音乐播放器，支持 GDStudio、Bilibili Music API Hub 与 Bilibili 视频解析音源，适配桌面端和移动端。
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
- 🌗 **日夜主题** - 支持日间/夜间/跟随系统三种主题模式
- 🎨 **封面毛玻璃背景** - 播放时可将歌曲封面作为模糊背景，面板变为透明毛玻璃效果
- 🎶 **多功能播放** - 支持播放、暂停、上一曲、下一曲、进度控制、列表播放、随机播放和歌曲搜索
- ❤️ **收藏与历史** - 收藏列表和播放历史保存在浏览器本地，可重新解析后播放
- 📜 **歌单** - 支持网易云歌单与 Bilibili 收藏夹；内置默认歌单，播放时保留当前歌曲不中断
- 📝 **歌词显示** - 支持原文、翻译歌词、时间戳和自动滚动
- ⏱️ **进度条拖动** - 支持鼠标和触摸拖动跳转，拖动时可预览对应歌词，也可拖到播放按钮取消跳转
- ⚙️ **性能模式** - 可在右上角设置中切换低性能模式，减少动画与平滑滚动
- 📺 **Bilibili 音源** - 支持 Music API Hub 音频源与 Bilibili 视频解析（yuafeng）源

## 🚀 快速开始

可以 Fork 本仓库后部署到 Vercel。其他平台也可以部署，但需要支持 Next.js 服务端接口与对 Music API Hub 的出站请求。

### 环境要求

- Node.js 18.17 或更高版本
- npm
- 推荐使用 Chrome、Edge、Safari 等较新的浏览器

### 本地运行

1. **克隆项目**

```bash
git clone https://github.com/armjukl/arc-music.git
cd arc-music
```

2. **安装依赖并启动开发环境**

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。

3. **构建并以生产模式运行（可选）**

```bash
npm run build
npm start
```

生产模式默认同样监听 `http://localhost:3000`，可在前方配置反向代理或 CDN。

### 自定义背景

将图片放到 `public/bg/` 目录，然后修改 `components/MusicPlayer.tsx` 中的背景地址。例如：

```tsx
backgroundImage: "url('/bg/your-image.jpg')"
```



## 🎮 使用方法

### 播放器

- **左随机按钮**：随机选择歌曲播放
- **右随机按钮**：切换单曲循环或随机播放或列表播放


### 播放列表

1. 点击任意歌曲开始播放
2. 使用搜索框快速查找歌曲
3. 在搜索栏中选择音源（网易云/酷我/JOOX/Bilibili）、接口和音质
4. 点击歌曲右侧心形图标收藏；播放器中的红色实心心形表示当前歌曲已收藏

### 歌单

1. 点击搜索栏中的「歌单」按钮进入歌单列表
2. 网格中的「添加歌单」大方块可粘贴网易云歌单链接/ID 或 Bilibili 收藏夹链接/media_id，确认后添加
3. 点击歌单卡片即可将歌曲加载到列表（不会自动播放、不中断当前播放）；Bilibili 收藏夹支持「加载更多」分页
4. 内置默认歌单：云音乐热歌榜、自定义歌单、Bilibili 收藏夹「爱」

### 主题与封面背景

点击 `Arc-music` 标题右侧的齿轮按钮：

1. **主题模式**：日间 / 夜间 / 跟随系统
2. **封面毛玻璃背景**：开启后播放时用当前封面作为模糊背景，面板透明
3. **性能模式**：正常 / 低性能

这些设置只保存在当前浏览器中，不会影响其他设备。

### 进度条操作

1. 按住播放器进度条并左右拖动，可预览目标时间对应的歌词。
2. 在目标位置松开即可跳转播放进度。
3. 拖动过程中将指针或手指移到播放按钮上，按钮会变为红色 `X`；此时松开会取消本次跳转，保留原播放位置。


## 📝 功能状态

- [x] 增加GDstudio api获取歌曲
- [x] Bilibili Music API Hub 搜索与播放
- [x] Bilibili 视频解析（yuafeng）搜索与播放
- [x] 收藏功能
- [x] 播放历史
- [x] 歌单（网易云歌单 / Bilibili 收藏夹 / 自定义）
- [x] 夜间模式（日间/夜间/跟随系统）
- [x] 封面毛玻璃背景
- [ ] 莫奈取色

## 📁 主要项目结构

```
arc-music/
├── api/                    # 音乐 API 适配器（gdstudio / bilibili / yuafeng）
├── components/
│   ├── player/             # 播放器子组件
│   └── MusicPlayer.tsx     # 主播放器
├── data/
│   ├── playlists/          # 默认歌单（netease-hot / custom / bilibili-favorites）
│   └── localTracks.ts      # 本地曲目配置
├── pages/
│   ├── api/music-hub/      # Bilibili Hub 同源代理
│   ├── api/bilibili/       # 官方收藏夹与视频解析路由
│   ├── index.tsx           # 首页
│   └── _app.tsx            # 应用入口
├── public/
│   └── bg/                 # 背景图片
├── styles/                 # 全局样式
├── .env.example            # 环境变量示例
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

### v0.4.0
- **歌单**：新增歌单列表，支持网易云歌单（链接/ID）与 Bilibili 收藏夹（media_id/链接），以及内置自定义歌单；大方块网格排布、封面懒加载；播放时打开歌单不中断当前歌曲。
- **Bilibili 视频解析**：新增独立音源（yuafeng），搜索与播放 Bilibili 视频；收藏夹歌单分页加载「加载更多」；通过隐藏 `<video>` 元素播放 MP4。
- **API 重新分类**：按音源（网易云/酷我/JOOX/Bilibili）分类，接口下拉随音源联动（GDStudio / Music API Hub / Bilibili 视频解析）。
- **夜间模式**：主题模式支持日间 / 夜间 / 跟随系统，持久化到本地。
- **封面毛玻璃背景**：播放时用当前封面作为模糊背景，面板透明；日夜模式下背景一致。
- **其他**：Inter 字体、设置面板新增封面背景开关。

### v0.3.3
- **Bilibili 服务配置**：移除代码中的服务地址，改用服务端环境变量 `MUSIC_API_HUB_BASE_URL`。
- **性能模式**：标题栏右侧新增设置按钮，可关闭非必要动画与歌词平滑滚动。
- **收藏图标**：播放器中的已收藏歌曲显示为红色实心心形。

### v0.3.2
- **iOS 12 歌词兼容**：歌词解析不再使用 iOS 12 Safari 缺失的 `String.matchAll()`，改为正则 `exec()` 循环，避免歌词加载时触发客户端错误。

### v0.3.1
- **背景溢出不滚动**：修复背景图缩放导致页面出现水平滚动条的问题，添加 `overflow-hidden` 防止溢出。

### v0.3.0
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

## 📺 配置 Bilibili Music API Hub

Bilibili 音源由 Next.js 同源代理 `/api/music-hub` 转发到 Music API Hub。浏览器不会直接读取或暴露 Hub 地址；播放时优先使用 Hub 返回的缓存 MP3 `download_url`。

服务地址必须通过服务端环境变量 `MUSIC_API_HUB_BASE_URL` 配置。不要使用 `NEXT_PUBLIC_` 前缀，也不要将真实地址提交到 Git。

### 本地配置

1. 在项目根目录复制环境变量示例文件。

```powershell
Copy-Item .env.example .env.local
```

2. 打开 `.env.local`，将值替换为你的 Music API Hub 基础地址。地址必须包含 `http://` 或 `https://` 及端口。

```env
MUSIC_API_HUB_BASE_URL=http://your-music-api-hub.example:8787
```

3. 重新启动开发服务器。

```bash
npm run dev
```

4. 打开播放器，在搜索栏中选择 `Bilibili（Music API Hub）` 与 `Bilibili` 音源后搜索歌曲。

### Vercel 生产环境配置

1. 进入 Vercel 中的项目，打开 **Settings** → **Environment Variables**。
2. 点击 **Add New**，变量名填写 `MUSIC_API_HUB_BASE_URL`。
3. 在 **Value** 填入你的 Music API Hub 基础地址，例如 `http://your-music-api-hub.example:8787`。
4. 在 **Environments** 至少勾选 **Production**；需要在预览部署中测试 Bilibili 时，同时勾选 **Preview**。
5. 点击 **Save** 后，在 **Deployments** 页面选择最新部署并点击 **Redeploy**。环境变量只会在新的部署中生效。
6. 部署完成后打开网站，选择 Bilibili 音源搜索并播放一首歌曲进行验证。

未设置变量、变量地址格式错误或上游服务不可访问时，Bilibili 请求会失败；请先检查 Vercel 环境变量是否已保存并完成重新部署。

### 更新已有部署

本地或自托管服务更新代码后，按以下步骤执行：

```bash
git pull origin main
npm install
npm run build
npm start
```

如果此前没有配置 Bilibili，请先按“本地配置”创建 `.env.local`。Vercel 项目只需推送代码、配置环境变量并重新部署，无需修改 `api/bilibili.ts` 或代理接口中的任何地址。
