IDポータル PWA v0.9.6

主な変更点
- カメラ/画像からQRを登録する際の「元パターン」取得方式を修正。
- IDポータル独自の4隅補間＋固定しきい値サンプリングを廃止。
- jsQR 1.4.0 の extractor が decode() に実際に渡した補正済み BitMatrix を取得し、その1bit Matrixをそのまま保存。
- Matrixの取得はjsQRソースをブラウザ内で読み込み、戻り値に extractedMatrix を追加した互換パッチ版を使用。通常のjsQRは自己検証用として維持。
- ECC/Maskも、可能な場合は同じ extractedMatrix のFormat Informationから取得。
- 通常表示はデコーダ抽出Matrix、［再構成］はデコード済みデータだけから標準QRを新規生成。
- JSONバックアップ形式 version 7。
- カメラ認識位置の緑枠表示、大きな正方形ガイドはv0.9.5から継続。

注意
- v0.9.5以前に登録したQRのmatrixは旧方式のままです。正しいデコーダ抽出Matrixを保存するには、v0.9.6で再登録してください。
- ネットワーク等で互換パッチ版jsQRを準備できなかった場合、QRのデコード自体は従来jsQRで継続しますが、decoder extracted matrixは保存されません。
