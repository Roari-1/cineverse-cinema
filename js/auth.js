import { auth,db } from './firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { doc,setDoc,serverTimestamp,getDoc,updateDoc } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { toast,friendlyError,setButtonLoading,qs,initNav } from './utils.js';

export async function getProfile(uid){const snap=await getDoc(doc(db,'users',uid));return snap.exists()?snap.data():null}
export async function logout(){await signOut(auth);location.href='../index.html'.replace('../','')}

initNav();
const register=qs('#registerForm');
register?.addEventListener('submit',async e=>{e.preventDefault();const btn=qs('button[type=submit]',register);const fd=new FormData(register),name=fd.get('name').trim(),email=fd.get('email').trim(),phone=fd.get('phone').trim(),pw=fd.get('password'),confirm=fd.get('confirmPassword');if(!name||!email||!phone||!pw)return toast('Please complete all required fields.','error');if(pw.length<6)return toast('Password must contain at least 6 characters.','error');if(pw!==confirm)return toast('Passwords do not match.','error');try{setButtonLoading(btn,true,'Creating account...');const cred=await createUserWithEmailAndPassword(auth,email,pw);await setDoc(doc(db,'users',cred.user.uid),{uid:cred.user.uid,name,email,phone,role:'user',status:'active',createdAt:serverTimestamp()});toast('Account created successfully.');setTimeout(()=>location.href='index.html',600)}catch(err){toast(friendlyError(err),'error')}finally{setButtonLoading(btn,false)}});
const login=qs('#loginForm');
login?.addEventListener('submit',async e=>{e.preventDefault();const btn=qs('button[type=submit]',login),fd=new FormData(login);try{setButtonLoading(btn,true,'Signing in...');await signInWithEmailAndPassword(auth,fd.get('email').trim(),fd.get('password'));const next=new URLSearchParams(location.search).get('redirect');location.href=next||'index.html'}catch(err){toast(friendlyError(err),'error')}finally{setButtonLoading(btn,false)}});
qs('#forgotBtn')?.addEventListener('click',async()=>{const email=qs('#email')?.value?.trim();if(!email)return toast('Enter your email first.','error');try{await sendPasswordResetEmail(auth,email);toast('Password reset instructions have been sent if an account exists for this email.')}catch(err){toast(friendlyError(err),'error')}});
qs('#togglePassword')?.addEventListener('click',()=>{const p=qs('#password');if(p)p.type=p.type==='password'?'text':'password'});
onAuthStateChanged(auth,async user=>{document.querySelectorAll('[data-auth-only]').forEach(el=>el.classList.toggle('hidden',!user));document.querySelectorAll('[data-guest-only]').forEach(el=>el.classList.toggle('hidden',!!user));if(user){try{const p=await getProfile(user.uid);document.querySelectorAll('[data-admin-only]').forEach(el=>el.classList.toggle('hidden',p?.role!=='admin'))}catch{}}});
document.addEventListener('click',e=>{if(e.target.closest('[data-logout]'))logout()});
