# CLAUDE.md — Project rules for AI coding

## 設計規範（強制遵守）

所有 UI 改動一律遵守專案根目錄的 [`Design.md`](./Design.md)。

**開發前必看：**
- **7.0 先用 PrimeVue 元件，再考慮手刻** — Tag / ToggleSwitch / Select / DataTable / Tabs / Dialog…等清單裡有的直接用，不要拿 `<div>` / `<span>` 手刻
- **6.6 Table 頁面排版** — Tabs 分類 + 功能鈕 + Table 三段式
- **7.1 元素內距** — Tabs（Card 內）用 `TabList :pt="{ root: { class: 'px-6' } }"`
- **7.4 按鈕規範** — 主要動作前面加 icon，Table 操作欄只放 icon + tooltip
- **7.5 Table 規範** — 全選 checkbox 放表頭第一欄；**DataTable 不寫 `:pt` 客製化 headerCell/bodyCell 的 padding / font-size / font-weight / background**（用 Aura 主題預設）
- **7.6 搜尋區規範** — 搜尋 Card 內、搜尋鈕只放「搜尋」二字不加 icon（覆蓋 7.4）；標題放在搜尋 Card 內
- **7.7 連結規範** — 資訊藍 `#2563EB` + `hover:underline` + `target="_blank" rel="noopener noreferrer"`

**色票（第二節）：**
- 主色 `#7008E7`；主色 Soft `#F2EBFF`
- 成功 `#16A34A` / `#DCFCE7`；危險 `#EF4444` / `#DC2626` / `#FEE2E2`；警告 `#CA8A04` / `#FEF9C3`；資訊 `#2563EB` / `#DBEAFE`
- 不要自創新色；不要用橘色（`#F97316`）取代警告色

**字級階梯（第三節）：**
- Display 24px / Title 20px / Subtitle 18px / Body 16px / Label 14px / Caption 13px / Helper 12px
- 別再寫 `text-[11px]` / `text-[15px]` / `text-[22px]` 等不在階梯上的值
- 12px 用 `text-xs`、14px 用 `text-sm`、16px 用 `text-base`、18px 用 `text-lg`

**間距節奏（第四節）：**
- 只用 `4/8/12/16/24/32` 的倍數 (`gap-1 / gap-2 / gap-3 / gap-4 / gap-6 / gap-8`)
- 別再寫 `gap-0.5` / `gap-1.5` / `pt-1.5` 等半格值

**圓角（7.3）：**
- 一般 `rounded-md`（6px）；卡片可用 `rounded-lg`（8px）
- Tag / Badge 用 `rounded-full`
- 別再寫 `rounded-[6px]` / `rounded-[8px]` — 用 Tailwind 標準 class

**破壞性動作（十）：**
- 一律經二次確認對話框，預設焦點放取消鈕
- 列表中禁止直接放實心紅刪除鈕（無確認）

## Prototype changelog 慣例
本 repo 是 `xsmartlive-portal-vue-prototype`。TopBar 有 info icon 點開的 Dialog，自動讀最近 10 筆 commit 顯示給用戶。
- Commit subject 用 conventional 風格：`feat:` / `fix:` / `refactor:` / `chore:`
- Commit body 用 `-` 開頭條列式，寫**用戶看得懂**的更新內容（不寫實作細節）
- vite.config 用 `git log --format=%cI|%s%n%b%x00` 抓資料，deploy 後才會刷新

## 專案結構備註
- 後台主視覺寬 **1440px**（Design.md 六）— 每次改動要在 1440px 下驗過
- 觸控友善：`.p-inputtext` / `.p-select` / `.p-button:not(.sm):not(.lg):not(.icon-only)` 已在 `src/style.css` 統一 `min-height: 44px`
