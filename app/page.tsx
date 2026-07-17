"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"

const CSS = `
  @keyframes serpentGlow {
    0%, 100% { filter: drop-shadow(0 0 6px #FFD100) drop-shadow(0 0 14px rgba(255,209,0,0.5)); }
    50%       { filter: drop-shadow(0 0 14px #FFD100) drop-shadow(0 0 28px rgba(255,209,0,0.75)) drop-shadow(0 0 48px rgba(255,209,0,0.25)); }
  }
  @keyframes waterfallShimmer {
    0%, 100% { opacity: 0.75; }
    50%       { opacity: 1; }
  }
  @keyframes mistPulse {
    0%, 100% { opacity: 0.28; transform: scaleX(1); }
    50%       { opacity: 0.48; transform: scaleX(1.1); }
  }
  @keyframes twinkle {
    0%, 100% { opacity: 0.15; transform: scale(1); }
    50%       { opacity: 0.95; transform: scale(1.5); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes subtleFloat {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-8px); }
  }
  .anim-glow    { animation: serpentGlow 3.2s ease-in-out infinite; }
  .anim-water   { animation: waterfallShimmer 1.8s ease-in-out infinite; }
  .anim-mist    { animation: mistPulse 4s ease-in-out infinite; }
  .anim-float   { animation: subtleFloat 6s ease-in-out infinite; }
  .fade-1 { animation: fadeUp 0.9s ease-out 0.05s both; }
  .fade-2 { animation: fadeUp 0.9s ease-out 0.25s both; }
  .fade-3 { animation: fadeUp 0.9s ease-out 0.45s both; }
  .fade-4 { animation: fadeUp 0.9s ease-out 0.65s both; }
  .card-hover:hover {
    background: rgba(255,255,255,0.06) !important;
    border-color: rgba(255,209,0,0.2) !important;
    transform: translateY(-2px);
    transition: all 0.25s ease;
  }
  .btn-primary:hover { box-shadow: 0 0 50px rgba(255,209,0,0.5) !important; transform: translateY(-1px); }
  .btn-ghost:hover { border-color: rgba(255,255,255,0.35) !important; color: #fff !important; }
  .mobile-menu-btn { display: none; }
  .nav-links {
    display: flex;
    align-items: center;
    gap: 18px;
  }
  .mobile-nav-open { display: flex !important; }
  @media (max-width: 768px) {
    .hero-flex { flex-direction: column !important; }
    .hero-text { font-size: 2.2rem !important; letter-spacing: -1px !important; }
    .hero-sub { font-size: 1rem !important; }
    .features-grid { grid-template-columns: 1fr !important; }
    .pricing-grid { grid-template-columns: 1fr !important; }
    .stats-grid { grid-template-columns: 1fr 1fr !important; }
    #precios, #suscripciones { padding: 56px 20px !important; }
    .nav-links { display: none !important; }
    .nav-links.mobile-nav-open { display: flex !important; flex-direction: column !important; position: fixed !important; top: 60px !important; left: 0 !important; right: 0 !important; background: rgba(4,7,17,0.97) !important; padding: 20px 24px !important; gap: 16px !important; z-index: 198 !important; border-bottom: 1px solid rgba(255,209,0,0.12) !important; }
    .mobile-menu-btn { display: flex !important; }
    .hero-svgs { display: none !important; }
    .hero-badge-row { flex-direction: column !important; align-items: flex-start !important; }
    .hero-section { padding: 88px 20px 40px !important; }
    .hero-left { flex: 0 0 100% !important; padding-right: 0 !important; }
    .cta-buttons { flex-direction: column !important; }
    .cta-buttons a { text-align: center !important; justify-content: center !important; }
    .section-pad { padding: 56px 20px !important; }
    .footer-pad { padding: 28px 20px !important; }
    .footer-links { flex-wrap: wrap !important; gap: 16px !important; }
    .final-cta-btn { display: block !important; padding: 16px 24px !important; }
  }
  @media (min-width: 769px) and (max-width: 1024px) {
    .features-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .hero-text { font-size: 2.8rem !important; }
    .hero-section { padding: 88px 28px 40px !important; }
    .section-pad { padding: 72px 28px !important; }
  }
`

const STARS = [
  {x:4,y:7,r:1,d:0},{x:11,y:22,r:0.7,d:0.4},{x:19,y:4,r:1.1,d:0.9},{x:33,y:14,r:0.8,d:1.4},
  {x:47,y:3,r:1,d:0.2},{x:59,y:19,r:0.6,d:0.7},{x:71,y:7,r:1.2,d:1.1},{x:84,y:17,r:0.7,d:0.5},
  {x:91,y:4,r:0.9,d:1.7},{x:14,y:38,r:0.6,d:1.9},{x:77,y:34,r:0.8,d:0.3},{x:54,y:44,r:0.7,d:1.5},
  {x:27,y:53,r:0.5,d:0.8},{x:67,y:49,r:1,d:1.0},{x:89,y:41,r:0.6,d:2.1},{x:2,y:59,r:0.8,d:0.6},
  {x:41,y:61,r:0.6,d:1.3},{x:81,y:64,r:0.9,d:0.1},{x:96,y:28,r:0.7,d:1.6},{x:37,y:30,r:0.5,d:2.3},
]

// 7 stars of Venezuela in arc — one per province that signed independence
// Arc centered at (56,50) in a 112×100 viewBox, radius ~32
const VE7 = Array.from({length:7},(_,i)=>{
  const a = (-160 + i * (320/6)) * (Math.PI/180)
  return {cx: 56 + 32*Math.cos(a), cy: 50 + 18*Math.sin(a)}
})

function StarPoly({cx,cy,r=5}:{cx:number,cy:number,r?:number}) {
  const pts = Array.from({length:10},(_,i)=>{
    const a = (i*36-90)*(Math.PI/180)
    const ri = i%2===0 ? r : r*0.42
    return `${cx+ri*Math.cos(a)},${cy+ri*Math.sin(a)}`
  }).join(' ')
  return <polygon points={pts} fill="white"/>
}

function RodOfAsclepius({size=130}:{size?:number}) {
  return (
    <svg width={size} height={size*1.55} viewBox="0 0 100 155" fill="none" className="anim-glow">
      <defs>
        <filter id="gf" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {/* Staff */}
      <rect x="47.5" y="5" width="5" height="145" rx="2.5" fill="#D4A017" filter="url(#gf)"/>
      <ellipse cx="50" cy="5" rx="5.5" ry="4" fill="#FFD100" filter="url(#gf)"/>
      <ellipse cx="50" cy="150" rx="4.5" ry="3.5" fill="#D4A017" filter="url(#gf)"/>
      {/* Serpent — single coil, no wings */}
      <path
        d="M50 22 C72 28,74 46,50 58 C26 70,28 88,50 100 C72 112,74 128,50 140"
        stroke="#FFD100" strokeWidth="4" strokeLinecap="round" fill="none" filter="url(#gf)"
      />
      {/* Serpent head */}
      <ellipse cx="50" cy="19" rx="8" ry="6" fill="#FFD100" filter="url(#gf)" transform="rotate(-8 50 19)"/>
      <circle cx="54" cy="16" r="1.8" fill="#040711"/>
      <circle cx="55" cy="15.5" r="0.6" fill="rgba(255,255,255,0.6)"/>
      {/* Tongue */}
      <path d="M56 18 L62 14 M56 18 L63 17" stroke="#CF142B" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

function RodSmall() {
  return (
    <svg width="26" height="38" viewBox="0 0 100 155" fill="none">
      <rect x="47.5" y="5" width="5" height="145" rx="2.5" fill="#FFD100"/>
      <path d="M50 22 C70 28,72 46,50 58 C28 70,30 88,50 100 C70 112,72 128,50 140"
        stroke="#FFD100" strokeWidth="5" strokeLinecap="round" fill="none"/>
      <ellipse cx="50" cy="19" rx="8" ry="6" fill="#FFD100" transform="rotate(-8 50 19)"/>
    </svg>
  )
}

function AngelFalls() {
  return (
    <svg viewBox="0 0 400 620" fill="none" style={{width:"100%",height:"100%",maxHeight:"88vh"}}>
      <defs>
        <linearGradient id="wfGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.95"/>
          <stop offset="35%" stopColor="#38bdf8"/>
          <stop offset="75%" stopColor="#0ea5e9" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.6"/>
        </linearGradient>
        <linearGradient id="tepuyGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0d1629"/>
          <stop offset="60%" stopColor="#162038"/>
          <stop offset="100%" stopColor="#1e2d4a"/>
        </linearGradient>
        <radialGradient id="skyGlow" cx="70%" cy="20%" r="55%">
          <stop offset="0%" stopColor="#003087" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="transparent" stopOpacity="0"/>
        </radialGradient>
        <filter id="mistF" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="10"/>
        </filter>
        <filter id="wfGlow" x="-40%" y="-10%" width="180%" height="120%">
          <feGaussianBlur stdDeviation="2.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="cloudF">
          <feGaussianBlur stdDeviation="5"/>
        </filter>
      </defs>

      {/* Sky glow */}
      <rect width="400" height="620" fill="url(#skyGlow)"/>

      {/* Cloud wisps near top */}
      <ellipse cx="320" cy="40" rx="60" ry="15" fill="white" opacity="0.04" filter="url(#cloudF)"/>
      <ellipse cx="350" cy="60" rx="40" ry="10" fill="white" opacity="0.03" filter="url(#cloudF)"/>

      {/* ── AUYÁN-TEPUI MAIN SILHOUETTE ── */}
      {/* The massive flat-topped sandstone cliff */}
      <path
        d="
          M0 620
          L0 158 L4 150 L9 142 L14 138 L18 132 L22 128
          L28 122 L34 118 L40 114 L47 110 L54 106
          L62 101 L70 97  L79 93  L90 89
          L102 85 L116 81 L132 77 L149 73
          L167 69 L185 65 L200 62 L212 59
          L220 57 L228 55 L234 53 L240 52
          L246 53 L252 55 L257 57
          L262 56 L267 53 L272 51
          L278 52 L283 55 L288 57
          L293 56 L298 53
          L302 51 L306 49 L309 47 L312 45
          L315 47 L317 49 L319 52
          L322 54 L325 52 L328 49
          L330 52 L333 56 L336 58
          L338 56 L340 53 L342 57
          L345 62 L348 75 L350 100
          L351 140 L352 180 L353 230
          L355 290 L357 350 L360 410
          L364 460 L370 510 L378 560
          L400 620 Z
        "
        fill="url(#tepuyGrad)"
      />

      {/* Tepuy left face — darker, to give depth */}
      <path
        d="
          M0 620 L0 158 L4 150 L9 142 L14 138 L18 132 L22 128
          L28 122 L34 118 L40 114 L47 110 L54 106
          L62 101 L70 97 L79 93 L90 89 L102 85
          L116 81 L132 77 L149 73 L167 69
          L185 65 L200 62 L200 620 Z
        "
        fill="#0a1220"
      />

      {/* Tepuy top surface texture — subtle lighter strip */}
      <path
        d="
          M240 52 L246 53 L252 55 L257 57
          L262 56 L267 53 L272 51
          L278 52 L283 55 L288 57
          L293 56 L298 53 L302 51
          L306 49 L309 47 L312 45
          L315 47 L317 49 L319 52
          L322 54 L325 52 L328 49
          L330 52 L333 56 L336 58
          L338 56 L340 53 L342 57
          L345 62 L345 72
          L340 68 L336 68 L330 62
          L325 62 L319 62 L312 55
          L306 59 L298 63 L288 67
          L283 65 L272 61 L262 66
          L257 67 L252 65 L246 63
          L240 62 Z
        "
        fill="#1a2a42" opacity="0.7"
      />

      {/* ── WATERFALL ── */}
      {/* The notch/gap where the falls emerge */}
      <path d="M309 47 L312 45 L315 47 L317 52 L312 54 L309 52 Z"
        fill="#7dd3fc" opacity="0.9"/>

      {/* Main waterfall — tall and narrow, the full height */}
      <rect x="310" y="44" width="5" height="418"
        fill="url(#wfGrad)" filter="url(#wfGlow)"
        className="anim-water"/>

      {/* Secondary spray strands */}
      <rect x="308" y="80"  width="1.5" height="340" fill="#bae6fd" opacity="0.35"/>
      <rect x="317" y="100" width="1.5" height="320" fill="#bae6fd" opacity="0.28"/>
      <rect x="306" y="150" width="1"   height="250" fill="#e0f2fe" opacity="0.2"/>

      {/* Waterfall splays at bottom */}
      <path d="M308 440 Q309 460 296 475 Q310 468 312.5 475 Q316 468 320 475 Q315 460 315 440 Z"
        fill="url(#wfGrad)" opacity="0.65" className="anim-water"/>

      {/* Mist pool */}
      <ellipse cx="312" cy="478" rx="55" ry="18"
        fill="#bae6fd" filter="url(#mistF)" opacity="0.38"
        className="anim-mist"/>
      <ellipse cx="312" cy="484" rx="35" ry="11"
        fill="#7dd3fc" filter="url(#mistF)" opacity="0.22"
        className="anim-mist"/>
      <ellipse cx="312" cy="470" rx="20" ry="7"
        fill="#e0f2fe" filter="url(#mistF)" opacity="0.18"
        className="anim-mist"/>

      {/* ── BASE VEGETATION ── */}
      <path
        d="
          M0 620 L0 545
          Q18 535,22 520 Q28 510,35 515 Q42 505,48 498
          Q55 490,62 494 Q69 485,76 480 Q83 472,90 477
          Q98 468,106 464 Q116 456,126 461
          Q136 452,148 456 Q160 447,172 452
          Q185 442,198 447 Q212 438,224 442
          Q238 432,250 437 Q263 428,275 433
          Q288 424,300 428 Q308 422,315 425
          Q322 419,328 423 Q335 417,342 421
          L350 430 Q354 445,358 465
          Q363 490,368 515 Q374 540,380 565 L400 620 Z
        "
        fill="#080f1e"
      />

      {/* Foreground tree silhouettes */}
      <path
        d="M0 620 L0 570 Q10 560,16 550 Q20 545,18 540 Q24 535,28 528
           Q32 522,30 518 Q36 512,40 505 Q44 498,42 494 L48 490 L52 497
           Q56 504,54 508 Q60 502,64 495 Q68 488,66 484 L72 480 L76 487
           Q80 494,78 498 Q84 492,88 485 L92 490 L96 497
           Q100 504,100 510 L110 505 L120 512 L130 518
           L130 620 Z"
        fill="#050c1a"
      />
    </svg>
  )
}

const FEATURES = [
  {icon:"🏥",title:"Historia Clínica Digital",desc:"Expedientes completos con historial médico, diagnósticos CIE-10 y notas SOAP estructuradas.",accent:"#003087"},
  {icon:"💊",title:"Prescripciones Inteligentes",desc:"Genera recetas con alertas de interacciones medicamentosas y ajuste de dosis asistido por IA.",accent:"#003087"},
  {icon:"🤖",title:"IA Clínica Integrada",desc:"Asistente diagnóstico potenciado por Claude AI: sugerencias de tratamiento basadas en evidencia.",accent:"#FFD100"},
  {icon:"👤",title:"Portal del Paciente",desc:"Resultados de laboratorio, citas y prescripciones disponibles para el paciente desde su celular.",accent:"#003087"},
  {icon:"💳",title:"Facturación Multi-Moneda",desc:"Cobros en bolívares, dólares y otras divisas con tasas BCV actualizadas automáticamente.",accent:"#CF142B"},
]

const STATS = [
  {val:"100%",label:"Venezolano",sub:"Diseñado para la realidad y regulaciones médicas de Venezuela"},
  {val:"IA",label:"Diagnóstico Asistido",sub:"Sugerencias clínicas y alertas en tiempo real potenciadas por IA"},
  {val:"24/7",label:"Disponibilidad",sub:"Infraestructura en la nube con alta disponibilidad, siempre activo"},
]

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  // Close mobile menu on route change so tapping a link doesn't leave the
  // dropdown open over the next page.
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // SEO F4 (2026-07-06): JSON-LD structured data for rich Google results.
  // Rendered as <script type="application/ld+json"> in the HTML so search
  // engines + WhatsApp link previews can pick up Organization, MedicalBusiness
  // and FAQPage semantics. Mirrors the FAQ shown in the #suscripciones section
  // below — keep them in sync when editing copy.
  const SITE_URL = "https://www.medsysve.com"
  const jsonLdOrganization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "Yoguitech LLC",
    legalName: "Yoguitech LLC",
    url: SITE_URL,
    logo: `${SITE_URL}/logo-medsysve-stripe.jpg`,
    foundingDate: "2025-06-01",
    founder: { "@type": "Person", name: "Carlos Pierluissi" },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "yoguitech@gmail.com",
      availableLanguage: ["Spanish", "es-VE"],
      areaServed: { "@type": "Country", name: "Venezuela" },
    },
    sameAs: [],
    address: {
      "@type": "PostalAddress",
      addressCountry: "VE",
    },
  }
  const jsonLdMedicalBusiness = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    "@id": `${SITE_URL}/#medicalbusiness`,
    name: "MedSysVE",
    alternateName: "MedSysVE HCE",
    url: SITE_URL,
    description:
      "Historia Clínica Electrónica multi-tenant para médicos y clínicas en Venezuela. Recetas digitales, referidos, asistencia IA, facturación dual USD/Bs.",
    image: `${SITE_URL}/og-image.png`,
    logo: `${SITE_URL}/logo-medsysve-stripe.jpg`,
    parentOrganization: { "@id": `${SITE_URL}/#organization` },
    priceRange: "$$",
    currenciesAccepted: "USD, VES",
    paymentAccepted: "Transferencia, PagoMóvil, Zelle, Binance USDT, Stripe",
    areaServed: { "@type": "Country", name: "Venezuela" },
    availableLanguage: ["Spanish", "es-VE"],
    medicalSpecialty: ["GeneralPractice", "InternalMedicine"],
  }
  const jsonLdFaqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${SITE_URL}/#faqpage`,
    mainEntity: [
      {
        "@type": "Question",
        name: "¿Qué pasa si no pago a tiempo?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Tu cuenta sigue activa durante 7 días de gracia. Después pasa a modo lectura: los datos quedan pero no podés crear consultas nuevas, recetas ni citas. Ni se borra nada.",
        },
      },
      {
        "@type": "Question",
        name: "¿Puedo cambiar de plan en cualquier momento?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Sí. Upgrade/downgrade se promedia en el siguiente ciclo de cobro. Si pasás de Individual a Clínica, solo pagás la diferencia prorrateada.",
        },
      },
      {
        "@type": "Question",
        name: "¿Cómo cancelo?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Desde Configuración del consultorio → Suscripción → Cancelar. Sigue activa hasta el fin del período pagado. Sin preguntas, sin penalización.",
        },
      },
      {
        "@type": "Question",
        name: "¿Hay contrato de permanencia?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Mensual o trimestral, sin lock-in. Si cancelás, no se renueva y ya. Los datos quedan en la cuenta por 90 días por si querés volver.",
        },
      },
      {
        "@type": "Question",
        name: "¿Qué pasa con mis datos si dejo de pagar?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Después de 90 días de inactividad, los datos se archivan (anonimizados) según LOPDP. Si volvés antes, recuperás todo. Auditoría de accesos se preserva siempre.",
        },
      },
      {
        "@type": "Question",
        name: "¿Aceptan pagos en bolívares?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Sí, por transferencia bancaria o PagoMóvil. El precio en Bs se calcula a la tasa BCV del día. Escribinos a yoguitech@gmail.com para coordinar.",
        },
      },
    ],
  }

  return (
    <div style={{background:"#040711",minHeight:"100vh",color:"#fff",fontFamily:"inherit",overflowX:"hidden"}}>
      <style>{CSS}</style>

      {/* ── JSON-LD structured data (SEO F4) ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdMedicalBusiness) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaqPage) }}
      />

      {/* ── FLAG STRIPE ── */}
      <div style={{position:"fixed",top:0,left:0,right:0,zIndex:200,display:"flex",height:4}}>
        <div style={{flex:1,background:"#FFD100"}}/>
        <div style={{flex:1,background:"#003087"}}/>
        <div style={{flex:1,background:"#CF142B"}}/>
      </div>

      {/* ── NAV ── */}
      <nav style={{
        position:"fixed",top:4,left:0,right:0,zIndex:199,
        display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"13px 40px",
        background:"rgba(4,7,17,0.88)",
        backdropFilter:"blur(14px)",
        borderBottom:"1px solid rgba(255,209,0,0.12)"
      }}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {/* next/image + priority suppresses the auto-generated
              `<link rel="preload" as="image">` that was firing the
              "preloaded but not used within a few seconds" warning. */}
          <Image
            src="/logo-medsysve-mark.png"
            alt="MedSysVE"
            width={44}
            height={44}
            priority
            style={{
              filter: "drop-shadow(0 0 10px rgba(255,209,0,0.35))",
            }}
          />
          <span style={{fontSize:22,fontWeight:900,letterSpacing:"-0.5px"}}>
            <span style={{color:"#FFD100"}}>Med</span>
            <span style={{color:"#3B82F6"}}>Sys</span>
            <span style={{color:"#EF4444"}}>VE</span>
          </span>
        </div>
        <div className={`nav-links${mobileMenuOpen ? " mobile-nav-open" : ""}`}>
          <Link href="/portal/login" style={{
            color:"rgba(255,255,255,0.85)",textDecoration:"none",
            fontSize:15,fontWeight:500,
            display:"inline-flex",alignItems:"center",gap:6,
          }}>
            <span aria-hidden>🩺</span> Portal del Paciente
          </Link>
          <Link href="/login" style={{color:"rgba(255,255,255,0.85)",textDecoration:"none",fontSize:15,fontWeight:500}}>
            Iniciar Sesión
          </Link>
          <Link href="/register" className="btn-primary" style={{
            background:"#FFD100",color:"#040711",padding:"8px 22px",
            borderRadius:9,textDecoration:"none",fontSize:15,fontWeight:800,
            boxShadow:"0 0 20px rgba(255,209,0,0.25)",transition:"all 0.2s"
          }}>
            Registrarse
          </Link>
        </div>
        {/* Mobile hamburger button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(o => !o)}
          aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          style={{
            background:"none",border:"none",cursor:"pointer",
            display:"flex",flexDirection:"column",gap:5,padding:6,
            alignItems:"center",justifyContent:"center"
          }}
        >
          <span style={{display:"block",width:22,height:2,background:"#fff",borderRadius:2,transition:"all 0.2s",transform:mobileMenuOpen?"rotate(45deg) translate(5px,5px)":"none"}}/>
          <span style={{display:"block",width:22,height:2,background:"#fff",borderRadius:2,transition:"all 0.2s",opacity:mobileMenuOpen?0:1}}/>
          <span style={{display:"block",width:22,height:2,background:"#fff",borderRadius:2,transition:"all 0.2s",transform:mobileMenuOpen?"rotate(-45deg) translate(5px,-5px)":"none"}}/>
        </button>
      </nav>

      {/* ── HERO ── */}
      <section className="hero-section" style={{
        minHeight:"100vh",display:"flex",alignItems:"center",
        padding:"88px 40px 40px",position:"relative",overflow:"hidden"
      }}>
        {/* === VENEZUELAN FLAG — full background === */}
        <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column"}}>
          {/* Amarillo */}
          <div style={{flex:1,background:"#D4A900"}}/>
          {/* Azul con las 7 estrellas */}
          <div style={{flex:1,background:"#003087",position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg viewBox="0 0 112 100" style={{position:"absolute",width:"70%",maxWidth:680,opacity:0.9}}>
              {VE7.map((s,i)=><StarPoly key={i} cx={s.cx} cy={s.cy} r={5}/>)}
            </svg>
          </div>
          {/* Rojo */}
          <div style={{flex:1,background:"#CF142B"}}/>
        </div>

        {/* Dark overlay — radial: darker center (text readable), lighter edges (flag visible) */}
        <div style={{
          position:"absolute",inset:0,
          background:"radial-gradient(ellipse 90% 80% at 40% 50%, rgba(4,7,17,0.82) 0%, rgba(4,7,17,0.68) 55%, rgba(4,7,17,0.45) 100%)"
        }}/>

        {/* Extra glow on blue stripe area */}
        <div style={{
          position:"absolute",top:"33%",left:0,right:0,height:"34%",
          background:"rgba(0,48,135,0.12)",pointerEvents:"none"
        }}/>

        <div className="hero-flex" style={{display:"flex",width:"100%",maxWidth:1240,margin:"0 auto",alignItems:"center"}}>
          {/* LEFT — 56% */}
          <div className="hero-left" style={{flex:"0 0 56%",paddingRight:32}}>

            {/* Badge row */}
            <div className="fade-1 hero-badge-row" style={{display:"flex",alignItems:"flex-start",gap:20,marginBottom:28}}>
              <div className="anim-float">
                <RodOfAsclepius size={118}/>
              </div>
              <div style={{display:"flex",flexDirection:"column",justifyContent:"center",gap:10,paddingTop:12}}>
                <span style={{
                  display:"inline-flex",alignItems:"center",gap:6,
                  background:"rgba(255,209,0,0.09)",
                  border:"1px solid rgba(255,209,0,0.28)",
                  borderRadius:100,padding:"5px 14px",
                  fontSize:12.5,color:"#FFD100",fontWeight:700,
                  letterSpacing:"0.06em",textTransform:"uppercase"
                }}>
                  🇻🇪 Sistema EMR Venezolano
                </span>
                <span style={{
                  display:"inline-flex",alignItems:"center",gap:6,
                  background:"rgba(0,48,135,0.12)",
                  border:"1px solid rgba(96,165,250,0.2)",
                  borderRadius:100,padding:"5px 14px",
                  fontSize:12.5,color:"#93c5fd",fontWeight:600,
                  letterSpacing:"0.04em"
                }}>
                  ✦ Potenciado por Inteligencia Artificial
                </span>
              </div>
            </div>

            {/* Heading */}
            <h1 className="fade-2 hero-text" style={{
              fontSize:"clamp(52px,6.5vw,86px)",
              fontWeight:900,lineHeight:1.0,
              letterSpacing:"-2.5px",marginBottom:14
            }}>
              <span style={{color:"#FFD100",textShadow:"0 0 40px rgba(255,209,0,0.4)"}}>Med</span>
              <span style={{color:"#3B82F6",textShadow:"0 0 40px rgba(59,130,246,0.4)"}}>Sys</span>
              <span style={{color:"#EF4444",textShadow:"0 0 40px rgba(239,68,68,0.4)"}}>VE</span>
            </h1>

            <p className="fade-2" style={{
              fontSize:"clamp(17px,2.2vw,24px)",fontWeight:700,
              color:"rgba(255,255,255,0.88)",marginBottom:10,
              letterSpacing:"-0.3px"
            }}>
              La Medicina Venezolana en la Era Digital
            </p>

            <p className="fade-3 hero-sub" style={{
              fontSize:16.5,color:"rgba(255,255,255,0.48)",
              lineHeight:1.7,marginBottom:38,maxWidth:470
            }}>
              La plataforma EMR diseñada para el médico venezolano moderno.
              Historia clínica digital, prescripciones inteligentes, asistente de IA
              y facturación en bolívares — todo en un solo lugar.
            </p>

            {/* CTAs */}
            <div className="fade-4 cta-buttons" style={{display:"flex",gap:14,flexWrap:"wrap"}}>
              <Link href="/register" className="btn-primary" style={{
                background:"#FFD100",color:"#040711",
                padding:"14px 34px",borderRadius:11,
                textDecoration:"none",fontSize:16.5,fontWeight:900,
                display:"inline-flex",alignItems:"center",gap:8,
                boxShadow:"0 0 32px rgba(255,209,0,0.35)",
                transition:"all 0.2s",letterSpacing:"-0.2px"
              }}>
                Comenzar Ahora →
              </Link>
              <Link href="/login" className="btn-ghost" style={{
                color:"rgba(255,255,255,0.65)",
                padding:"14px 28px",borderRadius:11,
                textDecoration:"none",fontSize:16.5,fontWeight:600,
                border:"1px solid rgba(255,255,255,0.18)",
                display:"inline-flex",alignItems:"center",gap:8,
                transition:"all 0.2s"
              }}>
                Soy médico →
              </Link>
              <Link href="/portal/login" className="btn-portal" style={{
                color:"#FFD100",
                padding:"14px 28px",borderRadius:11,
                textDecoration:"none",fontSize:16.5,fontWeight:700,
                border:"1px solid rgba(255,209,0,0.45)",
                background:"rgba(255,209,0,0.06)",
                display:"inline-flex",alignItems:"center",gap:8,
                transition:"all 0.2s"
              }}>
                <span aria-hidden>🩺</span> Portal del Paciente →
              </Link>
            </div>
            <p className="fade-4" style={{
              marginTop:18,fontSize:13.5,color:"rgba(255,255,255,0.42)",
              maxWidth:520,lineHeight:1.55
            }}>
              ¿Ya tienes cuenta de paciente? Ingresa por el Portal para ver tus
              citas, recetas, resultados de laboratorio y mensajes con tu médico.
            </p>
          </div>

          {/* RIGHT — Angel Falls — 44% */}
          <div className="hero-svgs" style={{
            flex:"0 0 44%",
            display:"flex",justifyContent:"flex-end",alignItems:"center",
            position:"relative"
          }}>
            <AngelFalls/>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="section-pad" style={{
        padding:"88px 40px",
        background:"linear-gradient(180deg,#040711 0%,#060d1e 50%,#040711 100%)",
        position:"relative"
      }}>
        {/* Top divider */}
        <div style={{
          position:"absolute",top:0,left:"8%",right:"8%",height:1,
          background:"linear-gradient(90deg,transparent,rgba(255,209,0,0.3),rgba(96,165,250,0.3),transparent)"
        }}/>

        <div style={{maxWidth:1200,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:56}}>
            <p style={{color:"#FFD100",fontSize:12.5,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:10}}>
              Funcionalidades
            </p>
            <h2 style={{fontSize:"clamp(26px,4vw,42px)",fontWeight:900,letterSpacing:"-1px",marginBottom:14}}>
              Todo lo que necesita tu consultorio
            </h2>
            <p style={{color:"rgba(255,255,255,0.45)",fontSize:17,maxWidth:500,margin:"0 auto",lineHeight:1.6}}>
              Desde la consulta hasta la factura, MedSysVE cubre cada etapa de tu práctica médica.
            </p>
          </div>

          <div className="features-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:18}}>
            {FEATURES.map((f,i)=>(
              <div key={i} className="card-hover" style={{
                background:"rgba(255,255,255,0.03)",
                border:"1px solid rgba(255,255,255,0.07)",
                borderRadius:16,padding:"26px 26px 26px 30px",
                position:"relative",overflow:"hidden",
                transition:"all 0.25s ease"
              }}>
                <div style={{
                  position:"absolute",top:0,left:0,
                  width:3,height:"100%",
                  background:f.accent,borderRadius:"3px 0 0 3px"
                }}/>
                <div style={{fontSize:30,marginBottom:14}}>{f.icon}</div>
                <h3 style={{fontSize:17,fontWeight:800,marginBottom:9,color:"#fff",letterSpacing:"-0.2px"}}>{f.title}</h3>
                <p style={{fontSize:14.5,color:"rgba(255,255,255,0.48)",lineHeight:1.65}}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="section-pad" style={{padding:"80px 40px",background:"#040711"}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:52}}>
            <h2 style={{fontSize:"clamp(26px,4vw,42px)",fontWeight:900,letterSpacing:"-1px",marginBottom:12}}>
              ¿Por qué MedSysVE?
            </h2>
            <p style={{color:"rgba(255,255,255,0.4)",fontSize:16,maxWidth:420,margin:"0 auto"}}>
              Construido específicamente para los desafíos y oportunidades de la medicina venezolana.
            </p>
          </div>
          <div className="stats-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:40}}>
            {STATS.map((s,i)=>(
              <div key={i} style={{textAlign:"center",padding:"32px 20px",position:"relative"}}>
                {/* Glow dot */}
                <div style={{
                  width:4,height:4,borderRadius:"50%",
                  background:"#FFD100",margin:"0 auto 20px",
                  boxShadow:"0 0 12px #FFD100"
                }}/>
                <div style={{
                  fontSize:"clamp(44px,5.5vw,64px)",fontWeight:900,
                  letterSpacing:"-2px",marginBottom:8,
                  background:"linear-gradient(135deg,#FFD100 0%,#60a5fa 100%)",
                  WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"
                }}>
                  {s.val}
                </div>
                <div style={{fontSize:18,fontWeight:800,color:"#fff",marginBottom:8}}>{s.label}</div>
                <div style={{fontSize:14.5,color:"rgba(255,255,255,0.4)",lineHeight:1.6}}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{
        padding:"96px 40px",
        background:"linear-gradient(135deg,rgba(0,48,135,0.22) 0%,rgba(4,7,17,1) 45%,rgba(207,20,43,0.12) 100%)",
        position:"relative",overflow:"hidden"
      }}>
        {/* 7 stars watermark */}
        <svg style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",opacity:0.06,pointerEvents:"none"}}
          width="340" height="200" viewBox="0 0 112 100">
          {VE7.map((s,i)=><StarPoly key={i} cx={s.cx} cy={s.cy}/>)}
        </svg>

        {/* Glow */}
        <div style={{
          position:"absolute",top:"50%",left:"50%",
          transform:"translate(-50%,-50%)",
          width:600,height:300,
          background:"radial-gradient(ellipse, rgba(255,209,0,0.06) 0%, transparent 70%)",
          pointerEvents:"none"
        }}/>

        <div style={{maxWidth:680,margin:"0 auto",textAlign:"center",position:"relative"}}>
          <div style={{marginBottom:28,display:"flex",justifyContent:"center"}}>
            <div className="anim-float"><RodOfAsclepius size={88}/></div>
          </div>
          <h2 style={{
            fontSize:"clamp(28px,5vw,54px)",fontWeight:900,
            letterSpacing:"-1.5px",marginBottom:16,lineHeight:1.1
          }}>
            Únete a la medicina<br/>
            <span style={{color:"#FFD100"}}>del futuro</span>
          </h2>
          <p style={{fontSize:17.5,color:"rgba(255,255,255,0.5)",marginBottom:38,lineHeight:1.7}}>
            Moderniza tu consultorio hoy. Crea tu cuenta y comienza a
            digitalizar tu práctica médica en minutos, sin contratos ni costos ocultos.
          </p>
          <Link href="/register" className="btn-primary final-cta-btn" style={{
            background:"#FFD100",color:"#040711",
            padding:"16px 44px",borderRadius:13,
            textDecoration:"none",fontSize:18,fontWeight:900,
            display:"inline-block",
            boxShadow:"0 0 44px rgba(255,209,0,0.38)",
            letterSpacing:"-0.3px",transition:"all 0.2s"
          }}>
            Crear cuenta gratuita →
          </Link>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          PRECIOS — Carlos quiere esto en el landing público (2026-06-27).
       ════════════════════════════════════════════════════════════════════════ */}
      <section className="section-pad" id="precios" style={{
        padding:"96px 40px",
        background:"linear-gradient(180deg, transparent 0%, rgba(255,209,0,0.04) 100%)",
        borderTop:"1px solid rgba(255,209,0,0.12)",
        borderBottom:"1px solid rgba(255,209,0,0.12)",
      }}>
        <div style={{maxWidth:1180,margin:"0 auto"}}>
          <div className="fade-2" style={{textAlign:"center",marginBottom:48}}>
            <p style={{color:"#FFD100",fontSize:13,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>
              Planes simples
            </p>
            <h2 style={{color:"#fff",fontSize:42,fontWeight:700,letterSpacing:-1,lineHeight:1.1,margin:0}}>
              Pagos mensuales o trimestrales. Sin contratos forzosos.
            </h2>
            <p style={{color:"rgba(255,255,255,0.55)",fontSize:16,marginTop:12,maxWidth:640,marginLeft:"auto",marginRight:"auto"}}>
              Empieza con 14 días gratis. Cancela cuando quieras. Pagos en USD con tarjeta internacional.
            </p>
          </div>

          {/* Plan grid */}
          <div className="pricing-grid" style={{
            display:"grid",
            gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",
            gap:20,
          }}>
            {/* Individual Monthly */}
            <PricingCard
              tag="Para empezar"
              title="Individual"
              price="$25"
              period="USD / mes"
              cycle="Mensual"
              features={["1 médico", "Pacientes ilimitados", "Recetas + referidos + portal", "Soporte por email"]}
              cta="Empezar gratis"
              href="/register"
            />
            {/* Individual Quarterly */}
            <PricingCard
              tag="Ahorra 7%"
              title="Individual Trimestral"
              price="$70"
              period="USD / 3 meses"
              cycle="$23.33/mes efectivo"
              features={["1 médico", "Pacientes ilimitados", "Recetas + referidos + portal", "Soporte por email", "Ahorrás $5 vs mensual"]}
              cta="Empezar gratis"
              href="/register"
              highlight
            />
            {/* Clinic Monthly */}
            <PricingCard
              tag="Para equipos"
              title="Clínica"
              price="$60"
              period="USD / mes"
              cycle="2 médicos incluidos"
              features={["2 médicos incluidos", "Pacientes ilimitados", "Cada médico extra +$15/mes", "Dashboard de equipo", "Anuncios del consultorio"]}
              cta="Empezar gratis"
              href="/register"
            />
            {/* Clinic Quarterly */}
            <PricingCard
              tag="Ahorra 11%"
              title="Clínica Trimestral"
              price="$160"
              period="USD / 3 meses"
              cycle="2 médicos incluidos"
              features={["2 médicos incluidos", "Cada médico extra +$40/3m", "Dashboard de equipo", "Soporte prioritario", "Ahorrás $20 vs mensual"]}
              cta="Empezar gratis"
              href="/register"
              highlight
            />
          </div>

          {/* Médico extra (anexo) */}
          <div className="fade-3" style={{
            marginTop:32,
            borderRadius:14,
            border:"1px solid rgba(255,255,255,0.08)",
            background:"rgba(255,255,255,0.025)",
            padding:"20px 24px",
            display:"flex",
            alignItems:"center",
            justifyContent:"space-between",
            flexWrap:"wrap",
            gap:16,
          }}>
            <div>
              <p style={{color:"#fff",fontSize:16,fontWeight:600,margin:0}}>
                ¿Más de 2 médicos en la clínica?
              </p>
              <p style={{color:"rgba(255,255,255,0.55)",fontSize:14,margin:"4px 0 0"}}>
                Cada médico adicional se cobra aparte. Cancela o agrega cuando quieras.
              </p>
            </div>
            <div style={{display:"flex",gap:24,fontSize:14}}>
              <span style={{color:"rgba(255,255,255,0.85)"}}>
                <strong style={{color:"#FFD100"}}>+$15</strong> / mes · o{" "}
                <strong style={{color:"#FFD100"}}>+$40</strong> / 3 meses
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          SUSCRIPCIONES — modelo + FAQ (2026-06-27).
       ════════════════════════════════════════════════════════════════════════ */}
      <section className="section-pad" id="suscripciones" style={{
        padding:"96px 40px",
        background:"#040711",
      }}>
        <div style={{maxWidth:980,margin:"0 auto"}}>
          <div className="fade-2" style={{textAlign:"center",marginBottom:48}}>
            <p style={{color:"#FFD100",fontSize:13,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>
              Suscripciones
            </p>
            <h2 style={{color:"#fff",fontSize:42,fontWeight:700,letterSpacing:-1,lineHeight:1.1,margin:0}}>
              Cómo funcionan los cobros.
            </h2>
          </div>

          <div style={{
            display:"grid",
            gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",
            gap:18,
          }}>
            <FaqCard
              q="¿Qué pasa si no pago a tiempo?"
              a="Tu cuenta sigue activa durante 7 días de gracia. Después pasa a modo lectura: los datos quedan pero no podés crear consultas nuevas, recetas ni citas. Ni se borra nada."
            />
            <FaqCard
              q="¿Puedo cambiar de plan en cualquier momento?"
              a="Sí. Upgrade/downgrade se promedia en el siguiente ciclo de cobro. Si pasás de Individual a Clínica, solo pagás la diferencia prorrateada."
            />
            <FaqCard
              q="¿Cómo cancelo?"
              a="Desde Configuración del consultorio → Suscripción → Cancelar. Sigue activa hasta el fin del período pagado. Sin preguntas, sin penalización."
            />
            <FaqCard
              q="¿Hay contrato de permanencia?"
              a="No. Mensual o trimestral, sin lock-in. Si cancelás, no se renueva y ya. Los datos quedan en la cuenta por 90 días por si querés volver."
            />
            <FaqCard
              q="¿Qué pasa con mis datos si dejo de pagar?"
              a="Después de 90 días de inactividad, los datos se archivan (anonimizados) según LOPDP. Si volvés antes, recuperás todo. Auditoría de accesos se preserva siempre."
            />
            <FaqCard
              q="¿Aceptan pagos en bolívares?"
              a="Sí, por transferencia bancaria o PagoMóvil. El precio en Bs se calcula a la tasa BCV del día. Escribinos a yoguitech@gmail.com para coordinar."
            />
          </div>

          {/* CTA final */}
          <div className="fade-4" style={{textAlign:"center",marginTop:48}}>
            <Link
              href="/register"
              className="final-cta-btn"
              style={{
                display:"inline-block",
                background:"#FFD100",
                color:"#040711",
                padding:"14px 36px",
                borderRadius:10,
                textDecoration:"none",
                fontSize:16,
                fontWeight:800,
                boxShadow:"0 0 30px rgba(255,209,0,0.4)",
                transition:"all 0.2s",
              }}
            >
              Crear cuenta gratis (14 días) →
            </Link>
            <p style={{color:"rgba(255,255,255,0.4)",fontSize:12,marginTop:14}}>
              Sin tarjeta para el trial. Te cobramos solo cuando elijas un plan.
            </p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer-pad" style={{
        padding:"28px 40px",
        borderTop:"1px solid rgba(255,255,255,0.07)",
        background:"#030610"
      }}>
        {/* Mini flag */}
        <div style={{display:"flex",height:3,marginBottom:22,borderRadius:2,overflow:"hidden",maxWidth:80,margin:"0 auto 22px"}}>
          <div style={{flex:1,background:"#FFD100"}}/>
          <div style={{flex:1,background:"#003087"}}/>
          <div style={{flex:1,background:"#CF142B"}}/>
        </div>
        <p style={{color:"rgba(255,255,255,0.3)",fontSize:13.5,textAlign:"center",marginBottom:12}}>
          Hecho con ❤️ en Venezuela 🇻🇪 · MedSysVE © 2025 · Todos los derechos reservados
        </p>
        <div className="footer-links" style={{display:"flex",justifyContent:"center",gap:24,flexWrap:"wrap"}}>
          <Link href="/portal/login" style={{color:"rgba(255,209,0,0.55)",textDecoration:"none",fontSize:13,fontWeight:600}}>🩺 Portal del Paciente</Link>
          <Link href="/login"    style={{color:"rgba(255,255,255,0.28)",textDecoration:"none",fontSize:13}}>Iniciar SesiA3n</Link>
          <Link href="/register" style={{color:"rgba(255,255,255,0.28)",textDecoration:"none",fontSize:13}}>Registrarse</Link>
        </div>
      </footer>
    </div>
  )
}

// ─── Pricing card ────────────────────────────────────────────────────────
function PricingCard({
  tag,
  title,
  price,
  period,
  cycle,
  features,
  cta,
  href,
  highlight,
}: {
  tag: string
  title: string
  price: string
  period: string
  cycle: string
  features: string[]
  cta: string
  href: string
  highlight?: boolean
}) {
  return (
    <div
      className="card-hover fade-3"
      style={{
        borderRadius: 14,
        border: highlight ? "2px solid #FFD100" : "1px solid rgba(255,255,255,0.08)",
        background: highlight ? "rgba(255,209,0,0.06)" : "rgba(255,255,255,0.025)",
        padding: 28,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      {highlight && (
        <span
          style={{
            alignSelf: "flex-start",
            background: "#FFD100",
            color: "#040711",
            padding: "3px 10px",
            borderRadius: 999,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 1.2,
            textTransform: "uppercase",
          }}
        >
          Más popular
        </span>
      )}
      <p
        style={{
          color: "rgba(255,255,255,0.55)",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1.5,
          textTransform: "uppercase",
        }}
      >
        {tag}
      </p>
      <p style={{ color: "#fff", fontSize: 22, fontWeight: 700, margin: 0 }}>{title}</p>
      <div>
        <span style={{ color: "#fff", fontSize: 44, fontWeight: 800, letterSpacing: -1 }}>{price}</span>
        <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, marginLeft: 6 }}>{period}</span>
      </div>
      <p style={{ color: "#FFD100", fontSize: 13, fontWeight: 600, margin: 0 }}>{cycle}</p>
      <ul style={{ margin: "8px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
        {features.map((f, i) => (
          <li
            key={i}
            style={{ color: "rgba(255,255,255,0.78)", fontSize: 13, display: "flex", alignItems: "flex-start", gap: 8 }}
          >
            <span style={{ color: "#FFD100", flexShrink: 0 }}>✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href={href}
        style={{
          marginTop: 12,
          display: "block",
          textAlign: "center",
          background: highlight ? "#FFD100" : "transparent",
          color: highlight ? "#040711" : "#FFD100",
          border: highlight ? "none" : "1px solid #FFD100",
          padding: "11px 16px",
          borderRadius: 9,
          textDecoration: "none",
          fontSize: 14,
          fontWeight: 700,
        }}
      >
        {cta}
      </Link>
    </div>
  )
}

// ─── FAQ card ────────────────────────────────────────────────────────────
function FaqCard({ q, a }: { q: string; a: string }) {
  return (
    <div
      className="card-hover fade-3"
      style={{
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.025)",
        padding: "20px 22px",
      }}
    >
      <p style={{ color: "#fff", fontSize: 15, fontWeight: 600, margin: 0, marginBottom: 8 }}>{q}</p>
      <p style={{ color: "rgba(255,255,255,0.62)", fontSize: 13, lineHeight: 1.55, margin: 0 }}>{a}</p>
    </div>
  )
}
