# 🎲 美式花旗骰 (Craps 2D) - 完整美式玩法大滿貫 & Odds Bet 演示

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![HTML5 / CSS3 / Vanilla JS](https://img.shields.io/badge/Tech-HTML5%20%7C%20CSS3%20%7C%20JS-emerald)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

一個採用純前端原生技術（HTML5 + Vanilla CSS + ES6 JavaScript + Web Audio API）開發的 **美式花旗骰（Full American Craps 2D）** 互動 Web 遊戲。

本專案特化了 **0% 莊家優勢的 Odds Bet（加倍下注）與 Lay Odds（鋪注）** 視覺化引導、獨立 **Direct Lay 點數牆**、**Come/Don't Come 精確點數移位引擎**，並內建**下注金額倍數建議（Proper Bet Multiples）**與網路權威規則教學彈窗。

---

## 🌟 核心特色 (Key Features)

- 翡翠綠質感暗色賭館風格（Glassmorphism + 賭桌氈布質感）。
- **0% 莊家優勢 Odds 注專區**：
  - **Pass Take Odds**（放 Pass Line 正後方）：4/10 (2:1)、5/9 (3:2)、6/8 (6:5)。
  - **Don't Pass Lay Odds**（放 Don't Pass 旁邊）：4/10 (1:2)、5/9 (2:3)、6/8 (5:6)。
- **Direct Lay Bets 獨立鋪注牆**：可直接下注 `Lay 4`、`Lay 5`、`Lay 6`、`Lay 8`、`Lay 9`、`Lay 10`，賭 `7` 比該號碼先被擲出。
- **Come / Don't Come 獨立移位與結算引擎**：下注後自動隨點數移動至專屬點數格獨立判定勝負。
- **全套高倍率注**：
  - **Hardways (硬牌區)**：Hard 4/10 (7:1)、Hard 6/8 (9:1)。
  - **One-Roll Props (單次爆發注)**：Any 7 (4:1)、Any Craps (7:1)、Yo 11 (15:1)，以及 **Aces (2) / Twelve (12) 高達 30:1** 的爆發賠率。
- **下注金額倍數提醒 (Proper Multiples)**：
  - 荷官日誌會在下注非最佳倍數時提醒（例如 Place 6/8 提示按 **$6 的倍數** 下注，避免派彩小數點被賭場無條件捨去）。
- **嚴格階段鎖定 (Come-Out Phase Locking)**：
  - 首擲（Come-Out Roll）期間自動鎖定 Odds、Lay Odds、Come、Don't Come 與 Place Bets，防止違規下注。
- **Web Audio API 原生音效**：零第三方庫依賴，包含籌碼碰撞、骰子滾動與勝彩慶祝音效。
- **📖 內建線上權威玩法教學 Modal**：隨時點擊頂部按鈕查看圖文對照指南。

---

## 🚀 快速開始 (Quick Start)

本專案無需不安裝任何 `npm` 或外部套件，開箱即用：

### 方法 1：直接雙擊打開
雙擊 `index.html` 即可在任何現代瀏覽器中直接開啟遊玩。

### 方法 2：使用 Python 啟動本地伺服器
```bash
# 複製專案
git clone https://github.com/summerr0007/crap.git
cd crap

# 啟動本地 Web 伺服器
python3 -m http.server 8080
```
瀏覽器開啟：`http://localhost:8080`

---

## 📊 玩法賠率對照表 (Payout Summary)

| 下注類型 | 解鎖階段 | 獲勝條件 | 賠率 (Payout) | 建議下注倍數 |
| :--- | :--- | :--- | :--- | :--- |
| **Pass Line** | Come-Out | 首擲 7/11 贏 (2/3/12輸) 或 Point Phase 先出 Point | 1:1 | 任意金額 |
| **Pass Take Odds** | Point Phase | Point 比 7 先出現 | **0% 莊優**<br>4/10 (2:1) \| 5/9 (3:2) \| 6/8 (6:5) | 6/8 需 **$5倍數**<br>5/9 需 **偶數** |
| **Don't Pass Line** | Come-Out | 首擲 2/3 贏 (12平局) 或 Point Phase 先出 7 | 1:1 | 任意金額 |
| **Don't Pass Lay Odds**| Point Phase | 7 比 Point 先出現 | **0% 莊優**<br>4/10 (1:2) \| 5/9 (2:3) \| 6/8 (5:6) | 5/9 需 **$3倍數**<br>6/8 需 **$6倍數** |
| **Direct Lay 4/10** | Point Phase | 7 先於 4 或 10 出現 | 1:2 | **偶數 ($2倍數)** |
| **Direct Lay 5/9** | Point Phase | 7 先於 5 或 9 出現 | 2:3 | **$3 的倍數** |
| **Direct Lay 6/8** | Point Phase | 7 先於 6 或 8 出現 | 5:6 | **$6 的倍數** |
| **Place 6 / 8** | Point Phase | 6 或 8 比 7 先出現 | 7:6 | **$6 的倍數** |
| **Place 5 / 9** | Point Phase | 5 或 9 比 7 先出現 | 7:5 | **$5 的倍數** |
| **Place 4 / 10** | Point Phase | 4 或 10 比 7 先出現 | 9:5 | **$5 的倍數** |
| **Hard 4 / 10** | 隨時 | 擲出雙數對子 (2+2 / 5+5) | 7:1 | 任意金額 |
| **Hard 6 / 8** | 隨時 | 擲出雙數對子 (3+3 / 4+4) | 9:1 | 任意金額 |
| **Aces (2) / Twelve (12)**| 隨時 (單次) | 當輪擲出 1+1=2 或 6+6=12 | **30:1** | 任意金額 |

---

## 📂 專案架構 (Project Structure)

```
crap/
├── index.html     # 主頁面 DOM 結構、賭桌區域與玩法教學 Modal
├── styles.css     # 翡翠綠賭館 CSS、Odds 虛線發光特效與 Modal 樣式
├── app.js         # 2D 花旗骰狀態機、0% 莊優賠率計算器與 Web Audio API SFX
└── README.md      # 專案說明文件
```

---

## 📄 授權條款 (License)

本專案採用 [MIT License](LICENSE) 授權。
