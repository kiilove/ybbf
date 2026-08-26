const fs = require('fs');
const path = 'd:\\app2\\ybbf\\src\\services\\priceCheckService.ts';

let content = fs.readFileSync(path, 'utf8');

// We find the block starting with /** and containing priceCheckLogs, up to writePriceCheckLog's closing brace.
// Let's use a regex to replace this corrupt block cleanly.
const targetRegex = /\/\*\*[\s\S]*?priceCheckLogs[\s\S]*?async function writePriceCheckLog\([\s\S]*?\}\s*?\r?\n\}/;

const cleanBlock = `/**
 * ✅ 1. Firestore contests/{contestId}/priceCheckLogs 하위에 입금 확인/취소 로그 기록
 */
async function writePriceCheckLog(
  action: 'add' | 'del' | 'cancel' | 'restore',
  invoice: InvoiceData,
  sessionUser: SessionUser,
  contestId: string
) {
  try {
    const logRef = collection(db, 'contests', contestId, 'priceCheckLogs');
    const logData = {
      action,
      timestamp: new Date().toISOString(),
      playerName: invoice.playerName || '-',
      clientInfo: {
        userID: sessionUser.userID || null,
        userGroup: sessionUser.userGroup || null,
        userContext: sessionUser.userContext || null,
        userDocId: sessionUser.id || null,
        clickedAt: new Date().toISOString(),
        clientDevice: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server/Worker',
        clientIp: '-' // 클라이언트단 기본 홀더
      }
    };
    await addDoc(logRef, logData);
    console.log(\`Firestore 입금 확인 로그 기록 완료 (\${action})\`);
  } catch (err) {
    console.error('Firestore 입금 로그 작성 실패:', err);
  }
}`;

if (targetRegex.test(content)) {
  content = content.replace(targetRegex, cleanBlock);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Successfully repaired priceCheckService.ts!');
} else {
  console.log('Regex did not match. Current content may differ.');
}
