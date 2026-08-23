import { useState } from 'react'
import { api, saveRememberedSession } from '../../lib'
import { useSiteSettings, useApplySiteSettings } from '../../hooks/useSiteSettings'

const countryCodes = [
  ['IN', '+91', 'India'], ['US', '+1', 'United States'], ['GB', '+44', 'United Kingdom'],
  ['AE', '+971', 'UAE'], ['AU', '+61', 'Australia'], ['CA', '+1', 'Canada'],
  ['DE', '+49', 'Germany'], ['FR', '+33', 'France'], ['JP', '+81', 'Japan'],
  ['SG', '+65', 'Singapore'], ['SA', '+966', 'Saudi Arabia'], ['PK', '+92', 'Pakistan'],
]

export function AuthModule({ onLogin }: { onLogin: () => void }) {
  const { settings } = useSiteSettings()
  useApplySiteSettings(settings)
  const [mode,setMode] = useState<'login'|'register'>('login')
  const [form,setForm] = useState({email:'',password:'',username:'',firstName:'',lastName:'',phone:'',countryCode:'+91'})
  const [remember,setRemember] = useState(true)
  const [error,setError] = useState(''); const [loading,setLoading] = useState(false)
  const update=(k:keyof typeof form,v:string)=>setForm(f=>({...f,[k]:v}))
  const submit=async(e:React.FormEvent)=>{e.preventDefault();setError('');setLoading(true);try{
    if(mode==='login'){
      const identifier = form.email.includes('@') ? form.email : (form.email.trim().startsWith('+') ? form.email.trim() : `${form.countryCode}${form.email.replace(/^0+/, '')}`)
      const r=await api.login(identifier,form.password)
      saveRememberedSession(r.data, remember); onLogin()
    } else {
      await api.register({...form, phone: form.phone ? `${form.countryCode}${form.phone.replace(/^0+/, '')}` : ''})
      setMode('login');setError('Registration successful. Please sign in.')
    }
  }catch(err){setError(err instanceof Error?err.message:'Request failed')}finally{setLoading(false)}}
  return <div className="auth-shell"><div className="auth-card">
    <div className="auth-brand"><span className="brand-mark">{settings.name.slice(0, 1).toUpperCase()}</span><div><strong>{settings.name}</strong><span>{settings.tagline}</span></div></div>
    <h1>{mode==='login'?'Welcome back':'Create your account'}</h1><p>{mode==='login'?'Sign in to continue to your conversations.':settings.description}</p>
    <form onSubmit={submit}>
      {mode==='register'&&<div className="form-grid">
        <input placeholder="First name (e.g. Abhishek)" value={form.firstName} onChange={e=>update('firstName',e.target.value)} required/>
        <input placeholder="Last name (e.g. Kumar)" value={form.lastName} onChange={e=>update('lastName',e.target.value)} required/>
        <label><span>Username</span><input placeholder="e.g. abhishek_123" value={form.username} onChange={e=>update('username',e.target.value)} required/></label>
        <div className="phone-field"><span>Phone number</span><div className="phone-row"><input list="country-codes" value={form.countryCode} onChange={e=>update('countryCode',e.target.value)} aria-label="Country code" placeholder="+91"/><input placeholder="e.g. 9876543210" value={form.phone} onChange={e=>update('phone',e.target.value)} required/></div><datalist id="country-codes">{countryCodes.map(([iso,code,name])=><option key={iso} value={code}>{name}</option>)}</datalist></div>
      </div>}
      <label>{mode==='login' ? 'Email or phone number' : 'Email'}
        {mode==='login' ? <div className="phone-row"><input list="country-codes-login" value={form.countryCode} onChange={e=>update('countryCode',e.target.value)} aria-label="Country code" placeholder="+91"/><input type="text" placeholder="you@example.com or 9876543210" value={form.email} onChange={e=>update('email',e.target.value)} required autoComplete="username"/></div>
        : <input type="email" placeholder="you@example.com" value={form.email} onChange={e=>update('email',e.target.value)} required autoComplete="email"/>}
      </label>
      {mode==='login' && <datalist id="country-codes-login">{countryCodes.map(([iso,code,name])=><option key={iso} value={code}>{name}</option>)}</datalist>}
      <label>Password<input type="password" placeholder="e.g. FedChat@1234 (8+ characters)" value={form.password} onChange={e=>update('password',e.target.value)} required autoComplete={mode==='login'?'current-password':'new-password'}/></label>
      {mode==='register' && <small className="auth-help">Username: 3–30 letters, numbers or underscores. Example: <strong>abhishek_123</strong>. Password example: <strong>FedChat@1234</strong>.</small>}
      {mode==='login' && <label className="remember-row"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/><span>Remember me on this device</span></label>}
      <button className="primary auth-submit" disabled={loading}>{loading?'Please wait…':mode==='login'?'Sign in':'Create account'}</button>
    </form>
    {error&&<div className={error.startsWith('Registration')?'success':'error'}>{error}</div>}
    {settings.registrationEnabled && <button className="link-button" onClick={()=>{setMode(mode==='login'?'register':'login');setError('')}}>{mode==='login'?'Create an account':'Already have an account? Sign in'}</button>}
  </div></div>
}
