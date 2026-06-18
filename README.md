# xsmartlive Admin（商城後台）Prototype

xsmartlive 商城**後台**改版的設計原型，給設計 / PM / 利害關係人 review 用。
（商城前台原型在 [xsmartlive-mall](https://github.com/minchenlee168/xsmartlive-mall)）

**線上預覽**：<https://minchenlee168.github.io/xsmartlive-admin/>

## 用途

- 提供商城後台改版的視覺與互動參考（直播收單、貼文收單、訂單管理、收單紀錄、抽獎大螢幕…）
- 設計確認後再「翻譯」到 [xsmartlive-portal-vue](https://github.com/ariesweng/xsmartlive-portal-vue) 主專案實作
- **不是** production code，沒有真 API、資料寫死

## 技術棧

- Vue 3 + `<script setup>` + TypeScript
- Vite 8
- Tailwind CSS 4
- PrimeVue 4（Aura）
- Pinia
- Vue Router + vue-i18n（後台支援多語）
- FontAwesome Pro Kit（後台 icon 主力）

## 本地開發

```bash
pnpm install --ignore-workspace   # ← 一定要加 --ignore-workspace，避免被外層 pnpm workspace 接管
pnpm dev                          # http://localhost:5173（或下一個可用 port）
```

> FontAwesome Pro Kit 安裝要在 `.npmrc` 內放 `_authToken`（已 gitignore；CI 從 `FONTAWESOME_NPM_TOKEN` secret 注入）。

## 部署

push 到 `main` → GitHub Actions 自動 build + deploy 到 GitHub Pages，約 1-2 分鐘生效。

```bash
git add .
git commit -m "<type>: 描述"
git push
```

不用手動跑 `pnpm build`。

## 專案結構

```
src/
├─ admin/
│  ├─ AdminApp.vue       # 後台殼層 layout switcher
│  ├─ layouts/           # DefaultLayout / AuthLayout
│  ├─ router/            # 後台 child routes + 抽獎全螢幕 routes
│  ├─ views/
│  │  ├─ live-order/     # 直播 / 貼文收單區（含 PostCollectionOverview / OrderModeView / 商品卡 / 留言卡 …）
│  │  ├─ live-records/   # 收單紀錄頁
│  │  ├─ order/          # 訂單管理列表
│  │  └─ bid-gift-lottery / keyword-lottery / store-management / …
│  ├─ components/        # 後台共用元件（portal-ui / Toast / Dialog 客製等）
│  ├─ stores/            # config / layout / shop / theme
│  ├─ composables/、constants/、directives/、locales/、types/、assets/
│  ├─ fontawesome.ts     # FontAwesome icon library 註冊
│  └─ i18n.ts、style.css
├─ stores/ui.ts          # 換頁 loading 用
├─ router/index.ts       # / → /admin redirect + 抽獎大螢幕
├─ App.vue               # 極簡：<RouterView /> + <Toast />
├─ style.css
└─ main.ts
```

## Commit 規範

| type | 用途 |
|---|---|
| `feat` | 新功能/新區塊 |
| `fix` | 修 bug |
| `style` | 視覺微調（不影響邏輯） |
| `refactor` | 重構 |
| `chore` | 雜事（升級套件等） |
| `docs` | 文件 |

## 注意事項

- `vite.config.ts` 的 `base: '/xsmartlive-admin/'` 是給 GitHub Pages 子路徑用，若改 custom domain 要改回 `'/'`
- 用 `pnpm` 不要用 `npm`，且記得帶 `--ignore-workspace`
- 本 repo 於 2026-06 從 `xsmartlive-all-prototype` monorepo 拆出，前台已分到 [xsmartlive-mall](https://github.com/minchenlee168/xsmartlive-mall)
