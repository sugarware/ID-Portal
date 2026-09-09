
    const STORAGE_KEY = "idPortalItems.v01";

    let items = loadItems();
    let editingId = null;
    let wakeLock = null;

    const list = document.getElementById("list");
    const modal = document.getElementById("editModal");
    const addBtn = document.getElementById("addBtn");
    const dataBtn = document.getElementById("dataBtn");
    const reorderBtn = document.getElementById("reorderBtn");
    const dataModal = document.getElementById("dataModal");
    const exportBtn = document.getElementById("exportBtn");
    const importBtn = document.getElementById("importBtn");
    const importFileInput = document.getElementById("importFileInput");
    const closeDataBtn = document.getElementById("closeDataBtn");
    const cancelBtn = document.getElementById("cancelBtn");
    const saveBtn = document.getElementById("saveBtn");
    const deleteBtn = document.getElementById("deleteBtn");
    const deleteRow = document.getElementById("deleteRow");
    const formTitle = document.getElementById("formTitle");
    const nameInput = document.getElementById("name");
    const typeInput = document.getElementById("type");
    const barcodeFormatInput = document.getElementById("barcodeFormat");
    const barcodeFormatField = document.getElementById("barcodeFormatField");
    const valueInput = document.getElementById("value");
    const valueLabel = document.getElementById("valueLabel");
    const imageScanBtn = document.getElementById("imageScanBtn");
    const cameraScanBtn = document.getElementById("cameraScanBtn");
    const imageFileInput = document.getElementById("imageFileInput");
    const reader = document.getElementById("reader");
    const scanStatus = document.getElementById("scanStatus");
    const manualToggleBtn = document.getElementById("manualToggleBtn");
    const manualFields = document.getElementById("manualFields");
    const appRegisterBtn = document.getElementById("appRegisterBtn");
    const shortcutSetupField = document.getElementById("shortcutSetupField");
    const shortcutNamePreview = document.getElementById("shortcutNamePreview");
    const copyShortcutNameBtn = document.getElementById("copyShortcutNameBtn");
    const createShortcutBtn = document.getElementById("createShortcutBtn");
    const testShortcutBtn = document.getElementById("testShortcutBtn");
    const colorGrid = document.getElementById("colorGrid");
    let selectedColor = "white";
    let html5Qr = null;
    let cameraRunning = false;
    let currentCodeSpec = null;
    let originalEditValue = "";

    const codeView = document.getElementById("codeView");
    const codeTitle = document.getElementById("codeTitle");
    const qrcode = document.getElementById("qrcode");
    const barcode = document.getElementById("barcode");
    const codeText = document.getElementById("codeText");
    const codeVerify = document.getElementById("codeVerify");
    const closeCodeBtn = document.getElementById("closeCodeBtn");

    function legacySpec(item, source = "legacy") {
      if (item.type === "qr") {
        const value = String(item.value || "");
        const mode = inferQrMode(value);
        return {
          symbology: "QR_CODE",
          version: null,
          errorCorrection: null,
          maskPattern: null,
          mode,
          segments: [{ mode, text: value }],
          characterEncoding: null,
          source,
          detected: { symbology: true, mode: false, version: false, errorCorrection: false, maskPattern: false }
        };
      }
      if (item.type === "barcode") {
        return { symbology: item.barcodeFormat || "CODE128", source, detected: { symbology: true } };
      }
      return null;
    }

    function normalizeItem(x) {
      const item = {
        id: x.id || crypto.randomUUID(),
        name: String(x.name || ""),
        type: ["qr","barcode","shortcut","link"].includes(x.type) ? x.type : "qr",
        value: String(x.value || ""),
        barcodeFormat: x.barcodeFormat || "CODE128",
        color: x.color || "white",
        codeSpec: x.codeSpec || null
      };
      if ((item.type === "qr" || item.type === "barcode") && !item.codeSpec) item.codeSpec = legacySpec(item);
      return item;
    }

    function loadItems() {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
        if (Array.isArray(saved)) return saved.map(normalizeItem);
      } catch {}
      return [
        normalizeItem({ id: crypto.randomUUID(), name: "サンプル病院", type: "qr", value: "SAMPLE-HOSPITAL-001", barcodeFormat: "CODE128" }),
        normalizeItem({ id: crypto.randomUUID(), name: "サンプルスーパー", type: "barcode", value: "123456789012", barcodeFormat: "CODE128" }),
        normalizeItem({ id: crypto.randomUUID(), name: "OpenAI", type: "link", value: "https://chatgpt.com/", barcodeFormat: "CODE128" })
      ];
    }

    function saveItems() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }

    function typeLabel(item) {
      if (item.type === "qr") return "コード表示";
      if (item.type === "barcode") return "コード表示";
      if (item.type === "shortcut") return "公式アプリ";
      return "リンク";
    }

    function render() {
      list.innerHTML = "";
      if (!items.length) {
        const empty = document.createElement("div");
        empty.className = "empty";
        empty.innerHTML = "まだIDが登録されていません。<br>右上の「＋」から登録してください。";
        list.appendChild(empty);
        return;
      }

      items.forEach((item, index) => {
        const row = document.createElement("div");
        row.className = `item color-${item.color || "white"}`;

        const main = document.createElement("div");
        main.className = "item-main";
        main.innerHTML = `<div class="name"></div>`;
        main.querySelector(".name").textContent = item.name;
        main.addEventListener("click", () => activate(item));

        const meta = document.createElement("div");
        meta.className = "meta";
        meta.textContent = typeLabel(item);
        meta.addEventListener("click", () => activate(item));

        const buttons = document.createElement("div");
        buttons.className = "drag";

        const handle = document.createElement("button");
        handle.className = "drag-handle reorder-only";
        handle.textContent = "≡";
        handle.title = "ドラッグして並び替え";
        handle.setAttribute("aria-label", `${item.name}を並び替え`);
        handle.addEventListener("pointerdown", e => beginDrag(e, item.id));

        const edit = document.createElement("button");
        edit.className = "mini edit-only";
        edit.textContent = "⋯";
        edit.title = "編集";
        edit.addEventListener("click", () => openEdit(item.id));

        buttons.append(handle, edit);
        row.append(main, meta, buttons);
        list.appendChild(row);
      });
    }

    let dragState = null;

    function beginDrag(e, id) {
      if (!document.body.classList.contains("reorder-mode")) return;
      e.preventDefault();
      const row = e.currentTarget.closest(".item");
      if (!row) return;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      dragState = { id, pointerId: e.pointerId, row, targetIndex: items.findIndex(x => x.id === id) };
      row.classList.add("dragging");
      document.addEventListener("pointermove", dragMove, { passive:false });
      document.addEventListener("pointerup", endDrag, { once:true });
      document.addEventListener("pointercancel", endDrag, { once:true });
    }

    function dragMove(e) {
      if (!dragState || e.pointerId !== dragState.pointerId) return;
      e.preventDefault();
      const rows = [...list.querySelectorAll(".item")];
      let target = rows.length - 1;
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i].getBoundingClientRect();
        if (e.clientY < r.top + r.height / 2) { target = i; break; }
      }
      dragState.targetIndex = Math.max(0, Math.min(target, items.length - 1));
      rows.forEach((r,i) => r.classList.toggle("drag-target", i === dragState.targetIndex && r !== dragState.row));
    }

    function endDrag(e) {
      if (!dragState) return;
      const from = items.findIndex(x => x.id === dragState.id);
      const to = dragState.targetIndex;
      dragState.row.classList.remove("dragging");
      list.querySelectorAll(".drag-target").forEach(r => r.classList.remove("drag-target"));
      document.removeEventListener("pointermove", dragMove);
      if (from >= 0 && to >= 0 && from !== to) {
        const [moved] = items.splice(from, 1);
        items.splice(to, 0, moved);
        saveItems();
      }
      dragState = null;
      render();
    }

    function openDataModal() {
      dataModal.classList.add("show");
      dataModal.setAttribute("aria-hidden", "false");
    }

    function closeDataModal() {
      dataModal.classList.remove("show");
      dataModal.setAttribute("aria-hidden", "true");
    }

    function exportData() {
      const backup = {
        format: "IDPortal",
        version: 2,
        exportedAt: new Date().toISOString(),
        items
      };
      // UTF-8 BOMを付け、iOS/Safariやファイル共有経由でも文字コードを誤判定されにくくする。
      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob(["\uFEFF", json], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const d = new Date();
      const stamp = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
      a.href = url;
      a.download = `IDPortal_backup_${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    async function importData(file) {
      if (!file) return;
      try {
        // file.text() に任せずUTF-8として明示的に復号する。
        const buffer = await file.arrayBuffer();
        let text = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
        // UTF-8 BOMがある場合は除去してからJSON解析する。
        if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
        const data = JSON.parse(text);
        if (!data || data.format !== "IDPortal" || !Array.isArray(data.items)) {
          throw new Error("invalid-format");
        }
        const normalized = data.items.map(normalizeItem);
        if (!confirm(`現在の${items.length}件を、読み込んだ${normalized.length}件で置き換えますか？`)) return;
        items = normalized;
        saveItems();
        render();
        closeDataModal();
        alert(`${items.length}件を読み込みました。`);
      } catch {
        alert("IDポータルのバックアップファイルとして読み込めませんでした。");
      } finally {
        importFileInput.value = "";
      }
    }

    function updateColorSelection() {
      colorGrid.querySelectorAll(".color-choice").forEach(btn => {
        btn.classList.toggle("selected", btn.dataset.color === selectedColor);
      });
    }

    function openEdit(id = null) {
      editingId = id;
      const item = items.find(x => x.id === id);

      formTitle.textContent = item ? "IDを編集" : "IDを追加";
      nameInput.value = item?.name || "";
      typeInput.value = item?.type || "qr";
      barcodeFormatInput.value = item?.barcodeFormat || "CODE128";
      valueInput.value = item?.value || "";
      originalEditValue = item?.value || "";
      currentCodeSpec = item?.codeSpec ? structuredClone(item.codeSpec) : (item ? legacySpec(item) : null);
      selectedColor = item?.color || "white";
      updateColorSelection();
      deleteRow.classList.toggle("hidden", !item);
      manualFields.classList.toggle("hidden", !item);
      manualToggleBtn.textContent = item ? "詳細設定を隠す" : "手入力・詳細設定";
      scanStatus.textContent = item ? "登録済みコードです。再読み取りすると置き換わります。" : "QRコード／主要バーコードを自動判定します。";

      stopCamera();
      updateFormFields();
      updateShortcutPreview();
      modal.classList.add("show");
      modal.setAttribute("aria-hidden", "false");
      setTimeout(() => nameInput.focus(), 50);
    }

    async function closeEdit() {
      await stopCamera();
      modal.classList.remove("show");
      modal.setAttribute("aria-hidden", "true");
      editingId = null;
    }

    function suggestedShortcutName() {
      const base = nameInput.value.trim() || "アプリ";
      return `${base}を開く`;
    }

    function updateShortcutPreview() {
      if (typeInput.value === "shortcut") {
        if (!valueInput.value.trim()) valueInput.value = suggestedShortcutName();
        shortcutNamePreview.textContent = valueInput.value.trim() || suggestedShortcutName();
      }
    }

    function updateFormFields() {
      const type = typeInput.value;
      barcodeFormatField.classList.toggle("hidden", type !== "barcode");
      shortcutSetupField.classList.toggle("hidden", type !== "shortcut");

      if (type === "link") {
        valueLabel.textContent = "URL";
        valueInput.placeholder = "例：https://example.com";
      } else if (type === "shortcut") {
        valueLabel.textContent = "ショートカット名";
        valueInput.placeholder = "例：楽天GORAを開く";
        updateShortcutPreview();
      } else {
        valueLabel.textContent = "コード内容";
        valueInput.placeholder = "文字列または番号";
      }
    }


    function setScanStatus(text, isError = false) {
      scanStatus.textContent = text;
      scanStatus.style.color = isError ? "var(--danger)" : "var(--muted)";
    }

    function inferQrMode(text) {
      if (/^[0-9]+$/.test(text)) return "numeric";
      if (/^[0-9A-Z $%*+\-./:]+$/.test(text)) return "alphanumeric";
      return "byte";
    }

    function normalizeModeName(mode) {
      const m = String(mode || "").toLowerCase();
      if (m.includes("numeric")) return "numeric";
      if (m.includes("alphanumeric")) return "alphanumeric";
      if (m.includes("kanji")) return "kanji";
      if (m.includes("byte")) return "byte";
      if (m.includes("eci")) return "eci";
      return m || "byte";
    }

    function extractSegmentsFromJsQr(result, fallbackText) {
      const chunks = Array.isArray(result?.chunks) ? result.chunks : [];
      const segments = [];
      for (const ch of chunks) {
        const mode = normalizeModeName(ch.type || ch.mode);
        if (!["numeric","alphanumeric","byte","kanji"].includes(mode)) continue;
        let text = typeof ch.text === "string" ? ch.text : "";
        if (!text && Array.isArray(ch.bytes)) {
          try { text = new TextDecoder("utf-8", {fatal:false}).decode(new Uint8Array(ch.bytes)); } catch {}
        }
        if (text) segments.push({ mode, text });
      }
      if (!segments.length) {
        const mode = inferQrMode(fallbackText || "");
        segments.push({ mode, text: fallbackText || "" });
      }
      return segments;
    }

    function bchTypeInfo(data) {
      function digit(n) { let d=0; while(n){d++; n >>>= 1;} return d; }
      const G15 = 0x537, G15_MASK = 0x5412;
      let d = data << 10;
      while (digit(d) - digit(G15) >= 0) d ^= (G15 << (digit(d) - digit(G15)));
      return ((data << 10) | d) ^ G15_MASK;
    }

    function hamming15(a,b) {
      let x=(a^b)&0x7fff, n=0;
      while(x){ n += x & 1; x >>>= 1; }
      return n;
    }

    function sampleQrModule(imageData, loc, n, row, col) {
      if (!loc?.topLeftCorner || !loc?.topRightCorner || !loc?.bottomLeftCorner || !loc?.bottomRightCorner) return null;
      const u=(col+0.5)/n, v=(row+0.5)/n;
      const tl=loc.topLeftCorner, tr=loc.topRightCorner, bl=loc.bottomLeftCorner, br=loc.bottomRightCorner;
      const x=(1-u)*(1-v)*tl.x + u*(1-v)*tr.x + (1-u)*v*bl.x + u*v*br.x;
      const y=(1-u)*(1-v)*tl.y + u*(1-v)*tr.y + (1-u)*v*bl.y + u*v*br.y;
      const ix=Math.max(0,Math.min(imageData.width-1,Math.round(x)));
      const iy=Math.max(0,Math.min(imageData.height-1,Math.round(y)));
      const k=(iy*imageData.width+ix)*4;
      const lum=0.299*imageData.data[k]+0.587*imageData.data[k+1]+0.114*imageData.data[k+2];
      return lum < 128 ? 1 : 0;
    }

    function extractQrFormatInfo(imageData, result) {
      const version = Number(result?.version || 0);
      if (!version) return { errorCorrection:null, maskPattern:null, confidence:null };
      const n=17+4*version, loc=result.location;
      const copies=[];
      let bitsV=0, okV=true;
      for(let i=0;i<15;i++){
        let row;
        if(i<6) row=i; else if(i<8) row=i+1; else row=n-15+i;
        const b=sampleQrModule(imageData,loc,n,row,8); if(b==null){okV=false;break;} bitsV|=(b<<i);
      }
      if(okV) copies.push(bitsV);
      let bitsH=0, okH=true;
      for(let i=0;i<15;i++){
        let col;
        if(i<8) col=n-i-1; else if(i<9) col=15-i; else col=15-i-1;
        const b=sampleQrModule(imageData,loc,n,8,col); if(b==null){okH=false;break;} bitsH|=(b<<i);
      }
      if(okH) copies.push(bitsH);
      let best=null;
      for(const observed of copies){
        for(let data=0;data<32;data++){
          const dist=hamming15(observed,bchTypeInfo(data));
          if(!best || dist<best.dist) best={data,dist};
        }
      }
      if(!best || best.dist>3) return { errorCorrection:null, maskPattern:null, confidence:null };
      const ecBits=best.data>>3;
      const ecMap={0:"M",1:"L",2:"H",3:"Q"};
      return { errorCorrection:ecMap[ecBits] || null, maskPattern:best.data&7, confidence:best.dist===0?"exact":"corrected" };
    }

    async function decodeQrFromImageFile(file) {
      if (typeof jsQR !== "function") return null;
      const bmp = await createImageBitmap(file);
      const canvas=document.createElement("canvas");
      canvas.width=bmp.width; canvas.height=bmp.height;
      const ctx=canvas.getContext("2d",{willReadFrequently:true});
      ctx.drawImage(bmp,0,0);
      bmp.close?.();
      const imageData=ctx.getImageData(0,0,canvas.width,canvas.height);
      const result=jsQR(imageData.data,imageData.width,imageData.height,{inversionAttempts:"attemptBoth"});
      if(!result) return null;
      const segments=extractSegmentsFromJsQr(result,result.data || "");
      const modes=[...new Set(segments.map(x=>x.mode))];
      const fmt=extractQrFormatInfo(imageData,result);
      return {
        text: result.data || "",
        spec: {
          symbology:"QR_CODE",
          version: Number(result.version) || null,
          errorCorrection: fmt.errorCorrection,
          maskPattern: fmt.maskPattern,
          mode: modes.length===1 ? modes[0] : "mixed",
          segments,
          characterEncoding: null,
          source:"image",
          detected:{ symbology:true, mode:true, version:!!result.version, errorCorrection:!!fmt.errorCorrection, maskPattern:Number.isInteger(fmt.maskPattern) },
          formatInfoConfidence: fmt.confidence
        }
      };
    }

    function makeQrSpecFromDecoded(text, decodedResult, source="camera") {
      const mode=inferQrMode(text || "");
      const meta=decodedResult?.result?.resultMetadata || decodedResult?.resultMetadata || {};
      const ec=meta.ERROR_CORRECTION_LEVEL || meta.errorCorrectionLevel || null;
      return {
        symbology:"QR_CODE", version:null, errorCorrection:ec || null, maskPattern:null,
        mode, segments:[{mode,text:text||""}], characterEncoding:null, source,
        detected:{symbology:true, mode:false, version:false, errorCorrection:!!ec, maskPattern:false}
      };
    }

    function mapScanFormat(formatName) {
      const f = (formatName || "").toUpperCase().replace(/[- ]/g, "_");
      if (f.includes("QR")) return { type: "qr", barcodeFormat: "CODE128", label: "QR Code" };
      if (f.includes("CODE_128") || f.includes("CODE128")) return { type: "barcode", barcodeFormat: "CODE128", label: "Code 128" };
      if (f.includes("CODE_39") || f.includes("CODE39")) return { type: "barcode", barcodeFormat: "CODE39", label: "Code 39" };
      if (f.includes("EAN_13") || f.includes("EAN13")) return { type: "barcode", barcodeFormat: "EAN13", label: "EAN-13" };
      if (f.includes("EAN_8") || f.includes("EAN8")) return { type: "barcode", barcodeFormat: "EAN8", label: "EAN-8" };
      if (f.includes("UPC_A") || f === "UPC") return { type: "barcode", barcodeFormat: "UPC", label: "UPC-A" };
      if (f.includes("ITF")) return { type: "barcode", barcodeFormat: "ITF14", label: "ITF" };
      return { type: "barcode", barcodeFormat: "CODE128", label: formatName || "バーコード" };
    }

    function applyDecoded(decodedText, decodedResult) {
      const fmtName =
        decodedResult?.result?.format?.formatName ||
        decodedResult?.result?.format?.format ||
        decodedResult?.formatName ||
        "";
      const mapped = mapScanFormat(fmtName);

      valueInput.value = decodedText || "";
      typeInput.value = mapped.type;
      barcodeFormatInput.value = mapped.barcodeFormat;
      currentCodeSpec = mapped.type === "qr"
        ? makeQrSpecFromDecoded(decodedText || "", decodedResult, "camera")
        : { symbology: mapped.barcodeFormat, source:"camera", detected:{symbology:true} };
      manualFields.classList.remove("hidden");
      manualToggleBtn.textContent = "詳細設定を隠す";
      updateFormFields();
      setScanStatus(`読み取り成功：${mapped.label} ／ ${decodedText}`);
    }

    async function ensureScanner() {
      if (!html5Qr) html5Qr = new Html5Qrcode("reader");
      return html5Qr;
    }

    async function scanImageFile(file) {
      if (!file) return;
      await stopCamera();
      reader.classList.remove("hidden");
      setScanStatus("画像を解析しています…");
      try {
        // QRはjsQRで先に解析し、Version / Segment mode / Format information を保存する。
        const qr = await decodeQrFromImageFile(file).catch(() => null);
        if (qr) {
          valueInput.value = qr.text;
          typeInput.value = "qr";
          currentCodeSpec = qr.spec;
          manualFields.classList.remove("hidden");
          manualToggleBtn.textContent = "詳細設定を隠す";
          updateFormFields();
          const ec = qr.spec.errorCorrection || "不明";
          const mask = Number.isInteger(qr.spec.maskPattern) ? qr.spec.maskPattern : "不明";
          setScanStatus(`読み取り成功：QR Code ／ mode=${qr.spec.mode} ／ Version=${qr.spec.version || "不明"} ／ ECC=${ec} ／ Mask=${mask}`);
        } else {
          const scanner = await ensureScanner();
          if (typeof scanner.scanFileV2 === "function") {
            const result = await scanner.scanFileV2(file, true);
            const decodedText = result?.decodedText || "";
            applyDecoded(decodedText, result);
          } else {
            const decodedText = await scanner.scanFile(file, true);
            valueInput.value = decodedText || "";
            const mode=inferQrMode(decodedText || "");
            currentCodeSpec={symbology:"UNKNOWN",source:"image",detected:{symbology:false},mode};
            manualFields.classList.remove("hidden");
            manualToggleBtn.textContent = "詳細設定を隠す";
            setScanStatus("読み取り成功。コード形式を自動判定できなかったため、種類を確認してください。");
          }
        }
      } catch (e) {
        setScanStatus("コードを読み取れませんでした。別の画像を試すか、手入力してください。", true);
      } finally {
        reader.classList.add("hidden");
        imageFileInput.value = "";
      }
    }

    async function startCamera() {
      if (cameraRunning) {
        await stopCamera();
        return;
      }
      reader.classList.remove("hidden");
      setScanStatus("カメラを起動しています…");
      try {
        const scanner = await ensureScanner();
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 160 } },
          async (decodedText, decodedResult) => {
            applyDecoded(decodedText, decodedResult);
            await stopCamera();
          },
          () => {}
        );
        cameraRunning = true;
        cameraScanBtn.textContent = "カメラを停止";
        setScanStatus("コードを枠内に映してください。");
      } catch (e) {
        setScanStatus("カメラを開始できませんでした。ブラウザのカメラ権限を確認してください。", true);
        reader.classList.add("hidden");
      }
    }

    async function stopCamera() {
      if (html5Qr && cameraRunning) {
        try { await html5Qr.stop(); } catch {}
        cameraRunning = false;
      }
      cameraScanBtn.textContent = "カメラで読み取る";
      reader.classList.add("hidden");
    }

    function validate(item) {
      if (!item.name.trim()) return "表示名を入力してください。";
      if (!item.value.trim()) {
        if (item.type === "link") return "URLを入力してください。";
        if (item.type === "shortcut") return "ショートカット名を入力してください。";
        return "コード内容を入力してください。";
      }
      return "";
    }

    function saveCurrent() {
      const valueNow = valueInput.value.trim();
      let spec = currentCodeSpec;
      if (typeInput.value === "qr") {
        if (!spec || spec.symbology !== "QR_CODE" || valueNow !== originalEditValue) {
          const mode=inferQrMode(valueNow);
          spec={symbology:"QR_CODE",version:null,errorCorrection:null,maskPattern:null,mode,segments:[{mode,text:valueNow}],characterEncoding:null,source:"manual",detected:{symbology:true,mode:false,version:false,errorCorrection:false,maskPattern:false}};
        }
      } else if (typeInput.value === "barcode") {
        spec={symbology:barcodeFormatInput.value,source:spec?.source || "manual",detected:{symbology:true}};
      } else spec=null;
      const item = {
        id: editingId || crypto.randomUUID(),
        name: nameInput.value.trim(),
        type: typeInput.value,
        value: valueNow,
        barcodeFormat: barcodeFormatInput.value,
        color: selectedColor,
        codeSpec: spec
      };
      const error = validate(item);
      if (error) return alert(error);

      if (editingId) {
        const index = items.findIndex(x => x.id === editingId);
        items[index] = item;
      } else {
        items.push(item);
      }
      saveItems();
      render();
      closeEdit();
    }

    function deleteCurrent() {
      if (!editingId) return;
      const item = items.find(x => x.id === editingId);
      if (!confirm(`「${item.name}」を削除しますか？`)) return;
      items = items.filter(x => x.id !== editingId);
      saveItems();
      render();
      closeEdit();
    }

    async function activate(item) {
      if (item.type === "shortcut") {
        const shortcutUrl = `shortcuts://run-shortcut?name=${encodeURIComponent(item.value)}`;
        window.location.href = shortcutUrl;
        return;
      }
      if (item.type === "link") {
        window.location.href = item.value;
        return;
      }
      await showCode(item);
    }

    async function showCode(item) {
      codeTitle.textContent = item.name;
      codeText.textContent = item.value;
      codeVerify.textContent = "";
      qrcode.innerHTML = "";
      barcode.innerHTML = "";
      qrcode.classList.toggle("hidden", item.type !== "qr");
      barcode.classList.toggle("hidden", item.type !== "barcode");

      try {
        if (item.type === "qr") {
          codeVerify.textContent = "再生成コードを検証しています…";
          const spec = item.codeSpec || legacySpec(item);
          const ec = spec?.errorCorrection || "M";
          let version = Number(spec?.version) || 0;
          let qr;
          const build = (v) => {
            const obj = qrcode(v, ec);
            const segs = Array.isArray(spec?.segments) && spec.segments.length ? spec.segments : [{mode:spec?.mode || inferQrMode(item.value), text:item.value}];
            for (const seg of segs) {
              const modeMap={numeric:"Numeric",alphanumeric:"Alphanumeric",byte:"Byte",kanji:"Kanji"};
              const m=modeMap[normalizeModeName(seg.mode)] || "Byte";
              obj.addData(String(seg.text ?? item.value), m);
            }
            obj.make();
            return obj;
          };
          try { qr=build(version); } catch { version=0; qr=build(0); }
          const modules=qr.getModuleCount(), quiet=4;
          const maxSize=Math.min(window.innerWidth*0.82,520);
          const scale=Math.max(2,Math.floor(maxSize/(modules+quiet*2)));
          const side=(modules+quiet*2)*scale;
          const canvas=document.createElement("canvas"); canvas.width=side; canvas.height=side;
          const ctx=canvas.getContext("2d"); ctx.fillStyle="#fff"; ctx.fillRect(0,0,side,side); ctx.fillStyle="#000";
          for(let r=0;r<modules;r++) for(let c=0;c<modules;c++) if(qr.isDark(r,c)) ctx.fillRect((c+quiet)*scale,(r+quiet)*scale,scale,scale);
          qrcode.appendChild(canvas);
          // 自己検証：再生成したQRを再度デコードし、保存データと完全一致することを確認。
          try {
            const img=ctx.getImageData(0,0,side,side);
            const chk=typeof jsQR==="function" ? jsQR(img.data,side,side,{inversionAttempts:"dontInvert"}) : null;
            if (chk?.data === item.value) {
              const modeText=spec?.mode || "不明";
              const vText=spec?.version || chk?.version || "自動";
              codeVerify.textContent=`再生成検証：OK ／ mode=${modeText} ／ Version=${vText} ／ ECC=${ec}${Number.isInteger(spec?.maskPattern)?` ／ 元Mask=${spec.maskPattern}`:""}`;
            } else codeVerify.textContent="再生成検証：確認できませんでした";
          } catch { codeVerify.textContent="再生成検証：未実施"; }
        } else {
          codeVerify.textContent = `形式：${item.codeSpec?.symbology || item.barcodeFormat || "CODE128"}`;
          JsBarcode(barcode, item.value, {
            format: item.barcodeFormat || "CODE128",
            displayValue: false,
            margin: 10,
            height: 150,
            width: 2
          });
        }
      } catch (e) {
        alert("コードを生成できませんでした。形式と内容を確認してください。");
        return;
      }

      codeView.classList.add("show");
      document.body.style.overflow = "hidden";
      try {
        if ("wakeLock" in navigator) wakeLock = await navigator.wakeLock.request("screen");
      } catch {}
    }

    async function closeCode() {
      codeView.classList.remove("show");
      document.body.style.overflow = "";
      if (wakeLock) {
        try { await wakeLock.release(); } catch {}
        wakeLock = null;
      }
    }

    addBtn.addEventListener("click", () => openEdit());
    dataBtn.addEventListener("click", openDataModal);
    exportBtn.addEventListener("click", exportData);
    importBtn.addEventListener("click", () => importFileInput.click());
    importFileInput.addEventListener("change", () => importData(importFileInput.files?.[0]));
    closeDataBtn.addEventListener("click", closeDataModal);
    dataModal.addEventListener("click", e => { if (e.target === dataModal) closeDataModal(); });
    reorderBtn.addEventListener("click", () => {
      const enabled = document.body.classList.toggle("reorder-mode");
      reorderBtn.textContent = enabled ? "完了" : "↓↑";
    });
    cancelBtn.addEventListener("click", closeEdit);
    saveBtn.addEventListener("click", saveCurrent);
    deleteBtn.addEventListener("click", deleteCurrent);
    typeInput.addEventListener("change", updateFormFields);
    nameInput.addEventListener("input", () => {
      if (typeInput.value === "shortcut" && (!editingId || valueInput.value === "" || valueInput.value.endsWith("を開く"))) {
        valueInput.value = suggestedShortcutName();
        updateShortcutPreview();
      }
    });
    valueInput.addEventListener("input", updateShortcutPreview);

    appRegisterBtn.addEventListener("click", async () => {
      await stopCamera();
      manualFields.classList.remove("hidden");
      manualToggleBtn.textContent = "詳細設定を隠す";
      typeInput.value = "shortcut";
      valueInput.value = suggestedShortcutName();
      updateFormFields();
      setScanStatus("公式アプリはAppleショートカットを経由して起動します。");
      if (!nameInput.value.trim()) nameInput.focus();
    });

    copyShortcutNameBtn.addEventListener("click", async () => {
      updateShortcutPreview();
      const text = shortcutNamePreview.textContent;
      try {
        await navigator.clipboard.writeText(text);
        setScanStatus(`「${text}」をコピーしました。`);
      } catch {
        valueInput.focus();
        valueInput.select();
        setScanStatus("コピーできなかったため、ショートカット名欄を選択しました。");
      }
    });

    colorGrid.addEventListener("click", (e) => {
      const btn = e.target.closest(".color-choice");
      if (!btn) return;
      selectedColor = btn.dataset.color || "white";
      updateColorSelection();
    });

    testShortcutBtn.addEventListener("click", () => {
      updateShortcutPreview();
      const name = shortcutNamePreview.textContent.trim();
      if (!name) return setScanStatus("ショートカット名を入力してください。", true);
      setScanStatus(`「${name}」を起動テストします。`);
      window.location.href = `shortcuts://run-shortcut?name=${encodeURIComponent(name)}`;
    });

    createShortcutBtn.addEventListener("click", async () => {
      updateShortcutPreview();
      const text = shortcutNamePreview.textContent;
      try { await navigator.clipboard.writeText(text); } catch {}
      setScanStatus(`「${text}」をコピーしました。ショートカットで「Appを開く」を追加してください。`);
      window.location.href = "shortcuts://create-shortcut";
    });
    imageScanBtn.addEventListener("click", () => imageFileInput.click());
    imageFileInput.addEventListener("change", () => scanImageFile(imageFileInput.files?.[0]));
    cameraScanBtn.addEventListener("click", startCamera);
    manualToggleBtn.addEventListener("click", () => {
      const hidden = manualFields.classList.toggle("hidden");
      manualToggleBtn.textContent = hidden ? "手入力・詳細設定" : "詳細設定を隠す";
    });
    closeCodeBtn.addEventListener("click", closeCode);
    modal.addEventListener("click", e => { if (e.target === modal) closeEdit(); });

    document.addEventListener("visibilitychange", async () => {
      if (document.visibilityState === "visible" && codeView.classList.contains("show") && "wakeLock" in navigator) {
        try { wakeLock = await navigator.wakeLock.request("screen"); } catch {}
      }
    });

    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js"));
    }

    render();
  