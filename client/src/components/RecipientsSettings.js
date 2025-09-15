import React, { useEffect, useState } from "react";

const keyTo = "checklist.to";
const keyCc = "checklist.cc";
const keyBcc = "checklist.bcc";

const parseList = (s) => (s || "").trim();
const isValidList = (s) =>
  !s || s.split(/[;,]\s*/).every(e => !e || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

export default function RecipientsSettings({ onClose }) {
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setTo(localStorage.getItem(keyTo) || "");
    setCc(localStorage.getItem(keyCc) || "");
    setBcc(localStorage.getItem(keyBcc) || "");
  }, []);

  const save = () => {
    if (!isValidList(to) || !isValidList(cc) || !isValidList(bcc)) {
      setMsg("Please separate emails with commas or semicolons. (Invalid address detected.)");
      return;
    }
    localStorage.setItem(keyTo, parseList(to));
    localStorage.setItem(keyCc, parseList(cc));
    localStorage.setItem(keyBcc, parseList(bcc));
    setMsg("Saved ✅");
    onClose?.();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-5 w-full max-w-lg">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Email Recipients</h2>
          <button className="text-gray-500 hover:text-black" onClick={onClose}>✕</button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Enter one or more emails separated by commas or semicolons.
        </p>

        <label className="block text-sm font-medium">To</label>
        <input className="w-full border rounded px-3 py-2 mb-3" value={to} onChange={(e)=>setTo(e.target.value)} placeholder="noc@panoptics.com; infra@panoptics.com" />

        <label className="block text-sm font-medium">CC</label>
        <input className="w-full border rounded px-3 py-2 mb-3" value={cc} onChange={(e)=>setCc(e.target.value)} placeholder="ops@panoptics.com" />

        <label className="block text-sm font-medium">BCC</label>
        <input className="w-full border rounded px-3 py-2 mb-4" value={bcc} onChange={(e)=>setBcc(e.target.value)} placeholder="" />

        {msg && <p className="text-sm text-red-600 mb-3">{msg}</p>}

        <div className="flex gap-3 justify-end">
          <button className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
}
