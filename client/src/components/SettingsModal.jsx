// src/components/SettingsModal.jsx
import React, { useMemo, useState } from "react";
import { XMarkIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { loadSettings, saveSettings, SettingsStore } from "../store/settingsStore";

const Tab = { Users: "Users", Roles: "Roles", Auth: "Auth" };

export default function SettingsModal({ onClose }) {
  const [tab, setTab] = useState(Tab.Users);
  const [data, setData] = useState(loadSettings());

  const set = (updater) => {
    setData((prev) => saveSettings(typeof updater === "function" ? updater(prev) : updater));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* card */}
      <div className="relative w-[95vw] max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between px-5 py-3 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">Settings</h2>
            <span className="text-xs text-gray-500">Last updated: {new Date(data.meta.updatedAt).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => set(SettingsStore.reset())}
              className="text-xs px-2 py-1 border rounded hover:bg-gray-100"
              title="Reset to defaults"
            >
              Reset
            </button>
            <button onClick={onClose} className="p-2 rounded hover:bg-gray-200">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* tabs */}
        <div className="px-5 pt-3">
          <div className="flex gap-2">
            {Object.values(Tab).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 text-sm rounded border-b-2 ${
                  tab === t ? "border-blue-600 text-blue-700" : "border-transparent text-gray-600 hover:text-gray-800"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* body */}
        <div className="px-5 pb-5 pt-3 overflow-auto" style={{ maxHeight: "70vh" }}>
          {tab === Tab.Users && <UsersTab data={data} set={set} />}
          {tab === Tab.Roles && <RolesTab data={data} set={set} />}
          {tab === Tab.Auth && <AuthTab data={data} set={set} />}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Users ---------------- */

function UsersTab({ data, set }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState(data.roles[1]?.id ?? "r-user"); // default 'User'

  const add = () => {
    if (!name.trim() || !email.trim()) return;
    const id = "u-" + Math.random().toString(36).slice(2, 8);
    set((prev) => ({
      ...prev,
      users: [...prev.users, { id, name, email, role: roleId, status: "invited" }],
    }));
    setName(""); setEmail("");
  };

  const remove = (id) => set((prev) => ({ ...prev, users: prev.users.filter((u) => u.id !== id) }));

  const changeRole = (id, role) =>
    set((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === id ? { ...u, role } : u)),
    }));

  const roleName = (id) => data.roles.find((r) => r.id === id)?.name ?? "Unknown";

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Manage app users for **display/config** purposes (local only). Hook these actions to your backend later.
      </p>

      {/* Add user */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
        <div className="flex-1">
          <label className="block text-xs text-gray-600 mb-1">Name</label>
          <input className="w-full border rounded px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-gray-600 mb-1">Email</label>
          <input className="w-full border rounded px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Role</label>
          <select className="border rounded px-3 py-2" value={roleId} onChange={(e) => setRoleId(e.target.value)}>
            {data.roles.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
        <button onClick={add} className="inline-flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          <PlusIcon className="h-4 w-4" /> Add
        </button>
      </div>

      {/* table */}
      <table className="w-full text-sm border rounded overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-2 border-b">Name</th>
            <th className="text-left p-2 border-b">Email</th>
            <th className="text-left p-2 border-b">Role</th>
            <th className="text-left p-2 border-b">Status</th>
            <th className="p-2 border-b w-12"></th>
          </tr>
        </thead>
        <tbody>
          {data.users.map((u) => (
            <tr key={u.id} className="odd:bg-white even:bg-gray-50">
              <td className="p-2 border-b">{u.name}</td>
              <td className="p-2 border-b">{u.email}</td>
              <td className="p-2 border-b">
                <select className="border rounded px-2 py-1" value={u.role} onChange={(e) => changeRole(u.id, e.target.value)}>
                  {data.roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </td>
              <td className="p-2 border-b capitalize">{u.status}</td>
              <td className="p-2 border-b text-right">
                <button onClick={() => remove(u.id)} className="p-1 rounded hover:bg-red-50 text-red-600" title="Remove">
                  <TrashIcon className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
          {!data.users.length && (
            <tr><td colSpan="5" className="p-4 text-center text-gray-500">No users yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Roles ---------------- */

function RolesTab({ data, set }) {
  const [name, setName] = useState("");
  const [perm, setPerm] = useState("useApp");

  const addRole = () => {
    const id = "r-" + Math.random().toString(36).slice(2, 6);
    if (!name.trim()) return;
    set((prev) => ({ ...prev, roles: [...prev.roles, { id, name: name.trim(), permissions: [perm] }] }));
    setName("");
  };

  const togglePerm = (id, p) =>
    set((prev) => ({
      ...prev,
      roles: prev.roles.map((r) =>
        r.id === id
          ? {
              ...r,
              permissions: r.permissions.includes(p)
                ? r.permissions.filter((x) => x !== p)
                : [...r.permissions, p],
            }
          : r
      ),
    }));

  const remove = (id) => set((prev) => ({ ...prev, roles: prev.roles.filter((r) => r.id !== id) }));

  const allPerms = ["useApp", "manageUsers", "configureAuth"];

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Define simple roles and permissions (local only).</p>

      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
        <div className="flex-1">
          <label className="block text-xs text-gray-600 mb-1">Role name</label>
          <input className="w-full border rounded px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Initial permission</label>
          <select className="border rounded px-3 py-2" value={perm} onChange={(e) => setPerm(e.target.value)}>
            {allPerms.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <button onClick={addRole} className="inline-flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          <PlusIcon className="h-4 w-4" /> Add
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {data.roles.map((r) => (
          <div key={r.id} className="border rounded p-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">{r.name}</h4>
              <button onClick={() => remove(r.id)} className="p-1 rounded hover:bg-red-50 text-red-600" title="Remove">
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {allPerms.map((p) => (
                <label key={p} className="inline-flex items-center gap-2 border rounded px-2 py-1 text-sm">
                  <input
                    type="checkbox"
                    checked={r.permissions.includes(p)}
                    onChange={() => togglePerm(r.id, p)}
                  />
                  {p}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Auth (SSO + 2FA) ---------------- */

function AuthTab({ data, set }) {
  const { auth } = data;
  const [mode, setMode] = useState(auth.sso.mode);
  const [clientId, setClientId] = useState(auth.sso.aad.clientId);
  const [tenantId, setTenantId] = useState(auth.sso.aad.tenantId);
  const [twoFA, setTwoFA] = useState(auth.twoFA);

  const save = () =>
    set((prev) => ({
      ...prev,
      auth: {
        sso: { mode, aad: { clientId: clientId.trim(), tenantId: tenantId.trim() } },
        twoFA,
      },
    }));

  // (Optional) you can have your `strategies.ts` read these runtime overrides:
  //   localStorage.getItem('infrahub.settings.v1') => auth.sso.mode, clientId, tenantId, twoFA
  // so the login screen reflects these settings immediately without rebuilds.

  return (
    <div className="space-y-6">
      <div className="border rounded p-4">
        <h4 className="font-semibold mb-2">Single Sign-On</h4>
        <div className="flex flex-col sm:flex-row gap-3">
          <label className="text-sm flex items-center gap-2">
            <input type="radio" name="mode" value="local" checked={mode === "local"} onChange={() => setMode("local")} />
            Local password only
          </label>
          <label className="text-sm flex items-center gap-2">
            <input type="radio" name="mode" value="sso" checked={mode === "sso"} onChange={() => setMode("sso")} />
            SSO only
          </label>
          <label className="text-sm flex items-center gap-2">
            <input type="radio" name="mode" value="both" checked={mode === "both"} onChange={() => setMode("both")} />
            Both (show both buttons)
          </label>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Azure AD Client ID</label>
            <input className="w-full border rounded px-3 py-2" value={clientId} onChange={(e) => setClientId(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Azure AD Tenant ID</label>
            <input className="w-full border rounded px-3 py-2" value={tenantId} onChange={(e) => setTenantId(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="border rounded p-4">
        <h4 className="font-semibold mb-2">Two-Factor Authentication</h4>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={twoFA.enabled}
            onChange={(e) => setTwoFA((t) => ({ ...t, enabled: e.target.checked }))}
          />
          Require 2FA
        </label>

        <div className="mt-3 grid sm:grid-cols-3 gap-2 text-sm">
          {Object.entries(twoFA.methods).map(([k, v]) => (
            <label key={k} className="inline-flex items-center gap-2 border rounded px-2 py-1">
              <input
                type="checkbox"
                checked={v}
                onChange={(e) =>
                  setTwoFA((t) => ({ ...t, methods: { ...t.methods, [k]: e.target.checked } }))
                }
                disabled={!twoFA.enabled}
              />
              {methodLabel(k)}
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={save} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
        <span className="text-xs text-gray-500 self-center">
          These values are stored locally. Wire them to your backend/Key Vault for production.
        </span>
      </div>
    </div>
  );
}

function methodLabel(k) {
  if (k === "sms") return "Text message (SMS)";
  if (k === "totp") return "Authenticator app (TOTP)";
  if (k === "webauthn") return "Security key / Passkey (WebAuthn)";
  return k;
}
