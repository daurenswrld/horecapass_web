import { useState, useMemo, useEffect, useRef } from "react";
import {
  Search,
  Sun,
  Moon,
  MapPin,
  Briefcase,
  Clock,
  Wallet,
  Building2,
  Coffee,
  UtensilsCrossed,
  Hotel,
  Wine,
  ChefHat,
  Star,
  Sparkles,
  MessageSquare,
  FileText,
  LayoutDashboard,
  Users,
  Plus,
  ChevronRight,
  ChevronDown,
  X,
  Check,
  Send,
  Paperclip,
  Phone,
  Video,
  Play,
  Download,
  Upload,
  Mail,
  ArrowRight,
  Filter,
  GripVertical,
  MoreHorizontal,
  Bot,
  LifeBuoy,
  ShieldCheck,
  CalendarDays,
  GraduationCap,
  Award,
  User,
  Pencil,
  Eye,
  TrendingUp,
  ArrowUpRight,
  Bell,
  Languages,
  Kanban,
  Bookmark,
  CircleDot,
  Wand2,
  Copy,
  BadgeCheck,
  Globe,
} from "lucide-react";

/* ───────────────────────── THEME ───────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap');
.hp{
  --bg:#f5ede3; --sf:#fffdfa; --sf2:#f9f3ea; --bd:rgba(62,46,34,.12); --bd2:rgba(62,46,34,.2);
  --tx:#1d1916; --mu:#7b6f65; --mu2:#a79b90;
  --ac:#ae927b; --ac2:#8f7460; --acs:#ece1d4; --aci:#ffffff;
  --teal:#1f7a6d; --teals:#dcefea; --danger:#b5514f; --dangers:#f6e3e2;
  --sh:0 1px 2px rgba(62,46,34,.05),0 10px 30px -14px rgba(62,46,34,.22);
  --sh2:0 24px 60px -20px rgba(62,46,34,.35);
  font-family:'Inter',ui-sans-serif,system-ui,sans-serif; color:var(--tx); background:var(--bg);
  -webkit-font-smoothing:antialiased;
}
.hp[data-theme="dark"]{
  --bg:#151210; --sf:#1e1a17; --sf2:#26211c; --bd:rgba(245,237,227,.09); --bd2:rgba(245,237,227,.18);
  --tx:#f5ede3; --mu:#a89c90; --mu2:#6f665e;
  --ac:#c9ab92; --ac2:#ae927b; --acs:#2f2721; --aci:#1d1916;
  --teal:#3fb39f; --teals:#16332e; --danger:#d4736f; --dangers:#3a2222;
  --sh:0 1px 2px rgba(0,0,0,.4),0 10px 30px -14px rgba(0,0,0,.6);
  --sh2:0 24px 60px -20px rgba(0,0,0,.7);
}
.hp *{box-sizing:border-box}
.hp h1,.hp h2,.hp h3,.hp .disp{font-family:'Plus Jakarta Sans','Inter',sans-serif;letter-spacing:-0.02em}
.bg{background:var(--bg)} .sf{background:var(--sf)} .sf2{background:var(--sf2)}
.bd{border-color:var(--bd)} .bd2{border-color:var(--bd2)}
.tx{color:var(--tx)} .mu{color:var(--mu)} .mu2{color:var(--mu2)} .ac{color:var(--ac2)} .teal{color:var(--teal)}
.hp[data-theme="dark"] .ac{color:var(--ac)}
.card{background:var(--sf);border:1px solid var(--bd);border-radius:16px;box-shadow:var(--sh)}
.card-flat{background:var(--sf);border:1px solid var(--bd);border-radius:14px}
.btn{display:inline-flex;align-items:center;gap:8px;font-weight:600;font-size:13.5px;border-radius:10px;padding:9px 14px;line-height:1;transition:all .15s;border:1px solid transparent;cursor:pointer;white-space:nowrap}
.btn:focus-visible{outline:2px solid var(--ac);outline-offset:2px}
.btn-p{background:var(--ac);color:var(--aci);box-shadow:0 1px 0 rgba(0,0,0,.05),inset 0 1px 0 rgba(255,255,255,.18)}
.btn-p:hover{background:var(--ac2)} .hp[data-theme="dark"] .btn-p:hover{background:#d8bda6}
.btn-s{background:var(--sf);border-color:var(--bd2);color:var(--tx)} .btn-s:hover{background:var(--sf2)}
.btn-g{background:transparent;color:var(--mu)} .btn-g:hover{background:var(--sf2);color:var(--tx)}
.btn-d{background:var(--tx);color:var(--bg)} .btn-d:hover{opacity:.9}
.btn-sm{padding:7px 11px;font-size:12.5px;border-radius:8px}
.btn-xs{padding:5px 9px;font-size:12px;border-radius:7px}
.inp{width:100%;background:var(--sf);border:1px solid var(--bd2);border-radius:10px;padding:9px 12px;font-size:13.5px;color:var(--tx);outline:none;transition:border .15s,box-shadow .15s;font-family:inherit}
.inp::placeholder{color:var(--mu2)} .inp:focus{border-color:var(--ac);box-shadow:0 0 0 3px var(--acs)}
.lbl{font-size:11.5px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--mu);display:block;margin-bottom:6px}
.chip{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:500;border-radius:999px;padding:4px 10px;border:1px solid var(--bd);background:var(--sf2);color:var(--tx)}
.chip.on{background:var(--tx);color:var(--bg);border-color:var(--tx)}
.badge{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:600;border-radius:999px;padding:3px 9px;line-height:1.3;white-space:nowrap}
.seg{display:inline-flex;background:var(--sf2);border:1px solid var(--bd);border-radius:11px;padding:3px;gap:2px}
.seg button{border:0;background:transparent;color:var(--mu);font-weight:600;font-size:12.5px;padding:6px 12px;border-radius:8px;cursor:pointer;transition:all .15s;font-family:inherit}
.seg button.on{background:var(--sf);color:var(--tx);box-shadow:var(--sh)}
.nav-i{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:10px;font-size:13.5px;font-weight:500;color:var(--mu);cursor:pointer;transition:all .15s;border:1px solid transparent}
.nav-i:hover{background:var(--sf2);color:var(--tx)} .nav-i.on{background:var(--sf);color:var(--tx);border-color:var(--bd);box-shadow:var(--sh)}
.nav-i.on svg{color:var(--ac2)} .hp[data-theme="dark"] .nav-i.on svg{color:var(--ac)}
.tab{padding:10px 2px;margin-right:22px;font-size:13.5px;font-weight:600;color:var(--mu);border-bottom:2px solid transparent;cursor:pointer;transition:all .15s;background:none;border-top:0;border-left:0;border-right:0;font-family:inherit}
.tab.on{color:var(--tx);border-bottom-color:var(--ac)}
.hov{transition:transform .18s,box-shadow .18s,border-color .18s}
.hov:hover{transform:translateY(-1px);box-shadow:var(--sh2);border-color:var(--bd2)}
.pass{position:relative;background:var(--sf);border:1px solid var(--bd);border-radius:14px;box-shadow:var(--sh)}
.pass::before,.pass::after{content:"";position:absolute;width:14px;height:14px;border-radius:50%;background:var(--bg);border:1px solid var(--bd);left:56px;z-index:1}
.pass::before{top:-8px;border-top-color:transparent;border-left-color:transparent;transform:rotate(45deg)}
.pass::after{bottom:-8px;border-bottom-color:transparent;border-right-color:transparent;transform:rotate(45deg)}
.perf{border-left:1.5px dashed var(--bd2)}
.dot{width:8px;height:8px;border-radius:50%;display:inline-block}
.pulse{animation:hp-pulse 1.8s ease-in-out infinite}
@keyframes hp-pulse{0%,100%{box-shadow:0 0 0 0 rgba(63,179,159,.5)}60%{box-shadow:0 0 0 6px rgba(63,179,159,0)}}
.typing span{width:5px;height:5px;background:var(--mu);border-radius:50%;display:inline-block;animation:hp-b 1.2s infinite}
.typing span:nth-child(2){animation-delay:.2s}.typing span:nth-child(3){animation-delay:.4s}
@keyframes hp-b{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-3px);opacity:1}}
.fade{animation:hp-f .28s ease-out}
@keyframes hp-f{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.slide{animation:hp-s .28s cubic-bezier(.2,.8,.2,1)}
@keyframes hp-s{from{transform:translateX(24px);opacity:0}to{transform:none;opacity:1}}
.hp[dir="rtl"] .slide{animation-name:hp-s-r}
@keyframes hp-s-r{from{transform:translateX(-24px);opacity:0}to{transform:none;opacity:1}}
.scroll{scrollbar-width:thin;scrollbar-color:var(--bd2) transparent}
.scroll::-webkit-scrollbar{height:8px;width:8px}.scroll::-webkit-scrollbar-thumb{background:var(--bd2);border-radius:8px}
.tbl th{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--mu);font-weight:600;text-align:left;padding:10px 14px;border-bottom:1px solid var(--bd)}
.tbl td{padding:12px 14px;border-bottom:1px solid var(--bd);font-size:13px}
.tbl tr:last-child td{border-bottom:0}
.otp{width:46px;height:54px;text-align:center;font-size:22px;font-weight:700;font-family:'Plus Jakarta Sans',sans-serif}
.kcol{min-width:264px;width:264px}
.dragover{outline:2px dashed var(--ac);outline-offset:-4px;background:var(--acs)}
.map{background:
  linear-gradient(var(--bd) 1px,transparent 1px) 0 0/28px 28px,
  linear-gradient(90deg,var(--bd) 1px,transparent 1px) 0 0/28px 28px,var(--sf2)}
.toggle{width:38px;height:22px;border-radius:999px;background:var(--bd2);position:relative;cursor:pointer;transition:background .15s;border:0}
.toggle.on{background:var(--teal)} .toggle i{position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:transform .15s}
.toggle.on i{transform:translateX(16px)}
@media (prefers-reduced-motion:reduce){.hp *{animation:none!important;transition:none!important}}
`;

/* ───────────────────────── DATA ───────────────────────── */
const VENUE = {
  hotel: { en: "Hotel", ru: "Отель", Icon: Hotel },
  restaurant: { en: "Restaurant", ru: "Ресторан", Icon: UtensilsCrossed },
  cafe: { en: "Cafe", ru: "Кафе", Icon: Coffee },
  bar: { en: "Bar", ru: "Бар", Icon: Wine },
  catering: { en: "Catering", ru: "Кейтеринг", Icon: ChefHat },
};

const STAGES = [
  { id: "new", en: "New", ru: "Новые", c: "#8a8078" },
  { id: "reviewed", en: "Reviewed", ru: "Просмотрено", c: "#7d8fa3" },
  { id: "shortlist", en: "AI Shortlisted", ru: "AI-шортлист", c: "#ae927b" },
  { id: "interview", en: "Interview", ru: "Интервью", c: "#c48b2c" },
  { id: "test", en: "Test Task", ru: "Тестовое", c: "#8b6fb5" },
  { id: "invited", en: "Invited", ru: "Приглашён", c: "#1f7a6d" },
  { id: "hired", en: "Hired", ru: "Нанят", c: "#2f8f5b" },
  { id: "rejected", en: "Rejected", ru: "Отказ", c: "#b5514f" },
];
const stageOf = (id) => STAGES.find((s) => s.id === id);

const VACANCIES = [
  {
    id: 1,
    title: "Chef de Partie",
    company: "The Ritz-Carlton",
    city: "Almaty",
    venue: "hotel",
    salary: [450, 550],
    schedule: "2/2 · 12h shifts",
    tags: ["French cuisine", "HACCP", "Brigade de cuisine"],
    posted: "2h",
    match: 94,
    verified: true,
    applicants: 38,
    address: "Esentai Tower, Al-Farabi Ave 77/7",
    about:
      "Luxury hotel with 145 rooms, two restaurants and a banquet floor. Brigade of 42.",
    resp: [
      "Run the sauce & grill section during dinner service",
      "Own mise-en-place and HACCP logs for your section",
      "Mentor two commis chefs",
      "Cost control: waste under 3% per week",
    ],
    benefits: [
      "Medical insurance after 3 months",
      "Staff canteen · 2 meals per shift",
      "Uniform & laundry",
      "Marriott Explore rate worldwide",
    ],
  },
  {
    id: 2,
    title: "Head Barista",
    company: "Coffee Boom",
    city: "Almaty",
    venue: "cafe",
    salary: [300, 380],
    schedule: "5/2 · 8h",
    tags: ["Latte art", "Dialing-in", "Team lead"],
    posted: "5h",
    match: 71,
    verified: true,
    applicants: 64,
    address: "Dostyk Ave 132",
    about: "Chain of 17 specialty coffee bars. Roastery-partnered.",
    resp: [
      "Lead a team of 6 baristas on the flagship bar",
      "Daily espresso calibration and QA",
      "Train new hires on the bar standard",
      "Manage bean & milk ordering",
    ],
    benefits: [
      "Bonus up to 20% by QA score",
      "Barista championship sponsorship",
      "Free coffee, obviously",
    ],
  },
  {
    id: 3,
    title: "Front Desk Manager",
    company: "InterContinental",
    city: "Almaty",
    venue: "hotel",
    salary: [500, 600],
    schedule: "Full-time · rotating",
    tags: ["Opera PMS", "English C1", "Guest relations"],
    posted: "1d",
    match: 58,
    verified: true,
    applicants: 21,
    address: "Zheltoksan St 181",
    about: "5-star business hotel, 274 rooms, IHG standards.",
    resp: [
      "Manage a team of 12 receptionists",
      "Handle VIP arrivals and escalations",
      "Own the night audit accuracy KPI",
      "Coordinate with housekeeping & concierge",
    ],
    benefits: [
      "IHG employee rate",
      "Quarterly service bonus",
      "Language courses covered",
    ],
  },
  {
    id: 4,
    title: "Waiter / Waitress",
    company: "Del Papa",
    city: "Astana",
    venue: "restaurant",
    salary: [220, 260],
    schedule: "Shift · tips",
    tags: ["Italian menu", "Wine basics", "iiko"],
    posted: "1d",
    match: 66,
    verified: false,
    applicants: 112,
    address: "Mangilik El Ave 55",
    about: "Italian trattoria group, 9 locations in Astana.",
    resp: [
      "Take orders and run 6–8 tables",
      "Know the menu and pairings",
      "Upsell desserts & aperitivo",
      "Close tables in iiko",
    ],
    benefits: ["Tips daily", "Meals on shift", "Fast promotion to senior"],
  },
  {
    id: 5,
    title: "Executive Housekeeper",
    company: "Rixos Almaty",
    city: "Almaty",
    venue: "hotel",
    salary: [480, 520],
    schedule: "Full-time",
    tags: ["Team 40+", "Inventory", "Budgeting"],
    posted: "2d",
    match: 44,
    verified: true,
    applicants: 9,
    address: "Seifullin Ave 506/99",
    about: "Resort-style city hotel with spa and 3 restaurants.",
    resp: [
      "Lead housekeeping & laundry teams",
      "Room inspection standards",
      "Chemicals & linen budget",
    ],
    benefits: ["Company car", "Spa access", "Annual bonus"],
  },
  {
    id: 6,
    title: "Bartender",
    company: "Bar Bardot",
    city: "Almaty",
    venue: "bar",
    salary: [260, 300],
    schedule: "Evenings · 4/3",
    tags: ["Classic cocktails", "Speed", "Flair"],
    posted: "3d",
    match: 61,
    verified: false,
    applicants: 47,
    address: "Kabanbay Batyr St 85",
    about: "Cocktail bar, 80 seats, top-30 city list.",
    resp: [
      "Run the main bar Thu–Sun",
      "Build the seasonal menu with head bartender",
      "Inventory nightly",
    ],
    benefits: ["Tips", "Trips to bar shows", "Staff drinks after shift"],
  },
  {
    id: 7,
    title: "Sous Chef",
    company: "Sova",
    city: "Astana",
    venue: "restaurant",
    salary: [400, 450],
    schedule: "6/1 · seasonal",
    tags: ["Nordic cuisine", "Menu dev", "Ordering"],
    posted: "4d",
    match: 83,
    verified: true,
    applicants: 15,
    address: "Turan Ave 24",
    about: "Fine dining, 46 seats, tasting menu.",
    resp: [
      "Second in command to the head chef",
      "Menu development twice a year",
      "Supplier relations",
    ],
    benefits: ["Profit share", "Stage abroad yearly"],
  },
  {
    id: 8,
    title: "Catering Coordinator",
    company: "Rixos Events",
    city: "Almaty",
    venue: "catering",
    salary: [350, 400],
    schedule: "Project-based",
    tags: ["Events 500+", "Logistics", "Client comms"],
    posted: "6d",
    match: 39,
    verified: true,
    applicants: 28,
    address: "Seifullin Ave 506/99",
    about: "Banquets, weddings, corporate events up to 1 200 guests.",
    resp: [
      "Plan and run 4–6 events a month",
      "Staff scheduling",
      "Client walkthroughs",
    ],
    benefits: ["Event bonuses", "Flexible off-season"],
  },
];

const CANDS = [
  {
    id: 1,
    name: "Ainur Bekova",
    role: "Chef de Partie",
    score: 94,
    stage: "shortlist",
    skills: ["French", "HACCP", "Grill"],
    exp: "6 yrs",
    city: "Almaty",
    seed: 47,
    video: true,
  },
  {
    id: 2,
    name: "Daniyar Seitkali",
    role: "Sous Chef",
    score: 88,
    stage: "interview",
    skills: ["Sauce", "Menu dev", "Costing"],
    exp: "8 yrs",
    city: "Almaty",
    seed: 12,
    video: true,
  },
  {
    id: 3,
    name: "Marat Ospanov",
    role: "Line Cook",
    score: 76,
    stage: "new",
    skills: ["Grill", "Prep", "Speed"],
    exp: "3 yrs",
    city: "Shymkent",
    seed: 53,
    video: false,
  },
  {
    id: 4,
    name: "Aigerim Nurlan",
    role: "Chef de Partie",
    score: 91,
    stage: "invited",
    skills: ["Pastry", "HACCP", "Plating"],
    exp: "5 yrs",
    city: "Almaty",
    seed: 32,
    video: true,
  },
  {
    id: 5,
    name: "Timur Zhaksylyk",
    role: "Demi Chef",
    score: 69,
    stage: "reviewed",
    skills: ["Cold kitchen", "Prep"],
    exp: "2 yrs",
    city: "Almaty",
    seed: 68,
    video: false,
  },
  {
    id: 6,
    name: "Olga Petrova",
    role: "Chef de Partie",
    score: 82,
    stage: "test",
    skills: ["Fish", "Sauce", "Brigade"],
    exp: "7 yrs",
    city: "Astana",
    seed: 26,
    video: true,
  },
  {
    id: 7,
    name: "Bekzat Amanov",
    role: "Chef de Partie",
    score: 97,
    stage: "hired",
    skills: ["French", "Grill", "Mentoring"],
    exp: "9 yrs",
    city: "Almaty",
    seed: 59,
    video: true,
  },
  {
    id: 8,
    name: "Sergey Kim",
    role: "Cook",
    score: 41,
    stage: "rejected",
    skills: ["Fast food"],
    exp: "1 yr",
    city: "Almaty",
    seed: 15,
    video: false,
  },
  {
    id: 9,
    name: "Madina Yerlan",
    role: "Commis Chef",
    score: 73,
    stage: "new",
    skills: ["Pastry", "Prep", "Cleanliness"],
    exp: "2 yrs",
    city: "Almaty",
    seed: 45,
    video: true,
  },
  {
    id: 10,
    name: "Alisher Tashkentov",
    role: "Chef de Partie",
    score: 85,
    stage: "reviewed",
    skills: ["Uzbek", "Grill", "Volume"],
    exp: "6 yrs",
    city: "Tashkent",
    seed: 60,
    video: false,
  },
  {
    id: 11,
    name: "Zhanar Kuat",
    role: "Chef de Partie",
    score: 79,
    stage: "new",
    skills: ["Sauce", "Plating"],
    exp: "4 yrs",
    city: "Almaty",
    seed: 20,
    video: true,
  },
];

const APPLICATIONS = [
  {
    id: 1,
    vac: 1,
    stage: "interview",
    date: "Aug 22",
    note: "Interview Mon 10:30 with Chef Laurent",
  },
  {
    id: 2,
    vac: 7,
    stage: "shortlist",
    date: "Aug 24",
    note: "AI match 83% · HR to review",
  },
  {
    id: 3,
    vac: 3,
    stage: "reviewed",
    date: "Aug 19",
    note: "Viewed by Nikita V.",
  },
  {
    id: 4,
    vac: 5,
    stage: "rejected",
    date: "Aug 10",
    note: "Position filled internally",
  },
  {
    id: 5,
    vac: 2,
    stage: "hired",
    date: "Jul 30",
    note: "Offer signed · start Sep 1",
  },
];

const CONVOS = [
  {
    id: 1,
    kind: "hr",
    name: "Aigul Sadykova",
    org: "The Ritz-Carlton · HR",
    seed: 44,
    online: true,
    unread: 2,
    last: "Can you make Monday 10:30?",
    time: "12:40",
  },
  {
    id: 2,
    kind: "hr",
    name: "Nikita Volkov",
    org: "InterContinental · Talent",
    seed: 11,
    online: false,
    unread: 0,
    last: "Thanks, reviewing your CV now",
    time: "Yesterday",
  },
  {
    id: 3,
    kind: "ai",
    name: "HorecaPass Assistant",
    org: "AI · always on",
    seed: 0,
    online: true,
    unread: 0,
    last: "I found 3 new matches for you",
    time: "09:12",
  },
  {
    id: 4,
    kind: "support",
    name: "Support",
    org: "Replies in ~5 min",
    seed: 0,
    online: true,
    unread: 0,
    last: "Ticket #4821 resolved",
    time: "Tue",
  },
  {
    id: 5,
    kind: "hr",
    name: "Dana Mukhtar",
    org: "Sova · Head Chef",
    seed: 5,
    online: true,
    unread: 1,
    last: "Send a photo of your plating?",
    time: "Mon",
  },
];

const MESSAGES = {
  1: [
    {
      me: false,
      t: "Hi Yerlan! Chef Laurent liked your trial dish plan. We'd like to invite you for a working interview.",
      time: "12:31",
    },
    {
      me: true,
      t: "Great news, thank you! I'm available Monday or Wednesday morning.",
      time: "12:35",
    },
    {
      me: false,
      t: "Can you make Monday 10:30? Kitchen entrance on Al-Farabi, ask for Aigul.",
      time: "12:40",
    },
  ],
  3: [
    {
      me: false,
      t: "Good morning. Since yesterday 3 new vacancies match your profile above 80%: Sous Chef at Sova (83%), Chef de Partie at Ritz-Carlton (94%), Grill Chef at Bar Bardot (81%).",
      time: "09:12",
    },
    {
      me: true,
      t: "Which one pays best and is close to Bostandyk district?",
      time: "09:14",
    },
    {
      me: false,
      t: "Ritz-Carlton: 450–550k ₸, 2.1 km from Bostandyk, 2/2 schedule. Want me to prep an application note for it?",
      time: "09:14",
    },
  ],
  4: [
    {
      me: false,
      t: "Ticket #4821 (PDF export) resolved. Anything else?",
      time: "Tue",
    },
  ],
  2: [{ me: false, t: "Thanks, reviewing your CV now", time: "Yesterday" }],
  5: [{ me: false, t: "Send a photo of your plating?", time: "Mon" }],
};

const TEAM = [
  {
    name: "Aigul Sadykova",
    role: "Owner",
    email: "a.sadykova@ritzcarlton.com",
    seed: 44,
    status: "active",
  },
  {
    name: "Laurent Dubois",
    role: "Hiring manager",
    email: "l.dubois@ritzcarlton.com",
    seed: 33,
    status: "active",
  },
  {
    name: "Saule Ibragimova",
    role: "Recruiter",
    email: "s.ibragimova@ritzcarlton.com",
    seed: 29,
    status: "active",
  },
  {
    name: "Ruslan Abenov",
    role: "Recruiter",
    email: "r.abenov@ritzcarlton.com",
    seed: 0,
    status: "invited",
  },
];

/* ───────────────────────── I18N ───────────────────────── */
const T = {
  en: {
    jobs: "Jobs",
    applications: "My applications",
    cv: "CV & profile",
    messages: "Messages",
    dashboard: "Dashboard",
    vacancies: "Vacancies",
    candidates: "Candidates",
    company: "Company & team",
    applicant: "Applicant",
    employer: "Employer",
    login: "Log in",
    register: "Create account",
    search: "Search roles, venues, skills…",
    all: "All vacancies",
    forYou: "For you",
    apply: "Apply now",
    applied: "Applied",
    month: "/ mo",
    posted: "Posted",
    filters: "Filters",
    city: "City",
    salary: "Salary",
    schedule: "Schedule",
    venueType: "Venue type",
    skills: "Skills",
    resp: "What you'll do",
    benefits: "Benefits",
    about: "About the venue",
    location: "Location",
    matches: "match",
    newVac: "New vacancy",
    stage: "Stage",
    startChat: "Start chat",
    exportPdf: "Export PDF",
    aiCv: "AI CV builder",
    save: "Save changes",
    invite: "Send invite",
    online: "Live",
    connected: "Connected",
    send: "Send",
  },
  ru: {
    jobs: "Вакансии",
    applications: "Мои отклики",
    cv: "Резюме и профиль",
    messages: "Сообщения",
    dashboard: "Дашборд",
    vacancies: "Вакансии",
    candidates: "Кандидаты",
    company: "Компания и команда",
    applicant: "Соискатель",
    employer: "Работодатель",
    login: "Войти",
    register: "Регистрация",
    search: "Должность, заведение, навык…",
    all: "Все вакансии",
    forYou: "Для вас",
    apply: "Откликнуться",
    applied: "Отклик отправлен",
    month: "/ мес",
    posted: "Опубликовано",
    filters: "Фильтры",
    city: "Город",
    salary: "Зарплата",
    schedule: "График",
    venueType: "Тип заведения",
    skills: "Навыки",
    resp: "Обязанности",
    benefits: "Условия",
    about: "О заведении",
    location: "Адрес",
    matches: "совпадение",
    newVac: "Новая вакансия",
    stage: "Этап",
    startChat: "Написать",
    exportPdf: "Экспорт PDF",
    aiCv: "AI-конструктор резюме",
    save: "Сохранить",
    invite: "Пригласить",
    online: "Онлайн",
    connected: "Соединение",
    send: "Отправить",
  },
};
T.ar = { ...T.en };

/* ───────────────────────── PRIMITIVES ───────────────────────── */
const fmt = (n) => n.toLocaleString("ru-RU").replace(/,/g, " ");
const Salary = ({ s, t }) => (
  <span>
    {fmt(s[0] * 1000)} – {fmt(s[1] * 1000)} ₸{" "}
    <span className="mu font-normal">{t.month}</span>
  </span>
);

function Avatar({ name, seed, size = 40, radius = "50%" }) {
  const [err, setErr] = useState(false);
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  const style = {
    width: size,
    height: size,
    borderRadius: radius,
    flexShrink: 0,
  };
  if (!seed || err)
    return (
      <div
        style={{
          ...style,
          background: "var(--acs)",
          color: "var(--ac2)",
          fontSize: size * 0.36,
          fontWeight: 700,
        }}
        className="grid place-items-center disp"
      >
        {initials}
      </div>
    );
  return (
    <img
      alt={name}
      src={`https://i.pravatar.cc/${size * 2}?img=${seed}`}
      onError={() => setErr(true)}
      style={{ ...style, objectFit: "cover" }}
    />
  );
}

function Logo({ name, size = 40 }) {
  const initials = name
    .split(" ")
    .filter((w) => w.length > 2 || w === "Del")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        background: "var(--tx)",
        color: "var(--bg)",
        fontSize: size * 0.34,
        fontWeight: 800,
        flexShrink: 0,
      }}
      className="grid place-items-center disp"
    >
      {initials}
    </div>
  );
}

const StageBadge = ({ id, lang, small }) => {
  const s = stageOf(id);
  return (
    <span
      className="badge"
      style={{
        background: `${s.c}22`,
        color: s.c,
        fontSize: small ? 11 : 11.5,
      }}
    >
      <span className="dot" style={{ background: s.c, width: 6, height: 6 }} />
      {s[lang] || s.en}
    </span>
  );
};

const Score = ({ v, size = 36 }) => {
  const r = (size - 4) / 2,
    c = 2 * Math.PI * r;
  const color = v >= 85 ? "var(--teal)" : v >= 65 ? "var(--ac)" : "var(--mu2)";
  return (
    <div
      style={{ width: size, height: size, position: "relative", flexShrink: 0 }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--bd)"
          strokeWidth="3"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v / 100)}
          strokeLinecap="round"
        />
      </svg>
      <span
        className="absolute inset-0 grid place-items-center disp font-bold"
        style={{ fontSize: size * 0.3 }}
      >
        {v}
      </span>
    </div>
  );
};

const Toggle = ({ on, set }) => (
  <button
    type="button"
    className={`toggle ${on ? "on" : ""}`}
    onClick={() => set(!on)}
    aria-pressed={on}
  >
    <i />
  </button>
);

function Field({ label, children, className = "" }) {
  return (
    <div className={className}>
      <span className="lbl">{label}</span>
      {children}
    </div>
  );
}

function Modal({ open, onClose, children, width = 440 }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      style={{ background: "rgba(20,14,10,.55)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="card fade"
        style={{ width: "100%", maxWidth: width, boxShadow: "var(--sh2)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function Drawer({ open, onClose, children, width = 520, title }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50"
      style={{ background: "rgba(20,14,10,.45)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="slide sf absolute top-0 bottom-0 flex flex-col"
        style={{
          width: "100%",
          maxWidth: width,
          insetInlineEnd: 0,
          boxShadow: "var(--sh2)",
          borderInlineStart: "1px solid var(--bd)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b bd">
          <h3 className="text-base font-bold">{title}</h3>
          <button
            className="btn btn-g btn-xs"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto scroll">{children}</div>
      </div>
    </div>
  );
}

/* ───────────────────────── AUTH (OTP) ───────────────────────── */
function AuthModal({ open, onClose, onAuthed, mode, onOtpSend, onOtpVerify }) {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const refs = useRef([]);
  useEffect(() => {
    if (open) {
      setStep("email");
      setCode(Array(6).fill(""));
      setError("");
    }
  }, [open]);
  const onKey = (i, e) => {
    if (e.key === "Backspace" && !code[i] && i > 0) refs.current[i - 1].focus();
  };
  const sendCode = async () => {
    setLoading(true);
    setError("");
    try {
      if (onOtpSend) await onOtpSend(email);
      setStep("code");
    } catch (e) {
      setError(e?.response?.data?.detail || "Error sending code");
    } finally {
      setLoading(false);
    }
  };
  const onChange = async (i, v) => {
    const d = v.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[i] = d;
    setCode(next);
    if (d && i < 5) refs.current[i + 1].focus();
    if (next.every(Boolean)) {
      setLoading(true);
      setError("");
      try {
        if (onOtpVerify) {
          await onOtpVerify(email, next.join(""));
        } else {
          /* demo mode */
        }
        onAuthed();
        onClose();
      } catch (e) {
        setError(e?.response?.data?.detail || "Invalid code");
        setCode(Array(6).fill(""));
        refs.current[0]?.focus();
      } finally {
        setLoading(false);
      }
    }
  };
  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-7">
        <div className="flex items-center gap-2 mb-5">
          <Mark />
          <span className="disp font-extrabold text-lg">HorecaPass</span>
        </div>
        {step === "email" ? (
          <>
            <h2 className="text-xl font-bold mb-1">
              {mode === "register" ? "Create your account" : "Welcome back"}
            </h2>
            <p className="mu text-sm mb-6">
              No passwords. We'll email you a 6-digit code.
            </p>
            <Field label="Work or personal email">
              <input
                className="inp"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendCode()}
                autoFocus
              />
            </Field>
            {error && (
              <p
                style={{ color: "var(--danger)", fontSize: 12.5, marginTop: 8 }}
              >
                {error}
              </p>
            )}
            <button
              className="btn btn-p w-full justify-center mt-4"
              onClick={sendCode}
              disabled={loading || !email}
            >
              {loading ? (
                "Sending…"
              ) : (
                <>
                  Send code <ArrowRight size={15} />
                </>
              )}
            </button>
            <p className="mu2 text-xs mt-4 text-center">
              By continuing you agree to the Terms and Privacy policy.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-1">Check your inbox</h2>
            <p className="mu text-sm mb-6">
              We sent a code to <b className="tx">{email}</b>. It expires in 10
              minutes.
            </p>
            <div className="flex gap-2 justify-between">
              {code.map((c, i) => (
                <input
                  key={i}
                  ref={(el) => (refs.current[i] = el)}
                  className="inp otp"
                  inputMode="numeric"
                  value={c}
                  onChange={(e) => onChange(i, e.target.value)}
                  onKeyDown={(e) => onKey(i, e)}
                  autoFocus={i === 0}
                  disabled={loading}
                />
              ))}
            </div>
            {error && (
              <p
                style={{ color: "var(--danger)", fontSize: 12.5, marginTop: 8 }}
              >
                {error}
              </p>
            )}
            <div className="flex items-center justify-between mt-5 text-sm">
              <button
                className="btn btn-g btn-sm"
                onClick={() => setStep("email")}
              >
                Change email
              </button>
              <button
                className="ac font-semibold text-sm bg-transparent border-0 cursor-pointer"
                style={{ fontFamily: "inherit" }}
              >
                Resend in 0:42
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

/* ───────────────────────── HEADER + NAV ───────────────────────── */
const Mark = () => (
  <div
    style={{
      width: 30,
      height: 30,
      borderRadius: 9,
      background: "var(--ac)",
      position: "relative",
      flexShrink: 0,
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.3)",
    }}
  >
    <div
      style={{
        position: "absolute",
        left: 7,
        right: 7,
        top: 9,
        height: 3,
        borderRadius: 2,
        background: "var(--aci)",
        opacity: 0.9,
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 7,
        width: 9,
        top: 16,
        height: 3,
        borderRadius: 2,
        background: "var(--aci)",
        opacity: 0.6,
      }}
    />
    <div
      style={{
        position: "absolute",
        right: 6,
        bottom: 6,
        width: 7,
        height: 7,
        borderRadius: "50%",
        border: "2px solid var(--aci)",
      }}
    />
  </div>
);

function Header({
  t,
  role,
  setRole,
  theme,
  setTheme,
  authed,
  openAuth,
  query,
  setQuery,
}) {
  return (
    <header
      className="sf border-b bd sticky top-0 z-40"
      style={{ backdropFilter: "blur(10px)" }}
    >
      <div className="flex items-center gap-3 px-4 lg:px-6 h-16">
        <div className="flex items-center gap-2.5 mr-2">
          <Mark />
          <span className="disp font-extrabold text-[17px] tracking-tight hidden sm:block">
            Horeca<span className="ac">Pass</span>
          </span>
        </div>
        <div className="seg hidden md:inline-flex">
          <button
            className={role === "applicant" ? "on" : ""}
            onClick={() => setRole("applicant")}
          >
            <span className="flex items-center gap-1.5">
              <User size={13} />
              {t.applicant}
            </span>
          </button>
          <button
            className={role === "employer" ? "on" : ""}
            onClick={() => setRole("employer")}
          >
            <span className="flex items-center gap-1.5">
              <Building2 size={13} />
              {t.employer}
            </span>
          </button>
        </div>
        <div className="flex-1 max-w-xl mx-auto relative">
          <Search
            size={15}
            className="mu absolute top-1/2 -translate-y-1/2"
            style={{ insetInlineStart: 12 }}
          />
          <input
            className="inp"
            style={{ paddingInlineStart: 36, background: "var(--sf2)" }}
            placeholder={t.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd
            className="absolute top-1/2 -translate-y-1/2 mu2 text-[11px] border bd rounded px-1.5 py-0.5 hidden lg:block"
            style={{ insetInlineEnd: 10 }}
          >
            ⌘K
          </kbd>
        </div>
        <button
          className="btn btn-g btn-sm"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        {authed ? (
          <div className="flex items-center gap-2">
            <button className="btn btn-g btn-sm relative">
              <Bell size={16} />
              <span
                className="dot absolute top-1.5 right-1.5"
                style={{ background: "var(--ac)" }}
              />
            </button>
            <Avatar
              name={role === "employer" ? "Aigul Sadykova" : "Yerlan Nurpeisov"}
              seed={role === "employer" ? 44 : 3}
              size={34}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              className="btn btn-s btn-sm hidden sm:inline-flex"
              onClick={() => openAuth("login")}
            >
              {t.login}
            </button>
            <button
              className="btn btn-p btn-sm"
              onClick={() => openAuth("register")}
            >
              {t.register}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

function Sidebar({ t, role, view, setView, setRole }) {
  const items =
    role === "applicant"
      ? [
          ["jobs", Briefcase, t.jobs],
          ["applications", CircleDot, t.applications],
          ["cv", FileText, t.cv],
          ["messages", MessageSquare, t.messages, 3],
        ]
      : [
          ["dashboard", LayoutDashboard, t.dashboard],
          ["vacancies", Briefcase, t.vacancies],
          ["kanban", Kanban, t.candidates, 12],
          ["messages", MessageSquare, t.messages, 5],
          ["company", Users, t.company],
        ];
  return (
    <aside
      className="hidden lg:flex flex-col w-60 shrink-0 p-4 gap-1 border-r bd"
      style={{ height: "calc(100vh - 64px)", position: "sticky", top: 64 }}
    >
      {items.map(([id, I, label, n]) => (
        <div
          key={id}
          className={`nav-i ${view === id ? "on" : ""}`}
          onClick={() => setView(id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setView(id)}
        >
          <I size={17} />
          <span className="flex-1">{label}</span>
          {n && (
            <span
              className="badge"
              style={{ background: "var(--acs)", color: "var(--ac2)" }}
            >
              {n}
            </span>
          )}
        </div>
      ))}
      <div className="mt-auto card-flat p-4 sf2">
        {role === "applicant" ? (
          <>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="ac" />
              <span className="text-xs font-semibold">Profile strength</span>
            </div>
            <div
              className="h-1.5 rounded-full"
              style={{ background: "var(--bd)" }}
            >
              <div
                className="h-full rounded-full"
                style={{ width: "72%", background: "var(--ac)" }}
              />
            </div>
            <p className="mu text-[11.5px] mt-2">
              Add a video intro to reach 90% and get 2× more views.
            </p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-1">
              <Logo name="The Ritz-Carlton" size={26} />
              <span className="text-xs font-semibold">The Ritz-Carlton</span>
            </div>
            <p className="mu text-[11.5px] mt-1">
              Pro plan · 6 of 10 vacancy slots used
            </p>
          </>
        )}
      </div>
    </aside>
  );
}

function MobileNav({ t, role, view, setView }) {
  const items =
    role === "applicant"
      ? [
          ["jobs", Briefcase, t.jobs],
          ["applications", CircleDot, t.applications],
          ["cv", FileText, t.cv],
          ["messages", MessageSquare, t.messages],
        ]
      : [
          ["dashboard", LayoutDashboard, t.dashboard],
          ["vacancies", Briefcase, t.vacancies],
          ["kanban", Kanban, t.candidates],
          ["messages", MessageSquare, t.messages],
          ["company", Users, t.company],
        ];
  return (
    <div className="lg:hidden flex gap-1 overflow-x-auto scroll px-3 py-2 border-b bd sf">
      {items.map(([id, I, label]) => (
        <button
          key={id}
          className={`nav-i ${view === id ? "on" : ""}`}
          style={{ whiteSpace: "nowrap", padding: "7px 11px", fontSize: 12.5 }}
          onClick={() => setView(id)}
        >
          <I size={15} />
          {label}
        </button>
      ))}
    </div>
  );
}

/* ───────────────────────── JOBS FEED + DETAIL ───────────────────────── */
function JobsView({
  t,
  lang,
  query,
  authed,
  openAuth,
  applied,
  setApplied,
  goMessages,
}) {
  const [tab, setTab] = useState("all");
  const [sel, setSel] = useState(1);
  const [venues, setVenues] = useState([]);
  const [city, setCity] = useState("");
  const [maxSal, setMaxSal] = useState(600);
  const [showFilters, setShowFilters] = useState(true);
  const list = useMemo(
    () =>
      VACANCIES.filter((v) => {
        const q = query.toLowerCase();
        const okQ =
          !q ||
          [v.title, v.company, ...v.tags].join(" ").toLowerCase().includes(q);
        const okV = !venues.length || venues.includes(v.venue);
        const okC = !city || v.city === city;
        const okS = v.salary[0] <= maxSal;
        const okT = tab === "all" || v.match >= 70;
        return okQ && okV && okC && okS && okT;
      }).sort((a, b) => (tab === "forYou" ? b.match - a.match : 0)),
    [query, venues, city, maxSal, tab],
  );
  const v = VACANCIES.find((x) => x.id === sel) || list[0];
  const VI = v && VENUE[v.venue].Icon;
  const isApplied = applied.includes(sel);
  const apply = () => {
    if (!authed) return openAuth("register");
    setApplied([...applied, sel]);
  };

  return (
    <div className="fade">
      <div className="flex items-end justify-between flex-wrap gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-extrabold">
            {lang === "ru" ? "Работа в HoReCa" : "HoReCa jobs"}
          </h1>
          <p className="mu text-sm mt-1">
            {lang === "ru"
              ? "1 284 вакансии в Казахстане · обновлено 4 мин назад"
              : "1,284 open roles across Kazakhstan · updated 4 min ago"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="seg">
            <button
              className={tab === "all" ? "on" : ""}
              onClick={() => setTab("all")}
            >
              {t.all}
            </button>
            <button
              className={tab === "forYou" ? "on" : ""}
              onClick={() => setTab("forYou")}
            >
              <span className="flex items-center gap-1.5">
                <Sparkles size={13} />
                {t.forYou}
              </span>
            </button>
          </div>
          <button
            className="btn btn-s btn-sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={14} />
            {t.filters}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="card-flat p-4 mb-5 grid gap-4 md:grid-cols-4 fade">
          <Field label={t.city}>
            <select
              className="inp"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            >
              <option value="">Any city</option>
              <option>Almaty</option>
              <option>Astana</option>
              <option>Shymkent</option>
            </select>
          </Field>
          <Field label={`${t.salary} · up to ${fmt(maxSal * 1000)} ₸`}>
            <input
              type="range"
              min={200}
              max={600}
              step={10}
              value={maxSal}
              onChange={(e) => setMaxSal(+e.target.value)}
              className="w-full mt-2"
              style={{ accentColor: "var(--ac)" }}
            />
          </Field>
          <Field label={t.schedule}>
            <select className="inp">
              <option>Any</option>
              <option>5/2</option>
              <option>2/2</option>
              <option>Shift</option>
              <option>Evenings</option>
            </select>
          </Field>
          <Field label={t.venueType}>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(VENUE).map(([k, vv]) => (
                <button
                  key={k}
                  className={`chip ${venues.includes(k) ? "on" : ""}`}
                  onClick={() =>
                    setVenues(
                      venues.includes(k)
                        ? venues.filter((x) => x !== k)
                        : [...venues, k],
                    )
                  }
                >
                  <vv.Icon size={12} />
                  {vv[lang] || vv.en}
                </button>
              ))}
            </div>
          </Field>
        </div>
      )}

      <div
        className="grid gap-5"
        style={{ gridTemplateColumns: "minmax(0,5fr) minmax(0,7fr)" }}
      >
        <div className="flex flex-col gap-3">
          {list.length === 0 && (
            <div className="card-flat p-8 text-center mu text-sm">
              No roles match these filters. Try widening the salary range or
              clearing venue type.
            </div>
          )}
          {list.map((x) => {
            const I = VENUE[x.venue].Icon;
            const on = x.id === sel;
            return (
              <div
                key={x.id}
                className="card hov p-4 cursor-pointer"
                style={
                  on
                    ? {
                        borderColor: "var(--ac)",
                        boxShadow: "0 0 0 3px var(--acs), var(--sh)",
                      }
                    : {}
                }
                onClick={() => setSel(x.id)}
              >
                <div className="flex gap-3">
                  <Logo name={x.company} size={42} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-bold text-[15px] leading-tight truncate">
                          {x.title}
                        </h3>
                        <p className="mu text-[13px] mt-0.5 flex items-center gap-1.5">
                          {x.company}
                          {x.verified && (
                            <BadgeCheck size={13} className="teal" />
                          )}
                          <span className="mu2">·</span>
                          {x.city}
                        </p>
                      </div>
                      {tab === "forYou" || x.match >= 80 ? (
                        <Score v={x.match} size={34} />
                      ) : null}
                    </div>
                    <div className="flex items-center gap-3 mt-2.5 text-[12.5px] mu flex-wrap">
                      <span className="tx font-semibold">
                        <Salary s={x.salary} t={t} />
                      </span>
                      <span className="flex items-center gap-1">
                        <I size={12} />
                        {VENUE[x.venue][lang] || VENUE[x.venue].en}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {x.schedule}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex gap-1.5 flex-wrap">
                        {x.tags.slice(0, 3).map((s) => (
                          <span
                            key={s}
                            className="chip"
                            style={{ padding: "2px 8px", fontSize: 11.5 }}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                      <span className="mu2 text-[11.5px] whitespace-nowrap">
                        {x.posted}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {v && (
          <div
            className="card overflow-hidden self-start sticky"
            style={{ top: 84 }}
          >
            <div
              className="p-6 border-b bd"
              style={{
                background: "linear-gradient(180deg,var(--sf2),var(--sf))",
              }}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex gap-4">
                  <Logo name={v.company} size={56} />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="badge"
                        style={{
                          background: "var(--acs)",
                          color: "var(--ac2)",
                        }}
                      >
                        <VI size={11} />
                        {VENUE[v.venue][lang] || VENUE[v.venue].en}
                      </span>
                      {v.verified && (
                        <span
                          className="badge"
                          style={{
                            background: "var(--teals)",
                            color: "var(--teal)",
                          }}
                        >
                          <ShieldCheck size={11} />
                          Verified employer
                        </span>
                      )}
                    </div>
                    <h2 className="text-[22px] font-extrabold leading-tight">
                      {v.title}
                    </h2>
                    <p className="mu text-sm mt-1">
                      {v.company} · {v.city} · {t.posted} {v.posted} ago ·{" "}
                      {v.applicants} applicants
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn btn-s btn-sm">
                    <Bookmark size={14} />
                  </button>
                  <button
                    className={`btn ${isApplied ? "btn-s" : "btn-p"}`}
                    onClick={apply}
                  >
                    {isApplied ? (
                      <>
                        <Check size={15} />
                        {t.applied}
                      </>
                    ) : (
                      <>
                        {t.apply}
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-5">
                {[
                  [Wallet, t.salary, <Salary s={v.salary} t={t} />],
                  [Clock, t.schedule, v.schedule],
                  [Sparkles, "AI " + t.matches, `${v.match}% · ${v.tags[0]}`],
                ].map(([I, l, val], i) => (
                  <div key={i} className="card-flat p-3 sf2">
                    <div className="flex items-center gap-1.5 mu text-[11px] uppercase font-semibold tracking-wide">
                      <I size={12} />
                      {l}
                    </div>
                    <div className="text-[13.5px] font-semibold mt-1">
                      {val}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 grid gap-6 md:grid-cols-[1fr_220px]">
              <div className="grid gap-6">
                <section>
                  <h4 className="lbl">{t.resp}</h4>
                  <ul className="grid gap-2">
                    {v.resp.map((r) => (
                      <li key={r} className="flex gap-2.5 text-[13.5px]">
                        <span
                          className="dot mt-2"
                          style={{
                            background: "var(--ac)",
                            width: 6,
                            height: 6,
                          }}
                        />
                        {r}
                      </li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h4 className="lbl">{t.skills}</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {v.tags.map((s) => (
                      <span key={s} className="chip">
                        {s}
                      </span>
                    ))}
                  </div>
                </section>
                <section>
                  <h4 className="lbl">{t.benefits}</h4>
                  <ul className="grid gap-2">
                    {v.benefits.map((r) => (
                      <li key={r} className="flex gap-2.5 text-[13.5px]">
                        <Check size={15} className="teal mt-0.5 shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h4 className="lbl">{t.about}</h4>
                  <p className="text-[13.5px] mu leading-relaxed">{v.about}</p>
                </section>
              </div>
              <div>
                <h4 className="lbl">{t.location}</h4>
                <div
                  className="map rounded-xl border bd relative overflow-hidden"
                  style={{ height: 160 }}
                >
                  <div className="absolute" style={{ left: "54%", top: "44%" }}>
                    <div
                      className="pulse"
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        background: "var(--teal)",
                        border: "3px solid var(--sf)",
                      }}
                    />
                  </div>
                  <div className="absolute left-2 bottom-2 sf rounded-md px-2 py-1 text-[11px] font-medium border bd">
                    2.1 km from you
                  </div>
                </div>
                <p className="text-[12.5px] mt-2 flex gap-1.5">
                  <MapPin size={13} className="mu mt-0.5 shrink-0" />
                  {v.address}
                </p>
                <div className="card-flat p-3 mt-4 sf2">
                  <div className="flex items-center gap-2">
                    <Avatar name="Aigul Sadykova" seed={44} size={30} />
                    <div>
                      <div className="text-[12.5px] font-semibold">
                        Aigul Sadykova
                      </div>
                      <div className="mu text-[11px]">HR · replies in ~2h</div>
                    </div>
                  </div>
                  <button
                    className="btn btn-s btn-xs w-full justify-center mt-3"
                    onClick={goMessages}
                  >
                    <MessageSquare size={13} />
                    Ask a question
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── APPLICATIONS TRACKER ───────────────────────── */
function ApplicationsView({ t, lang }) {
  const steps = STAGES.filter((s) => s.id !== "rejected");
  return (
    <div className="fade">
      <div className="flex items-end justify-between flex-wrap gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-extrabold">{t.applications}</h1>
          <p className="mu text-sm mt-1">5 active · 1 interview this week</p>
        </div>
        <div className="seg">
          <button className="on">All</button>
          <button>Active</button>
          <button>Archived</button>
        </div>
      </div>
      <div className="grid gap-3">
        {APPLICATIONS.map((a) => {
          const v = VACANCIES.find((x) => x.id === a.vac);
          const idx = steps.findIndex((s) => s.id === a.stage);
          const rejected = a.stage === "rejected";
          return (
            <div key={a.id} className="card p-5 hov">
              <div className="flex items-center gap-4 flex-wrap">
                <Logo name={v.company} size={44} />
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-[15px]">{v.title}</h3>
                    <StageBadge id={a.stage} lang={lang} />
                  </div>
                  <p className="mu text-[13px] mt-0.5">
                    {v.company} · {v.city} · applied {a.date}
                  </p>
                </div>
                <div className="text-[13px] mu flex items-center gap-2">
                  <CalendarDays size={14} />
                  {a.note}
                </div>
                <button className="btn btn-s btn-sm">
                  <MessageSquare size={14} />
                  Chat
                </button>
              </div>
              <div
                className="mt-5 flex items-center"
                style={{ opacity: rejected ? 0.45 : 1 }}
              >
                {steps.map((s, i) => {
                  const done = i <= idx && !rejected,
                    cur = i === idx && !rejected;
                  return (
                    <div
                      key={s.id}
                      className="flex-1 flex items-center min-w-0"
                    >
                      <div
                        className="flex flex-col items-center gap-1.5 min-w-0"
                        style={{ width: 26 }}
                      >
                        <div
                          className="grid place-items-center rounded-full transition-all"
                          style={{
                            width: cur ? 22 : 16,
                            height: cur ? 22 : 16,
                            background: done ? s.c : "var(--sf2)",
                            border: `1.5px solid ${done ? s.c : "var(--bd2)"}`,
                            boxShadow: cur ? `0 0 0 4px ${s.c}33` : "none",
                          }}
                        >
                          {done && !cur && (
                            <Check size={10} color="#fff" strokeWidth={3} />
                          )}
                          {cur && (
                            <span
                              className="dot"
                              style={{
                                background: "#fff",
                                width: 6,
                                height: 6,
                              }}
                            />
                          )}
                        </div>
                      </div>
                      {i < steps.length - 1 && (
                        <div
                          className="flex-1 h-px mx-1"
                          style={{
                            background:
                              i < idx && !rejected ? s.c : "var(--bd2)",
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-1.5 flex text-[10.5px] mu2 font-medium uppercase tracking-wide">
                {steps.map((s, i) => (
                  <div
                    key={s.id}
                    className="flex-1 truncate"
                    style={{
                      color: i === idx && !rejected ? s.c : undefined,
                      textAlign:
                        i === 0
                          ? "left"
                          : i === steps.length - 1
                            ? "right"
                            : "center",
                    }}
                  >
                    {s[lang] || s.en}
                  </div>
                ))}
              </div>
              {rejected && (
                <div
                  className="mt-3 text-[12.5px] flex items-center gap-2"
                  style={{ color: "var(--danger)" }}
                >
                  <X size={13} />
                  {a.note} ·{" "}
                  <button
                    className="underline bg-transparent border-0 cursor-pointer p-0"
                    style={{
                      color: "inherit",
                      fontFamily: "inherit",
                      fontSize: "inherit",
                    }}
                  >
                    see similar roles
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────── CV BUILDER ───────────────────────── */
function CvView({ t }) {
  const [tab, setTab] = useState("personal");
  const [ai, setAi] = useState(false);
  const [preview, setPreview] = useState(false);
  const [skills, setSkills] = useState([
    "French cuisine",
    "HACCP",
    "Grill section",
    "Sauces",
    "Menu costing",
    "Team of 8",
  ]);
  const tabs = [
    ["personal", User, "Personal"],
    ["experience", Briefcase, "Experience"],
    ["education", GraduationCap, "Education"],
    ["skills", Award, "Skills"],
    ["languages", Languages, "Languages"],
  ];
  const EXP = [
    {
      co: "Rixos Almaty",
      role: "Demi Chef de Partie",
      from: "2022",
      to: "now",
      d: "Hot kitchen, banquet up to 600 covers. Reduced section waste 4.1% → 2.3%.",
    },
    {
      co: "Sova, Astana",
      role: "Commis Chef",
      from: "2020",
      to: "2022",
      d: "Tasting menu prep, fermentation station.",
    },
  ];
  return (
    <div className="fade">
      <div className="flex items-end justify-between flex-wrap gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-extrabold">{t.cv}</h1>
          <p className="mu text-sm mt-1">
            Visible to 148 employers · last edit 2 days ago
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-s" onClick={() => setAi(true)}>
            <Sparkles size={15} className="ac" />
            {t.aiCv}
          </button>
          <button className="btn btn-s" onClick={() => setPreview(true)}>
            <Eye size={15} />
            Preview
          </button>
          <button className="btn btn-p">
            <Download size={15} />
            {t.exportPdf}
          </button>
        </div>
      </div>
      <div
        className="grid gap-5"
        style={{ gridTemplateColumns: "minmax(0,1fr) 300px" }}
      >
        <div className="card">
          <div className="flex border-b bd px-5 overflow-x-auto scroll">
            {tabs.map(([id, I, l]) => (
              <button
                key={id}
                className={`tab flex items-center gap-1.5 ${tab === id ? "on" : ""}`}
                onClick={() => setTab(id)}
              >
                <I size={14} />
                {l}
              </button>
            ))}
          </div>
          <div className="p-6 fade" key={tab}>
            {tab === "personal" && (
              <div className="grid gap-5">
                <div className="flex items-center gap-4">
                  <Avatar
                    name="Yerlan Nurpeisov"
                    seed={3}
                    size={72}
                    radius={18}
                  />
                  <div>
                    <button className="btn btn-s btn-sm">
                      <Upload size={14} />
                      Change photo
                    </button>
                    <p className="mu text-[12px] mt-1.5">
                      JPG or PNG, up to 5 MB. Kitchen whites look great.
                    </p>
                  </div>
                  <div className="ml-auto card-flat p-3 sf2 flex items-center gap-3">
                    <div
                      className="grid place-items-center rounded-lg"
                      style={{
                        width: 40,
                        height: 40,
                        background: "var(--tx)",
                        color: "var(--bg)",
                      }}
                    >
                      <Play size={16} />
                    </div>
                    <div>
                      <div className="text-[12.5px] font-semibold">
                        Video intro
                      </div>
                      <div className="mu text-[11.5px]">
                        Not recorded · +18% views
                      </div>
                    </div>
                    <button className="btn btn-p btn-xs">Record</button>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="First name">
                    <input className="inp" defaultValue="Yerlan" />
                  </Field>
                  <Field label="Last name">
                    <input className="inp" defaultValue="Nurpeisov" />
                  </Field>
                  <Field label="Target role">
                    <input className="inp" defaultValue="Chef de Partie" />
                  </Field>
                  <Field label="City">
                    <select className="inp">
                      <option>Almaty</option>
                      <option>Astana</option>
                    </select>
                  </Field>
                  <Field label="Expected salary, ₸">
                    <input className="inp" defaultValue="480 000" />
                  </Field>
                  <Field label="Preferred schedule">
                    <select className="inp">
                      <option>2/2</option>
                      <option>5/2</option>
                      <option>Shifts</option>
                    </select>
                  </Field>
                </div>
                <Field label="About me">
                  <textarea
                    className="inp"
                    rows={4}
                    defaultValue="Hot-kitchen cook with 6 years in hotel and fine-dining brigades. Comfortable with 600-cover banquets and 12-course tasting menus. Looking for a section of my own."
                  />
                </Field>
                <div className="flex items-center justify-between border-t bd pt-4">
                  <div className="flex items-center gap-3">
                    <Toggle on set={() => {}} />
                    <span className="text-[13px]">
                      Open to offers · visible in employer search
                    </span>
                  </div>
                  <button className="btn btn-p">{t.save}</button>
                </div>
              </div>
            )}
            {tab === "experience" && (
              <div className="grid gap-3">
                {EXP.map((e) => (
                  <div key={e.co} className="card-flat p-4 flex gap-4">
                    <Logo name={e.co} size={40} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-[14px]">{e.role}</h4>
                        <span className="mu text-[12px]">
                          {e.from} — {e.to}
                        </span>
                      </div>
                      <p className="mu text-[13px]">{e.co}</p>
                      <p className="text-[13px] mt-2">{e.d}</p>
                    </div>
                    <button className="btn btn-g btn-xs self-start">
                      <Pencil size={13} />
                    </button>
                  </div>
                ))}
                <button
                  className="btn btn-s justify-center border-dashed"
                  style={{ borderStyle: "dashed" }}
                >
                  <Plus size={15} />
                  Add position
                </button>
              </div>
            )}
            {tab === "education" && (
              <div className="grid gap-3">
                <div className="card-flat p-4 flex gap-4">
                  <div
                    className="grid place-items-center rounded-lg sf2 border bd"
                    style={{ width: 40, height: 40 }}
                  >
                    <GraduationCap size={18} className="ac" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-[14px]">
                      Almaty College of Technology & Service
                    </h4>
                    <p className="mu text-[13px]">
                      Culinary arts · 2017 — 2020
                    </p>
                  </div>
                </div>
                <div className="card-flat p-4 flex gap-4">
                  <div
                    className="grid place-items-center rounded-lg sf2 border bd"
                    style={{ width: 40, height: 40 }}
                  >
                    <Award size={18} className="ac" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-[14px]">
                      HACCP Level 2 · Food Safety
                    </h4>
                    <p className="mu text-[13px]">
                      Certificate · 2023 · valid to 2026
                    </p>
                  </div>
                  <span
                    className="badge self-start"
                    style={{ background: "var(--teals)", color: "var(--teal)" }}
                  >
                    Verified
                  </span>
                </div>
                <button
                  className="btn btn-s justify-center"
                  style={{ borderStyle: "dashed" }}
                >
                  <Plus size={15} />
                  Add education or certificate
                </button>
              </div>
            )}
            {tab === "skills" && (
              <div>
                <p className="mu text-[13px] mb-3">
                  Skills employers search for in your role. Drag to reorder —
                  the first three show on your card.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {skills.map((s) => (
                    <span
                      key={s}
                      className="chip"
                      style={{ padding: "6px 10px" }}
                    >
                      <GripVertical size={12} className="mu2" />
                      {s}
                      <button
                        className="mu2 bg-transparent border-0 cursor-pointer p-0 ml-1"
                        onClick={() => setSkills(skills.filter((x) => x !== s))}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    className="inp"
                    placeholder="Add a skill, e.g. Sous-vide"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.target.value) {
                        setSkills([...skills, e.target.value]);
                        e.target.value = "";
                      }
                    }}
                  />
                  <button className="btn btn-s">Add</button>
                </div>
                <div className="mt-5 card-flat p-4 sf2 flex gap-3">
                  <Sparkles size={16} className="ac shrink-0 mt-0.5" />
                  <p className="text-[13px]">
                    Suggested from your experience: <b>Banquet service</b>,{" "}
                    <b>Sous-vide</b>, <b>Waste control</b>.{" "}
                    <button
                      className="ac font-semibold bg-transparent border-0 cursor-pointer p-0"
                      style={{ fontFamily: "inherit" }}
                    >
                      Add all
                    </button>
                  </p>
                </div>
              </div>
            )}
            {tab === "languages" && (
              <div className="grid gap-3">
                {[
                  ["Kazakh", "Native", 100],
                  ["Russian", "Native", 100],
                  ["English", "B2 · Upper-intermediate", 70],
                  ["French", "A2 · Kitchen vocabulary", 30],
                ].map(([l, lvl, p]) => (
                  <div
                    key={l}
                    className="card-flat p-4 flex items-center gap-4"
                  >
                    <div className="w-24 font-semibold text-[14px]">{l}</div>
                    <div
                      className="flex-1 h-1.5 rounded-full"
                      style={{ background: "var(--bd)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${p}%`, background: "var(--ac)" }}
                      />
                    </div>
                    <span className="mu text-[12.5px] w-44 text-right">
                      {lvl}
                    </span>
                  </div>
                ))}
                <button
                  className="btn btn-s justify-center"
                  style={{ borderStyle: "dashed" }}
                >
                  <Plus size={15} />
                  Add language
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 self-start">
          <div className="pass p-4 pl-5" style={{ paddingLeft: 20 }}>
            <div className="flex gap-3 items-center">
              <Avatar name="Yerlan Nurpeisov" seed={3} size={46} />
              <div className="min-w-0">
                <div className="font-bold text-[14px] truncate">
                  Yerlan Nurpeisov
                </div>
                <div className="mu text-[12px]">Chef de Partie · Almaty</div>
              </div>
            </div>
            <div className="perf mt-3 pl-3 ml-1 grid gap-1.5 text-[12.5px]">
              <div className="flex justify-between">
                <span className="mu">Experience</span>
                <b>6 years</b>
              </div>
              <div className="flex justify-between">
                <span className="mu">Expected</span>
                <b>480 000 ₸</b>
              </div>
              <div className="flex justify-between">
                <span className="mu">Profile views · 7d</span>
                <b className="teal">64 ↑</b>
              </div>
            </div>
            <p className="mu2 text-[10.5px] uppercase tracking-wider mt-3">
              How employers see you
            </p>
          </div>
          <div className="card-flat p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-semibold">
                Profile strength
              </span>
              <span className="ac font-bold text-[13px]">72%</span>
            </div>
            <div
              className="h-1.5 rounded-full mb-3"
              style={{ background: "var(--bd)" }}
            >
              <div
                className="h-full rounded-full"
                style={{ width: "72%", background: "var(--ac)" }}
              />
            </div>
            {[
              ["Photo", true],
              ["2+ positions", true],
              ["Video intro", false],
              ["Certificates verified", true],
              ["Portfolio photos", false],
            ].map(([l, ok]) => (
              <div
                key={l}
                className="flex items-center gap-2 text-[12.5px] py-1"
              >
                {ok ? (
                  <Check size={14} className="teal" />
                ) : (
                  <CircleDot size={14} className="mu2" />
                )}
                <span className={ok ? "" : "mu"}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Drawer open={ai} onClose={() => setAi(false)} title={t.aiCv} width={460}>
        <div className="p-5 flex flex-col gap-3 h-full">
          <div className="flex gap-3">
            <div
              className="grid place-items-center rounded-full shrink-0"
              style={{ width: 32, height: 32, background: "var(--acs)" }}
            >
              <Bot size={16} className="ac" />
            </div>
            <div className="card-flat p-3 sf2 text-[13px] leading-relaxed">
              I read your two positions. Your Rixos bullet about waste (4.1% →
              2.3%) is strong — that's exactly what a Chef de Partie posting at
              Ritz-Carlton asks for. Want me to rewrite the "About me" to lead
              with it?
            </div>
          </div>
          <div className="flex gap-3 flex-row-reverse">
            <Avatar name="Yerlan Nurpeisov" seed={3} size={32} />
            <div
              className="p-3 rounded-xl text-[13px]"
              style={{ background: "var(--tx)", color: "var(--bg)" }}
            >
              Yes, and keep it under 60 words.
            </div>
          </div>
          <div className="flex gap-3">
            <div
              className="grid place-items-center rounded-full shrink-0"
              style={{ width: 32, height: 32, background: "var(--acs)" }}
            >
              <Bot size={16} className="ac" />
            </div>
            <div className="card-flat p-3 sf2 text-[13px] leading-relaxed">
              Hot-kitchen cook, 6 years in hotel brigades and fine dining. Cut
              section waste by 44% at Rixos while running banquets up to 600
              covers. HACCP Level 2. Ready to own a section.
              <div className="flex gap-2 mt-3">
                <button className="btn btn-p btn-xs">
                  <Check size={12} />
                  Use this
                </button>
                <button className="btn btn-s btn-xs">
                  <Copy size={12} />
                  Copy
                </button>
              </div>
            </div>
          </div>
          <div className="mt-auto flex gap-2 pt-3">
            <input className="inp" placeholder="Ask to improve any section…" />
            <button className="btn btn-p">
              <Send size={15} />
            </button>
          </div>
        </div>
      </Drawer>

      <Modal open={preview} onClose={() => setPreview(false)} width={640}>
        <div className="p-6 border-b bd flex items-center justify-between">
          <h3 className="font-bold">Resume preview · A4</h3>
          <div className="flex gap-2">
            <button className="btn btn-p btn-sm">
              <Download size={14} />
              {t.exportPdf}
            </button>
            <button
              className="btn btn-g btn-sm"
              onClick={() => setPreview(false)}
            >
              <X size={15} />
            </button>
          </div>
        </div>
        <div className="p-6 sf2">
          <div
            className="sf p-8 rounded-lg border bd"
            style={{ fontFamily: "Inter" }}
          >
            <div className="flex justify-between items-start pb-4 border-b bd">
              <div>
                <h2 className="text-xl font-extrabold">Yerlan Nurpeisov</h2>
                <p className="mu text-sm">
                  Chef de Partie · Almaty · +7 777 ··· 42 · yerlan@…
                </p>
              </div>
              <Avatar name="Yerlan Nurpeisov" seed={3} size={56} radius={10} />
            </div>
            <p className="text-[12.5px] mt-4">
              Hot-kitchen cook, 6 years in hotel brigades and fine dining. Cut
              section waste by 44% at Rixos while running banquets up to 600
              covers.
            </p>
            <h4 className="lbl mt-5">Experience</h4>
            {EXP.map((e) => (
              <div key={e.co} className="text-[12.5px] mb-2">
                <b>{e.role}</b> · {e.co}{" "}
                <span className="mu">
                  · {e.from}–{e.to}
                </span>
                <p className="mu">{e.d}</p>
              </div>
            ))}
            <h4 className="lbl mt-5">Skills</h4>
            <p className="text-[12.5px]">{skills.join(" · ")}</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ───────────────────────── EMPLOYER: DASHBOARD ───────────────────────── */
function DashboardView({ t, lang, setView, openCand }) {
  const bars = [12, 18, 9, 22, 31, 27, 35, 29, 41, 38, 46, 33, 52, 44];
  const max = Math.max(...bars);
  return (
    <div className="fade">
      <div className="flex items-end justify-between flex-wrap gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-extrabold">Good afternoon, Aigul</h1>
          <p className="mu text-sm mt-1">
            The Ritz-Carlton Almaty · Friday, Aug 28
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-s" onClick={() => setView("kanban")}>
            <Kanban size={15} />
            Open board
          </button>
          <button className="btn btn-p" onClick={() => setView("vacancies")}>
            <Plus size={15} />
            {t.newVac}
          </button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4 mb-5">
        {[
          ["Active vacancies", "6", "of 10 slots", Briefcase],
          ["Applications · 30d", "248", "+31% vs July", Users],
          ["Interviews this week", "9", "3 today", CalendarDays],
          ["Avg. time to hire", "11 d", "industry 19 d", TrendingUp],
        ].map(([l, v, sub, I]) => (
          <div key={l} className="card p-5">
            <div className="flex items-center justify-between">
              <span className="mu text-[12.5px] font-medium">{l}</span>
              <I size={15} className="mu2" />
            </div>
            <div className="disp text-[30px] font-extrabold mt-2 leading-none">
              {v}
            </div>
            <div className="text-[12px] mt-2 teal font-medium">{sub}</div>
          </div>
        ))}
      </div>
      <div
        className="grid gap-5"
        style={{ gridTemplateColumns: "minmax(0,3fr) minmax(0,2fr)" }}
      >
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Applications per day</h3>
            <div className="seg">
              <button className="on">14d</button>
              <button>30d</button>
              <button>90d</button>
            </div>
          </div>
          <div className="flex items-end gap-1.5" style={{ height: 140 }}>
            {bars.map((b, i) => (
              <div
                key={i}
                className="flex-1 rounded-md transition-all"
                title={`${b}`}
                style={{
                  height: `${(b / max) * 100}%`,
                  background:
                    i === bars.length - 2 ? "var(--ac)" : "var(--acs)",
                }}
              />
            ))}
          </div>
          <div className="flex justify-between mu2 text-[11px] mt-2">
            <span>Aug 15</span>
            <span>Aug 21</span>
            <span>Aug 28</span>
          </div>
          <div className="border-t bd mt-5 pt-4">
            <h4 className="lbl">Your vacancies</h4>
            <table className="tbl w-full">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Applicants</th>
                  <th>Shortlisted</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {VACANCIES.filter((v) =>
                  ["The Ritz-Carlton", "Rixos Almaty", "Rixos Events"].includes(
                    v.company,
                  ),
                ).map((v) => (
                  <tr key={v.id}>
                    <td className="font-semibold">{v.title}</td>
                    <td>{v.applicants}</td>
                    <td>{Math.round(v.applicants * 0.18)}</td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: "var(--teals)",
                          color: "var(--teal)",
                        }}
                      >
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="grid gap-5 self-start">
          <div className="card p-5">
            <h3 className="font-bold mb-3">Candidate quick-search</h3>
            <div className="relative">
              <Search
                size={14}
                className="mu absolute left-3 top-1/2 -translate-y-1/2"
              />
              <input className="inp pl-9" placeholder="Name, role or skill" />
            </div>
            <div className="flex gap-1.5 mt-3 flex-wrap">
              {["Chef", "HACCP", "Barista", "Opera PMS", "English C1"].map(
                (s) => (
                  <span key={s} className="chip cursor-pointer">
                    {s}
                  </span>
                ),
              )}
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">Needs your attention</h3>
              <span
                className="badge"
                style={{ background: "var(--acs)", color: "var(--ac2)" }}
              >
                4
              </span>
            </div>
            <div className="grid gap-2">
              {CANDS.filter((c) =>
                ["shortlist", "interview", "test"].includes(c.stage),
              )
                .slice(0, 4)
                .map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 p-2 rounded-xl hover:sf2 cursor-pointer"
                    onClick={() => openCand(c.id)}
                  >
                    <Avatar name={c.name} seed={c.seed} size={36} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold truncate">
                        {c.name}
                      </div>
                      <div className="mu text-[11.5px]">
                        {c.role} · {c.exp}
                      </div>
                    </div>
                    <StageBadge id={c.stage} lang={lang} small />
                    <Score v={c.score} size={30} />
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── EMPLOYER: VACANCIES + WIZARD ───────────────────────── */
function VacanciesView({ t, lang }) {
  const [mode, setMode] = useState("list");
  const [wtab, setWtab] = useState("manual");
  const [step, setStep] = useState(0);
  const [video, setVideo] = useState(true);
  const [qs, setQs] = useState([
    "How many covers per night are you comfortable with on the grill?",
    "Describe your HACCP routine for the end of a shift.",
  ]);
  const [gen, setGen] = useState(null);
  const [busy, setBusy] = useState(false);
  const [prompt, setPrompt] = useState(
    "Chef de Partie for a 5-star hotel, French cuisine, banquets, 2/2 schedule, 450–550k ₸",
  );
  const STEPS = [
    "Basics",
    "Pay & schedule",
    "Description",
    "Screening",
    "Review",
  ];
  const generate = () => {
    setBusy(true);
    setGen(null);
    setTimeout(() => {
      setBusy(false);
      setGen(VACANCIES[0]);
    }, 1200);
  };
  if (mode === "list")
    return (
      <div className="fade">
        <div className="flex items-end justify-between flex-wrap gap-3 mb-5">
          <div>
            <h1 className="text-2xl font-extrabold">{t.vacancies}</h1>
            <p className="mu text-sm mt-1">6 active · 2 drafts · 4 closed</p>
          </div>
          <button className="btn btn-p" onClick={() => setMode("wizard")}>
            <Plus size={15} />
            {t.newVac}
          </button>
        </div>
        <div className="card overflow-hidden">
          <table className="tbl w-full">
            <thead>
              <tr>
                <th>Role</th>
                <th>Venue</th>
                <th>Salary</th>
                <th>Applicants</th>
                <th>Pipeline</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {VACANCIES.slice(0, 6).map((v) => {
                const I = VENUE[v.venue].Icon;
                return (
                  <tr key={v.id} className="hover:sf2">
                    <td>
                      <div className="font-semibold">{v.title}</div>
                      <div className="mu text-[12px]">
                        Posted {v.posted} ago · {v.city}
                      </div>
                    </td>
                    <td>
                      <span className="flex items-center gap-1.5 mu">
                        <I size={13} />
                        {VENUE[v.venue][lang] || VENUE[v.venue].en}
                      </span>
                    </td>
                    <td className="font-medium whitespace-nowrap">
                      {fmt(v.salary[0])}–{fmt(v.salary[1])}k ₸
                    </td>
                    <td>{v.applicants}</td>
                    <td>
                      <div className="flex gap-0.5">
                        {STAGES.slice(0, 7).map((s, i) => (
                          <div
                            key={s.id}
                            className="h-2 rounded-sm"
                            style={{
                              width: 6 + (7 - i) * 3,
                              background: s.c,
                              opacity: 0.8,
                            }}
                          />
                        ))}
                      </div>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background:
                            v.id % 3 === 0 ? "var(--sf2)" : "var(--teals)",
                          color: v.id % 3 === 0 ? "var(--mu)" : "var(--teal)",
                        }}
                      >
                        {v.id % 3 === 0 ? "Draft" : "Active"}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-g btn-xs">
                        <MoreHorizontal size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  return (
    <div className="fade">
      <div className="flex items-center gap-3 mb-5">
        <button className="btn btn-g btn-sm" onClick={() => setMode("list")}>
          <ChevronRight size={15} style={{ transform: "rotate(180deg)" }} />
          Vacancies
        </button>
        <h1 className="text-2xl font-extrabold">{t.newVac}</h1>
        <div className="seg ml-auto">
          <button
            className={wtab === "manual" ? "on" : ""}
            onClick={() => setWtab("manual")}
          >
            Step by step
          </button>
          <button
            className={wtab === "ai" ? "on" : ""}
            onClick={() => setWtab("ai")}
          >
            <span className="flex items-center gap-1.5">
              <Wand2 size={13} />
              AI generator
            </span>
          </button>
        </div>
      </div>

      {wtab === "manual" ? (
        <div
          className="grid gap-5"
          style={{ gridTemplateColumns: "220px minmax(0,1fr)" }}
        >
          <div className="card-flat p-3 self-start grid gap-1">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`nav-i ${i === step ? "on" : ""}`}
                onClick={() => setStep(i)}
              >
                <span
                  className="grid place-items-center rounded-full text-[11px] font-bold shrink-0"
                  style={{
                    width: 22,
                    height: 22,
                    background:
                      i < step
                        ? "var(--teal)"
                        : i === step
                          ? "var(--ac)"
                          : "var(--sf2)",
                    color: i <= step ? "#fff" : "var(--mu)",
                    border: i > step ? "1px solid var(--bd2)" : 0,
                  }}
                >
                  {i < step ? <Check size={12} strokeWidth={3} /> : i + 1}
                </span>
                {s}
              </div>
            ))}
          </div>
          <div className="card p-6 fade" key={step}>
            <h3 className="font-bold text-lg mb-1">{STEPS[step]}</h3>
            <p className="mu text-[13px] mb-5">
              {
                [
                  "What the role is and where it happens.",
                  "Be concrete — listings with a salary range get 3× more applications.",
                  "What the day looks like. Bullets beat paragraphs.",
                  "Questions every applicant answers before you see them. Keep it to 3.",
                  "Check everything before it goes live.",
                ][step]
              }
            </p>
            {step === 0 && (
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Job title" className="md:col-span-2">
                  <input className="inp" defaultValue="Chef de Partie" />
                </Field>
                <Field label="Venue type" className="md:col-span-2">
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(VENUE).map(([k, v]) => (
                      <button
                        key={k}
                        className={`chip ${k === "hotel" ? "on" : ""}`}
                        style={{ padding: "8px 14px" }}
                      >
                        <v.Icon size={13} />
                        {v[lang] || v.en}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Address" className="md:col-span-2">
                  <div className="relative">
                    <MapPin
                      size={14}
                      className="mu absolute left-3 top-1/2 -translate-y-1/2"
                    />
                    <input
                      className="inp pl-9"
                      defaultValue="Esentai Tower, Al-Farabi Ave 77/7, Almaty"
                    />
                  </div>
                </Field>
                <Field label="Department">
                  <select className="inp">
                    <option>Kitchen</option>
                    <option>Front office</option>
                    <option>F&B service</option>
                    <option>Housekeeping</option>
                  </select>
                </Field>
                <Field label="Reports to">
                  <input
                    className="inp"
                    defaultValue="Laurent Dubois, Executive Chef"
                  />
                </Field>
              </div>
            )}
            {step === 1 && (
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Salary from, ₸">
                  <input className="inp" defaultValue="450 000" />
                </Field>
                <Field label="Salary to, ₸">
                  <input className="inp" defaultValue="550 000" />
                </Field>
                <Field label="Schedule">
                  <select className="inp">
                    <option>2/2 · 12h shifts</option>
                    <option>5/2</option>
                    <option>Rotating</option>
                  </select>
                </Field>
                <Field label="Employment">
                  <select className="inp">
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Seasonal</option>
                  </select>
                </Field>
                <Field label="Benefits" className="md:col-span-2">
                  <div className="flex gap-2 flex-wrap">
                    {[
                      "Medical insurance",
                      "Meals on shift",
                      "Uniform & laundry",
                      "Employee hotel rate",
                      "Transport at night",
                      "Relocation help",
                    ].map((b, i) => (
                      <button key={b} className={`chip ${i < 4 ? "on" : ""}`}>
                        {i < 4 && <Check size={11} />}
                        {b}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            )}
            {step === 2 && (
              <div className="grid gap-4">
                <Field label="Responsibilities">
                  <textarea
                    className="inp"
                    rows={6}
                    defaultValue={VACANCIES[0].resp
                      .map((r) => "• " + r)
                      .join("\n")}
                  />
                </Field>
                <Field label="Required skills">
                  <div className="flex gap-2 flex-wrap">
                    {VACANCIES[0].tags.map((s) => (
                      <span key={s} className="chip">
                        {s}
                        <X size={11} className="mu2" />
                      </span>
                    ))}
                    <input
                      className="inp"
                      style={{ width: 160 }}
                      placeholder="Add skill"
                    />
                  </div>
                </Field>
              </div>
            )}
            {step === 3 && (
              <div className="grid gap-4">
                <div className="card-flat p-4 flex items-center gap-4">
                  <div
                    className="grid place-items-center rounded-lg shrink-0"
                    style={{ width: 44, height: 44, background: "var(--acs)" }}
                  >
                    <Video size={18} className="ac" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-[14px]">
                      Video greeting from the chef
                    </div>
                    <p className="mu text-[12.5px]">
                      A 30-second hello from the hiring manager. Listings with
                      video get 2.4× more completed applications.
                    </p>
                  </div>
                  <Toggle on={video} set={setVideo} />
                </div>
                <Field label="Screening questions">
                  <div className="grid gap-2">
                    {qs.map((q, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <span className="mu2 text-[12px] w-5">{i + 1}.</span>
                        <input className="inp" defaultValue={q} />
                        <button
                          className="btn btn-g btn-xs"
                          onClick={() => setQs(qs.filter((_, j) => j !== i))}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    className="btn btn-s btn-sm mt-2"
                    onClick={() => setQs([...qs, ""])}
                  >
                    <Plus size={13} />
                    Add question
                  </button>
                </Field>
                <div className="card-flat p-4 sf2 flex gap-3">
                  <Sparkles size={16} className="ac shrink-0 mt-0.5" />
                  <p className="text-[13px]">
                    AI will pre-score answers against the role and move strong
                    candidates to <b>AI Shortlisted</b> automatically. You
                    always see the full answer.
                  </p>
                </div>
              </div>
            )}
            {step === 4 && (
              <div className="grid gap-4">
                <div
                  className="card-flat p-5"
                  style={{
                    background: "linear-gradient(180deg,var(--sf2),var(--sf))",
                  }}
                >
                  <div className="flex gap-4">
                    <Logo name="The Ritz-Carlton" size={48} />
                    <div>
                      <span
                        className="badge"
                        style={{
                          background: "var(--acs)",
                          color: "var(--ac2)",
                        }}
                      >
                        <Hotel size={11} />
                        Hotel
                      </span>
                      <h3 className="text-lg font-extrabold mt-1">
                        Chef de Partie
                      </h3>
                      <p className="mu text-[13px]">
                        The Ritz-Carlton · Almaty · 450 000 – 550 000 ₸ · 2/2
                      </p>
                    </div>
                  </div>
                  <ul className="mt-4 grid gap-1.5 text-[13px]">
                    {VACANCIES[0].resp.map((r) => (
                      <li key={r} className="flex gap-2">
                        <span
                          className="dot mt-2"
                          style={{
                            background: "var(--ac)",
                            width: 5,
                            height: 5,
                          }}
                        />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="grid grid-cols-3 gap-3 text-[13px]">
                  {[
                    ["Screening questions", qs.length],
                    ["Video greeting", video ? "On" : "Off"],
                    ["Visibility", "Public + For You"],
                  ].map(([l, v]) => (
                    <div key={l} className="card-flat p-3">
                      <div className="mu text-[11.5px]">{l}</div>
                      <div className="font-semibold mt-0.5">{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between mt-6 pt-4 border-t bd">
              <button
                className="btn btn-g"
                disabled={step === 0}
                onClick={() => setStep(step - 1)}
                style={{ opacity: step === 0 ? 0.4 : 1 }}
              >
                Back
              </button>
              <div className="flex gap-2">
                <button className="btn btn-s">Save draft</button>
                {step < 4 ? (
                  <button
                    className="btn btn-p"
                    onClick={() => setStep(step + 1)}
                  >
                    Continue
                    <ArrowRight size={15} />
                  </button>
                ) : (
                  <button className="btn btn-p" onClick={() => setMode("list")}>
                    <Check size={15} />
                    Publish
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="grid gap-5"
          style={{ gridTemplateColumns: "minmax(0,2fr) minmax(0,3fr)" }}
        >
          <div className="card p-6 self-start">
            <div className="flex items-center gap-2 mb-1">
              <Wand2 size={16} className="ac" />
              <h3 className="font-bold">Describe the role in a sentence</h3>
            </div>
            <p className="mu text-[13px] mb-4">
              AI drafts the title, responsibilities, skills, benefits and 3
              screening questions in your company's tone.
            </p>
            <textarea
              className="inp"
              rows={5}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <div className="flex gap-2 mt-2 flex-wrap">
              {[
                "Head Barista, specialty cafe, 5/2",
                "Night receptionist, Opera PMS",
                "Banquet waiter, weekends",
              ].map((p) => (
                <button
                  key={p}
                  className="chip cursor-pointer"
                  onClick={() => setPrompt(p)}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-4">
              <Field label="Language" className="flex-1">
                <select className="inp">
                  <option>Russian + English</option>
                  <option>Russian</option>
                  <option>English</option>
                </select>
              </Field>
              <Field label="Tone" className="flex-1">
                <select className="inp">
                  <option>Warm, precise</option>
                  <option>Formal</option>
                  <option>Casual</option>
                </select>
              </Field>
            </div>
            <button
              className="btn btn-p w-full justify-center mt-4"
              onClick={generate}
              disabled={busy}
            >
              {busy ? (
                <span className="typing flex gap-1">
                  <span />
                  <span />
                  <span />
                </span>
              ) : (
                <>
                  <Sparkles size={15} />
                  Generate vacancy
                </>
              )}
            </button>
          </div>
          <div className="card p-6 min-h-[400px]">
            {!gen && !busy && (
              <div className="h-full grid place-items-center text-center mu text-[13.5px]">
                <div>
                  <Wand2 size={28} className="mu2 mx-auto mb-3" />
                  Your draft appears here.
                  <br />
                  You can edit every line before publishing.
                </div>
              </div>
            )}
            {busy && (
              <div className="grid gap-3 mt-2">
                {[80, 60, 95, 70, 85, 50].map((w, i) => (
                  <div
                    key={i}
                    className="h-3 rounded"
                    style={{ width: `${w}%`, background: "var(--sf2)" }}
                  />
                ))}
              </div>
            )}
            {gen && (
              <div className="fade">
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="badge"
                    style={{ background: "var(--teals)", color: "var(--teal)" }}
                  >
                    <Sparkles size={11} />
                    Draft ready · 1.2s
                  </span>
                  <div className="flex gap-2">
                    <button className="btn btn-s btn-sm">Regenerate</button>
                    <button
                      className="btn btn-p btn-sm"
                      onClick={() => {
                        setWtab("manual");
                        setStep(4);
                      }}
                    >
                      Use in wizard
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
                <h3 className="text-xl font-extrabold">{gen.title}</h3>
                <p className="mu text-[13px] mt-1">
                  {gen.company} · {gen.city} · <Salary s={gen.salary} t={t} /> ·{" "}
                  {gen.schedule}
                </p>
                <h4 className="lbl mt-5">{t.resp}</h4>
                <ul className="grid gap-1.5 text-[13px]">
                  {gen.resp.map((r) => (
                    <li key={r} className="flex gap-2">
                      <span
                        className="dot mt-2"
                        style={{ background: "var(--ac)", width: 5, height: 5 }}
                      />
                      {r}
                    </li>
                  ))}
                </ul>
                <h4 className="lbl mt-5">{t.skills}</h4>
                <div className="flex gap-1.5 flex-wrap">
                  {gen.tags.map((s) => (
                    <span key={s} className="chip">
                      {s}
                    </span>
                  ))}
                </div>
                <h4 className="lbl mt-5">Screening questions</h4>
                <ol className="grid gap-1.5 text-[13px] list-decimal pl-5">
                  {qs.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                  <li>What's your go-to dish when the printer won't stop?</li>
                </ol>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── EMPLOYER: KANBAN ───────────────────────── */
function KanbanView({ t, lang, cands, setCands, openCand }) {
  const [drag, setDrag] = useState(null);
  const [over, setOver] = useState(null);
  const move = (id, stage) =>
    setCands(cands.map((c) => (c.id === id ? { ...c, stage } : c)));
  return (
    <div className="fade">
      <div className="flex items-end justify-between flex-wrap gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mu text-[12.5px] mb-1">
            <Briefcase size={13} />
            Chef de Partie · The Ritz-Carlton
            <ChevronDown size={13} />
          </div>
          <h1 className="text-2xl font-extrabold">{t.candidates}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              size={14}
              className="mu absolute left-3 top-1/2 -translate-y-1/2"
            />
            <input
              className="inp pl-9"
              style={{ width: 220 }}
              placeholder="Find a candidate"
            />
          </div>
          <button className="btn btn-s btn-sm">
            <Filter size={14} />
            Score ≥ 70
          </button>
          <button className="btn btn-p btn-sm">
            <Sparkles size={14} />
            Run AI screening
          </button>
        </div>
      </div>
      <div
        className="flex gap-3 overflow-x-auto scroll pb-4"
        style={{ minHeight: "calc(100vh - 220px)" }}
      >
        {STAGES.map((s) => {
          const items = cands.filter((c) => c.stage === s.id);
          return (
            <div
              key={s.id}
              className={`kcol rounded-2xl p-2 flex flex-col gap-2 ${over === s.id ? "dragover" : ""}`}
              style={{
                background: "var(--sf2)",
                border: "1px solid var(--bd)",
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(s.id);
              }}
              onDragLeave={() => setOver(null)}
              onDrop={(e) => {
                e.preventDefault();
                if (drag) move(drag, s.id);
                setDrag(null);
                setOver(null);
              }}
            >
              <div className="flex items-center gap-2 px-2 py-1.5">
                <span className="dot" style={{ background: s.c }} />
                <span className="text-[12.5px] font-bold">
                  {s[lang] || s.en}
                </span>
                <span className="mu text-[12px] ml-auto">{items.length}</span>
                <button className="btn btn-g btn-xs" style={{ padding: 3 }}>
                  <Plus size={13} />
                </button>
              </div>
              {items.map((c) => (
                <div
                  key={c.id}
                  draggable
                  onDragStart={() => setDrag(c.id)}
                  onDragEnd={() => setDrag(null)}
                  onClick={() => openCand(c.id)}
                  className="pass hov cursor-grab active:cursor-grabbing p-3"
                  style={{ opacity: drag === c.id ? 0.4 : 1 }}
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar name={c.name} seed={c.seed} size={38} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-bold truncate">
                        {c.name}
                      </div>
                      <div className="mu text-[11.5px] truncate">
                        {c.role} · {c.exp}
                      </div>
                    </div>
                    <Score v={c.score} size={34} />
                  </div>
                  <div className="perf mt-2.5 ml-[19px] pl-3">
                    <div className="flex flex-wrap gap-1">
                      {c.skills.slice(0, 3).map((k) => (
                        <span
                          key={k}
                          className="chip"
                          style={{ padding: "1px 7px", fontSize: 10.5 }}
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mt-2 mu2 text-[11px]">
                      <MapPin size={11} />
                      {c.city}
                      {c.video && (
                        <span className="flex items-center gap-1 ml-auto teal">
                          <Video size={11} />
                          intro
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="rounded-xl grid place-items-center text-[12px] mu2 border border-dashed bd2 flex-1 min-h-[80px]">
                  Drop here
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CandidateDrawer({ t, lang, cand, onClose, setStage, goChat }) {
  if (!cand) return null;
  return (
    <Drawer open onClose={onClose} title="Candidate" width={560}>
      <div className="p-5 grid gap-5">
        <div className="flex gap-4 items-start">
          <Avatar name={cand.name} seed={cand.seed} size={64} radius={16} />
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-extrabold">{cand.name}</h3>
            <p className="mu text-[13px]">
              {cand.role} · {cand.exp} · {cand.city}
            </p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <StageBadge id={cand.stage} lang={lang} />
              <span
                className="badge"
                style={{ background: "var(--teals)", color: "var(--teal)" }}
              >
                <Sparkles size={11} />
                {cand.score}% {t.matches}
              </span>
            </div>
          </div>
          <Score v={cand.score} size={52} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label={t.stage}>
            <select
              className="inp"
              value={cand.stage}
              onChange={(e) => setStage(cand.id, e.target.value)}
            >
              {STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s[lang] || s.en}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex items-end gap-2">
            <button
              className="btn btn-p flex-1 justify-center"
              onClick={goChat}
            >
              <MessageSquare size={15} />
              {t.startChat}
            </button>
            <button className="btn btn-s">
              <Phone size={15} />
            </button>
          </div>
        </div>
        {cand.video ? (
          <div
            className="rounded-2xl overflow-hidden relative"
            style={{
              aspectRatio: "16/9",
              background: "linear-gradient(135deg,#2a2320,#4a3d34)",
            }}
          >
            <img
              alt=""
              src={`https://i.pravatar.cc/600?img=${cand.seed}`}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: 0.55, filter: "saturate(.8)" }}
              onError={(e) => (e.target.style.display = "none")}
            />
            <div className="absolute inset-0 grid place-items-center">
              <button
                className="grid place-items-center rounded-full border-0 cursor-pointer"
                style={{
                  width: 56,
                  height: 56,
                  background: "var(--bg)",
                  color: "var(--tx)",
                }}
              >
                <Play size={22} />
              </button>
            </div>
            <div className="absolute left-3 bottom-3 text-white text-[12px] font-medium flex items-center gap-2">
              <span
                className="badge"
                style={{ background: "rgba(0,0,0,.5)", color: "#fff" }}
              >
                0:42
              </span>
              Video introduction
            </div>
          </div>
        ) : (
          <div className="card-flat p-4 sf2 mu text-[13px] flex items-center gap-2">
            <Video size={15} />
            No video intro.{" "}
            <button
              className="ac font-semibold bg-transparent border-0 cursor-pointer p-0"
              style={{ fontFamily: "inherit" }}
            >
              Request one
            </button>
          </div>
        )}
        <section>
          <h4 className="lbl">Screening answers</h4>
          <div className="grid gap-2">
            {[
              [
                "How many covers per night on the grill?",
                "180–220 on a full Saturday at Rixos, with one commis. Comfortable up to 300 for banquets with pre-seared proteins.",
                92,
              ],
              [
                "Describe your HACCP routine for the end of shift.",
                "Probe temps logged for all cooled items, label-date-initial, fridge audit, then sign the section sheet. Photos on request.",
                88,
              ],
            ].map(([q, a, s]) => (
              <div key={q} className="card-flat p-3">
                <div className="flex justify-between gap-3">
                  <div className="text-[12.5px] font-semibold">{q}</div>
                  <span
                    className="badge shrink-0"
                    style={{ background: "var(--acs)", color: "var(--ac2)" }}
                  >
                    AI {s}
                  </span>
                </div>
                <p className="mu text-[13px] mt-1.5 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h4 className="lbl">Experience</h4>
          {[
            ["Rixos Almaty", "Demi Chef de Partie", "2022 — now"],
            ["Sova, Astana", "Commis Chef", "2020 — 2022"],
          ].map(([co, r, d]) => (
            <div
              key={co}
              className="flex gap-3 py-2.5 border-b bd last:border-0"
            >
              <Logo name={co} size={34} />
              <div className="flex-1">
                <div className="text-[13.5px] font-semibold">{r}</div>
                <div className="mu text-[12.5px]">{co}</div>
              </div>
              <span className="mu2 text-[12px]">{d}</span>
            </div>
          ))}
        </section>
        <section>
          <h4 className="lbl">{t.skills}</h4>
          <div className="flex gap-1.5 flex-wrap">
            {[...cand.skills, "Plating", "Mentoring", "Costing"].map((s) => (
              <span key={s} className="chip">
                {s}
              </span>
            ))}
          </div>
        </section>
        <section>
          <h4 className="lbl">Team notes</h4>
          <div className="card-flat p-3 flex gap-3">
            <Avatar name="Laurent Dubois" seed={33} size={28} />
            <div className="text-[13px]">
              <b>Laurent</b> <span className="mu2">· 2h</span>
              <p className="mt-0.5">
                Trial shift Monday. Wants to see the sauce station under
                pressure.
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <input className="inp" placeholder="Add a note for the team…" />
            <button className="btn btn-s">
              <Send size={14} />
            </button>
          </div>
        </section>
        <div className="flex gap-2 pt-2 border-t bd">
          <button className="btn btn-s flex-1 justify-center">
            <Download size={14} />
            CV as PDF
          </button>
          <button className="btn btn-s flex-1 justify-center">
            <CalendarDays size={14} />
            Schedule interview
          </button>
          <button
            className="btn btn-s"
            style={{ color: "var(--danger)" }}
            onClick={() => setStage(cand.id, "rejected")}
          >
            <X size={14} />
            Reject
          </button>
        </div>
      </div>
    </Drawer>
  );
}

/* ───────────────────────── EMPLOYER: COMPANY & TEAM ───────────────────────── */
function CompanyView({ t }) {
  const [tab, setTab] = useState("company");
  return (
    <div className="fade">
      <div className="flex items-end justify-between flex-wrap gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-extrabold">{t.company}</h1>
          <p className="mu text-sm mt-1">
            How candidates see The Ritz-Carlton on HorecaPass
          </p>
        </div>
        <div className="seg">
          <button
            className={tab === "company" ? "on" : ""}
            onClick={() => setTab("company")}
          >
            Company profile
          </button>
          <button
            className={tab === "team" ? "on" : ""}
            onClick={() => setTab("team")}
          >
            Team · 4
          </button>
        </div>
      </div>
      {tab === "company" ? (
        <div
          className="grid gap-5"
          style={{ gridTemplateColumns: "minmax(0,1fr) 320px" }}
        >
          <div className="card p-6 grid gap-5">
            <div className="flex items-center gap-4">
              <Logo name="The Ritz-Carlton" size={72} />
              <div className="flex-1">
                <div className="flex gap-2">
                  <button className="btn btn-s btn-sm">
                    <Upload size={14} />
                    Upload logo
                  </button>
                  <button className="btn btn-g btn-sm">Remove</button>
                </div>
                <p className="mu text-[12px] mt-1.5">
                  SVG or PNG, square, at least 512px.
                </p>
              </div>
              <span
                className="badge"
                style={{ background: "var(--teals)", color: "var(--teal)" }}
              >
                <ShieldCheck size={12} />
                Verified · BIN checked
              </span>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Company name">
                <input
                  className="inp"
                  defaultValue="The Ritz-Carlton, Almaty"
                />
              </Field>
              <Field label="Venue type">
                <select className="inp">
                  <option>Hotel · 5 stars</option>
                  <option>Restaurant</option>
                </select>
              </Field>
              <Field label="Address" className="md:col-span-2">
                <input
                  className="inp"
                  defaultValue="Esentai Tower, Al-Farabi Ave 77/7, Almaty 050060"
                />
              </Field>
              <Field label="Website">
                <input className="inp" defaultValue="ritzcarlton.com/almaty" />
              </Field>
              <Field label="Team size">
                <select className="inp">
                  <option>200–500</option>
                  <option>50–200</option>
                </select>
              </Field>
            </div>
            <Field label="About">
              <textarea
                className="inp"
                rows={4}
                defaultValue="145 rooms on the top floors of Esentai Tower. Two restaurants, a rooftop bar and a banquet floor. We hire for attitude and train for skill — a third of our chefs started as commis."
              />
            </Field>
            <Field label="Benefits shown on every vacancy">
              <div className="flex gap-2 flex-wrap">
                {[
                  "Medical insurance",
                  "Staff canteen",
                  "Uniform & laundry",
                  "Marriott Explore rate",
                  "Night transport",
                  "English classes",
                ].map((b, i) => (
                  <span key={b} className={`chip ${i < 4 ? "on" : ""}`}>
                    {i < 4 && <Check size={11} />}
                    {b}
                  </span>
                ))}
                <button className="chip">
                  <Plus size={11} />
                  Add
                </button>
              </div>
            </Field>
            <div className="flex justify-end gap-2 pt-4 border-t bd">
              <button className="btn btn-s">Preview public page</button>
              <button className="btn btn-p">{t.save}</button>
            </div>
          </div>
          <div className="grid gap-4 self-start">
            <div className="card p-5">
              <h3 className="font-bold mb-3">Employer page stats · 30d</h3>
              {[
                ["Page views", "3 412"],
                ["Follows", "218"],
                ["Apply rate", "6.8%"],
                ["Avg. reply time", "1h 50m"],
              ].map(([l, v]) => (
                <div
                  key={l}
                  className="flex justify-between py-2 border-b bd last:border-0 text-[13px]"
                >
                  <span className="mu">{l}</span>
                  <b>{v}</b>
                </div>
              ))}
            </div>
            <div className="card p-5 sf2">
              <div className="flex items-center gap-2 mb-2">
                <Star size={14} className="ac" />
                <span className="text-[13px] font-semibold">
                  Candidate rating 4.7
                </span>
              </div>
              <p className="mu text-[12.5px]">
                From 64 candidates after interviews. "Fast replies, clear trial
                shift" is the most common comment.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-5">
          <div className="card p-5">
            <h3 className="font-bold mb-1">Invite a recruiter</h3>
            <p className="mu text-[13px] mb-3">
              They'll get a 6-digit code by email and join with the role you
              pick.
            </p>
            <div className="flex gap-2 flex-wrap">
              <input
                className="inp flex-1"
                placeholder="name@ritzcarlton.com"
                style={{ minWidth: 220 }}
              />
              <select className="inp" style={{ width: 180 }}>
                <option>Recruiter</option>
                <option>Hiring manager</option>
                <option>Admin</option>
              </select>
              <button className="btn btn-p">
                <Mail size={15} />
                {t.invite}
              </button>
            </div>
          </div>
          <div className="card overflow-hidden">
            <table className="tbl w-full">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Role</th>
                  <th>Vacancies</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {TEAM.map((m) => (
                  <tr key={m.email}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar name={m.name} seed={m.seed} size={34} />
                        <div>
                          <div className="font-semibold">{m.name}</div>
                          <div className="mu text-[12px]">{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <select
                        className="inp"
                        style={{ width: 150, padding: "6px 10px" }}
                        defaultValue={m.role}
                      >
                        <option>Owner</option>
                        <option>Admin</option>
                        <option>Hiring manager</option>
                        <option>Recruiter</option>
                      </select>
                    </td>
                    <td>
                      {m.status === "invited"
                        ? "—"
                        : Math.floor(Math.random() * 4 + 1)}
                    </td>
                    <td>
                      {m.status === "active" ? (
                        <span
                          className="badge"
                          style={{
                            background: "var(--teals)",
                            color: "var(--teal)",
                          }}
                        >
                          Active
                        </span>
                      ) : (
                        <span
                          className="badge"
                          style={{
                            background: "var(--acs)",
                            color: "var(--ac2)",
                          }}
                        >
                          Invited · expires in 6d
                        </span>
                      )}
                    </td>
                    <td className="text-right">
                      <button className="btn btn-g btn-xs">
                        <MoreHorizontal size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card-flat p-4 sf2 text-[13px] flex gap-3">
            <ShieldCheck size={16} className="ac shrink-0 mt-0.5" />
            <div>
              <b>Roles</b> · Owner manages billing and team. Admin edits company
              profile. Hiring manager sees only assigned vacancies. Recruiter
              moves candidates and chats.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── MESSENGER ───────────────────────── */
function MessengerView({ t, role }) {
  const convos =
    role === "employer"
      ? CANDS.slice(0, 5)
          .map((c, i) => ({
            id: 100 + c.id,
            kind: "hr",
            name: c.name,
            org: `${c.role} · ${c.score}% match`,
            seed: c.seed,
            online: i % 2 === 0,
            unread: i === 0 ? 2 : 0,
            last:
              i === 0
                ? "Great news, thank you! I'm available Monday…"
                : "Thank you for the update",
            time: i === 0 ? "12:35" : "Yesterday",
          }))
          .concat(CONVOS.slice(2, 4))
      : CONVOS;
  const [sel, setSel] = useState(convos[0].id);
  const [msgs, setMsgs] = useState(MESSAGES);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const c = convos.find((x) => x.id === sel);
  const thread =
    role === "employer" && sel > 100
      ? (msgs[1] || []).map((m) => ({ ...m, me: !m.me }))
      : msgs[sel] || [];
  const endRef = useRef(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread.length, sel]);
  const send = () => {
    if (!text.trim()) return;
    const key = role === "employer" && sel > 100 ? 1 : sel;
    const mine = { me: true, t: text, time: "now" };
    setMsgs((m) => ({
      ...m,
      [key]: [
        ...(m[key] || []),
        role === "employer" && sel > 100 ? { ...mine, me: false } : mine,
      ],
    }));
    setText("");
    if (c.kind === "ai") {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        setMsgs((m) => ({
          ...m,
          [key]: [
            ...m[key],
            {
              me: false,
              t: "Done — I drafted a 3-line note for the Ritz-Carlton application mentioning your banquet experience. Open it in CV & profile → Applications.",
              time: "now",
            },
          ],
        }));
      }, 1400);
    }
  };
  return (
    <div
      className="card overflow-hidden fade flex"
      style={{ height: "calc(100vh - 128px)" }}
    >
      <div className="w-[300px] shrink-0 border-r bd flex flex-col">
        <div className="p-3 border-b bd">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-[15px] px-1">{t.messages}</h2>
            <span className="flex items-center gap-1.5 text-[11px] teal font-medium">
              <span
                className="dot pulse"
                style={{ background: "var(--teal)" }}
              />
              {t.connected}
            </span>
          </div>
          <div className="relative">
            <Search
              size={13}
              className="mu absolute left-3 top-1/2 -translate-y-1/2"
            />
            <input
              className="inp pl-8"
              style={{ padding: "7px 10px 7px 32px", fontSize: 13 }}
              placeholder="Search"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scroll p-2 grid gap-0.5 content-start">
          {convos.map((x) => (
            <div
              key={x.id}
              className="flex gap-3 p-2.5 rounded-xl cursor-pointer"
              style={sel === x.id ? { background: "var(--sf2)" } : {}}
              onClick={() => setSel(x.id)}
            >
              <div className="relative">
                {x.kind === "ai" ? (
                  <div
                    className="grid place-items-center rounded-full"
                    style={{ width: 40, height: 40, background: "var(--acs)" }}
                  >
                    <Bot size={18} className="ac" />
                  </div>
                ) : x.kind === "support" ? (
                  <div
                    className="grid place-items-center rounded-full"
                    style={{
                      width: 40,
                      height: 40,
                      background: "var(--teals)",
                    }}
                  >
                    <LifeBuoy size={18} className="teal" />
                  </div>
                ) : (
                  <Avatar name={x.name} seed={x.seed} size={40} />
                )}
                {x.online && (
                  <span
                    className="dot absolute bottom-0 right-0"
                    style={{
                      background: "var(--teal)",
                      border: "2px solid var(--sf)",
                      width: 11,
                      height: 11,
                    }}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-2">
                  <span className="text-[13px] font-semibold truncate">
                    {x.name}
                  </span>
                  <span className="mu2 text-[11px] shrink-0">{x.time}</span>
                </div>
                <div className="mu text-[11.5px] truncate">{x.org}</div>
                <div className="flex justify-between gap-2 mt-0.5">
                  <span
                    className={`text-[12px] truncate ${x.unread ? "tx font-medium" : "mu"}`}
                  >
                    {x.last}
                  </span>
                  {x.unread > 0 && (
                    <span
                      className="badge"
                      style={{
                        background: "var(--ac)",
                        color: "var(--aci)",
                        padding: "1px 6px",
                      }}
                    >
                      {x.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-3 px-5 py-3 border-b bd">
          {c.kind === "ai" ? (
            <div
              className="grid place-items-center rounded-full"
              style={{ width: 38, height: 38, background: "var(--acs)" }}
            >
              <Bot size={17} className="ac" />
            </div>
          ) : c.kind === "support" ? (
            <div
              className="grid place-items-center rounded-full"
              style={{ width: 38, height: 38, background: "var(--teals)" }}
            >
              <LifeBuoy size={17} className="teal" />
            </div>
          ) : (
            <Avatar name={c.name} seed={c.seed} size={38} />
          )}
          <div className="flex-1 min-w-0">
            <div className="font-bold text-[14px]">{c.name}</div>
            <div className="text-[12px] flex items-center gap-1.5">
              {c.online ? (
                <>
                  <span
                    className="dot"
                    style={{ background: "var(--teal)", width: 6, height: 6 }}
                  />
                  <span className="teal">{t.online}</span>
                </>
              ) : (
                <span className="mu">last seen 2h ago</span>
              )}
              <span className="mu2">·</span>
              <span className="mu">{c.org}</span>
            </div>
          </div>
          {c.kind === "hr" && (
            <div className="flex gap-1">
              <button className="btn btn-g btn-sm">
                <Phone size={16} />
              </button>
              <button className="btn btn-g btn-sm">
                <Video size={16} />
              </button>
              {role === "employer" && (
                <button className="btn btn-s btn-sm">
                  <Eye size={14} />
                  Profile
                </button>
              )}
              <button className="btn btn-g btn-sm">
                <MoreHorizontal size={16} />
              </button>
            </div>
          )}
        </div>
        <div
          className="flex-1 overflow-y-auto scroll p-5 grid gap-3 content-start"
          style={{ background: "var(--bg)" }}
        >
          <div className="text-center mu2 text-[11px] uppercase tracking-wider">
            Today
          </div>
          {c.kind === "hr" && role === "applicant" && sel === 1 && (
            <div
              className="card-flat p-3 sf flex items-center gap-3 mx-auto text-[12.5px]"
              style={{ maxWidth: 420 }}
            >
              <Logo name="The Ritz-Carlton" size={30} />
              <div>
                <b>Chef de Partie</b> · you applied Aug 22
                <div className="mu">
                  Stage: <StageBadge id="interview" lang="en" small />
                </div>
              </div>
            </div>
          )}
          {thread.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.me ? "justify-end" : "justify-start"} fade`}
            >
              <div className="max-w-[70%]">
                <div
                  className="p-3 text-[13.5px] leading-relaxed"
                  style={
                    m.me
                      ? {
                          background: "var(--tx)",
                          color: "var(--bg)",
                          borderRadius: "16px 16px 4px 16px",
                        }
                      : {
                          background: "var(--sf)",
                          border: "1px solid var(--bd)",
                          borderRadius: "16px 16px 16px 4px",
                        }
                  }
                >
                  {m.t}
                </div>
                <div
                  className={`mu2 text-[10.5px] mt-1 flex items-center gap-1 ${m.me ? "justify-end" : ""}`}
                >
                  {m.time}
                  {m.me && <Check size={11} className="teal" />}
                </div>
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex">
              <div className="p-3 sf border bd rounded-2xl typing flex gap-1">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
        <div className="p-3 border-t bd">
          {c.kind === "ai" && (
            <div className="flex gap-1.5 mb-2 flex-wrap">
              {[
                "Find roles near me",
                "Improve my CV",
                "Prep for the interview",
              ].map((q) => (
                <button
                  key={q}
                  className="chip cursor-pointer"
                  onClick={() => setText(q)}
                >
                  <Sparkles size={11} className="ac" />
                  {q}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <button className="btn btn-g btn-sm">
              <Paperclip size={16} />
            </button>
            <input
              className="inp"
              placeholder={
                c.kind === "ai"
                  ? "Ask anything about jobs, CV or interviews…"
                  : "Write a message…"
              }
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <button className="btn btn-p" onClick={send}>
              <Send size={15} />
              {t.send}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── APP ───────────────────────── */
// Принимает пропсы из App.jsx для подключения к реальному бэкенду api.horecapass.com
export default function HorecaPass({
  externalUser,
  onOtpSend,
  onOtpVerify,
  onLogout,
  vacanciesApi: _vacanciesApi,
}) {
  const [theme, setTheme] = useState("light");
  const lang = "en"; // English only
  const [role, setRoleRaw] = useState("applicant");
  const [view, setView] = useState("jobs");
  const [auth, setAuth] = useState(null);
  const [query, setQuery] = useState("");
  const [applied, setApplied] = useState([]);
  const [cands, setCands] = useState(CANDS);
  const [candId, setCandId] = useState(null);
  const t = T[lang] || T.en;

  // Синхронизируем authed с реальным пользователем (если подключён бэкенд)
  const authed = externalUser ? true : false;

  const setRole = (r) => {
    setRoleRaw(r);
    setView(r === "applicant" ? "jobs" : "dashboard");
  };
  const cand = cands.find((c) => c.id === candId);
  const setStage = (id, stage) =>
    setCands(cands.map((c) => (c.id === id ? { ...c, stage } : c)));

  return (
    <div
      className="hp min-h-screen"
      data-theme={theme}
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <style>{CSS}</style>
      <Header
        t={t}
        role={role}
        setRole={setRole}
        theme={theme}
        setTheme={setTheme}
        authed={authed}
        openAuth={setAuth}
        query={query}
        setQuery={setQuery}
      />
      <div className="flex">
        <Sidebar
          t={t}
          role={role}
          view={view}
          setView={setView}
          setRole={setRole}
        />
        <main className="flex-1 min-w-0">
          <MobileNav t={t} role={role} view={view} setView={setView} />
          <div className="p-4 lg:p-7 max-w-[1400px]">
            {role === "applicant" && view === "jobs" && (
              <JobsView
                t={t}
                lang={lang}
                query={query}
                authed={authed}
                openAuth={setAuth}
                applied={applied}
                setApplied={setApplied}
                goMessages={() => setView("messages")}
              />
            )}
            {role === "applicant" && view === "applications" && (
              <ApplicationsView t={t} lang={lang} />
            )}
            {role === "applicant" && view === "cv" && <CvView t={t} />}
            {role === "employer" && view === "dashboard" && (
              <DashboardView
                t={t}
                lang={lang}
                setView={setView}
                openCand={setCandId}
              />
            )}
            {role === "employer" && view === "vacancies" && (
              <VacanciesView t={t} lang={lang} />
            )}
            {role === "employer" && view === "kanban" && (
              <KanbanView
                t={t}
                lang={lang}
                cands={cands}
                setCands={setCands}
                openCand={setCandId}
              />
            )}
            {role === "employer" && view === "company" && <CompanyView t={t} />}
            {view === "messages" && <MessengerView t={t} role={role} />}
          </div>
        </main>
      </div>
      <AuthModal
        open={!!auth}
        mode={auth}
        onClose={() => setAuth(null)}
        onAuthed={() => setAuth(null)} // будет заменено на реальный токен через onOtpVerify
        onOtpSend={onOtpSend}
        onOtpVerify={onOtpVerify}
      />
      <CandidateDrawer
        t={t}
        lang={lang}
        cand={cand}
        onClose={() => setCandId(null)}
        setStage={setStage}
        goChat={() => {
          setCandId(null);
          setView("messages");
        }}
      />
    </div>
  );
}
