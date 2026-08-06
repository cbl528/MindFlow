/**
 * 前后端联通开关
 *
 * - USE_BACKEND = false（默认）：前端使用 src/data/seed.ts 内置演示数据渲染所有页面，
 *   无需后端即可浏览完整 UI。service 层返回死数据。
 * - USE_BACKEND = true：所有 service 走真实 HTTP 请求（对接 MindFlow 后端）。
 *
 * 也可以不修改此文件，通过 .env 中 VITE_USE_BACKEND=true 覆盖。
 */
export const USE_BACKEND = import.meta.env.VITE_USE_BACKEND === 'true'
