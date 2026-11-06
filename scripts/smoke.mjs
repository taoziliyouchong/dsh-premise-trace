#!/usr/bin/env node
/**
 * 本机冒烟：不起应用、不联网、不碰任何会话数据。
 *
 * 六关：
 *   1. 包结构      —— files 声明的必需文件都在
 *   2. 组合声明    —— dsh.bundle.patch 指向的文件在，里面的 insert id 等于包名
 *   3. 注册        —— 桩 ctx 跑 apply：导出名等于包名，注册 1 个技能 provider、1 个技能
 *   4. 正文可读    —— provider.get() 能读出 assets 里的方法正文，长度与关键小节齐
 *   5. 零外部依赖  —— 运行时只引 node: 内置模块，不引宿主内部包
 *   6. 伴随插件    —— invariant.js 导出名与登记名符合约定
 *
 * 用法：node scripts/smoke.mjs   （任一条失败退出码 1）
 */

import { readFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const problems = []

const ok = (label, extra = '') => console.log('ok   ' + label + (extra ? '  ' + extra : ''))
const fail = (label, why) => {
  problems.push(label + ': ' + why)
  console.log('FAIL ' + label + '  ' + why)
}

/** 1. 包结构 */
const REQUIRED = [
  'index.js',
  'invariant.js',
  'cordis.patch.yml',
  'assets/premise-trace.md',
  'README.md',
  'README.en.md',
  'LICENSE',
  'scripts/smoke.mjs',
]
const missing = REQUIRED.filter((rel) => !existsSync(join(root, rel)))
if (missing.length > 0) fail('结构', '缺 ' + missing.join('、'))
else ok('结构', REQUIRED.length + ' 个必需文件齐全')

/** 2. 组合声明：dsh plugin add 靠这一条把包接进层栈 */
const patchRel = pkg.dsh && pkg.dsh.bundle && pkg.dsh.bundle.patch
if (!patchRel) fail('组合声明', 'package.json 没声明 dsh.bundle.patch')
else if (!existsSync(join(root, patchRel))) fail('组合声明', 'dsh.bundle.patch 指向的文件不存在：' + patchRel)
else {
  const patch = readFileSync(join(root, patchRel), 'utf8')
  if (!patch.includes('id: ' + pkg.name)) fail('组合声明', patchRel + ' 里没有 id: ' + pkg.name)
  else if (!patch.includes('name: ' + pkg.name)) fail('组合声明', patchRel + ' 里没有 name: ' + pkg.name)
  else ok('组合声明', 'dsh.bundle.patch → ' + patchRel + '（id 与 name 都是 ' + pkg.name + '）')
}
if (pkg.files && !pkg.files.includes('assets')) fail('组合声明', 'files 里没有 assets，装出来的包读不到方法正文')
if (pkg.exports && pkg.exports['./client']) fail('组合声明', '本包没有浏览器半边，exports 不该声明 ./client')

/** 3. 注册：桩 ctx 跑 apply */
const mod = await import(pathToFileURL(join(root, 'index.js')).href)
if (mod.name !== pkg.name) fail('注册', 'index.js 导出的 name 是 ' + mod.name + '，不等于包名 ' + pkg.name)
else ok('注册', 'name = ' + mod.name)
if (!Array.isArray(mod.inject) || !mod.inject.includes('skills')) fail('注册', 'inject 里没有 skills')

const providers = []
const ctx = {
  skills: {
    registerProvider(factory) {
      providers.push(factory())
    },
  },
}
try {
  mod.apply(ctx)
} catch (error) {
  fail('注册', 'apply 抛错：' + error.message)
}
if (providers.length !== 1) fail('注册', '应注册 1 个技能 provider，实际 ' + providers.length)
else {
  const listed = await providers[0].list()
  if (!Array.isArray(listed) || listed.length !== 1) fail('注册', 'provider 应列出 1 个技能，实际 ' + (listed || []).length)
  else {
    const skill = listed[0]
    if (skill.name !== 'premise-trace') fail('注册', '技能名是 ' + skill.name + '，应为 premise-trace')
    else if (skill.source !== 'bundled') fail('注册', '技能 source 是 ' + skill.source + '，应为 bundled')
    else if (typeof skill.rank !== 'number') fail('注册', '技能缺数字档位 rank')
    else if (!skill.invocation || !skill.invocation.modelInvocable) fail('注册', '技能没有对模型开放')
    else ok('注册', '1 个技能：' + skill.name + '（rank ' + skill.rank + '）')
  }
}

/** 4. 正文可读：方法正文必须随包带上、能被 get() 读出 */
if (providers.length === 1) {
  try {
    const skill = (await providers[0].list())[0]
    const loaded = await providers[0].get({ name: skill.name })
    const body = String(loaded && loaded.content)
    const bytes = Buffer.byteLength(body, 'utf8')
    if (bytes < 10000) fail('正文', '正文只有 ' + bytes + ' 字节，疑似截断')
    else if (!body.includes('关键成立条件')) fail('正文', '正文里找不到「关键成立条件」')
    else if (!body.includes('## 边界')) fail('正文', '正文里缺「## 边界」小节')
    else ok('正文', bytes + ' 字节，关键小节齐')
  } catch (error) {
    fail('正文', 'get() 抛错：' + error.message)
  }
}

/** 5. 零外部依赖：运行时只引 node: 内置模块 */
for (const rel of ['index.js', 'invariant.js']) {
  const source = readFileSync(join(root, rel), 'utf8')
  const imports = [...source.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1])
  const external = imports.filter((spec) => !spec.startsWith('node:'))
  if (external.length > 0) fail('依赖', rel + ' 引了外部包：' + external.join('、'))
}
if (pkg.dependencies && Object.keys(pkg.dependencies).length > 0) {
  fail('依赖', 'package.json 声明了 dependencies，本包应为零依赖：' + Object.keys(pkg.dependencies).join('、'))
}
if (!problems.some((p) => p.startsWith('依赖'))) ok('依赖', '运行时只用 node: 内置模块')

/** 6. 伴随插件 */
const companion = await import(pathToFileURL(join(root, 'invariant.js')).href)
if (companion.name !== pkg.name + '-invariant') fail('伴随插件', '导出的 name 是 ' + companion.name + '，应为 ' + pkg.name + '-invariant')
else if (!Array.isArray(companion.inject) || !companion.inject.includes('invariants')) fail('伴随插件', 'inject 里没有 invariants')
else {
  const registered = []
  const invariantCtx = { invariants: { register: (name) => registered.push(name) } }
  await companion.apply(invariantCtx)
  if (registered[0] !== pkg.name) fail('伴随插件', '登记的包名是 ' + registered[0] + '，应为 ' + pkg.name)
  else ok('伴随插件', '登记 ' + pkg.name)
}

console.log('')
if (problems.length > 0) {
  console.error('冒烟失败 ' + problems.length + ' 项')
  process.exit(1)
}
console.log('冒烟通过')
process.exit(0)
