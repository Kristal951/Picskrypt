const BRAND = "#4f46e5";
const BRAND_2 = "#7c3aed";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function magicLinkEmail(opts: {
  magicLink: string;
  expiresInMinutes?: number;
}): { html: string; text: string } {
  const minutes = opts.expiresInMinutes ?? 15;
  const link = escapeHtml(opts.magicLink);
  const year = new Date().getFullYear();
  const preheader = `Your Picskrypt login link. It expires in ${minutes} minutes.`;
  const font =
    "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>Your Picskrypt login link</title>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
<style>
  body, table, td, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
  table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
  body { margin:0 !important; padding:0 !important; width:100% !important; }
  @media (max-width:600px) {
    .container { width:100% !important; }
    .px { padding-left:24px !important; padding-right:24px !important; }
    .h1 { font-size:24px !important; line-height:30px !important; }
  }
  @media (prefers-color-scheme: dark) {
    .bg-page { background-color:#0b1020 !important; }
    .bg-card { background-color:#151a2e !important; }
    .text-main { color:#f1f5f9 !important; }
    .text-muted { color:#94a3b8 !important; }
    .bg-soft { background-color:#1e2440 !important; border-color:#2b3255 !important; }
    .divider { border-color:#2b3255 !important; }
    .link-text { color:#a5b4fc !important; }
  }
</style>
</head>
<body class="bg-page" style="margin:0;padding:0;background-color:#f1f5f9;">

<!-- Preheader (inbox preview text) -->
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
  ${escapeHtml(preheader)}&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg-page" style="background-color:#f1f5f9;">
  <tr>
    <td align="center" style="padding:32px 16px;">

      <table role="presentation" class="container" width="560" cellpadding="0" cellspacing="0" border="0" style="width:560px;max-width:560px;">

        <!-- Card -->
        <tr>
          <td class="bg-card" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

              <!-- Header -->
              <tr>
                <td bgcolor="${BRAND}" align="left" class="px" style="background-color:${BRAND};background-image:linear-gradient(135deg,${BRAND} 0%,${BRAND_2} 100%);padding:28px 40px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td width="40" height="40" align="center" valign="middle" bgcolor="#6366f1" style="width:40px;height:40px;background-color:#6366f1;border-radius:10px;font-family:${font};font-size:20px;font-weight:800;color:#ffffff;line-height:40px;">P</td>
                      <td style="padding-left:12px;font-family:${font};font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">Picskrypt</td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td class="px" style="padding:40px 40px 8px 40px;font-family:${font};">
                  <h1 class="h1 text-main" style="margin:0 0 12px 0;font-family:${font};font-size:28px;line-height:34px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">Log in to Picskrypt</h1>
                  <p class="text-muted" style="margin:0 0 28px 0;font-family:${font};font-size:16px;line-height:26px;color:#475569;">
                    Tap the button below to sign in. No password needed.
                  </p>
                </td>
              </tr>

              <!-- Button -->
              <tr>
                <td class="px" align="left" style="padding:0 40px 8px 40px;">
                  <!--[if mso]>
                  <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${link}" style="height:52px;v-text-anchor:middle;width:240px;" arcsize="24%" stroke="f" fillcolor="${BRAND}">
                    <w:anchorlock/>
                    <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">Log in to Picskrypt</center>
                  </v:roundrect>
                  <![endif]-->
                  <!--[if !mso]><!-- -->
                  <a href="${link}" target="_blank" style="display:inline-block;background-color:${BRAND};color:#ffffff;font-family:${font};font-size:16px;font-weight:700;line-height:52px;height:52px;padding:0 32px;border-radius:12px;text-decoration:none;text-align:center;">Log in to Picskrypt</a>
                  <!--<![endif]-->
                </td>
              </tr>

              <!-- Expiry note -->
              <tr>
                <td class="px" style="padding:16px 40px 28px 40px;font-family:${font};">
                  <p class="text-muted" style="margin:0;font-family:${font};font-size:14px;line-height:22px;color:#64748b;">
                    This link expires in <strong>${minutes} minutes</strong> and can only be used once.
                  </p>
                </td>
              </tr>

              <!-- Divider -->
              <tr>
                <td class="px" style="padding:0 40px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr><td class="divider" style="border-top:1px solid #e2e8f0;font-size:0;line-height:0;height:1px;">&nbsp;</td></tr>
                  </table>
                </td>
              </tr>

              <!-- Fallback link -->
              <tr>
                <td class="px" style="padding:24px 40px 8px 40px;font-family:${font};">
                  <p class="text-muted" style="margin:0 0 10px 0;font-family:${font};font-size:13px;line-height:20px;color:#64748b;">
                    Button not working? Copy and paste this link into your browser:
                  </p>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td class="bg-soft" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px;">
                        <a href="${link}" target="_blank" class="link-text" style="font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:12px;line-height:18px;color:${BRAND};word-break:break-all;text-decoration:none;">${link}</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Security note -->
              <tr>
                <td class="px" style="padding:20px 40px 36px 40px;font-family:${font};">
                  <p class="text-muted" style="margin:0;font-family:${font};font-size:13px;line-height:20px;color:#64748b;">
                    <strong class="text-main" style="color:#334155;">Didn&rsquo;t request this?</strong>
                    You can safely ignore this email. Nobody can log in without this link, so please don&rsquo;t forward it to anyone.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="padding:24px 16px 0 16px;font-family:${font};">
            <p class="text-muted" style="margin:0;font-family:${font};font-size:12px;line-height:18px;color:#94a3b8;">
              &copy; ${year} Picskrypt. All rights reserved.<br>
              You received this email because a login was requested for your address.
            </p>
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>

</body>
</html>`;

  const text = [
    "Log in to Picskrypt",
    "",
    "Use the link below to sign in. No password needed.",
    `It expires in ${minutes} minutes and can only be used once.`,
    "",
    opts.magicLink,
    "",
    "Didn't request this? You can safely ignore this email.",
    "Nobody can log in without this link, so please don't forward it.",
    "",
    `(c) ${year} Picskrypt`,
  ].join("\n");

  return { html, text };
}
