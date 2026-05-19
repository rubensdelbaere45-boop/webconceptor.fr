"use client";

import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import {
  ArrowRight, Check, Zap, Package, FileSpreadsheet, BarChart3,
  Users, ShieldCheck, ScanBarcode, Printer, DoorOpen, Scale,
  Bluetooth, Star, Leaf, Plus, Minus, Receipt,
  Search, Upload, ChevronDown,
} from "lucide-react";

/* ─── TOKENS ─────────────────────────────────────────── */
const B = { blue:"#4F46E5", dark:"#4338CA", soft:"#EEF2FF", green:"#059669", greenSoft:"#ECFDF5" };
const S: Record<string,string> = {
  "900":"#0F172A","800":"#1E293B","700":"#334155","600":"#475569",
  "500":"#64748B","400":"#94A3B8","300":"#CBD5E1","200":"#E2E8F0",
  "100":"#F1F5F9","50":"#F8FAFC","white":"#FFFFFF",
};
const F = { d:"'Outfit',sans-serif", b:"'IBM Plex Sans',sans-serif", m:"'JetBrains Mono',monospace" };
const elev = { boxShadow:"0 1px 2px rgba(15,23,42,.04),0 8px 24px -8px rgba(15,23,42,.08)" };
const sbrand = { boxShadow:"0 10px 30px -10px rgba(79,70,229,.45)" };

/* ─── DATA ───────────────────────────────────────────── */
const FEATURES = [
  { Icon:Zap,            t:"Encaissement éclair",   d:"Scan, panier, paiement, ticket en 3 gestes." },
  { Icon:Package,        t:"Catalogue intelligent", d:"Prix d'achat, vente, marge auto, TVA, stock min." },
  { Icon:FileSpreadsheet,t:"Import Excel/CSV",      d:"Glissez-déposez votre catalogue. Import massif." },
  { Icon:BarChart3,      t:"Dashboard temps réel",  d:"CA, marge, panier moyen, top ventes — instantanément." },
  { Icon:Users,          t:"Fidélité client",        d:"Base clients + points automatiques." },
  { Icon:ShieldCheck,    t:"PIN + lock auto",        d:"Verrouillage 6 chiffres après inactivité." },
];
const HARDWARE = [
  { Icon:ScanBarcode, label:"Scanner USB",        note:"WebHID" },
  { Icon:Printer,     label:"Imprimante ticket",  note:"WebUSB" },
  { Icon:DoorOpen,    label:"Tiroir caisse",      note:"ESC/POS" },
  { Icon:Scale,       label:"Balance",            note:"WebSerial" },
  { Icon:Bluetooth,   label:"Scanner Bluetooth",  note:"WebBluetooth" },
];
const PLANS = [
  { name:"Starter",  price:19, hl:false, features:["1 utilisateur","500 produits","Ticket PDF","Dashboard de base","Support email"], cta:"Démarrer" },
  { name:"Pro",      price:39, hl:true,  features:["5 utilisateurs","Catalogue illimité","Import Excel/CSV","Fidélité clients","Rapports avancés","Support prioritaire"], cta:"Choisir Pro" },
  { name:"Business", price:69, hl:false, features:["Utilisateurs illimités","Multi-magasins (bientôt)","Fournisseurs avancés","API & matériel","Manager dédié","SLA 99,9%"], cta:"Contacter" },
];
const FAQ = [
  { q:"Combien de temps dure l'essai gratuit ?",       a:"14 jours, sans carte bancaire. Vous accédez à toutes les fonctionnalités du plan Pro." },
  { q:"Sur quel matériel ça fonctionne ?",             a:"Caissio tourne sur tout navigateur moderne : Mac, PC, iPad, tablette Android. Scanner USB, Bluetooth, imprimante ESC/POS et tiroir caisse sont détectés automatiquement." },
  { q:"Comment fonctionne la détection du matériel ?", a:"Un bouton « Audit complet » dans la section Périphériques détecte vos appareils grâce aux API natives du navigateur. Aucune installation, aucun pilote." },
  { q:"Puis-je importer mon catalogue existant ?",     a:"Oui. Glissez votre fichier Excel ou CSV, prévisualisez, validez. Les catégories sont créées automatiquement." },
  { q:"Mes données sont-elles sécurisées ?",           a:"Authentification JWT en cookies httpOnly, PIN 6 chiffres, verrouillage automatique, isolation multi-tenant." },
  { q:"Puis-je changer d'offre à tout moment ?",      a:"Oui, basculez vers une offre supérieure ou inférieure quand vous voulez. Sans engagement." },
];
const TESTIMONIALS = [
  { q:"On encaisse deux fois plus vite. Les clients adorent.",      a:"Sophie L.", role:"Épicerie fine, Lyon" },
  { q:"L'import de mes 800 références s'est fait en 2 minutes.",   a:"Karim B.", role:"Boulangerie, Marseille" },
  { q:"Enfin une caisse claire, pas un truc d'usine à gaz.",       a:"Marie D.", role:"Snack-Tabac, Bordeaux" },
];
const DEMO = [
  { id:"1", name:"Croissant",     price:1.20, emoji:"🥐" },
  { id:"2", name:"Pain campagne", price:3.50, emoji:"🥖" },
  { id:"3", name:"Pain chocolat", price:1.40, emoji:"🍫" },
  { id:"4", name:"Café expresso", price:2.00, emoji:"☕" },
  { id:"5", name:"Eau 50cl",      price:1.00, emoji:"💧" },
  { id:"6", name:"Coca 33cl",     price:1.80, emoji:"🥤" },
  { id:"7", name:"Salade mixte",  price:4.50, emoji:"🥗" },
  { id:"8", name:"Sandwich",      price:3.90, emoji:"🥪" },
];

/* ─── LOGO ─────────────────────────────────────────── */
function Mark({ size=32 }:{ size?:number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect x="2" y="2" width="44" height="44" rx="11" fill="currentColor"/>
      <rect x="14" y="6" width="14" height="6" rx="1.5" fill="white" opacity=".95"/>
      <rect x="16" y="8" width="6" height="1.2" rx=".6" fill="currentColor" opacity=".4"/>
      <rect x="16" y="9.8" width="9" height="1.2" rx=".6" fill="currentColor" opacity=".4"/>
      <rect x="10" y="16" width="28" height="22" rx="3.5" fill="white"/>
      <rect x="14" y="20" width="20" height="6" rx="1.5" fill="currentColor" opacity=".15"/>
      <rect x="14" y="28" width="5" height="3" rx="1" fill="currentColor" opacity=".5"/>
      <rect x="21.5" y="28" width="5" height="3" rx="1" fill="currentColor" opacity=".5"/>
      <rect x="29" y="28" width="5" height="3" rx="1" fill="currentColor" opacity=".5"/>
      <rect x="14" y="33" width="5" height="3" rx="1" fill="currentColor" opacity=".5"/>
      <rect x="21.5" y="33" width="5" height="3" rx="1" fill="currentColor" opacity=".5"/>
      <rect x="29" y="33" width="5" height="3" rx="1" fill="#10B981"/>
    </svg>
  );
}

/* ─── FAQ ITEM ─────────────────────────────────────── */
function FAQItem({ q, a }:{ q:string; a:string }) {
  const [open,setOpen] = useState(false);
  return (
    <div style={{ background:S.white, border:`1px solid ${S[200]}`, borderRadius:12, marginBottom:8, overflow:"hidden" }}>
      <button onClick={()=>setOpen(!open)} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 20px", background:"none", border:"none", cursor:"pointer", textAlign:"left", gap:16 }}>
        <span style={{ fontFamily:F.b, fontWeight:600, fontSize:15, color:S[900] }}>{q}</span>
        <ChevronDown size={16} style={{ color:S[400], flexShrink:0, transition:"transform .2s", transform:open?"rotate(180deg)":"rotate(0)" }}/>
      </button>
      {open && <div style={{ padding:"0 20px 18px", fontFamily:F.b, fontSize:14, color:S[600], lineHeight:1.7 }}>{a}</div>}
    </div>
  );
}

/* ─── SCREEN MOCKUPS ─────────────────────────────────── */
function BrowserShell({ children }:{ children:React.ReactNode }) {
  return (
    <div style={{ position:"relative" }}>
      <div style={{ position:"absolute", inset:-16, background:B.soft, borderRadius:24, filter:"blur(32px)", opacity:.6 }}/>
      <div style={{ position:"relative", borderRadius:16, border:`1px solid ${S[200]}`, overflow:"hidden", background:S.white, ...elev }}>
        <div style={{ height:28, background:S[50], borderBottom:`1px solid ${S[200]}`, display:"flex", alignItems:"center", padding:"0 12px", gap:6 }}>
          {["#FCA5A5","#FCD34D","#6EE7B7"].map(c=><div key={c} style={{ width:9,height:9,borderRadius:"50%",background:c }}/>)}
        </div>
        {children}
      </div>
    </div>
  );
}

function POSMock() {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"130px 1fr 180px", height:300, fontFamily:F.b, fontSize:11 }}>
      <div style={{ background:S.white, borderRight:`1px solid ${S[200]}`, padding:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, color:B.blue, marginBottom:12 }}>
          <Mark size={18}/><span style={{ fontFamily:F.d, fontWeight:700, fontSize:11 }}>Caissio</span>
        </div>
        {["Caisse","Dashboard","Produits","Stock","Clients"].map((n,i)=>(
          <div key={n} style={{ padding:"6px 8px", borderRadius:6, fontSize:11, fontWeight:500, background:i===0?B.soft:"none", color:i===0?B.dark:S[500], marginBottom:2 }}>{n}</div>
        ))}
      </div>
      <div style={{ background:S[50], padding:8 }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:5 }}>
          {[["🥐","Croissant","1.20€"],["🥖","Pain","3.50€"],["☕","Café","2.00€"],["💧","Eau","1.00€"],["🥤","Coca","1.80€"],["🥗","Salade","4.50€"]].map(([e,n,p])=>(
            <div key={n} style={{ background:S.white, border:`1px solid ${S[200]}`, borderRadius:8, padding:7 }}>
              <div style={{ fontSize:18,marginBottom:3 }}>{e}</div>
              <div style={{ fontSize:10, fontWeight:600, color:S[900] }}>{n}</div>
              <div style={{ fontFamily:F.d, fontSize:11, fontWeight:700, color:B.blue }}>{p}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background:S.white, borderLeft:`1px solid ${S[200]}`, padding:10, display:"flex", flexDirection:"column" }}>
        <div style={{ fontFamily:F.d, fontWeight:700, fontSize:12, color:S[900], marginBottom:8 }}>Ticket</div>
        {[["🥐 Croissant","1.20€"],["☕ Café","2.00€"]].map(([n,p])=>(
          <div key={n} style={{ background:S[50], borderRadius:6, padding:"4px 8px", marginBottom:4, display:"flex", justifyContent:"space-between" }}>
            <span style={{ color:S[700], fontSize:10 }}>{n}</span>
            <span style={{ fontFamily:F.m, fontWeight:700, color:S[900], fontSize:10 }}>{p}</span>
          </div>
        ))}
        <div style={{ marginTop:"auto", borderTop:`1px solid ${S[200]}`, paddingTop:8 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <span style={{ fontSize:9, color:S[500], textTransform:"uppercase", letterSpacing:"0.1em" }}>Total</span>
            <span style={{ fontFamily:F.d, fontSize:15, fontWeight:900, color:B.blue }}>3.20€</span>
          </div>
          <div style={{ background:B.blue, borderRadius:6, height:26, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:S.white }}>Encaisser</div>
        </div>
      </div>
    </div>
  );
}

function DashMock() {
  return (
    <div style={{ padding:14, fontFamily:F.b, height:300, overflow:"hidden" }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, marginBottom:10 }}>
        {[["CA aujourd'hui","1 248 €","+12%"],["Panier moyen","18.40 €","+3%"],["Transactions","68","+8%"],["Stock faible","3 art.","⚠️"]].map(([l,v,d])=>(
          <div key={l} style={{ background:S[50], border:`1px solid ${S[200]}`, borderRadius:8, padding:8 }}>
            <div style={{ fontSize:9, color:S[500], textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>{l}</div>
            <div style={{ fontFamily:F.d, fontSize:13, fontWeight:800, color:S[900] }}>{v}</div>
            <div style={{ fontSize:10, color:B.green, fontWeight:600 }}>{d}</div>
          </div>
        ))}
      </div>
      <div style={{ background:S[50], border:`1px solid ${S[200]}`, borderRadius:8, padding:10 }}>
        <div style={{ fontSize:10, color:S[500], marginBottom:8 }}>CA des 7 derniers jours</div>
        <div style={{ display:"flex", alignItems:"flex-end", gap:4, height:70 }}>
          {[60,75,55,90,85,95,100].map((h,i)=>(
            <div key={i} style={{ flex:1, background:i===6?B.blue:B.soft, borderRadius:"2px 2px 0 0", height:`${h}%` }}/>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductsMock() {
  return (
    <div style={{ fontFamily:F.b, height:300, overflow:"hidden" }}>
      <div style={{ padding:"7px 14px", borderBottom:`1px solid ${S[200]}`, display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ flex:1, background:S[50], border:`1px solid ${S[200]}`, borderRadius:6, height:26, display:"flex", alignItems:"center", padding:"0 8px", gap:6 }}>
          <Search size={11} style={{ color:S[400] }}/><span style={{ fontSize:11, color:S[400] }}>Rechercher…</span>
        </div>
        <div style={{ background:B.blue, borderRadius:6, padding:"4px 10px", fontSize:11, fontWeight:700, color:S.white }}>+ Ajouter</div>
      </div>
      <table style={{ width:"100%", borderCollapse:"collapse" }}>
        <thead>
          <tr style={{ background:S[50] }}>
            {["Produit","Cat.","P.vente","Marge","Stock"].map(h=>(
              <th key={h} style={{ padding:"5px 10px", fontSize:9, fontWeight:600, color:S[500], textAlign:"left", textTransform:"uppercase", letterSpacing:"0.08em" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[["Croissant","Boulangerie","1.20€","65%","42"],["Pain campagne","Boulangerie","3.50€","58%","15"],["Café","Boissons","2.00€","72%","200"],["Coca 33cl","Boissons","1.80€","45%","48"]].map(([n,c,p,m,st])=>(
            <tr key={n} style={{ borderBottom:`1px solid ${S[100]}` }}>
              <td style={{ padding:"6px 10px", fontSize:11, fontWeight:600, color:S[900] }}>{n}</td>
              <td style={{ padding:"6px 10px", fontSize:11, color:S[500] }}>{c}</td>
              <td style={{ padding:"6px 10px", fontFamily:F.m, fontSize:11, fontWeight:700, color:B.blue }}>{p}</td>
              <td style={{ padding:"6px 10px", fontSize:11, color:B.green, fontWeight:600 }}>{m}</td>
              <td style={{ padding:"6px 10px", fontFamily:F.m, fontSize:11, color:S[700] }}>{st}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ImportMock() {
  return (
    <div style={{ padding:14, fontFamily:F.b, height:300 }}>
      <div style={{ border:`2px dashed ${B.soft}`, borderRadius:12, padding:20, textAlign:"center", marginBottom:12, background:B.soft }}>
        <Upload size={24} style={{ color:B.blue, margin:"0 auto 8px" }}/>
        <div style={{ fontFamily:F.d, fontWeight:700, fontSize:13, color:S[900], marginBottom:4 }}>Glissez votre fichier Excel ou CSV</div>
        <div style={{ fontSize:12, color:S[500] }}>ou cliquez pour choisir</div>
      </div>
      <div style={{ border:`1px solid ${S[200]}`, borderRadius:8, overflow:"hidden" }}>
        <div style={{ background:S[50], padding:"5px 10px", borderBottom:`1px solid ${S[200]}` }}>
          <span style={{ fontSize:10, fontWeight:600, color:S[500] }}>catalogue-2026.xlsx — 847 lignes détectées</span>
        </div>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr>{["Nom","Cat.","P.achat","P.vente"].map(h=><th key={h} style={{ padding:"5px 10px", fontSize:9, color:S[500], textAlign:"left", fontWeight:600, textTransform:"uppercase" }}>{h}</th>)}</tr></thead>
          <tbody>
            {[["Croissant","Boulangerie","0.40€","1.20€"],["Café expresso","Boissons","0.55€","2.00€"]].map(([n,...r])=>(
              <tr key={n} style={{ borderTop:`1px solid ${S[100]}` }}>
                <td style={{ padding:"5px 10px", fontSize:11, color:S[900], fontWeight:600 }}>{n}</td>
                {r.map(v=><td key={v} style={{ padding:"5px 10px", fontSize:11, color:S[700] }}>{v}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DevicesMock() {
  return (
    <div style={{ padding:14, fontFamily:F.b, height:300 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <span style={{ fontFamily:F.d, fontWeight:700, fontSize:13, color:S[900] }}>Périphériques</span>
        <div style={{ background:B.blue, color:S.white, borderRadius:6, padding:"4px 12px", fontSize:11, fontWeight:700 }}>Audit complet</div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
        {[
          { Icon:ScanBarcode, n:"Scanner USB",   s:"Connecté",   ok:true },
          { Icon:Printer,     n:"Imprimante",    s:"Connectée",  ok:true },
          { Icon:DoorOpen,    n:"Tiroir caisse", s:"ESC/POS",    ok:true },
          { Icon:Scale,       n:"Balance",       s:"Non trouvée",ok:false },
          { Icon:Bluetooth,   n:"Scanner BT",   s:"Connecté",   ok:true },
        ].map(({ Icon, n, s, ok })=>(
          <div key={n} style={{ border:`1px solid ${ok?"#D1FAE5":S[200]}`, background:ok?"#F0FDF4":S[50], borderRadius:10, padding:10, textAlign:"center" }}>
            <div style={{ width:32, height:32, borderRadius:8, background:ok?"#D1FAE5":S[100], display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 6px" }}>
              <Icon size={16} style={{ color:ok?B.green:S[400] }}/>
            </div>
            <div style={{ fontSize:10, fontWeight:700, color:S[900] }}>{n}</div>
            <div style={{ fontSize:9, color:ok?B.green:S[400], fontWeight:600, marginTop:2 }}>{s}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── PRODUCT SHOT ─────────────────────────────────── */
function ProductShot({ reverse, eyebrow, title, desc, bullets, mock }:{
  reverse?:boolean; eyebrow:string; title:string; desc:string; bullets:string[]; mock:React.ReactNode;
}) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:64, alignItems:"center", marginBottom:80, direction:reverse?"rtl":"ltr" }}>
      <div style={{ direction:"ltr" }}>
        <div style={{ fontFamily:F.b, fontSize:11, fontWeight:700, color:B.blue, textTransform:"uppercase", letterSpacing:"0.2em" }}>{eyebrow}</div>
        <h3 style={{ fontFamily:F.d, fontSize:"clamp(26px,2.5vw,36px)", fontWeight:700, letterSpacing:"-0.025em", color:S[900], margin:"12px 0 14px", lineHeight:1.15 }}>{title}</h3>
        <p style={{ fontFamily:F.b, fontSize:16, color:S[600], lineHeight:1.7, marginBottom:18 }}>{desc}</p>
        <ul style={{ listStyle:"none", display:"flex", flexDirection:"column", gap:9 }}>
          {bullets.map(b=>(
            <li key={b} style={{ display:"flex", alignItems:"flex-start", gap:8, fontFamily:F.b, fontSize:14, color:S[700] }}>
              <Check size={15} style={{ color:B.green, flexShrink:0, marginTop:2 }}/> {b}
            </li>
          ))}
        </ul>
      </div>
      <div style={{ direction:"ltr" }}><BrowserShell>{mock}</BrowserShell></div>
    </div>
  );
}

/* ─── PAGE ───────────────────────────────────────────── */
export default function CaissioPage() {
  const [cart, setCart] = useState<{id:string;name:string;price:number;emoji:string;qty:number}[]>([]);
  const [paid, setPaid] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [toast, setToast] = useState<string|null>(null);

  useEffect(()=>{
    const h = ()=>setScrolled(window.scrollY>20);
    window.addEventListener("scroll",h,{ passive:true });
    return ()=>window.removeEventListener("scroll",h);
  },[]);

  useEffect(()=>{
    if(!toast) return;
    const t = setTimeout(()=>setToast(null), 2500);
    return ()=>clearTimeout(t);
  },[toast]);

  const total = useMemo(()=>cart.reduce((s,i)=>s+i.price*i.qty,0),[cart]);

  const add = (p:typeof DEMO[0])=>{
    setPaid(false);
    setCart(c=>{ const f=c.find(i=>i.id===p.id); if(f) return c.map(i=>i.id===p.id?{...i,qty:i.qty+1}:i); return [...c,{...p,qty:1}]; });
  };
  const rem = (id:string)=>setCart(c=>c.map(i=>i.id===id?{...i,qty:i.qty-1}:i).filter(i=>i.qty>0));
  const checkout = ()=>{
    if(!cart.length) return;
    setPaid(true);
    setToast(`Vente démo encaissée : ${total.toFixed(2)} €`);
    setTimeout(()=>{ setCart([]); setPaid(false); },2500);
  };

  return (
    <div style={{ background:S.white, color:S[900], minHeight:"100vh", fontFamily:F.b }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::selection{background:${B.blue};color:#fff;}
        html{scroll-behavior:smooth;}
        .tac{transition:transform 90ms ease,background-color 150ms ease,box-shadow 150ms ease,border-color 150ms ease;}
        .tac:active{transform:scale(0.97);}
        .ch:hover{border-color:${B.blue}!important;box-shadow:0 10px 30px -10px rgba(79,70,229,.18);}
        @keyframes fp{0%,100%{opacity:1}50%{opacity:.4}}.fp{animation:fp 2s ease-in-out infinite;}
      `}</style>

      {/* TOAST */}
      {toast && (
        <div style={{ position:"fixed", bottom:28, right:28, zIndex:9999, background:B.green, color:S.white, fontFamily:F.b, fontWeight:700, fontSize:14, padding:"11px 20px", borderRadius:10, display:"flex", alignItems:"center", gap:8, boxShadow:"0 8px 32px rgba(0,0,0,.15)" }}>
          <Check size={15}/> {toast}
        </div>
      )}

      {/* NAV */}
      <header style={{ position:"fixed", top:0, left:0, right:0, zIndex:50, background:"rgba(255,255,255,.78)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", borderBottom:`1px solid ${scrolled?S[200]:"transparent"}`, transition:"border-color .3s" }}>
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 24px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <Link href="/caissio" style={{ display:"flex", alignItems:"center", gap:8, textDecoration:"none", color:B.blue }}>
            <Mark size={32}/><span style={{ fontFamily:F.d, fontWeight:700, fontSize:20, color:S[900], letterSpacing:"-0.025em" }}>Caissio</span>
          </Link>
          <nav style={{ display:"flex", alignItems:"center", gap:28 }}>
            {[["#demo","Essayer"],["#screens","Le produit"],["#hardware","Matériel"],["#pricing","Tarifs"],["#faq","FAQ"]].map(([h,l])=>(
              <a key={h} href={h} style={{ fontFamily:F.b, fontSize:14, fontWeight:500, color:S[600], textDecoration:"none", transition:"color .15s" }}
                onMouseEnter={e=>(e.currentTarget.style.color=S[900])}
                onMouseLeave={e=>(e.currentTarget.style.color=S[600])}>{l}</a>
            ))}
          </nav>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <Link href="/login" style={{ fontFamily:F.b, fontSize:14, fontWeight:500, color:S[600], textDecoration:"none" }}
              onMouseEnter={e=>(e.currentTarget.style.color=S[900])}
              onMouseLeave={e=>(e.currentTarget.style.color=S[600])}>Connexion</Link>
            <Link href="/register" data-testid="nav-register-cta" className="tac"
              style={{ fontFamily:F.b, fontWeight:700, fontSize:14, color:S.white, background:B.blue, padding:"8px 18px", borderRadius:10, textDecoration:"none", display:"inline-flex", alignItems:"center", ...sbrand, transition:"background .15s" }}
              onMouseEnter={e=>(e.currentTarget.style.background=B.dark)}
              onMouseLeave={e=>(e.currentTarget.style.background=B.blue)}>Essai gratuit</Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section style={{ position:"relative", paddingTop:128, paddingBottom:64, overflow:"hidden", background:"radial-gradient(circle at 10% 0%,rgba(79,70,229,.10),transparent 45%),radial-gradient(circle at 90% 100%,rgba(79,70,229,.06),transparent 45%),#fff" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(rgba(15,23,42,.05) 1px,transparent 1px)", backgroundSize:"22px 22px", opacity:.5, pointerEvents:"none" }}/>
        <div style={{ position:"relative", maxWidth:860, margin:"0 auto", padding:"0 24px", textAlign:"center" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, border:`1px solid ${S[200]}`, borderRadius:999, padding:"5px 14px", marginBottom:24 }}>
            <span className="fp" style={{ width:6, height:6, borderRadius:"50%", background:B.green, display:"inline-block" }}/>
            <span style={{ fontFamily:F.b, fontSize:11, fontWeight:700, color:S[600], textTransform:"uppercase", letterSpacing:"0.18em" }}>Caisse SaaS · Pensée en France</span>
          </div>
          <h1 style={{ fontFamily:F.d, fontSize:"clamp(44px,7vw,78px)", fontWeight:800, letterSpacing:"-0.035em", lineHeight:1.05, color:S[900], marginBottom:20 }}>
            La caisse intelligente<br/><span style={{ color:B.blue }}>pour les commerces qui avancent.</span>
          </h1>
          <p style={{ fontFamily:F.b, fontSize:20, color:S[600], maxWidth:580, margin:"0 auto 36px", lineHeight:1.65 }}>
            Encaissez plus vite, gérez votre stock en temps réel, fidélisez vos clients. Branchez votre matériel d'un clic.{" "}
            <strong style={{ color:S[900] }}>Sans installation, sans formation.</strong>
          </p>
          <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap", marginBottom:22 }}>
            <Link href="/register" data-testid="hero-cta-trial" className="tac"
              style={{ fontFamily:F.b, fontWeight:700, fontSize:16, color:S.white, background:B.blue, height:54, padding:"0 32px", borderRadius:12, textDecoration:"none", display:"inline-flex", alignItems:"center", gap:8, ...sbrand, transition:"background .15s" }}
              onMouseEnter={e=>(e.currentTarget.style.background=B.dark)}
              onMouseLeave={e=>(e.currentTarget.style.background=B.blue)}>
              Essai gratuit 14 jours <ArrowRight size={18}/>
            </Link>
            <a href="#demo" className="tac"
              style={{ fontFamily:F.b, fontWeight:700, fontSize:16, color:S[900], background:S.white, height:54, padding:"0 32px", borderRadius:12, textDecoration:"none", display:"inline-flex", alignItems:"center", border:`1px solid ${S[200]}`, transition:"background .15s" }}
              onMouseEnter={e=>(e.currentTarget.style.background=S[50])}
              onMouseLeave={e=>(e.currentTarget.style.background=S.white)}>
              Essayer en direct
            </a>
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"center", gap:"6px 18px" }}>
            {["Sans carte bancaire","Configuration 2 min","Annulation libre"].map(t=>(
              <span key={t} style={{ display:"inline-flex", alignItems:"center", gap:4, fontFamily:F.b, fontSize:11, fontWeight:600, color:S[500], textTransform:"uppercase", letterSpacing:"0.15em" }}>
                <Check size={12} style={{ color:B.green }}/>{t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* DEMO */}
      <section id="demo" style={{ padding:"64px 0", background:S.white, borderBottom:`1px solid ${S[100]}` }}>
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 24px" }}>
          <div style={{ textAlign:"center", maxWidth:540, margin:"0 auto 40px" }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:8, fontFamily:F.b, fontSize:11, fontWeight:700, color:B.blue, textTransform:"uppercase", letterSpacing:"0.2em", marginBottom:12 }}>
              <span className="fp" style={{ width:6,height:6,borderRadius:"50%",background:B.green,display:"inline-block" }}/> Essayez en direct
            </div>
            <h2 style={{ fontFamily:F.d, fontSize:"clamp(26px,3.5vw,42px)", fontWeight:700, letterSpacing:"-0.025em", color:S[900], lineHeight:1.1 }}>
              Encaissez votre première vente <span style={{ color:B.blue }}>maintenant</span>.
            </h2>
            <p style={{ marginTop:12, fontFamily:F.b, fontSize:16, color:S[600] }}>Touchez les produits, ajustez les quantités, validez. Comme dans la vraie caisse.</p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 360px", maxWidth:1100, margin:"0 auto", border:`1px solid ${S[200]}`, borderRadius:24, overflow:"hidden", background:S.white, ...elev }} data-testid="demo-grid">
            <div style={{ background:S[50], padding:20 }}>
              <div style={{ fontSize:11, fontWeight:600, color:S[500], textTransform:"uppercase", letterSpacing:"0.16em", marginBottom:12 }}>Choisissez un produit</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
                {DEMO.map(p=>(
                  <button key={p.id} onClick={()=>add(p)} data-testid={`demo-product-${p.id}`} className="tac ch"
                    style={{ background:S.white, border:`1px solid ${S[200]}`, borderRadius:14, padding:11, cursor:"pointer", textAlign:"left", display:"flex", flexDirection:"column", transition:"border-color .15s" }}>
                    <div style={{ aspectRatio:"1", background:S[50], borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, marginBottom:7 }}>{p.emoji}</div>
                    <div style={{ fontFamily:F.b, fontSize:12, fontWeight:600, color:S[900], overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</div>
                    <div style={{ fontFamily:F.d, fontSize:13, fontWeight:700, color:B.blue }}>{p.price.toFixed(2)} €</div>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ background:S.white, borderLeft:`1px solid ${S[200]}`, display:"flex", flexDirection:"column", minHeight:420 }}>
              <div style={{ height:54, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 18px", borderBottom:`1px solid ${S[200]}` }}>
                <span style={{ fontFamily:F.d, fontWeight:700, fontSize:15, color:S[900] }}>Ticket démo</span>
                {cart.length>0 && <button onClick={()=>setCart([])} style={{ fontFamily:F.b, fontSize:10, fontWeight:700, color:S[400], textTransform:"uppercase", letterSpacing:"0.15em", background:"none", border:"none", cursor:"pointer" }}>Vider</button>}
              </div>
              <div style={{ flex:1, overflowY:"auto", padding:11, display:"flex", flexDirection:"column", gap:7 }} data-testid="demo-cart">
                {cart.length===0 ? (
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:160, color:S[400], textAlign:"center", padding:24 }}>
                    <Receipt size={32} style={{ color:S[200], marginBottom:9 }}/>
                    <span style={{ fontFamily:F.b, fontSize:13 }}>Touchez un produit pour commencer.</span>
                  </div>
                ) : cart.map(item=>(
                  <div key={item.id} style={{ background:S[50], border:`1px solid ${S[100]}`, borderRadius:12, padding:11, display:"flex", alignItems:"center", gap:9 }}>
                    <span style={{ fontSize:20 }}>{item.emoji}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontFamily:F.b, fontSize:13, fontWeight:600, color:S[900], overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.name}</div>
                      <div style={{ fontFamily:F.m, fontSize:11, color:S[500] }}>{item.price.toFixed(2)} € × {item.qty}</div>
                    </div>
                    <button onClick={()=>rem(item.id)} style={{ width:29,height:29,borderRadius:8,border:`1px solid ${S[200]}`,background:S.white,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}><Minus size={12} style={{ color:S[500] }}/></button>
                    <span style={{ fontFamily:F.m, fontSize:12, width:20, textAlign:"center", color:S[900] }}>{item.qty}</span>
                    <button onClick={()=>add(item)} style={{ width:29,height:29,borderRadius:8,border:`1px solid ${S[200]}`,background:S.white,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}><Plus size={12} style={{ color:S[500] }}/></button>
                  </div>
                ))}
              </div>
              <div style={{ borderTop:`1px solid ${S[200]}`, padding:15, display:"flex", flexDirection:"column", gap:11 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <span style={{ fontFamily:F.b, fontSize:11, fontWeight:600, color:S[500], textTransform:"uppercase", letterSpacing:"0.16em" }}>Total</span>
                  <span style={{ fontFamily:F.d, fontSize:28, fontWeight:900, color:B.blue, letterSpacing:"-0.03em" }}>{total.toFixed(2)} €</span>
                </div>
                <button onClick={checkout} disabled={!cart.length} data-testid="demo-checkout" className="tac"
                  style={{ width:"100%", height:50, borderRadius:10, border:"none", cursor:cart.length?"pointer":"not-allowed", fontFamily:F.b, fontWeight:700, fontSize:15, color:S.white, background:paid?B.green:B.blue, opacity:!cart.length?.3:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8, ...sbrand }}>
                  {paid?<><Check size={16}/> Encaissé !</>:"Encaisser la démo"}
                </button>
                <p style={{ fontFamily:F.b, fontSize:12, color:S[400], textAlign:"center" }}>
                  👉 <Link href="/register" style={{ color:B.blue, textDecoration:"none", fontWeight:600 }}>Créer mon compte gratuit</Link> pour aller plus loin
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCT TOUR */}
      <section id="screens" style={{ padding:"96px 0", background:"rgba(248,250,252,.5)" }}>
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 24px" }}>
          <div style={{ maxWidth:560, marginBottom:56 }}>
            <div style={{ fontFamily:F.b, fontSize:11, fontWeight:700, color:B.blue, textTransform:"uppercase", letterSpacing:"0.2em", marginBottom:12 }}>Visite guidée</div>
            <h2 style={{ fontFamily:F.d, fontSize:"clamp(30px,4vw,50px)", fontWeight:700, letterSpacing:"-0.025em", color:S[900], lineHeight:1.1 }}>Découvrez le logiciel <span style={{ color:B.blue }}>en images.</span></h2>
            <p style={{ marginTop:14, fontFamily:F.b, fontSize:17, color:S[600] }}>Tout ce que vous voyez est réel. Pas de mockup.</p>
          </div>
          <ProductShot eyebrow="Module 01 — La caisse" title="Encaissez vos clients en quelques gestes."
            desc="Recherche instantanée, scan code-barres natif, panier latéral, paiement mixte espèces + carte avec rendu monnaie automatique."
            bullets={["Scan code-barres USB ou Bluetooth","Panier dynamique avec remise","Paiement mixte CB + espèces","Ticket PDF — ou pas, écologique"]}
            mock={<POSMock/>}/>
          <ProductShot reverse eyebrow="Module 02 — Le dashboard" title="Pilotez votre commerce d'un coup d'œil."
            desc="Suivez votre CA jour/semaine/mois, votre panier moyen, vos best-sellers, et recevez des alertes sur votre stock."
            bullets={["KPIs en temps réel","Évolution du CA sur 7 jours","Top produits du mois","Alertes ruptures & stock faible"]}
            mock={<DashMock/>}/>
          <ProductShot eyebrow="Module 03 — Le catalogue" title="Vos produits, parfaitement organisés."
            desc="Catégories, codes-barres, prix d'achat, prix de vente, TVA, stock. Marge brute calculée automatiquement."
            bullets={["CRUD complet et tactile","Marge brute auto","Alertes stock visuelles","Recherche & filtres"]}
            mock={<ProductsMock/>}/>
          <ProductShot reverse eyebrow="Module 04 — L'import" title="Vos 800 références chargées en 2 minutes."
            desc="Glissez votre fichier Excel ou CSV. Caissio détecte les colonnes, prévisualise, importe en masse."
            bullets={["Drag & drop Excel / CSV","Détection auto des colonnes","Prévisualisation avant import","Catégories créées toutes seules"]}
            mock={<ImportMock/>}/>
          <ProductShot eyebrow="Module 05 — Le matériel" title="Audit complet. Tout reconnu, en un clic."
            desc="Scanner code-barres, imprimante ticket ESC/POS, tiroir caisse, balance, scanner Bluetooth — tout détecté grâce aux API natives."
            bullets={["Bouton Audit complet unique","USB, HID, série, Bluetooth","Tiroir ouvert via imprimante ESC/POS","Aucun pilote à installer"]}
            mock={<DevicesMock/>}/>
        </div>
      </section>

      {/* HARDWARE */}
      <section id="hardware" style={{ padding:"80px 0", background:S.white, borderTop:`1px solid ${S[200]}`, borderBottom:`1px solid ${S[200]}` }}>
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 24px" }}>
          <div style={{ textAlign:"center", maxWidth:540, margin:"0 auto 48px" }}>
            <div style={{ fontFamily:F.b, fontSize:11, fontWeight:700, color:B.blue, textTransform:"uppercase", letterSpacing:"0.2em", marginBottom:12 }}>Matériel compatible</div>
            <h2 style={{ fontFamily:F.d, fontSize:"clamp(28px,3.5vw,44px)", fontWeight:700, letterSpacing:"-0.025em", color:S[900], lineHeight:1.1 }}>Détection automatique. <span style={{ color:B.blue }}>Zéro pilote.</span></h2>
            <p style={{ marginTop:14, fontFamily:F.b, fontSize:16, color:S[600] }}>Branchez. Cliquez sur <strong>Audit complet</strong>. Tout est trouvé.</p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, maxWidth:800, margin:"0 auto" }}>
            {HARDWARE.map(({ Icon,label,note })=>(
              <div key={label} className="ch" style={{ border:`1px solid ${S[200]}`, borderRadius:16, padding:20, textAlign:"center", background:S.white, transition:"border-color .15s,box-shadow .15s" }}>
                <div style={{ width:44,height:44,borderRadius:12,background:B.soft,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px" }}>
                  <Icon size={20} style={{ color:B.blue }}/>
                </div>
                <div style={{ fontFamily:F.d, fontWeight:700, fontSize:13, color:S[900] }}>{label}</div>
                <div style={{ fontFamily:F.m, fontSize:9, color:S[400], marginTop:4, textTransform:"uppercase", letterSpacing:"0.12em" }}>{note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding:"96px 0" }}>
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 24px" }}>
          <div style={{ maxWidth:540, marginBottom:48 }}>
            <div style={{ fontFamily:F.b, fontSize:11, fontWeight:700, color:B.blue, textTransform:"uppercase", letterSpacing:"0.2em", marginBottom:12 }}>Fonctionnalités</div>
            <h2 style={{ fontFamily:F.d, fontSize:"clamp(30px,4vw,50px)", fontWeight:700, letterSpacing:"-0.025em", color:S[900], lineHeight:1.1 }}>Tout ce qu'il vous faut. <span style={{ color:B.blue }}>Rien de plus.</span></h2>
            <p style={{ marginTop:14, fontFamily:F.b, fontSize:17, color:S[600] }}>Un logiciel pensé pour les commerçants, pas pour les ingénieurs.</p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
            {FEATURES.map(({ Icon,t,d })=>(
              <div key={t} className="ch" style={{ border:`1px solid ${S[200]}`, borderRadius:16, padding:24, background:S.white, transition:"border-color .15s,box-shadow .15s" }}>
                <div style={{ width:44,height:44,borderRadius:12,background:B.soft,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16 }}>
                  <Icon size={20} style={{ color:B.blue }}/>
                </div>
                <div style={{ fontFamily:F.d, fontSize:18, fontWeight:700, color:S[900], marginBottom:8 }}>{t}</div>
                <div style={{ fontFamily:F.b, fontSize:14, color:S[600], lineHeight:1.65 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ECO */}
      <section style={{ padding:"64px 0", background:B.greenSoft }}>
        <div style={{ maxWidth:900, margin:"0 auto", padding:"0 24px", display:"flex", alignItems:"center", gap:24, flexWrap:"wrap" }}>
          <div style={{ width:64,height:64,borderRadius:16,background:S.white,border:"1px solid rgba(5,150,105,.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
            <Leaf size={28} style={{ color:B.green }}/>
          </div>
          <div>
            <div style={{ fontFamily:F.b, fontSize:11, fontWeight:700, color:B.green, textTransform:"uppercase", letterSpacing:"0.18em", marginBottom:8 }}>Geste écologique</div>
            <h3 style={{ fontFamily:F.d, fontSize:"clamp(20px,2.5vw,28px)", fontWeight:700, color:S[900], letterSpacing:"-0.025em", marginBottom:8 }}>Le ticket est demandé. Plus jamais imposé.</h3>
            <p style={{ fontFamily:F.b, fontSize:15, color:S[700], lineHeight:1.65 }}>Caissio propose au client son ticket : impression, e-mail, SMS, ou rien. Une seconde pour économiser des kilomètres de papier.</p>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding:"80px 0", background:"radial-gradient(circle at 10% 0%,rgba(79,70,229,.10),transparent 45%),radial-gradient(circle at 90% 100%,rgba(79,70,229,.06),transparent 45%),#fff" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 24px" }}>
          <div style={{ textAlign:"center", marginBottom:48 }}>
            <div style={{ fontFamily:F.b, fontSize:11, fontWeight:700, color:B.blue, textTransform:"uppercase", letterSpacing:"0.2em", marginBottom:12 }}>Ce qu'ils en disent</div>
            <h2 style={{ fontFamily:F.d, fontSize:"clamp(26px,3.5vw,40px)", fontWeight:700, letterSpacing:"-0.025em", color:S[900] }}>Des commerçants qui dorment mieux.</h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
            {TESTIMONIALS.map((t,i)=>(
              <div key={i} style={{ border:`1px solid ${S[200]}`, borderRadius:16, padding:24, background:S.white, ...elev }}>
                <div style={{ display:"flex", gap:2, marginBottom:12 }}>
                  {Array.from({length:5}).map((_,j)=><Star key={j} size={14} style={{ color:"#FBBF24", fill:"#FBBF24" }}/>)}
                </div>
                <p style={{ fontFamily:F.b, fontSize:15, fontWeight:500, color:S[800], lineHeight:1.65 }}>« {t.q} »</p>
                <div style={{ marginTop:16, paddingTop:16, borderTop:`1px solid ${S[100]}` }}>
                  <div style={{ fontFamily:F.b, fontSize:14, fontWeight:700, color:S[900] }}>{t.a}</div>
                  <div style={{ fontFamily:F.b, fontSize:12, color:S[500], marginTop:2 }}>{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding:"96px 0" }}>
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 24px" }}>
          <div style={{ textAlign:"center", maxWidth:460, margin:"0 auto 48px" }}>
            <div style={{ fontFamily:F.b, fontSize:11, fontWeight:700, color:B.blue, textTransform:"uppercase", letterSpacing:"0.2em", marginBottom:12 }}>Tarifs</div>
            <h2 style={{ fontFamily:F.d, fontSize:"clamp(30px,4vw,50px)", fontWeight:700, letterSpacing:"-0.025em", color:S[900], lineHeight:1.1 }}>Simple. <span style={{ color:B.blue }}>Sans surprise.</span></h2>
            <p style={{ marginTop:14, fontFamily:F.b, fontSize:16, color:S[600] }}>14 jours d'essai gratuit, sans carte bancaire.</p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:24, maxWidth:940, margin:"0 auto" }}>
            {PLANS.map(p=>(
              <div key={p.name} data-testid={`pricing-${p.name.toLowerCase()}`}
                style={{ position:"relative", border:`2px solid ${p.hl?B.blue:S[200]}`, borderRadius:24, padding:32, background:p.hl?B.soft:S.white, ...(p.hl?sbrand:{}) }}>
                {p.hl && (
                  <div style={{ position:"absolute", top:-14, left:"50%", transform:"translateX(-50%)", padding:"4px 14px", background:B.blue, color:S.white, borderRadius:999, fontFamily:F.b, fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.14em", whiteSpace:"nowrap" }}>Populaire</div>
                )}
                <div style={{ fontFamily:F.d, fontSize:22, fontWeight:700, color:S[900], marginBottom:16 }}>{p.name}</div>
                <div style={{ display:"flex", alignItems:"baseline", gap:4, marginBottom:24 }}>
                  <span style={{ fontFamily:F.d, fontSize:52, fontWeight:900, color:S[900], letterSpacing:"-0.04em" }}>{p.price}€</span>
                  <span style={{ fontFamily:F.b, fontSize:15, color:S[400] }}>/mois</span>
                </div>
                <ul style={{ listStyle:"none", display:"flex", flexDirection:"column", gap:11, marginBottom:32 }}>
                  {p.features.map(f=>(
                    <li key={f} style={{ display:"flex", alignItems:"flex-start", gap:8, fontFamily:F.b, fontSize:14, color:S[700] }}>
                      <Check size={15} style={{ color:B.green, flexShrink:0, marginTop:1 }}/>{f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" data-testid={`pricing-cta-${p.name.toLowerCase()}`} className="tac"
                  style={{ display:"flex", alignItems:"center", justifyContent:"center", height:46, borderRadius:10, fontFamily:F.b, fontWeight:700, fontSize:15, color:S.white, background:p.hl?B.blue:S[900], textDecoration:"none", transition:"background .15s" }}
                  onMouseEnter={e=>(e.currentTarget.style.background=p.hl?B.dark:S[800])}
                  onMouseLeave={e=>(e.currentTarget.style.background=p.hl?B.blue:S[900])}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ padding:"96px 0", background:S[50], borderTop:`1px solid ${S[200]}`, borderBottom:`1px solid ${S[200]}` }}>
        <div style={{ maxWidth:700, margin:"0 auto", padding:"0 24px" }}>
          <div style={{ textAlign:"center", marginBottom:48 }}>
            <div style={{ fontFamily:F.b, fontSize:11, fontWeight:700, color:B.blue, textTransform:"uppercase", letterSpacing:"0.2em", marginBottom:12 }}>FAQ</div>
            <h2 style={{ fontFamily:F.d, fontSize:"clamp(30px,4vw,48px)", fontWeight:700, letterSpacing:"-0.025em", color:S[900] }}>Questions fréquentes</h2>
          </div>
          {FAQ.map((f,i)=><FAQItem key={i} q={f.q} a={f.a}/>)}
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding:"96px 0" }}>
        <div style={{ maxWidth:760, margin:"0 auto", padding:"0 24px", textAlign:"center" }}>
          <h2 style={{ fontFamily:F.d, fontSize:"clamp(34px,5vw,64px)", fontWeight:900, letterSpacing:"-0.04em", color:S[900], lineHeight:1.05, marginBottom:20 }}>
            Lancez votre caisse en <span style={{ color:B.blue }}>2 minutes</span>.
          </h2>
          <p style={{ fontFamily:F.b, fontSize:18, color:S[600], marginBottom:36 }}>Aucune carte bancaire. Aucun risque. Juste un logiciel qui marche.</p>
          <Link href="/register" data-testid="footer-cta-trial" className="tac"
            style={{ display:"inline-flex", alignItems:"center", gap:8, height:54, padding:"0 40px", borderRadius:12, fontFamily:F.b, fontWeight:700, fontSize:16, color:S.white, background:B.blue, textDecoration:"none", ...sbrand, transition:"background .15s" }}
            onMouseEnter={e=>(e.currentTarget.style.background=B.dark)}
            onMouseLeave={e=>(e.currentTarget.style.background=B.blue)}>
            Commencer gratuitement <ArrowRight size={18}/>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding:"48px 0", borderTop:`1px solid ${S[200]}` }}>
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 24px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, color:B.blue }}>
            <Mark size={28}/><span style={{ fontFamily:F.d, fontWeight:700, fontSize:16, color:S[900] }}>Caissio</span>
            <span style={{ fontFamily:F.b, fontSize:13, color:S[400] }}>© 2026</span>
          </div>
          <span style={{ fontFamily:F.b, fontSize:11, color:S[500], textTransform:"uppercase", letterSpacing:"0.2em" }}>La caisse intelligente</span>
          <div style={{ display:"flex", gap:20 }}>
            {[["#","CGU"],["#","Confidentialité"],["mailto:contact@caissio.fr","Contact"]].map(([h,l])=>(
              <a key={l} href={h} style={{ fontFamily:F.b, fontSize:13, color:S[500], textDecoration:"none", transition:"color .15s" }}
                onMouseEnter={e=>(e.currentTarget.style.color=S[900])}
                onMouseLeave={e=>(e.currentTarget.style.color=S[500])}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
