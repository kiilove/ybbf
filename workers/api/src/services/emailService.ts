export interface SendEmailMessage {
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  headers?: Record<string, string>;
}

export interface CloudflareEmailBinding {
  send(message: SendEmailMessage): Promise<{ messageId?: string }>;
}

export interface SendMailOptions {
  to: string;
  subject: string;
  title: string;
  contentHtml: string;
  plainText: string;
}

/**
 * Cloudflare Native Email API를 활용한 이메일 발송 헬퍼
 */
export async function sendEmailHelper(
  emailBinding: CloudflareEmailBinding | undefined,
  appUrlFromEnv: string | undefined,
  options: SendMailOptions
): Promise<{ success: boolean; error?: string }> {
  // 1. 이메일 바인딩 존재 여부 검증 (미바인딩 시 샌드박스 메일로 폴백)
  if (!emailBinding) {
    console.warn('[EmailService] env.EMAIL 바인딩이 구성되어 있지 않습니다. 이메일 발송을 시뮬레이션합니다.');
    console.log(`[EmailService SINK] To: ${options.to}, Subject: ${options.subject}`);
    return { success: true };
  }

  const appUrl = appUrlFromEnv || 'https://ybbf.org';
  const fromEmail = 'noreply@ybbf.org';

  // 2. YBFF 다크 & 브랜딩 메일 템플릿
  const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Apple SD Gothic Neo', 'Pretendard', sans-serif; background-color: #0a0a0a; color: #ffffff; margin: 0; padding: 24px; }
        .container { max-width: 560px; margin: 0 auto; background: #161a16; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .header { display: flex; align-items: center; justify-content: space-between; border-b: 1px solid rgba(255,255,255,0.1); padding-bottom: 16px; margin-bottom: 24px; }
        .logo { font-size: 18px; font-weight: 900; color: #d2ff00; letter-spacing: -0.5px; }
        .title { font-size: 20px; font-weight: 800; color: #ffffff; margin-bottom: 16px; }
        .content { font-size: 14px; line-height: 1.6; color: rgba(255,255,255,0.8); }
        .token-box { background-color: #0c0c0c; border: 1px solid #d2ff00; color: #d2ff00; padding: 18px; font-family: monospace; font-size: 20px; font-weight: bold; text-align: center; border-radius: 12px; margin: 24px 0; letter-spacing: 2px; }
        .btn { display: inline-block; background-color: #d2ff00; color: #000000; font-weight: 900; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-size: 14px; text-align: center; transition: all 0.2s; }
        .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.05); font-size: 11px; color: rgba(255,255,255,0.4); text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">YBBF 보디빌딩협회</div>
        </div>
        <div class="title">${options.title}</div>
        <div class="content">
          ${options.contentHtml}
        </div>
        <div class="footer">
          본 메일은 발신 전용 메일입니다.<br/>
          © 용인특례시보디빌딩협회(YBBF) • <a href="${appUrl}" style="color: #d2ff00; text-decoration: none;">${appUrl}</a>
        </div>
      </div>
    </body>
    </html>
  `;

  // 3. Cloudflare Native send API 호출
  try {
    const result = await emailBinding.send({
      from: fromEmail,
      to: options.to.trim(),
      subject: options.subject,
      html: fullHtml,
      text: options.plainText,
    });

    console.log(`[EmailService] 이메일 발송 성공 (To: ${options.to}):`, result?.messageId);
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : '알 수 없는 이메일 발송 오류';
    console.error(`[EmailService] 이메일 발송 실패 (To: ${options.to}):`, errorMsg);
    return { success: false, error: errorMsg };
  }
}
