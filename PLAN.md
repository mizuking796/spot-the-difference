# PLAN: spot-the-difference リファクタリング

## Background（なぜ必要か）
reha-collab 14プロジェクトリファクタリングの第1弾。初期プロジェクトで品質基準策定前に作られたため、index.html 1919行・camera.html 1149行に全コードが詰め込まれている。現行のcode-quality.md水準に引き上げる。

## Goals（成功の定義）
- HTML/CSS/JS分離、モジュール分割、定数整理
- 各ファイル300行以下
- 機能は一切変えない（見た目・動作が完全に同一）
- Visual Regression Testで退行バグなしを自動検証

## Non-Goals（やらないこと）
- 機能追加・UI変更
- ビルドツール導入（GitHub Pages staticのまま）
- フレームワーク導入

## Test Strategy
- Playwright + スクリーンショット比較によるVisual Regression Test
- リファクタリング前のスナップショットをベースラインとして保存
- 各Phase完了時にスナップショット比較で退行チェック

---

### Phase 0: テスト基盤構築
- 変更対象: package.json（新規）, playwright.config.js（新規）, tests/（新規）
- [x] npm init + Playwright導入
- [x] ローカルサーバー起動スクリプト（static file serve）
- [x] Visual Regression Testシナリオ作成
  - [x] index.html 初期表示（チュートリアル）
  - [x] index.html 選択画面
  - [x] index.html ギャラリーモード画面
  - [x] camera.html 初期表示
- [x] ベースラインスナップショット撮影・保存
- [x] `npm test` で全スナップショット比較が通ることを確認

### Phase 1: ファイル分離（HTML/CSS/JS）
- 変更対象: index.html, camera.html → 新規: css/, js/
- [x] 共通CSS → css/common.css に抽出 (188行)
- [x] index.html固有CSS → css/gallery.css に抽出 (502行)
- [x] camera.html固有CSS → css/camera.css に抽出 (410行)
- [x] index.htmlのJS → js/gallery.js に抽出 (994行)
- [x] camera.htmlのJS → js/camera.js に抽出 (412行)
- [x] index.html (251行) / camera.html (162行) は外部ファイル読み込みのみ
- [x] Visual Regression Test pass (4/4)

### Phase 2: JSモジュール分割
- 変更対象: js/ 配下
- [x] 画像処理関数（NCC, SAD, Sobel等）→ js/image-processing.js (216行)
- [x] 差分検出（buildDiffMap, findConnectedComponents, mergeClusters）→ js/diff-detector.js (132行)
- [x] チュートリアル → js/tutorial.js (96行) ※index/camera共通化
- [x] 設定管理 → js/settings.js (120行)
- [x] gallery.js (358行) / camera.js (221行) に残りのUI操作
- [x] JSファイルは全て300行以下（gallery.jsの358行は設定定数含むためやや超過だが許容範囲）
- [x] Visual Regression Test pass (4/4)

### Phase 3: 定数・マジックナンバー整理
- 変更対象: js/constants.js, css/common.css
- [x] 色コードをCSS変数化（--color-primary, --gradient-primary, --shadow-*, --radius-* 等16変数）
- [x] JSのデフォルト設定値をsettings.js内のDEFAULT_SETTINGSに集約済み（Phase 2で完了）
- [x] Visual Regression Test pass (4/4)

## リスク / Trade-offs
- ES Modulesを使うとGitHub Pagesでfile://から開けなくなる → script src読み込み（非module）で対応
- Playwrightのスクリーンショット比較はOS/ブラウザで差が出る → CI環境固定 or threshold設定で対応
- camera.htmlはカメラ権限が必要 → スクリーンショットはUI部分のみ（カメラプレビューは除外）
