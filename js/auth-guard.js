import { auth,db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { doc,getDoc } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
export function requireAuth(){return new Promise(resolve=>onAuthStateChanged(auth,user=>{if(!user){const path=location.pathname.split('/').pop()+location.search;location.href='login.html?redirect='+encodeURIComponent(path);return}resolve(user)}))}
export function requireAdmin(){return new Promise(resolve=>onAuthStateChanged(auth,async user=>{if(!user){location.href='../login.html?redirect='+encodeURIComponent('admin/'+location.pathname.split('/').pop());return}const p=await getDoc(doc(db,'users',user.uid));if(!p.exists()||p.data().role!=='admin'){location.href='../index.html';return}resolve({user,profile:p.data()})}))}
