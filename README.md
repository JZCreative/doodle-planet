# DOODLE PLANET · 涂鸦星球

### A Gift for the Unimagined — 献给尚未被想象的世界

**[进入宇宙 · Play online](https://jzcreative.github.io/doodle-planet/)**

## 中文介绍

当虚拟 3D 世界不断追求逼真的光影、材质与感官体验，我们想问：二维本身，何尝不是一种美？

DOODLE PLANET 是一个可以探索、旋转与涂色的手绘宇宙。奇异角色在星空中漂浮、翻滚，偶尔被陨石撞得打转。它们拥有三维的体积，却保留二维插画的黑色线条、平涂色块与留白，像从纸上走出来，又没有离开绘画。

这份礼物送给仍然愿意想象的人，也送给那些觉得自己“不会画画”的人。点击角色，镜头便带你靠近；你可以为眼睛、嘴巴和身体分别填色，也可以自由涂鸦、保存设计，将角色聚成一张宇宙合照，或制作专属头像。这里没有标准配色，也没有审美评分，只有探索与表达。

艺术家张赢的原创 2D 手稿是整个世界的起点。那些荒诞的身体、微妙的表情与不合常理的组合，来自艺术家的个人想象，而非 AI 的随机生成。手稿经 Tripo 转化为 3D 资产，再由 Blender 二次加工、调整造型与简化细节，最终进入交互系统。AI 协助转换维度，艺术家决定世界的性格。

项目采用 HTML、CSS、JavaScript 与 Three.js / WebGL，结合本地存档与 Canvas 图像导出，让绘画成为可以进入、参与并带走的礼物。

## English

As virtual 3D worlds pursue realistic light, materials and sensations, we ask: isn’t 2D beautiful in its own right?

DOODLE PLANET is a hand-drawn universe to explore and color. Strange characters drift and tumble through space, sometimes spun by passing meteors. They have volume, yet retain black outlines, flat colors and white space—as if stepping off the page without leaving the drawing.

This gift is for anyone willing to imagine, especially those who think they cannot draw. Click a character to move closer, color its eyes, mouth and body, or doodle freely. Save your designs, gather characters into a cosmic group portrait, or create a personal avatar. There are no correct palettes or aesthetic scores, only exploration and expression.

Artist Zhang Ying’s original 2D sketches are the foundation. Their absurd bodies, subtle expressions and unlikely combinations come from a personal imagination, not random AI generation. Tripo converts the drawings into 3D assets; Blender is then used to refine forms and simplify details before they enter the interactive experience. AI helps translate dimensions; the artist defines the world’s identity.

Built with HTML, CSS, JavaScript and Three.js / WebGL, with local saves and Canvas image export, the project turns drawing into a gift you can enter, shape and take away.

## 体验说明 · Playing

- 拖动环绕宇宙，点击角色进入涂鸦；支持中文 / English 切换。
- 当前为展览预览版本：19 / 19 个角色全部解锁。
- 设计记录保存在当前浏览器本地，不会上传服务器，也不会跨设备同步。清除浏览器数据会清除这些记录。
- 首次访问需加载 3D 模型，请稍候；建议使用支持 WebGL 的现代桌面浏览器。
- 本地版本与线上版本使用不同的网站存储空间，本地已有填色不会自动转移。

Drag to explore and click a character to paint. All 19 characters are unlocked in this preview. Designs are saved locally in your browser, not on a server. They do not sync between devices or between the local and online sites. Clearing browser data removes local saves. Initial model loading may take a moment; a modern desktop browser with WebGL is recommended.

## 本地运行 · Run locally

无需构建或安装依赖。请使用静态 HTTP 服务器，不要直接双击 HTML 文件。

```sh
python3 -m http.server 4173
```

Open <http://localhost:4173>. Three.js and the game assets are included locally.

## 发布与素材 · Deployment & credits

GitHub Pages serves the root of the `main` branch. `.nojekyll` keeps the site as plain static files. This repository contains the playable game, not recording footage or intermediate modeling files.

原创角色及插画：张赢 / Original characters and drawings: Zhang Ying. 3D workflow: Tripo → Blender → Three.js.

Third-party libraries and fonts retain their respective licenses. No additional license for the original artwork or game assets is granted by this README.
