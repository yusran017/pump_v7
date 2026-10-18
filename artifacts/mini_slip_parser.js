// Pure JS Slip Verify Mini-QR parser (Thai bank slip)
// Based on BOT Thai QR Payment Slip Verify format

const BANK_NAMES = {
  "002": "ธนาคารกรุงเทพ (BBL)",
  "004": "ธนาคารกสิกรไทย (KBANK)",
  "006": "ธนาคารกรุงไทย (KTB)",
  "011": "ธนาคารทหารไทยธนชาต (TTB)",
  "014": "ธนาคารไทยพาณิชย์ (SCB)",
  "025": "ธนาคารกรุงศรีอยุธยา (BAY)",
  "030": "ธนาคารออมสิน (GSB)",
  "033": "ธนาคารอาคารสงเคราะห์ (GHB)",
  "034": "ธนาคารเพื่อการเกษตรและสหกรณ์ (BAAC)",
  "069": "ธนาคารเกียรตินาคินภัทร (KKP)",
  "022": "ธนาคารซีไอเอ็มบีไทย (CIMB)",
  "024": "ธนาคารยูโอบี (UOB)",
  "073": "ธนาคารแลนด์ แอนด์ เฮ้าส์ (LH)",
  "067": "ธนาคารทิสโก้ (TISCO)"
};

function parseTLV(str) {
  const result = [];
  let i = 0;
  while (i < str.length - 3) {
    const tag = str.substr(i, 2);
    const len = parseInt(str.substr(i + 2, 2), 10);
    if (isNaN(len) || i + 4 + len > str.length) break;
    const value = str.substr(i + 4, len);
    result.push({ tag, len, value });
    i += 4 + len;
  }
  return result;
}

function parseSlipMiniQR(payload) {
  if (!payload || typeof payload !== "string" || payload.length < 20) return null;

  try {
    const tags = parseTLV(payload);
    let root = null;
    let country = null;

    for (const t of tags) {
      if (t.tag === "00") root = t.value;
      if (t.tag === "51") country = t.value;
    }

    if (!root) return null;

    const sub = parseTLV(root);
    let marker = null, sendingBank = null, transRef = null;

    for (const t of sub) {
      if (t.tag === "00") marker = t.value;
      if (t.tag === "01") sendingBank = t.value;
      if (t.tag === "02") transRef = t.value;
    }

    // Standard slip verify marker is usually "000001"
    if (!sendingBank || !transRef) return null;

    return {
      valid: true,
      sendingBank,
      bankName: BANK_NAMES[sendingBank] || `ธนาคาร (${sendingBank})`,
      transRef,
      country: country || "TH",
      raw: payload,
      scannedAt: new Date().toISOString()
    };
  } catch (e) {
    return null;
  }
}

// Test examples
console.log(parseSlipMiniQR("004000060000010103002021900021231231212000115102TH91049C30"));
