# 发布清单（DSH 社区）

这个目录就是可直接推到 GitHub 公开仓库的内容。下面每一步做完再进下一步。

## 0. 发布前在本机验证

```sh
npm install          # 无运行时依赖，只为生成锁文件
npm run check        # 语法
npm run smoke        # 结构 / 组合声明 / 注册 / 正文可读 / 零外部依赖 / 伴随插件 六关
npm pack --dry-run   # 看包里到底装了什么
```

`scripts/smoke.mjs` 不起应用、不联网、不碰会话数据：桩 `ctx` 跑 `apply`，验证注册出 1 个技能 `premise-trace`、`get()` 能读出 `assets/premise-trace.md` 全文（长度与关键小节）、`cordis.patch.yml` 里的 id 与 name 等于包名、运行时只引 `node:` 内置模块。任一条失败退出码 1。

本包没有浏览器半边，也就没有 `lib/client.js`、不需要构建、没有 `check:client` 这一步。

## 0.5 检查打包内容

```sh
npm pack --dry-run
```

包里只应出现：`index.js`、`cordis.patch.yml`、`assets/`、`scripts/`、两个 README、`LICENSE`。`node_modules/`、`publish/`、`*.tgz` 都不该进包。

## 1. 建 GitHub 仓库

- 公开仓库与包名同名：`dsh-premise-trace`，安装命令写 `github:taoziliyouchong/dsh-premise-trace`。
- 仓库页 About 的 Description 填：`回望一件事怎么变成现在这样，说清它现在靠什么成立，判断它下一步会变成什么。`
- 推送本目录内容（`git init` 已做过，首次只需 `git push -u origin main`）。
- 给仓库加 topic：`dsh-plugin`（收录检查会看）。
- 仓库创建要满 1 天才能进目录（自动检查），当天建好、第二天再提 PR。

## 2. 填占位符

- `package.json` 的 `repository` / `homepage` / `bugs` 三处 URL（当前写的是 `taoziliyouchong`，换成就用的 GitHub 用户名）。
- `publish/registry-entry.yml` 的三处 URL 和 `name`。
- 若走 npm，先确认包名可用：`npm view dsh-premise-trace version`（404 表示未被占用）。

## 3. 发布到 npm（可选但推荐）

```sh
npm publish --access public
```

不发 npm 也能被收录：安装命令走 GitHub。发 npm 的好处是市场能做版本更新检查。

## 4. 提交目录收录

到 GitHub 仓库 `awesome-dsh-plugin/awesome-dsh-plugin` 开 PR，只加一个文件：

- 路径：`data/plugins/taoziliyouchong__dsh-premise-trace.yml`
- 内容：`publish/registry-entry.yml` 全文

分类填 `skill`。条目里没有 `icon` 字段——本包不含图片资源，不写这一行即可。

## 5. 之后的版本更新

1. 改 `package.json` 的 `version`（语义化版本）。
2. 改方法正文就动 `assets/premise-trace.md`，改注册动 `index.js`。
3. 提交、打 tag、推：`git tag v0.1.1 && git push && git push --tags`。
4. `npm publish`（如果走 npm）。
5. 目录条目本身不用改，市场按 npm 版本或 GitHub HEAD 检查更新。

## 收录要求对照

| 要求 | 本仓库状态 |
| --- | --- |
| `package.json` 声明 `dsh.bundle.patch` | 已声明，指向 `cordis.patch.yml` |
| 仓库有真实可用代码 | 有（技能注册与 120 行方法正文） |
| 仓库满 1 天 | 建库后次日再提 PR |
| 加 `dsh-plugin` topic | 建库时加 |
| 描述只说功能、不夸大 | `registry-entry.yml` 按实际能力写 |
| 分类贴合 | `skill` |

## 已知注意事项

- 与私有版 `zzuser-premise-trace` 的技能名不同（`premise-trace` vs `zzuser-premise-trace-workflow`），两个同时装不会撞名；但同一套方法装两份没有意义，留一份即可。
- 档位 600 与宿主内置 bundled 技能同档，技能目录里按名字排列，不抢位。
