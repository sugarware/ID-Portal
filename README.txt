ここコード PWA v2.56

v2.54を基準に、必要性の高い不具合・信頼性対策のみを反映した最小差分版です。

変更点:
- ZXing 3 の一時的な読込失敗後に再試行できるよう修正
- ZXing 動的scriptに CORS 指定を追加し、Service Workerによるキャッシュ成立性を改善
- カメラ起動の多重実行を防止
- QR/BAR表示の非同期競合を防止
- 動的コード表示が翻訳処理で古い内容へ戻る問題を防止
- localStorage保存失敗を検知してユーザーへ通知

意図的に変更していない点:
- シングルタップ430ms待機、ダブルタップ、長押しの既存操作体系
- BAR SVG描画方式
- ZXingの必要時ロード（起動時プリウォームなし）
- ZXing JS/WASMのinstall時プリキャッシュなし
- 旧QR抽出関数の削除なし
- viewport設定の変更なし

ここコード PWA v2.54 JsBarcode削除・ZXing3 BAR生成移行テスト版

【v2.54 変更点】
- v2.53をベースに、BAR生成ライブラリ JsBarcode 3.11.6 を削除。
- Code 128 / Code 39 / EAN-13 / EAN-8 / UPC-A / ITF-14 の生成を ZXing-WASM 3.1.6 full版 writeBarcode() へ移行。
- 既存UIの形式名は維持し、ZXing 3 Writerの形式名へ内部変換（UPC→UPCA、ITF14→ITF）。
- QR生成・QR読取・Symbol保存・カメラUIはv2.53から変更なし。
- 画面表示、Service Worker、manifestのバージョンをv2.54へ更新。
