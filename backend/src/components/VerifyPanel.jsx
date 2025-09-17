import React, { useState } from 'react'

const API = import.meta.env.VITE_API || 'http://localhost:4000'

export default function VerifyPanel() {
  const [id, setId] = useState('')
  const [status, setStatus] = useState('verified')
  const [msg, setMsg] = useState('')

  async function verify() {
    // demo: logs in as demo and verifies
    const r = await fetch(API + '/auth/login', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email:'demo@example.com', password:'demopass123' })})
    const { token } = await r.json()
    const v = await fetch(`${API}/reports/${id}/verify`, { method:'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ status }) })
    const out = await v.json()
    setMsg(JSON.stringify(out))
  }

  return (
    <div>
      <h3 className="font-semibold mb-2">Official Verification (Demo)</h3>
      <div className="flex gap-2">
        <input className="border rounded p-2 flex-1" placeholder="Report ID" value={id} onChange={e=>setId(e.target.value)} />
        <select className="border rounded p-2" value={status} onChange={e=>setStatus(e.target.value)}>
          <option value="verified">verified</option>
          <option value="rejected">rejected</option>
          <option value="pending">pending</option>
        </select>
        <button className="px-3 rounded bg-emerald-500 text-white" onClick={verify}>Update</button>
      </div>
      {msg && <pre className="text-xs mt-2 bg-slate-100 p-2 rounded">{msg}</pre>}
    </div>
  )
}
