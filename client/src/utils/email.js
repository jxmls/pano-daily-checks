// src/utils/email.js

// try to read from environment (CRA style: REACT_APP_*) or localStorage
function getRecipients() {
  // CRA env vars are injected at build time
  const to = process.env.REACT_APP_CHECKLIST_TO;
  const cc = process.env.REACT_APP_CHECKLIST_CC;
  const bcc = process.env.REACT_APP_CHECKLIST_BCC;

  return {
    to: to || localStorage.getItem("checklist.to") || "",
    cc: cc || localStorage.getItem("checklist.cc") || "",
    bcc: bcc || localStorage.getItem("checklist.bcc") || "",
  };
}

// open default mail client
export function openEmail(subject, body) {
  const { to, cc, bcc } = getRecipients();

  let mailto = "mailto:" + encodeURIComponent(to);
  const params = [];

  if (cc) params.push("cc=" + encodeURIComponent(cc));
  if (bcc) params.push("bcc=" + encodeURIComponent(bcc));
  if (subject) params.push("subject=" + encodeURIComponent(subject));
  if (body) params.push("body=" + encodeURIComponent(body));

  if (params.length) mailto += "?" + params.join("&");

  window.location.href = mailto;
}
