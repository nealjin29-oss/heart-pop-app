import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Camera, CheckCircle2, Circle, MapPin, Calendar, DollarSign, AlertCircle, FileText, User, Lock, Download, Image as ImageIcon, BarChart3, Users, LogOut, ChevronDown, ChevronUp, X, ChevronLeft, ChevronRight, CalendarDays, List, HelpCircle, Edit2, Trash2, Save, Maximize2, Loader2, FileSpreadsheet, TrendingUp, Menu, MessageSquare, BookOpen, Clock, Power, Key, Thermometer, Droplets, Wind, Package, Trash, Shirt, Box, Play, Layers } from 'lucide-react';

// === Firebase Database Integration ===
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc, query, addDoc, serverTimestamp } from 'firebase/firestore';

// =====================================================================
// 💡 Load Firebase Config
// =====================================================================
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "AIzaSyAjjEtx4Rkf7yGRaymWf9_tmUzf-yQ16Qg",
  authDomain: "heart-pop.firebaseapp.com",
  projectId: "heart-pop",
  projectName: "heart-pop",
  storageBucket: "heart-pop.firebasestorage.app",
  messagingSenderId: "711616458234",
  appId: "1:711616458234:web:bb3de45e0be2f6102c0843"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'heart-pop-app-prod';
const appId = rawAppId.replace(/\//g, '_');

// --- UI Data Mappings ---
const supplyNames = {
  breadTieShort: '빵끈',
  plasticBagShort: '포장 비닐',
  gloveShort: '위생장갑',
  earmuffShort: '귀마개',
  maskShort: '마스크'
};

const checklistNames = {
  readyCash: '영업준비금 10만원 확인',
  machineClean: '기기 청소',
  acrylicClean: '아크릴통 청소',
  hideStock: '재고 가리기',
  receiptPaper: '영수증 용지 확인',
  hideKey: '열쇠 숨기기',
  changeEnough: '5천원권 충분',
  posClose: 'POS 종료',
  submitLog: '매출일지 사무실 제출'
};

const photoNames = {
  riceBin: '쌀통',
  pot: '솥',
  desk: '매대 정면',
  report: '판매일보',
  key: '열쇠'
};

const openManualItems = [
  { id: 1, title: 'POS 전원 켜기 + KFPOS 프로그램 켜기', icon: <Power className="text-blue-500"/> },
  { id: 2, title: '돈통 열쇠 찾아서 열기', icon: <Key className="text-amber-500"/> },
  { id: 3, title: '기계 전원 연결 + 히터 켜기(240도 확인)', icon: <Thermometer className="text-red-500"/> },
  { id: 4, title: '아크릴 보관함 내부 세척(물티슈)', icon: <Droplets className="text-cyan-500"/> },
  { id: 5, title: '매대 및 뒤쪽 보관함 전체 에어건 청소', icon: <Wind className="text-slate-400"/> },
  { id: 6, title: '포장 비닐, 위생장갑, 빵끈 꺼내기', icon: <Package className="text-orange-400"/> },
  { id: 7, title: '쓰레기 봉투 및 로스뻥튀기 봉투 부착', icon: <Trash className="text-gray-400"/> },
  { id: 8, title: '모자, 앞치마, 위생마스크, 이어플러그, 장갑 착용', icon: <Shirt className="text-indigo-500"/> },
  { id: 9, title: '사용할 쌀 재고 확인', icon: <Box className="text-yellow-600"/> },
  { id: 10, title: '쌀 넣고 기계 작동시키기', icon: <Play className="text-green-500"/> },
  { id: 11, title: '재고 가림막(보자기천) 제거하기', icon: <Layers className="text-purple-500"/> },
];

const closeManualItems = [
  { id: 1, title: '기계 쌀통에 있는 쌀을 모두 빼주세요. (7~8분 더 작동합니다.)', icon: <Box className="text-orange-600"/> },
  { id: 2, title: '돈통에 있는 현금과 매입일지의 현금이 일치하는지 확인', icon: <DollarSign className="text-green-600"/> },
  { id: 3, title: 'POS에서 마감진행 + 매출일지 작성 + 사진촬영', icon: <Camera className="text-blue-500"/> },
  { id: 4, title: '쌀이 끊기면 기계를 끄고 기계 청소를 진행합니다. (마감방법 준수)', icon: <Wind className="text-slate-400"/> },
  { id: 5, title: '남은 뻥튀기 마저 포장하고 아크릴 보관함 세척', icon: <Droplets className="text-cyan-500"/> },
  { id: 6, title: '재고를 보자기천으로 가려주세요.', icon: <Layers className="text-purple-500"/> },
  { id: 7, title: '에어건으로 전체적으로 청소해주세요.', icon: <Wind className="text-slate-400"/> },
  { id: 8, title: '잡동사니 및 사용한 물품을 플라스틱 보관함에 넣어주세요.', icon: <Box className="text-amber-500"/> },
  { id: 9, title: 'POS 끄기 + 열쇠 숨기기', icon: <Power className="text-red-500"/> },
  { id: 10, title: '마감보고 작성해주세요.', icon: <FileText className="text-rose-600"/> },
  { id: 11, title: '외부인 출입이 안되도록 출입구를 막아주세요.', icon: <Lock className="text-gray-900"/> },
  { id: 12, title: '로스뻥튀기 봉투와 쓰레기봉투를 외부 쓰레기장에 버려주세요.', icon: <Trash className="text-gray-400"/> },
];

const getTodayString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return (new Date(now - offset)).toISOString().split('T')[0];
};

const formatTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true });
};

export default function App() {
  // --- States ---
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [notices, setNotices] = useState([]);
  const [view, setView] = useState('form'); 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [adminPwd, setAdminPwd] = useState('');
  const [filterType, setFilterType] = useState('ALL'); 
  const [filterValue, setFilterValue] = useState('');
  const [expandedReportId, setExpandedReportId] = useState(null);
  const [adminViewMode, setAdminViewMode] = useState('list'); 
  const [calendarDate, setCalendarDate] = useState(new Date()); 
  const [editReportId, setEditReportId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState(''); 
  const [isUploading, setIsUploading] = useState(false); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [noticeInput, setNoticeInput] = useState('');

  // 매뉴얼 로컬 체크 상태
  const [openChecks, setOpenChecks] = useState({});
  const [closeChecks, setCloseChecks] = useState({});

  const [formData, setFormData] = useState({
    location: '상행선',
    date: getTodayString(), 
    worker: '정윤이',
    customWorker: '',
    sales: { cash: '', card: '' },
    checklist: { readyCash: false, machineClean: false, acrylicClean: false, hideStock: false, receiptPaper: false, hideKey: false, changeEnough: false, posClose: false, submitLog: false },
    inventory: { stockCount: '', usedRice: '', leftRice: '', loss: '', hasRiceForNextDay: null, remainingRiceAmount: '' },
    supplies: { breadTieShort: false, plasticBagShort: false, gloveShort: false, earmuffShort: false, maskShort: false, extra: '' },
    suppliesStock: { breadTieShort: '', plasticBagShort: '', gloveShort: '', earmuffShort: '', maskShort: '', extra: '' },
    photos: { riceBin: null, pot: null, desk: null, report: null, key: null },
    notes: '',
    waiting: { hadWaiting: null, lastNumber: '', missedTeams: '' }
  });

  // --- 1. Authentication ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth Error:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  // --- 2. 매뉴얼 체크리스트 초기화 로직 ---
  useEffect(() => {
    if (view !== 'manual_open') setOpenChecks({});
    if (view !== 'manual_close') setCloseChecks({});
  }, [view]);

  // --- Data Subscription ---
  useEffect(() => {
    if (!user) return;
    const reportsRef = collection(db, 'artifacts', appId, 'public', 'data', 'reports');
    const noticesRef = collection(db, 'artifacts', appId, 'public', 'data', 'notices');
    
    const unsubReports = onSnapshot(reportsRef, (snapshot) => {
      const fetched = [];
      snapshot.forEach((doc) => fetched.push({ id: doc.id, ...doc.data() }));
      fetched.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setReports(fetched);
    }, (err) => console.error(err));

    const unsubNotices = onSnapshot(noticesRef, (snapshot) => {
      const fetched = [];
      snapshot.forEach((doc) => fetched.push({ id: doc.id, ...doc.data() }));
      fetched.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setNotices(fetched);
    }, (err) => console.error(err));

    return () => { unsubReports(); unsubNotices(); };
  }, [user]);

  // --- Handlers ---
  const handleChecklist = (key) => {
    setFormData(prev => ({ ...prev, checklist: { ...prev.checklist, [key]: !prev.checklist[key] } }));
  };

  const handleWaitingToggle = (val) => {
    setFormData(prev => ({ ...prev, waiting: { ...prev.waiting, hadWaiting: val } }));
  };

  const handlePhotoChange = (key, e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 1200; 
        let w = img.width; let h = img.height;
        if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } }
        else { if (h > MAX) { w *= MAX / h; h = MAX; } }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        setFormData(p => ({ ...p, photos: { ...p.photos, [key]: canvas.toDataURL('image/jpeg', 0.7) } }));
        setIsUploading(false);
      };
    };
  };

  const submitReport = async () => {
    if (!formData.sales.cash || !formData.sales.card) return setAlertMessage("현금/카드 매출을 모두 입력해 주세요.");
    if (!user) return setAlertMessage("인증 중입니다. 잠시만 기다려 주세요.");
    setIsSubmitting(true);
    const total = (Number(formData.sales.cash) || 0) + (Number(formData.sales.card) || 0);
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'reports', Date.now().toString()), {
        ...formData, totalSales: total, timestamp: new Date().toISOString()
      });
      setShowSubmitModal(true);
    } catch (e) { setAlertMessage("제출 실패: " + e.message); } finally { setIsSubmitting(false); }
  };

  const submitNotice = async () => {
    if (!noticeInput.trim() || !user) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'notices'), {
        content: noticeInput, timestamp: new Date().toISOString(), date: getTodayString()
      });
      setNoticeInput('');
      setAlertMessage("공유사항이 성공적으로 등록되었습니다.");
    } catch (e) { setAlertMessage("등록 실패: " + e.message); }
  };

  const executeDelete = async (id, colName = 'reports') => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', colName, id));
      if (colName === 'reports') setDeleteConfirmId(null);
    } catch (e) { setAlertMessage("삭제 오류: " + e.message); }
  };

  const startEdit = (report) => {
    setEditReportId(report.id);
    setEditData({ ...report });
  };

  const saveEdit = async () => {
    if (!user || !editData) return;
    const total = (Number(editData.sales.cash) || 0) + (Number(editData.sales.card) || 0);
    const id = editData.id;
    const updated = { ...editData, totalSales: total };
    delete updated.id;
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'reports', id), updated);
      setEditReportId(null);
      setEditData(null);
      setAlertMessage("리포트가 성공적으로 수정되었습니다.");
    } catch (e) { setAlertMessage("저장 오류: " + e.message); }
  };

  const toggleOpenManualCheck = (id) => {
    setOpenChecks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCloseManualCheck = (id) => {
    setCloseChecks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // --- Statistics ---
  const dailyStatus = useMemo(() => {
    const today = formData.date;
    return {
      상행선: reports.some(r => r.date === today && r.location === '상행선') ? '제출완료' : '미제출',
      하행선: reports.some(r => r.date === today && r.location === '하행선') ? '제출완료' : '미제출'
    };
  }, [reports, formData.date]);

  const monthlyStats = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const mReports = reports.filter(r => { const d = new Date(r.date); return d.getFullYear() === year && d.getMonth() === month; });
    const total = mReports.reduce((s, r) => s + (Number(r.totalSales) || 0), 0);
    const sang = mReports.filter(r => r.location === '상행선').reduce((s, r) => s + (Number(r.totalSales) || 0), 0);
    const ha = mReports.filter(r => r.location === '하행선').reduce((s, r) => s + (Number(r.totalSales) || 0), 0);
    const attend = {};
    mReports.forEach(r => { attend[r.worker] = (attend[r.worker] || 0) + 1; });
    return { total, sang, ha, attend };
  }, [reports, calendarDate]);

  const filteredReports = useMemo(() => {
    let result = [...reports];
    if (filterType === 'LOCATION') result = reports.filter(r => r.location === filterValue);
    else if (filterType === 'WORKER') result = reports.filter(r => r.worker === filterValue);
    return result;
  }, [reports, filterType, filterValue]);

  const downloadCSV = () => {
    const headers = ['일자', '위치', '매니저', '총매출', '현금', '카드', '사용한쌀(kg)', '재고(개)', '부족물품', '특이사항'];
    const rows = filteredReports.map(r => [
      r.date, r.location, r.worker, r.totalSales, r.sales?.cash, r.sales?.card, 
      r.inventory?.usedRice, r.inventory?.stockCount, 
      Object.entries(r.supplies || {}).filter(([k,v]) => v === true).map(([k]) => supplyNames[k] || k).join('|'),
      (r.notes || "").replace(/,/g, " ")
    ]);
    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `하트뻥튀기_업무보고_${getTodayString()}.csv`;
    link.click();
  };

  const renderCalendar = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="p-2"></div>);
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const sales = reports.filter(r => r.date === dStr).reduce((sum, r) => sum + (Number(r.totalSales)||0), 0);
      days.push(
        <div key={d} className={`p-1.5 border border-gray-200 min-h-[80px] flex flex-col rounded-lg ${dStr === getTodayString() ? 'bg-rose-50 border-rose-300' : 'bg-white'}`}>
          <span className="text-xs font-black text-gray-500">{d}</span>
          {sales > 0 && <span className="text-[10px] font-black text-rose-600 mt-auto text-right">{sales.toLocaleString()}</span>}
        </div>
      );
    }
    return days;
  };

  // --- Navigation Menu ---
  const NavigationMenu = () => (
    <div className={`fixed inset-0 z-50 flex transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
      <div className={`relative w-64 bg-white h-full shadow-2xl transition-transform duration-300 transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b-4 border-gray-900 bg-rose-600 text-white">
          <h2 className="font-black text-xl flex items-center gap-2">❤️ 하트메뉴</h2>
        </div>
        <div className="p-4 space-y-2">
          <button onClick={() => { setView('form'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 p-4 rounded-2xl font-black transition-all ${view === 'form' ? 'bg-rose-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}>
            <FileText size={20}/> 업무공유 리포트
          </button>
          <button onClick={() => { setView('notices'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 p-4 rounded-2xl font-black transition-all ${view === 'notices' ? 'bg-rose-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}>
            <MessageSquare size={20}/> 날짜별 공유사항
          </button>
          <div className="pt-4 pb-2 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans">Manuals</div>
          <button onClick={() => { setView('manual_open'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 p-4 rounded-2xl font-black transition-all ${view === 'manual_open' ? 'bg-rose-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}>
            <BookOpen size={20}/> 오픈 매뉴얼
          </button>
          <button onClick={() => { setView('manual_close'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 p-4 rounded-2xl font-black transition-all ${view === 'manual_close' ? 'bg-rose-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}>
            <Clock size={20}/> 마감 매뉴얼
          </button>
          <div className="pt-8 mt-8 border-t-2 border-gray-100">
            <button onClick={() => { setView('login'); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 p-4 rounded-2xl font-black text-gray-400 hover:text-gray-900 transition-all">
              <Lock size={20}/> 관리자 로그인
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderView = () => {
    if (view === 'login') {
      return (
        <div className="max-w-md mx-auto min-h-screen flex items-center justify-center p-4 bg-white font-sans">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full border-2 border-gray-900">
            <h2 className="text-2xl font-black text-center mb-8 text-gray-900">관리자 보안 접속</h2>
            <form onSubmit={(e) => { e.preventDefault(); if (adminPwd === '940329') { setView('admin'); setAdminPwd(''); } else setAlertMessage('인증 암호가 일치하지 않습니다.'); }} className="space-y-6">
              <input type="password" autoFocus value={adminPwd} onChange={e=>setAdminPwd(e.target.value)} className="w-full p-5 bg-gray-100 rounded-xl border-none outline-none text-center text-3xl font-black focus:ring-4 ring-rose-500 text-gray-900 shadow-inner" placeholder="••••••" />
              <button type="submit" className="w-full bg-gray-900 text-white py-5 rounded-xl font-black text-xl active:scale-95 transition-transform">인증하기</button>
            </form>
            <button onClick={()=>setView('form')} className="w-full mt-6 text-gray-900 font-bold text-sm underline text-center">돌아가기</button>
          </div>
        </div>
      );
    }

    if (view === 'admin') {
      return (
        <div className="max-w-4xl mx-auto bg-white min-h-screen pb-32 font-sans">
          <header className="bg-white p-6 sticky top-0 z-30 border-b-4 border-gray-900 flex justify-between items-center shadow-lg">
            <h1 className="font-black text-xl flex items-center gap-2 text-gray-900"><BarChart3 className="text-rose-600"/> 하트뻥튀기 (처인휴게소)</h1>
            <button onClick={()=>setView('form')} className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><LogOut size={24} className="text-gray-900"/></button>
          </header>
          <div className="p-4 space-y-8">
            <div className="bg-white p-6 rounded-[40px] border-4 border-gray-900 shadow-xl space-y-6 animate-in slide-in-from-top-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <div className="space-y-1">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest font-sans">MONTHLY TOTAL SALES</h3>
                    <p className="text-5xl font-black text-rose-600 tracking-tight">{monthlyStats.total.toLocaleString()}원</p>
                 </div>
                 <button onClick={downloadCSV} className="bg-green-600 text-white px-6 py-4 rounded-2xl font-black text-sm flex items-center gap-2 active:scale-95 shadow-xl font-sans"><FileSpreadsheet size={20}/> 엑셀(CSV) 다운로드</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-red-50 p-5 rounded-3xl border-2 border-red-200 shadow-inner">
                    <h4 className="text-[10px] font-black text-red-400 mb-1 uppercase tracking-tighter">상행선 누적</h4>
                    <p className="text-2xl font-black text-red-600">{monthlyStats.sang.toLocaleString()}원</p>
                 </div>
                 <div className="bg-blue-50 p-5 rounded-3xl border-2 border-blue-200 shadow-inner">
                    <h4 className="text-[10px] font-black text-blue-400 mb-1 uppercase tracking-tighter">하행선 누적</h4>
                    <p className="text-2xl font-black text-blue-600">{monthlyStats.ha.toLocaleString()}원</p>
                 </div>
              </div>
            </div>
            <div className="flex bg-gray-100 p-2 rounded-[32px] border-2 border-gray-200">
              <button onClick={()=>setAdminViewMode('list')} className={`flex-1 py-4 rounded-2xl text-base font-black transition-all ${adminViewMode==='list'?'bg-white shadow-xl text-gray-900':'text-gray-500'}`}>리포트 목록</button>
              <button onClick={()=>setAdminViewMode('calendar')} className={`flex-1 py-4 rounded-2xl text-base font-black transition-all ${adminViewMode==='calendar'?'bg-white shadow-xl text-gray-900':'text-gray-500'}`}>집계 달력</button>
            </div>
            {adminViewMode === 'calendar' ? (
              <div className="bg-white p-6 rounded-[40px] border-4 border-gray-900 shadow-xl animate-in fade-in">
                <div className="flex justify-between items-center mb-8 px-4">
                  <button onClick={()=>setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth()-1, 1))} className="p-3 bg-gray-100 rounded-full hover:bg-gray-200"><ChevronLeft size={28} className="text-gray-900"/></button>
                  <span className="font-black text-3xl text-gray-900">{calendarDate.getFullYear()}년 {calendarDate.getMonth()+1}월</span>
                  <button onClick={()=>setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth()+1, 1))} className="p-3 bg-gray-100 rounded-full hover:bg-gray-200"><ChevronRight size={28} className="text-gray-900"/></button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center mb-3 text-[12px] font-black text-gray-400 uppercase tracking-widest font-sans">
                  {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=><div key={d}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                  <button onClick={()=>setFilterType('ALL')} className={`px-5 py-3 rounded-2xl border-4 font-black text-sm whitespace-nowrap transition-all ${filterType==='ALL' ? 'bg-gray-900 text-white border-gray-900 shadow-lg' : 'bg-white border-gray-100 text-gray-400'}`}>전체보기</button>
                  {Object.keys(monthlyStats.attend).map(name => (
                    <button key={name} onClick={()=>{setFilterType('WORKER');setFilterValue(name)}} className={`px-5 py-3 rounded-2xl border-4 font-black text-sm whitespace-nowrap transition-all ${filterType==='WORKER' && filterValue===name ? 'bg-gray-900 text-white border-gray-900 shadow-lg' : 'bg-white border-gray-100 text-gray-400'}`}>{name}</button>
                  ))}
                </div>
                {filteredReports.map(r => (
                  <div key={r.id} className="p-8 rounded-[40px] border-4 shadow-2xl bg-white border-gray-900">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <p className="text-[11px] font-black text-gray-400 mb-1 uppercase tracking-widest font-sans">{new Date(r.timestamp).toLocaleString('ko-KR')}</p>
                        <p className="font-black text-2xl text-gray-900 tracking-tighter">{r.date} | {r.location}</p>
                      </div>
                      <span className={`px-5 py-2.5 rounded-full text-xs font-black text-white shadow-md ${r.location==='상행선'?'bg-red-600':'bg-blue-600'}`}>{r.worker}</span>
                    </div>
                    <div className="flex justify-between items-end border-t-4 border-gray-50 pt-6">
                       <span className="text-xs font-black text-gray-500 uppercase tracking-widest font-sans">Calculated Sales</span>
                       <span className="text-4xl font-black text-gray-900 tracking-tight">{Number(r.totalSales || 0).toLocaleString()}원</span>
                    </div>
                    <button onClick={()=>setExpandedReportId(expandedReportId === r.id ? null : r.id)} className="w-full mt-6 py-5 bg-gray-900 text-white rounded-[24px] text-base font-black active:scale-95 flex items-center justify-center gap-2 shadow-xl">
                      {expandedReportId === r.id ? <ChevronUp/> : <ChevronDown/>} {expandedReportId === r.id ? '상세 닫기' : '상세 보기'}
                    </button>
                    {expandedReportId === r.id && (
                      <div className="mt-8 space-y-6 pt-8 border-t-4 border-dashed border-gray-100 animate-in fade-in zoom-in-95">
                         {editReportId === r.id ? (
                           <div className="space-y-4 bg-gray-50 p-6 rounded-3xl border-2 border-gray-200 shadow-inner">
                             <p className="text-xs font-black text-rose-600 uppercase mb-4 font-sans">Edit Report Mode</p>
                             <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-1">
                                 <label className="text-[10px] font-black text-gray-400 uppercase font-sans">CASH 현금</label>
                                 <input type="number" value={editData.sales?.cash || ''} onChange={e=>setEditData({...editData, sales:{...editData.sales, cash:e.target.value}})} className="w-full p-3 bg-white rounded-xl border-none font-black text-gray-900 text-right" />
                               </div>
                               <div className="space-y-1">
                                 <label className="text-[10px] font-black text-gray-400 uppercase font-sans">CARD 카드</label>
                                 <input type="number" value={editData.sales?.card || ''} onChange={e=>setEditData({...editData, sales:{...editData.sales, card:e.target.value}})} className="w-full p-3 bg-white rounded-xl border-none font-black text-gray-900 text-right" />
                               </div>
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-1">
                                 <label className="text-[10px] font-black text-gray-400 uppercase font-sans">사용한 쌀 (kg)</label>
                                 <input type="number" value={editData.inventory?.usedRice || ''} onChange={e=>setEditData({...editData, inventory:{...editData.inventory, usedRice:e.target.value}})} className="w-full p-3 bg-white rounded-xl border-none font-black text-gray-900 text-right" />
                               </div>
                               <div className="space-y-1">
                                 <label className="text-[10px] font-black text-gray-400 uppercase font-sans">재고 (개)</label>
                                 <input type="number" value={editData.inventory?.stockCount || ''} onChange={e=>setEditData({...editData, inventory:{...editData.inventory, stockCount:e.target.value}})} className="w-full p-3 bg-white rounded-xl border-none font-black text-gray-900 text-right" />
                               </div>
                             </div>
                             <div className="space-y-1">
                               <label className="text-[10px] font-black text-gray-400 font-sans uppercase">Notes</label>
                               <textarea value={editData.notes || ''} onChange={e=>setEditData({...editData, notes:e.target.value})} className="w-full p-3 bg-white rounded-xl border-none font-black text-gray-900" rows={3} />
                             </div>
                             <div className="flex gap-2 pt-2">
                               <button onClick={saveEdit} className="flex-1 py-4 bg-green-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg"><Save size={18}/> 저장하기</button>
                               <button onClick={()=>{setEditReportId(null);setEditData(null)}} className="px-6 py-4 bg-gray-300 text-gray-700 rounded-2xl font-black">취소</button>
                             </div>
                           </div>
                         ) : (
                           <>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100">
                                  <p className="text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest font-sans">Revenue Info</p>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-black text-gray-500">현금</span>
                                    <span className="font-black text-gray-900">{Number(r.sales?.cash || 0).toLocaleString()}원</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs font-black text-gray-500">카드</span>
                                    <span className="font-black text-gray-900">{Number(r.sales?.card || 0).toLocaleString()}원</span>
                                  </div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100">
                                  <p className="text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest font-sans">Inventory Info</p>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-black text-gray-500">쌀 사용량</span>
                                    <span className="font-black text-gray-900">{r.inventory?.usedRice || 0}kg</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs font-black text-gray-500">재고 수량</span>
                                    <span className="font-black text-gray-900">{r.inventory?.stockCount || 0}개</span>
                                  </div>
                                </div>
                             </div>
                             <div className={`p-5 rounded-2xl border-4 ${r.inventory?.hasRiceForNextDay ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                               <p className="text-[10px] font-black text-gray-400 mb-1 uppercase font-sans">Next Day Rice Status</p>
                               <p className={`font-black text-lg ${r.inventory?.hasRiceForNextDay ? 'text-green-700' : 'text-red-700'}`}>
                                 {r.inventory?.hasRiceForNextDay ? '충분함 (1.5박스 이상)' : `부족함 (남은양: ${r.inventory?.remainingRiceAmount || '미기입'})`}
                               </p>
                             </div>
                             <div className="bg-gray-900 p-6 rounded-3xl text-white italic font-bold leading-relaxed shadow-xl">
                               <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-widest not-italic font-sans">Manager Notes</p>
                               "{r.notes || '전달사항 없음'}"
                             </div>
                             <div className="grid grid-cols-5 gap-2">
                               {r.photos && Object.entries(r.photos).map(([key, url]) => (
                                 url && (
                                   <div key={key} onClick={()=>setSelectedPhoto({url, name: photoNames[key], date: r.date, worker: r.worker})} className="aspect-square bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200 cursor-pointer hover:border-rose-500 transition-all">
                                      <img src={url} className="w-full h-full object-cover" />
                                   </div>
                                 )
                               ))}
                             </div>
                             <div className="flex gap-4 pt-4">
                                <button onClick={()=>startEdit(r)} className="flex-1 py-5 bg-blue-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all font-sans uppercase"><Edit2 size={20}/> EDIT</button>
                                <button onClick={()=>setDeleteConfirmId(r.id)} className="flex-1 py-5 bg-red-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all font-sans uppercase"><Trash2 size={20}/> DELETE</button>
                             </div>
                           </>
                         )}
                      </div>
                    )}
                  </div>
                ))}
                {filteredReports.length === 0 && (
                   <div className="bg-white p-20 rounded-[40px] border-4 border-dashed border-gray-200 text-center font-black text-gray-300 font-sans uppercase">NO REPORTS FOUND</div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (view === 'notices') {
      return (
        <div className="max-w-md mx-auto bg-white min-h-screen pb-40 font-sans animate-in fade-in">
          <header className="bg-white p-6 border-b-4 border-gray-900 flex justify-between items-center sticky top-0 z-20 shadow-md">
            <button onClick={() => setIsMenuOpen(true)} className="p-3 bg-gray-100 rounded-2xl active:scale-90"><Menu size={24}/></button>
            <h1 className="font-black text-gray-900 text-xl tracking-tight">하트뻥튀기 (처인휴게소)</h1>
            <div className="w-10"></div>
          </header>
          <div className="p-4 space-y-6">
            <div className="bg-white p-6 rounded-[36px] border-4 border-gray-900 shadow-xl space-y-4">
              <h2 className="text-sm font-black text-rose-600 border-l-8 border-rose-600 pl-3 uppercase">날짜별 공유사항</h2>
              <textarea value={noticeInput} onChange={e=>setNoticeInput(e.target.value)} className="w-full bg-gray-100 rounded-2xl p-5 font-black text-gray-900 border-none outline-none shadow-inner focus:ring-4 ring-rose-100" rows={4} placeholder="모든 매니저가 볼 수 있는 내용을 남겨주세요..."/>
              <button onClick={submitNotice} className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black text-xl shadow-lg active:scale-95 transition-all">공유사항 등록</button>
            </div>
            <div className="space-y-4">
               <h3 className="px-4 text-xs font-black text-gray-400 uppercase tracking-widest font-sans">Recent Updates</h3>
               {notices.map(n => (
                 <div key={n.id} className="bg-white p-6 rounded-[32px] border-4 border-gray-900 shadow-md animate-in slide-in-from-bottom-2">
                    <div className="flex justify-between items-center mb-4">
                       <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">{n.date}</span>
                          <span className="text-[10px] font-black text-gray-400 flex items-center gap-1 font-sans"><Clock size={10}/> {formatTime(n.timestamp)}</span>
                       </div>
                       <button onClick={() => setDeleteConfirmId(n.id)} className="text-[10px] font-black text-gray-300 hover:text-red-500 font-sans uppercase">DELETE</button>
                    </div>
                    <p className="font-black text-gray-900 text-lg whitespace-pre-wrap leading-relaxed bg-gray-50/50 p-4 rounded-2xl border-2 border-gray-50">{n.content}</p>
                 </div>
               ))}
            </div>
          </div>
        </div>
      );
    }

    if (view === 'manual_open' || view === 'manual_close') {
      const isOpen = view === 'manual_open';
      const manualItems = isOpen ? openManualItems : closeManualItems;
      const checks = isOpen ? openChecks : closeChecks;
      const toggleFn = isOpen ? toggleOpenManualCheck : toggleCloseManualCheck;
      const checkedCount = Object.values(checks).filter(Boolean).length;
      const progress = Math.round((checkedCount / manualItems.length) * 100);

      return (
        <div className="max-w-md mx-auto bg-white min-h-screen pb-40 font-sans animate-in fade-in">
          <header className="bg-white p-6 border-b-4 border-gray-900 flex justify-between items-center sticky top-0 z-20 shadow-md">
            <button onClick={() => setIsMenuOpen(true)} className="p-3 bg-gray-100 rounded-2xl active:scale-90 transition-all"><Menu size={24}/></button>
            <h1 className="font-black text-gray-900 text-xl tracking-tight">하트뻥튀기 (처인휴게소)</h1>
            <div className="w-10"></div>
          </header>
          <div className="p-4 space-y-6">
            <div className="bg-white p-6 rounded-[44px] border-4 border-gray-900 shadow-xl space-y-6">
              <div className="flex justify-between items-end">
                <h2 className="text-sm font-black text-rose-600 border-l-8 border-rose-600 pl-4 uppercase font-sans tracking-widest">
                  {isOpen ? 'OPEN MANUAL 오픈 매뉴얼' : 'CLOSE MANUAL 마감 매뉴얼'}
                </h2>
                <span className="text-3xl font-black text-gray-900 font-sans">{progress}%</span>
              </div>
              <div className="w-full h-6 bg-gray-100 rounded-full border-2 border-gray-900 overflow-hidden shadow-inner">
                <div className="h-full bg-rose-600 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
              </div>
              <div className="bg-rose-50 p-5 rounded-3xl border-2 border-rose-200">
                <p className="text-sm font-black text-rose-800 leading-relaxed text-center italic">
                  {isOpen ? '"적혀있는 순서대로 오픈하기를 권장드립니다. 개인의 기호에 따라 편하신 대로 선택하셔도 됩니다."' : '"깨끗한 매장을 위해 마감 수칙을 꼭 지켜주세요. 오늘도 정말 고생 많으셨습니다."'}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {manualItems.map((item) => (
                <button key={item.id} onClick={() => toggleFn(item.id)} className={`w-full flex items-center gap-5 p-5 rounded-3xl border-4 transition-all duration-300 transform active:scale-[0.98] ${checks[item.id] ? 'bg-rose-50 border-rose-600 shadow-inner' : 'bg-white border-gray-100 shadow-lg'}`}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md flex-shrink-0 ${checks[item.id] ? 'bg-rose-600 text-white' : 'bg-gray-100'}`}>
                    {checks[item.id] ? <CheckCircle2 size={28}/> : item.icon}
                  </div>
                  <span className={`flex-1 text-left font-black text-lg leading-tight ${checks[item.id] ? 'text-rose-700 line-through opacity-60' : 'text-gray-900'}`}>
                    {item.title}
                  </span>
                  {!checks[item.id] && <Circle size={28} className="text-gray-200 flex-shrink-0"/>}
                </button>
              ))}
            </div>
            {progress === 100 && (
              <div className="bg-green-600 p-8 rounded-[44px] text-white text-center shadow-2xl animate-in zoom-in font-black space-y-2">
                <h3 className="text-2xl">{isOpen ? '준비 완료! ✨' : '마감 완료! 🌙'}</h3>
                <p className="opacity-80 font-sans uppercase">{isOpen ? 'GOOD LUCK TODAY!' : 'HAVE A NICE REST!'}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    // --- Default: Report Form ---
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen pb-20 font-sans">
        <header className="bg-white p-6 border-b-4 border-gray-900 sticky top-0 z-20 flex flex-col gap-2 shadow-md">
          <div className="flex justify-between items-center">
            <button onClick={() => setIsMenuOpen(true)} className="p-3 bg-gray-100 rounded-2xl active:scale-90 transition-all"><Menu size={24}/></button>
            <h1 className="font-black text-gray-900 text-lg sm:text-xl flex items-center gap-1 sm:gap-2 tracking-tight">❤️ 하트뻥튀기 (처인휴게소)</h1>
            <div className="w-10"></div>
          </div>
        </header>

        <div className="p-4 space-y-8 animate-in slide-in-from-bottom-4 duration-700">
          {/* 💡 수정: 투데이 워크 데이트 고정 해제 (본문으로 이동) */}
          <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-[28px] border-2 border-gray-900 mt-2 shadow-inner">
             <div className="flex-1 flex flex-col">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-0.5 font-sans">TODAY WORK DATE</span>
                <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="text-base font-black text-gray-900 bg-transparent border-none p-0 focus:ring-0 cursor-pointer" />
             </div>
             <div className="flex gap-3">
                <div className="flex flex-col items-center">
                   {/* 💡 수정: UP -> 상행선 */}
                   <span className="text-[9px] font-black text-gray-400 mb-1 font-sans">상행선</span>
                   <span className={`text-[10px] font-black px-3 py-1 rounded-full border-2 transition-all duration-500 ${dailyStatus.상행선 === '제출완료' ? 'bg-green-600 text-white border-green-600 shadow-md' : 'bg-white text-gray-300 border-gray-200'}`}>{dailyStatus.상행선}</span>
                </div>
                <div className="flex flex-col items-center">
                   {/* 💡 수정: DOWN -> 하행선 */}
                   <span className="text-[9px] font-black text-gray-400 mb-1 font-sans">하행선</span>
                   <span className={`text-[10px] font-black px-3 py-1 rounded-full border-2 transition-all duration-500 ${dailyStatus.하행선 === '제출완료' ? 'bg-green-600 text-white border-green-600 shadow-md' : 'bg-white text-gray-300 border-gray-200'}`}>{dailyStatus.하행선}</span>
                </div>
             </div>
          </div>

          <section className="bg-white p-6 rounded-[44px] border-4 border-gray-900 shadow-2xl space-y-6">
            <h2 className="text-sm font-black text-gray-900 border-l-8 border-rose-600 pl-4 uppercase tracking-widest font-sans">1. 기본 정보 및 매출</h2>
            <div className="space-y-6 pt-2">
               <div className="flex justify-between items-center">
                  <label className="text-lg font-black text-gray-900">근무 매니저</label>
                  <select value={formData.worker} onChange={e=>setFormData({...formData, worker:e.target.value})} className="bg-gray-100 p-4 rounded-2xl text-base font-black border-none outline-none focus:ring-4 ring-rose-500 text-gray-900 shadow-inner">
                    <option>정윤이</option><option>황진웅</option><option>최윤미</option><option>장유미</option><option>윤종규</option><option>직접입력</option>
                  </select>
               </div>
               <div className="flex justify-between items-center">
                  <label className="text-lg font-black text-gray-900">영업 위치</label>
                  <div className="flex gap-3">
                    {['상행선','하행선'].map(l=>(
                      <button key={l} onClick={()=>setFormData({...formData, location:l})} className={`px-7 py-4 rounded-2xl text-base font-black border-4 transition-all duration-300 active:scale-90 shadow-sm ${formData.location === l ? (l === '상행선' ? 'bg-red-600 border-red-600 text-white shadow-xl' : 'bg-blue-600 border-blue-600 text-white shadow-xl') : 'bg-white border-gray-100 text-gray-300'}`}>{l}</button>
                    ))}
                  </div>
               </div>
            </div>
            <div className="space-y-4 pt-8 border-t-2 border-dashed border-gray-100">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-gray-900 ml-1 uppercase font-sans">CASH 현금</label>
                  <input type="number" value={formData.sales.cash} onChange={e=>setFormData({...formData, sales:{...formData.sales, cash:e.target.value}})} className="w-full p-5 bg-gray-100 rounded-[28px] border-none outline-none font-black text-right text-gray-900 text-2xl shadow-inner focus:ring-4 ring-rose-200" placeholder="0" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-gray-900 ml-1 uppercase font-sans">CARD 카드</label>
                  <input type="number" value={formData.sales.card} onChange={e=>setFormData({...formData, sales:{...formData.sales, card:e.target.value}})} className="w-full p-5 bg-gray-100 rounded-[28px] border-none outline-none font-black text-right text-gray-900 text-2xl shadow-inner focus:ring-4 ring-rose-200" placeholder="0" />
                </div>
              </div>
              <div className={`p-6 rounded-[32px] flex justify-between items-center text-white shadow-2xl transition-all duration-700 transform ${formData.location === '상행선' ? 'bg-red-600' : 'bg-blue-600'} hover:scale-[1.03]`}>
                <span className="text-xl font-black">오늘 마감 합계</span>
                <span className="text-4xl font-black tracking-tight font-sans">{((Number(formData.sales.cash)||0)+(Number(formData.sales.card)||0)).toLocaleString()}원</span>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-[44px] border-4 border-gray-900 shadow-2xl space-y-6">
            <h2 className="text-sm font-black text-gray-900 border-l-8 border-rose-600 pl-4 uppercase tracking-widest font-sans">2. 마감 체크리스트</h2>
            <div className="grid grid-cols-1 gap-3 pt-2">
              {Object.keys(checklistNames).map(k=>(
                <button key={k} onClick={()=>handleChecklist(k)} className={`w-full flex justify-between py-5 px-7 items-center rounded-[28px] border-4 transition-all duration-200 transform active:scale-95 ${formData.checklist[k] ? 'bg-rose-50 border-rose-600 shadow-xl' : 'border-gray-50 bg-gray-50/50'}`}>
                  <span className={`text-lg font-black transition-colors ${formData.checklist[k] ? 'text-rose-700' : 'text-gray-900'}`}>{checklistNames[k]}</span>
                  {formData.checklist[k] ? <CheckCircle2 className="text-rose-600" size={32}/> : <Circle className="text-gray-200" size={32}/>}
                </button>
              ))}
            </div>
          </section>

          <section className="bg-white p-6 rounded-[44px] border-4 border-gray-900 shadow-2xl space-y-6">
            <h2 className="text-sm font-black text-gray-900 border-l-8 border-rose-600 pl-4 uppercase tracking-widest font-sans">3. 재료 및 재고 현황</h2>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <label className="text-[11px] font-black text-gray-900 ml-1 uppercase font-sans">STOCK 재고 (개)</label>
                <input type="number" value={formData.inventory.stockCount} onChange={e=>setFormData({...formData, inventory:{...formData.inventory, stockCount:e.target.value}})} className="w-full p-5 bg-gray-100 rounded-[28px] border-none outline-none font-black text-right text-gray-900 text-2xl shadow-inner focus:ring-4 ring-rose-200" placeholder="0" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-black text-gray-900 ml-1 uppercase font-sans">사용한 쌀 (kg)</label>
                <input type="number" value={formData.inventory.usedRice} onChange={e=>setFormData({...formData, inventory:{...formData.inventory, usedRice:e.target.value}})} className="w-full p-5 bg-gray-100 rounded-[28px] border-none outline-none font-black text-right text-gray-900 text-2xl shadow-inner focus:ring-4 ring-rose-200" placeholder="0" />
              </div>
            </div>
            <div className="pt-8 border-t-2 border-dashed border-gray-100 space-y-5">
              <p className="text-xl font-black text-gray-900 text-center leading-tight">내일 사용할 쌀이 충분한가요?<br/><span className="text-xs text-rose-500 font-bold tracking-tighter uppercase font-sans">(1.5 BOX MINIMUM CHECK)</span></p>
              <div className="flex gap-4">
                <button onClick={()=>setFormData({...formData, inventory:{...formData.inventory, hasRiceForNextDay:true, remainingRiceAmount: ''}})} className={`flex-1 py-6 rounded-[28px] font-black text-xl border-4 transition-all duration-300 transform active:scale-95 ${formData.inventory.hasRiceForNextDay===true?'bg-rose-600 border-rose-600 text-white shadow-2xl':'bg-white border-gray-100 text-gray-400'}`}>네, 충분함</button>
                <button onClick={()=>setFormData({...formData, inventory:{...formData.inventory, hasRiceForNextDay:false}})} className={`flex-1 py-6 rounded-[28px] font-black text-xl border-4 transition-all duration-300 transform active:scale-95 ${formData.inventory.hasRiceForNextDay===false?'bg-gray-900 border-gray-900 text-white shadow-2xl':'bg-white border-gray-100 text-gray-400'}`}>아니오, 부족</button>
              </div>
              {formData.inventory.hasRiceForNextDay === false && (
                  <div className="mt-4 p-6 bg-rose-50 rounded-[32px] border-4 border-rose-500 space-y-4 animate-in slide-in-from-top-6 duration-500 shadow-2xl">
                      <label className="text-xl font-black text-rose-800 block">쌀 잔량 정보를 입력해 주세요</label>
                      <input type="text" value={formData.inventory.remainingRiceAmount} onChange={e=>setFormData({...formData, inventory:{...formData.inventory, remainingRiceAmount: e.target.value}})} className="w-full p-5 bg-white rounded-2xl border-none outline-none font-black text-gray-900 text-2xl shadow-inner focus:ring-4 ring-rose-300 placeholder:text-gray-200" placeholder="예: 0.5박스 남았습니다" />
                  </div>
              )}
            </div>
          </section>

          <section className="bg-white p-6 rounded-[44px] border-4 border-gray-900 shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-black text-gray-900 border-l-8 border-rose-600 pl-4 uppercase tracking-widest font-sans">4. 증빙 사진 촬영 (필수)</h2>
              {isUploading && <Loader2 className="w-8 h-8 text-rose-600 animate-spin"/>}
            </div>
            <div className="grid grid-cols-3 gap-4 pt-2">
              {Object.keys(photoNames).map(p=>(
                <label key={p} className={`aspect-square rounded-[36px] border-4 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden relative transition-all duration-200 transform active:scale-90 ${formData.photos[p] ? 'bg-gray-50 border-rose-500 shadow-2xl scale-[1.02]' : 'bg-gray-50 border-gray-200 hover:border-gray-900'}`}>
                  <input type="file" accept="image/*" className="hidden" onChange={e=>handlePhotoChange(p, e)} disabled={isUploading} />
                  {formData.photos[p] ? <img src={formData.photos[p]} className="w-full h-full object-cover" /> : <div className="flex flex-col items-center opacity-40"><Camera size={40} className="text-gray-900 mb-2"/><span className="text-[11px] font-black text-gray-900 uppercase tracking-tighter uppercase font-sans">{photoNames[p]}</span></div>}
                  {formData.photos[p] && <div className="absolute inset-0 bg-rose-600/10 flex items-center justify-center animate-in zoom-in duration-300"><CheckCircle2 className="text-rose-600" size={56}/></div>}
                </label>
              ))}
            </div>
          </section>

          <section className="bg-white p-6 rounded-[44px] border-4 border-gray-900 shadow-2xl space-y-6">
            <h2 className="text-sm font-black text-gray-900 border-l-8 border-rose-600 pl-4 uppercase tracking-widest font-sans">5. 대기 손님 파악</h2>
            <div className="flex gap-4 pt-2">
              <button onClick={()=>handleWaitingToggle(true)} className={`flex-1 py-7 rounded-[28px] font-black text-xl border-4 transition-all duration-300 transform active:scale-95 ${formData.waiting.hadWaiting===true?'bg-blue-600 border-blue-600 text-white shadow-2xl':'bg-white border-gray-100 text-gray-400'}`}>손님 있었음</button>
              <button onClick={()=>handleWaitingToggle(false)} className={`flex-1 py-7 rounded-[28px] font-black text-xl border-4 transition-all duration-300 transform active:scale-95 ${formData.waiting.hadWaiting===false?'bg-gray-900 border-gray-900 text-white shadow-2xl':'bg-white border-gray-100 text-gray-400'}`}>없었음</button>
            </div>
          </section>

          <section className="bg-white p-6 rounded-[44px] border-4 border-gray-900 shadow-2xl space-y-4">
            <h2 className="text-sm font-black text-gray-900 border-l-8 border-rose-600 pl-4 uppercase tracking-widest font-sans">6. 특이사항</h2>
            <textarea rows="5" value={formData.notes} onChange={e=>setFormData({...formData, notes:e.target.value})} className="w-full bg-gray-100 rounded-[36px] p-8 border-none outline-none text-lg font-black text-gray-900 placeholder:text-gray-300 shadow-inner focus:ring-4 ring-rose-100" placeholder="사장님께 전달할 특별한 내용이 있다면 입력해 주세요..." />
          </section>

          <div className="mt-12 p-5 pb-12 bg-white border-t-4 border-gray-900">
            <button onClick={submitReport} disabled={isSubmitting || isUploading} className={`w-full py-7 rounded-[32px] font-black text-2xl text-white shadow-[0_15px_40px_rgba(225,29,72,0.3)] transition-all transform active:scale-95 flex items-center justify-center gap-4 ${isSubmitting||isUploading?'bg-gray-400 border-gray-400':'bg-rose-600 hover:bg-rose-700 border-rose-700'}`}>
              {isSubmitting ? <Loader2 className="animate-spin" size={36}/> : null} {isSubmitting ? '보고서 전송 중...' : '업무공유 제출 완료하기'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <NavigationMenu />
      {renderView()}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/95 z-[300] flex items-center justify-center p-8 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="bg-white p-12 rounded-[64px] w-full text-center shadow-2xl border-[12px] border-gray-900 animate-in zoom-in duration-500">
            <div className="bg-green-100 w-36 h-36 rounded-full flex items-center justify-center mx-auto mb-10 shadow-inner"><CheckCircle2 size={84} className="text-green-600"/></div>
            <h3 className="text-4xl font-black mb-6 text-gray-900 tracking-tighter uppercase font-sans tracking-widest">SUCCESS</h3>
            <p className="text-gray-500 mb-14 font-black text-2xl leading-relaxed">매니저님, 정말 고생 많으셨습니다!<br/>조심히 들어가세요. ✨</p>
            <button onClick={() => { window.location.reload(); }} className="w-full bg-gray-900 text-white py-8 rounded-[36px] font-black text-2xl shadow-2xl hover:bg-black active:scale-95 transition-all uppercase tracking-widest font-sans">Main Return</button>
          </div>
        </div>
      )}
      {alertMessage && (
        <div className="fixed inset-0 bg-black/85 z-[310] flex items-center justify-center p-8 backdrop-blur-sm" onClick={()=>setAlertMessage('')}>
          <div className="bg-white p-12 rounded-[56px] w-full text-center border-8 border-rose-600 shadow-2xl animate-in zoom-in-95 duration-300" onClick={e=>e.stopPropagation()}>
            <div className="bg-amber-50 w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner"><AlertCircle size={64} className="text-rose-600"/></div>
            <p className="text-gray-900 font-black text-2xl mb-12 whitespace-pre-wrap leading-relaxed tracking-tight">{String(alertMessage)}</p>
            <button onClick={()=>setAlertMessage('')} className="w-full bg-gray-900 text-white py-7 rounded-[32px] font-black text-2xl hover:bg-black active:scale-95 transition-all">확인 완료</button>
          </div>
        </div>
      )}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/98 z-[100] flex flex-col items-center justify-center p-6 animate-in fade-in duration-300" onClick={()=>setSelectedPhoto(null)}>
          <div className="absolute top-8 right-8 flex gap-8">
             <a href={selectedPhoto.url} download={`하트뻥튀기_${selectedPhoto.date}_${selectedPhoto.name}.jpg`} className="p-5 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors shadow-2xl" onClick={e=>e.stopPropagation()}><Download size={36}/></a>
             <button className="p-5 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors shadow-2xl"><X size={36}/></button>
          </div>
          <img src={selectedPhoto.url} className="max-w-full max-h-[80vh] rounded-[40px] shadow-2xl border-4 border-white/20 animate-in zoom-in duration-500" />
          <div className="text-center mt-10 text-white font-black animate-in slide-in-from-bottom-4">
            <p className="text-4xl mb-3 tracking-tighter uppercase">{String(selectedPhoto.name)}</p>
            <p className="text-gray-500 text-xl uppercase tracking-[0.2em]">{String(selectedPhoto.date)} | {String(selectedPhoto.worker)} MANAGER</p>
          </div>
        </div>
      )}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/85 z-[200] flex items-center justify-center p-8 backdrop-blur-md animate-in fade-in duration-200">
           <div className="bg-white p-12 rounded-[56px] w-full max-w-sm text-center border-[10px] border-red-600 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="bg-red-50 w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner"><AlertCircle size={64} className="text-red-600"/></div>
              <p className="font-black text-gray-900 mb-12 text-3xl tracking-tight leading-tight">정말 이 항목을<br/>영구 삭제하시겠습니까?</p>
              <div className="flex gap-4">
                 <button onClick={()=>setDeleteConfirmId(null)} className="flex-1 py-6 bg-gray-100 rounded-[28px] font-black text-xl text-gray-500 hover:bg-gray-200 transition-colors">취소</button>
                 <button onClick={()=>executeDelete(deleteConfirmId, view === 'notices' ? 'notices' : 'reports')} className="flex-1 py-6 bg-red-600 text-white rounded-[28px] font-black shadow-2xl hover:bg-red-700 active:scale-95 transition-all">삭제 승인</button>
              </div>
           </div>
        </div>
      )}
    </>
  );
}