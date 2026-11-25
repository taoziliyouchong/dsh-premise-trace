/**
 * 前提追溯：判断一个主体为什么从状态 A 转到状态 B、下一步转到哪，或解释单个状态靠哪几项成立条件同时成立。
 *
 * 只注册一个内置技能，没有工具、命令、路由与浏览器半边；除了 node:fs 不引任何包。
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * 技能排序档位：与宿主内置 bundled 技能同档。
 * 宿主导出过这个常量（BUNDLED_SKILL_RANK = 600），但那是宿主内部包，装进别人的 profile
 * 不一定解析得到，所以这里写定值，靠 scripts/smoke.mjs 在校验时比对资产文件是否可读。
 */
const SKILL_RANK = 600

/** Cordis 插件名。 */
export const name = 'dsh-premise-trace'
/** 需要的服务。 */
export const inject = ['skills']

/** 注册内置技能。 */
export function apply(ctx) {
  // 单 provider 挂全部技能；本包只有一个
  const skillEntries = [
    {
      name: 'premise-trace',
      description:
        '前提追溯：回答一个东西为什么变成现在这样、靠什么撑着、下一步会变成什么——拆开撑住它的条件，标出哪几项撤了就塌（关键条件）、哪几项有备胎；交付一张逐条标好的条件表，不是列它外面需要什么。',
      file: 'premise-trace.md',
    },
  ]

  ctx.skills.registerProvider(() => ({
    name: 'dsh-premise-trace',
    list: () =>
      Promise.resolve(
        skillEntries.map((s) => ({
          name: s.name,
          description: s.description,
          invocation: { modelInvocable: true, userInvocable: true },
          provider: 'dsh-premise-trace',
          source: 'bundled',
          resourceBase: { kind: 'directory', path: fileURLToPath(new URL('./assets/', import.meta.url)) },
          rank: SKILL_RANK,
          locator: new URL(`./assets/${s.file}`, import.meta.url),
        })),
      ),
    async get(candidate) {
      const s = skillEntries.find((x) => x.name === candidate.name) ?? skillEntries[0]
      const body = readFileSync(new URL(`./assets/${s.file}`, import.meta.url), 'utf8')
      return { ...candidate, content: body }
    },
  }))
}
