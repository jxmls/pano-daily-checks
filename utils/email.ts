function getRecipients() {
  return {
    to: process.env.NEXT_PUBLIC_CHECKLIST_TO ?? "",
    cc: process.env.NEXT_PUBLIC_CHECKLIST_CC ?? "",
    bcc: process.env.NEXT_PUBLIC_CHECKLIST_BCC ?? "",
  };
}

export function openEmail(subject: string, body: string): void {
  const { to, cc, bcc } = getRecipients();
  let mailto = "mailto:" + encodeURIComponent(to);
  const params: string[] = [];
  if (cc) params.push("cc=" + encodeURIComponent(cc));
  if (bcc) params.push("bcc=" + encodeURIComponent(bcc));
  if (subject) params.push("subject=" + encodeURIComponent(subject));
  if (body) params.push("body=" + encodeURIComponent(body));
  if (params.length) mailto += "?" + params.join("&");
  window.location.href = mailto;
}
