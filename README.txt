ここコード PWA v2.54 JsBarcode削除・ZXing3 BAR生成移行テスト版

【v2.54 変更点】
- v2.53をベースに、BAR生成ライブラリ JsBarcode 3.11.6 を削除。
- Code 128 / Code 39 / EAN-13 / EAN-8 / UPC-A / ITF-14 の生成を ZXing-WASM 3.1.6 full版 writeBarcode() へ移行。
- 既存UIの形式名は維持し、ZXing 3 Writerの形式名へ内部変換（UPC→UPCA、ITF14→ITF）。
- QR生成・QR読取・Symbol保存・カメラUIはv2.53から変更なし。
- 画面表示、Service Worker、manifestのバージョンをv2.54へ更新。
