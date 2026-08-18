import { useState } from 'react'
import { api, saveSession } from '../../lib'
import { useSiteSettings, useApplySiteSettings } from '../../hooks/useSiteSettings'

export function AuthModule({ onLogin }: { onLogin: () => void }) {
  const { settings } = useSiteSettings()
  useApplySiteSettings(settings)
  const [mode,setMode] = useState<'login'|'register'>('login')
  const [form,setForm] = useState({email:'',password:'',username:'',firstName:'',lastName:'',phone:''})
  const [error,setError] = useState(''); const [loading,setLoading] = useState(false)
  const update=(k:keyof typeof form,v:string)=>setForm(f=>({...f,[k]:v}))
  const submit=async(e:React.FormEvent)=>{e.preventDefault();setError('');setLoading(true);try{
    if(mode==='login'){const r=await api.login(form.email,form.password);saveSession(r.data);onLogin()}
    else {await api.register(form);setMode('login');setError('Registration successful. Please sign in.')}
  }catch(err){setError(err instanceof Error?err.message:'Request failed')}finally{setLoading(false)}}
  // const demo = async (email:string,password:string) => { setError(''); setLoading(true); try { const r=await api.login(email,password); saveSession(r.data); onLogin() } catch (err) { setError(err instanceof Error ? err.message : 'Login failed') } finally { setLoading(false) } }
  return <div className="auth-shell"><div className="auth-card">
    <div className="auth-brand"><span className="brand-mark">{settings.name.slice(0, 1).toUpperCase()}</span><div><strong>{settings.name}</strong><span>{settings.tagline}</span></div></div>
    <h1>{mode==='login'?'Welcome back':'Create your account'}</h1><p>{mode==='login'?'Sign in to continue to your conversations.':settings.description}</p>
    <form onSubmit={submit}>{mode==='register'&&<div className="form-grid"><input placeholder="First name" value={form.firstName} onChange={e=>update('firstName',e.target.value)} required/><input placeholder="Last name" value={form.lastName} onChange={e=>update('lastName',e.target.value)} required/><input placeholder="Username" value={form.username} onChange={e=>update('username',e.target.value)} required/><input placeholder="Phone (optional)" value={form.phone} onChange={e=>update('phone',e.target.value)}/></div>}<label>Email<input type="email" placeholder="you@example.com" value={form.email} onChange={e=>update('email',e.target.value)} required autoComplete="email"/></label><label>Password<input type="password" placeholder="Your password" value={form.password} onChange={e=>update('password',e.target.value)} required autoComplete={mode==='login'?'current-password':'new-password'}/></label><button className="primary auth-submit" disabled={loading}>{loading?'Please wait…':mode==='login'?'Sign in':'Create account'}</button></form>
    {settings.registrationEnabled && mode==='login'}
    {error&&<div className={error.startsWith('Registration')?'success':'error'}>{error}</div>}
    {settings.registrationEnabled && <button className="link-button" onClick={()=>{setMode(mode==='login'?'register':'login');setError('')}}>{mode==='login'?'Create an account':'Already have an account? Sign in'}</button>}
  </div></div>
}
