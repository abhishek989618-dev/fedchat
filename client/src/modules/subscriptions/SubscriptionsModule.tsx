import { useEffect, useMemo, useState } from 'react'
import { api } from '../../lib'

function qrUrl(upiId: string, name: string, amount: string) {
  const upi = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}${amount ? `&am=${encodeURIComponent(amount)}&cu=INR` : ''}`
  return `https://quickchart.io/qr?size=280&margin=1&text=${encodeURIComponent(upi)}`
}

export function SubscriptionsModule(){
  const [plans,setPlans]=useState<any[]>([])
  const [methods,setMethods]=useState<any[]>([])
  const [selected,setSelected]=useState<any>(null)
  const [transactionId,setTransactionId]=useState('')
  const [message,setMessage]=useState('')
  const [busy,setBusy]=useState(false)
  const method=useMemo(()=>methods.find(m=>m.isDefault&&m.isActive)||methods.find(m=>m.type==='UPI'&&m.isActive)||methods[0], [methods])
  useEffect(()=>{api.plans().then(r=>setPlans(r.data.plans||[])).catch(()=>{});api.paymentMethods().then(r=>setMethods(r.data.paymentMethods||[])).catch(()=>{})},[])
  const submit=async()=>{if(!selected||!method||!transactionId.trim()){setMessage('Select a plan, make the UPI payment, and enter the transaction/reference ID.');return}setBusy(true);setMessage('');try{await api.createPaymentRequest({planId:selected.id,paymentMethodId:method.id,transactionId:transactionId.trim()});setMessage('Payment submitted successfully. Admin verification is pending.');setTransactionId('')}catch(e){setMessage(e instanceof Error?e.message:'Unable to submit request')}finally{setBusy(false)}}
  return <div className="page-module billing-page"><div className="page-header"><div><h2>Plans & Billing</h2><p>UPI is the default payment method. Complete payment, then submit your transaction reference for manual verification.</p></div><span className="admin-badge">UPI BILLING</span></div><div className="stats-grid">{plans.map(p=><div className="stat-card billing-plan-card" key={p.id}><span>{p.name}</span><strong>₹{String(p.price)}</strong><small>{p.durationDays} days · {p.accessLevel}</small><button className="primary" onClick={()=>{setSelected(p);setMessage('')}}>Choose plan</button></div>)}</div>{selected&&method&&<div className="billing-card"><div className="billing-card-main"><div><span className="eyebrow">Selected plan</span><h3>{selected.name} · ₹{String(selected.price)}</h3><p>{selected.description || 'Full access to your selected plan.'}</p><div className="billing-payment-method"><div><strong>{method.name || 'UPI'}</strong><small>{method.upiId || method.paymentNumber || 'UPI ID not configured yet'}</small></div><span className="pending">Default</span></div><label><span>Transaction / UTR / reference ID</span><input value={transactionId} onChange={e=>setTransactionId(e.target.value)} placeholder="Enter the transaction reference after payment" /></label><button className="primary" disabled={busy} onClick={submit}>{busy?'Submitting…':'Submit payment for approval'}</button>{message&&<div className="notice"><span>{message}</span></div>}</div><div className="upi-qr-card"><span className="eyebrow">Scan & Pay</span>{method.upiId ? <><img className="upi-qr" src={qrUrl(method.upiId, method.name || 'FedChat', String(selected.price))} alt="UPI payment QR"/><strong>{method.upiId}</strong><small>Scan with any UPI app</small></> : <div className="notice"><span>Admin has not configured the UPI ID yet.</span></div>}</div></div></div>}</div>}