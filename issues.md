# 改进清单

> 来自代码审查，共 64 个问题，按优先级和类别分组。

---

## 🚨 高优先级

### 1. 组件架构

- [x] **MusicPlayer.tsx 拆分** — 已拆出 LibraryPanel、DesktopPlayer、MobilePlayer、TrackInfoModal、SearchBar、TrackList（桌面/移动端播放器按需求保持现状，不再细拆）
- [ ] **桌面/移动端 UI 重复** — 按需求保留现状，不拆
- [x] **条件类名管理** — 所有条件类名已改用 `clsx`

### 2. 依赖问题

- [x] **`@types/react: ^19` 与 React 18 不匹配** — 已改为 `"@types/react": "^18"` 和 `"@types/react-dom": "^18"`
- [x] **`@tailwindcss/postcss: ^4` 与 `tailwindcss: ^3` 冲突** — 已删除此依赖
- [x] **依赖重复** — `howler` 仅保留在 `dependencies`，`@types/howler` 仅保留在 `devDependencies`
- [x] **`lucide-react` 版本较旧** — 已升级到 ^0.525.0
- [x] **`cssnano` 未启用** — 已删除（Next.js 生产构建自带 CSS 压缩，无需 cssnano）
- [x] **`package.json` 中存在空行** — 已清理

### 3. 代码质量

- [ ] **随机选曲逻辑重复 4 次** — 在桌面端随机按钮、移动端随机按钮、`playNext` shuffle 模式、`playPrevious` shuffle 模式中重复，应抽取为 `getRandomIndex` 工具函数
- [ ] **搜索重置逻辑重复 3 次** — 在 `handleSearch`、`handleApiChange`、`handleSourceChange` 中重复，应抽取为 `resetSearchState`
- [ ] **格式化函数在组件内部定义** — `formatTime`、`formatFileSizeLabel`、`formatBitrateLabel` 是纯函数，应移到组件外部或独立的 `utils/format.ts`
- [ ] **播放随机模式切换提示不对** — 当前切换 `single → order → shuffle`，但 README 写着"右随机按钮：切换单曲循环或随机播放或列表播放"，实际只有三个状态，需要确认逻辑是否准确

### 4. 类型定义

- [x] **`LocalTrack.bitrate` 与 `BITRATE_OPTIONS` 类型重复** — `BITRATE_OPTIONS` 统一定义在 `data/localTracks.ts`，`BitrateOption` 由 `(typeof BITRATE_OPTIONS)[number]` 派生，各处引用同一来源
- [x] **`PlaybackMode` 定义在组件函数内部** — 已移到 `components/player/types.ts`
- [x] **`LyricLine` 和 `CombinedLyricLine` 闭包在组件中** — 已移到 `components/player/types.ts`

---

## ⚡ 中优先级

### 5. 死代码清理

- [x] **删除 `data/localTracksold.ts`** — 已删除（验证全项目无引用）
- [x] **`pages/api/music.ts` 没有实际用途** — 已删除（无任何代码请求 `/api/music`；若日后做 BFF 限流可重建）
- [x] **删除注释掉的代码** — 已删除组件内被注释掉的 `useEffect`

### 6. 状态管理

- [ ] **`coverUrl` 无需独立 state** — 完全可从 `currentSong` 派生，应改用 `useMemo`
- [ ] **搜索分页 4 个 state 应归组** — `searchPage`、`searchPageInput`、`searchHasMore`、`lastSearchKeyword` 应合并为一个对象或使用 `useReducer`
- [ ] **弹窗 4 个 state 应归组** — `infoModalVisible`、`infoModalTrack`、`infoModalLoading`、`infoModalError` 应合并
- [ ] **`updateTrackInStates` 同时更新 3 个 state** — `setLocalTracks`、`setAllTracks`、`setMusicList`，建议用 `useReducer` 统一管理
- [ ] **`useEffect` 依赖链复杂** — 比特率切换的 effect 依赖 6 个值且内部调用 `playSong`，容易导致死循环或意外重播

### 7. API 层

- [ ] **客户端限流失效** — `gdstudio.ts` 的速率限制在客户端实现，用户可轻易绕过，应移至服务端（`pages/api/music.ts` 作为 BFF 代理）
- [ ] **`request` 函数没有超时处理** — fetch 应设置 `AbortSignal` 超时，防止请求挂起
- [ ] **`MusicApiId` 是单例联合类型** — `type MusicApiId = 'gdstudio'`，日后新增 API 需手动修改，应改为注册表模式
- [ ] **`ApiSearchItem.source` 是 `string` 而非 `MusicSource`** — 类型不协调
- [ ] **API URL 硬编码** — GDStudio API 地址直接写在 `gdstudio.ts` 中，应通过环境变量管理

### 8. 样式与 UI

- [ ] **背景图路径硬编码** — `url('bg/5.jpg')` 写在 JSX 中，应作为配置项
- [ ] **自定义滚动条只支持 WebKit** — 缺少 `scrollbar-width: thin` 等 Firefox 兼容属性
- [ ] **`animate-pulse` 过多** — 多个动画同时运行可能消耗 CPU
- [ ] **`tailwind.config.js` 没有自定义主题** — 大量硬编码颜色值应抽取到配置中
- [ ] **响应式设计断点拼接混乱** — `hidden md:flex` / `md:hidden` 组合随组件复杂化难以维护

---

## 🧩 低优先级 / 渐进式改进

### 9. 性能

- [ ] **列表全量渲染** — `musicList.map` 每次 state 变化都重新计算，大列表时应加虚拟滚动（`react-window` 或 `@tanstack/react-virtual`）
- [ ] **封面图片无优化** — 使用原生 `<img>` 而非 Next.js `<Image>`，无 `loading="lazy"`
- [ ] **进度条更新频率过高** — 每 500ms `setState` 两次，可改用 ref + `requestAnimationFrame`
- [ ] **未使用动态导入** — `pages/index.tsx` 静态导入 1741 行组件，应使用 `next/dynamic`
- [ ] **`no-store` 缓存策略浪费** — 同一会话中每次请求都发起网络调用，应加简单内存缓存
- [ ] **部分 `useMemo` 过度使用** — 小数据量的 `parseLyricLines` 用 `useMemo` 开销可能大于收益

### 10. 工具函数抽取

- [ ] **`parseLyricLines` 应在独立的 `utils/lyric.ts`** — 纯函数，组件无关
- [ ] **`findTranslationForTime` 同上** — 纯函数
- [ ] **`sanitizeUrl` 同上** — 纯函数
- [ ] **常量分散各处** — `DEFAULT_SEARCH_COUNT`、`DEFAULT_COVER_SIZE`、`AVAILABLE_SOURCES` 等应放到 `constants/` 目录

### 11. 错误处理

- [ ] **异常处理不统一** — 有些地方 `try/catch` 设错误消息，有些 `catch {}` 静默忽略，应统一策略
- [ ] **`void` 操作符滥用** — 大量 `void playSong()`、`void handleSearch()`，应内部处理错误或 `.catch()`
- [ ] **`isNaN` 应改为 `Number.isNaN`** — 全局 `isNaN` 有隐式类型转换问题

### 12. 架构与配置

- [ ] **没有测试文件** — 整个项目无任何 `.test.ts` 或 `.spec.ts`
- [ ] **没有环境变量管理** — 无 `.env.local` 或 `.env.example`
- [ ] **`next.config.js` 过于简单** — 只有 `reactStrictMode: true`，缺少 `images.domains` 等配置
- [ ] **README 项目结构与实际不符** — 缺少 `api/`、`data/`、`styles/` 目录描述
- [ ] **`buildResourceUrl` 命名不当** — 实际上获取的是 URL 而非构建，应改为 `getResourceUrl`
- [ ] **`useRequestIdRef` 模式重复 3 次** — 应统一用 `AbortController` 替代

### 13. 功能缺失（来自 README 开发计划）

- [ ] **暗色模式** — 已在开发计划中，代码中无任何 `dark:` 类名
- [ ] **收藏功能**
- [ ] **播放历史**
- [ ] **莫奈取色**
- [ ] **bilibili 解析**

---

## 📊 数据统计

| 类别 | 问题数 |
|------|--------|
| 组件架构 | 3 |
| 依赖问题 | 6 |
| 代码质量 | 4 |
| 类型定义 | 3 |
| 死代码清理 | 3 |
| 状态管理 | 6 |
| API 层 | 5 |
| 样式与 UI | 5 |
| 性能 | 6 |
| 工具函数抽取 | 4 |
| 错误处理 | 3 |
| 架构与配置 | 6 |
| 功能缺失 | 5 |
| **总计** | **59** |
