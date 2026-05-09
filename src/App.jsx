import React, { useState, useMemo, useEffect } from 'react';
import { Camera, CheckCircle2, Circle, MapPin, Calendar, DollarSign, AlertCircle, FileText, User, Lock, Download, Image as ImageIcon, BarChart3, Users, LogOut, ChevronDown, ChevronUp, X, ChevronLeft, ChevronRight, CalendarDays, List, HelpCircle, Edit2, Trash2, Save, Maximize2, Loader2, FileSpreadsheet } from 'lucide-react';

// === Firebase Database Integration ===
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc, query } from 'firebase/firestore';

// =====================================================================
// 💡 Load Firebase Config
// =====================================================================
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "AIzaSyAjjEtx4Rkf7yGRaymWf9_tmUzf-yQ16Qg",
  authDomain: "heart-pop.firebaseapp.com",
  projectId: "heart-pop",
  storageBucket: "heart-pop.firebasestorage.app",
  messagingSenderId: "711616458234",
  appId: "1:711616458234:web:bb3de45e0be2f6102c0843"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 💡 Firebase Path Helper
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

const getTodayString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return (new Date(now - offset)).toISOString().split('T')[0];
};

export default function App() {
  // --- States ---
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [view, setView] = useState('form'); 
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
        console.error("인증 에러:", err);
        setAlertMessage("서버 연결 실패: Firebase에서 '익명 로그인'이 켜져 있는지 확인해 주세요.");
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  // --- 2. Data Fetching ---
  useEffect(() => {
    if (!user) return;
    const reportsRef = collection(db, 'artifacts', appId, 'public', 'data', 'reports');
    const unsubscribe = onSnapshot(reportsRef, (snapshot) => {
      const fetched = [];
      snapshot.forEach((doc) => fetched.push({ id: doc.id, ...doc.data() }));
      fetched.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setReports(fetched);
    }, (error) => {
      console.error("데이터 동기화 에러:", error);
      // 권한 에러인 경우 사용자에게 안내
      if (error.code === 'permission-denied') {
        // 이 메시지는 대시보드 접근 시 보일 수 있음
      }
    });
    return () => unsubscribe();
  }, [user]);

  // --- Statistics Logic ---
  const dailyStatus = useMemo(() => {
    const today = formData.date;
    const sang = reports.find(r => r.date === today && r.location === '상행선');
    const ha = reports.find(r => r.date === today && r.location === '하행선');
    return {
      상행선: sang ? '제출완료' : '미제출',
      하행선: ha ? '제출완료' : '미제출'
    };
  }, [reports, formData.date]);

  const monthlyStats = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const monthlyReports = reports.filter(r => {
      const d = new Date(r.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    const totalSales = monthlyReports.reduce((sum, r) => sum + (Number(r.totalSales) || 0), 0);
    const attendance = {};
    monthlyReports.forEach(r => {
      const name = r.worker;
      attendance[name] = (attendance[name] || 0) + 1;
    });
    return { totalSales, attendance };
  }, [reports, calendarDate]);

  const filteredReports = useMemo(() => {
    let result = reports;
    if (filterType === 'LOCATION') {
      result = reports.filter(r => r.location === filterValue);
    } else if (filterType === 'WORKER') {
      result = reports.filter(r => r.worker === filterValue);
    }
    return result;
  }, [reports, filterType, filterValue]);

  // --- Handlers ---
  const handleChecklist = (key) => {
    setFormData(prev => ({
      ...prev,
      checklist: { ...prev.checklist, [key]: !prev.checklist[key] },
    }));
  };

  const handleWaitingToggle = (val) => {
    setFormData(prev => ({
      ...prev,
      waiting: { ...prev.waiting, hadWaiting: val }
    }));
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
    if (formData.inventory.hasRiceForNextDay === null) return setAlertMessage("다음날 쌀 여부를 선택해 주세요.");
    if (formData.inventory.hasRiceForNextDay === false && !formData.inventory.remainingRiceAmount) return setAlertMessage("쌀 잔량을 입력해 주세요.");
    if (formData.waiting.hadWaiting === null) return setAlertMessage("대기 손님 질문에 답해 주세요.");
    if (!user) return setAlertMessage("인증 중입니다. 잠시만 기다려 주세요.");

    setIsSubmitting(true);
    const total = (Number(formData.sales.cash) || 0) + (Number(formData.sales.card) || 0);
    const id = Date.now().toString();
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'reports', id);
      await setDoc(docRef, {
        ...formData,
        totalSales: total,
        timestamp: new Date().toISOString()
      });
      setShowSubmitModal(true);
    } catch (e) {
      console.error("제출 에러:", e);
      if (e.code === 'permission-denied') {
        setAlertMessage("제출 실패: 서버 권한이 없습니다.\nFirebase 콘솔의 '보안 규칙' 설정을 확인해 주세요.");
      } else {
        setAlertMessage("제출 실패: " + e.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeDelete = async (id) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'reports', id));
      setDeleteConfirmId(null);
      setExpandedReportId(null);
    } catch (e) { alert("삭제 오류: " + e.message); }
  };

  const saveEdit = async () => {
    if (!user || !editData) return;
    const total = (Number(editData.sales.cash) || 0) + (Number(editData.sales.card) || 0);
    const updated = { ...editData, totalSales: total };
    const id = editData.id;
    delete updated.id;
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'reports', id), updated);
      setEditReportId(null);
      setEditData(null);
    } catch (e) { alert("저장 오류: " + e.message); }
  };

  const downloadCSV = () => {
    const headers = ['일자', '위치', '매니저', '총매출', '현금', '카드', '사용쌀(kg)', '재고(개)', '부족물품', '특이사항'];
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

  // --- Views ---
  if (view === 'login') {
    return (
      <div className="max-w-md mx-auto min-h-screen flex items-center justify-center p-4 bg-white font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full border-2 border-gray-900">
          <h2 className="text-2xl font-black text-center mb-8 text-gray-900">관리자 보안 접속</h2>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (adminPwd === '940329') { setView('admin'); setAdminPwd(''); }
            else setAlertMessage('인증 암호가 일치하지 않습니다.');
          }} className="space-y-6">
            <input 
              type="password" 
              autoFocus
              value={adminPwd} 
              onChange={e=>setAdminPwd(e.target.value)} 
              className="w-full p-5 bg-gray-100 rounded-xl border-none outline-none text-center text-3xl font-black focus:ring-4 ring-rose-500 text-gray-900" 
              placeholder="••••••" 
            />
            <button type="submit" className="w-full bg-gray-900 text-white py-5 rounded-xl font-black text-xl active:scale-95 transition-transform">인증하기</button>
          </form>
          <button onClick={()=>setView('form')} className="w-full mt-6 text-gray-900 font-bold text-sm underline">돌아가기</button>
        </div>
      </div>
    );
  }

  if (view === 'admin') {
    return (
      <div className="max-w-3xl mx-auto bg-white min-h-screen pb-32 font-sans">
        <header className="bg-white p-6 sticky top-0 z-30 border-b-4 border-gray-900 flex justify-between items-center shadow-lg">
          <h1 className="font-black text-2xl flex items-center gap-2 text-gray-900"><BarChart3 className="text-rose-600"/> 업무공유 현황</h1>
          <button onClick={()=>setView('form')} className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><LogOut size={24} className="text-gray-900"/></button>
        </header>

        <div className="p-4 space-y-8">
          <div className="bg-white p-6 rounded-3xl border-4 border-gray-900 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
               <div>
                  <h3 className="text-xs font-black text-gray-500 mb-1 uppercase tracking-tighter">Selected Month Sales</h3>
                  <p className="text-4xl font-black text-rose-600 tracking-tight">{monthlyStats.totalSales.toLocaleString()}원</p>
               </div>
               <button onClick={downloadCSV} className="bg-green-600 text-white px-5 py-3 rounded-xl font-black text-sm flex items-center gap-2 active:scale-95 shadow-md"><FileSpreadsheet size={18}/> 엑셀(CSV) 저장</button>
            </div>
            <div className="pt-4 border-t-2 border-dashed border-gray-100">
               <h4 className="text-xs font-black text-gray-500 mb-3">이달의 매니저별 출근 현황</h4>
               <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {Object.entries(monthlyStats.attendance).map(([name, count]) => (
                    <button key={name} onClick={()=>{setFilterType('WORKER');setFilterValue(name)}} className={`px-4 py-3 rounded-2xl border-2 font-black text-sm whitespace-nowrap transition-all ${filterType==='WORKER' && filterValue===name ? 'bg-gray-900 text-white border-gray-900 shadow-lg' : 'bg-gray-50 border-gray-100 text-gray-700'}`}>
                       {name} 매니저 ({count}회)
                    </button>
                  ))}
               </div>
            </div>
          </div>

          <div className="flex bg-gray-100 p-1.5 rounded-2xl border-2 border-gray-200">
            <button onClick={()=>setAdminViewMode('list')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${adminViewMode==='list'?'bg-white shadow-md text-gray-900':'text-gray-500'}`}>목록 필터링</button>
            <button onClick={()=>setAdminViewMode('calendar')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${adminViewMode==='calendar'?'bg-white shadow-md text-gray-900':'text-gray-500'}`}>종합 달력</button>
          </div>

          {adminViewMode === 'calendar' ? (
            <div className="bg-white p-6 rounded-3xl border-4 border-gray-900 shadow-xl animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-6 px-2">
                <button onClick={()=>setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth()-1, 1))} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><ChevronLeft size={24} className="text-gray-900"/></button>
                <span className="font-black text-2xl text-gray-900">{calendarDate.getFullYear()}년 {calendarDate.getMonth()+1}월</span>
                <button onClick={()=>setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth()+1, 1))} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><ChevronRight size={24} className="text-gray-900"/></button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center mb-2 text-[10px] font-black text-gray-400">
                {['일','월','화','수','목','금','토'].map(d=><div key={d}>{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
            </div>
          ) : (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                 <button onClick={()=>setFilterType('ALL')} className={`px-5 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all border-2 ${filterType==='ALL'?'bg-rose-600 text-white border-rose-600 shadow-lg':'bg-gray-100 text-gray-400 border-transparent'}`}>전체 내역</button>
                 <button onClick={()=>{setFilterType('LOCATION');setFilterValue('상행선')}} className={`px-5 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all border-2 ${filterType==='LOCATION'&&filterValue==='상행선'?'bg-red-600 text-white border-red-600 shadow-lg':'bg-gray-100 text-gray-400 border-transparent'}`}>상행선만</button>
                 <button onClick={()=>{setFilterType('LOCATION');setFilterValue('하행선')}} className={`px-5 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all border-2 ${filterType==='LOCATION'&&filterValue==='하행선'?'bg-blue-600 text-white border-blue-600 shadow-lg':'bg-gray-100 text-gray-400 border-transparent'}`}>하행선만</button>
              </div>

              {filteredReports.map(r => {
                const isExpanded = expandedReportId === r.id;
                const isEditing = editReportId === r.id;
                const data = isEditing ? editData : r;
                
                return (
                  <div key={r.id} className={`p-6 rounded-3xl border-4 shadow-xl transition-all ${isEditing ? 'border-blue-500 bg-blue-50' : 'bg-white border-gray-900'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 mb-1 uppercase">{new Date(data.timestamp).toLocaleString('ko-KR')}</p>
                        <p className="font-black text-xl text-gray-900 tracking-tighter">{data.date} | {data.location}</p>
                      </div>
                      <span className={`px-4 py-2 rounded-full text-xs font-black text-white ${data.location==='상행선'?'bg-red-600':'bg-blue-600'}`}>{data.worker}</span>
                    </div>

                    <div className="flex justify-between items-end border-t-2 border-gray-100 pt-4">
                       <span className="text-xs font-black text-gray-500 uppercase">Total Sales</span>
                       <span className="text-3xl font-black text-gray-900 tracking-tight">{data.totalSales.toLocaleString()}원</span>
                    </div>

                    <button onClick={()=>setExpandedReportId(isExpanded ? null : r.id)} className="w-full mt-4 py-4 bg-gray-900 text-white rounded-2xl text-sm font-black transition-all active:scale-95 shadow-md">
                       {isExpanded ? '리포트 접기' : '리포트 상세 보기 (수정/삭제)'}
                    </button>

                    {isExpanded && (
                      <div className="mt-6 space-y-6 pt-6 border-t-4 border-dashed border-gray-200 animate-in fade-in zoom-in-95">
                         {isEditing ? (
                           <div className="space-y-4 bg-white p-5 rounded-2xl border-4 border-blue-500 shadow-inner">
                              <h4 className="font-black text-xl text-blue-700">리포트 데이터 수정</h4>
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-1"><label className="text-[11px] font-black text-gray-400 ml-1">현금 매출</label><input type="number" value={editData.sales.cash} onChange={e=>setEditData({...editData, sales:{...editData.sales, cash:e.target.value}})} className="w-full p-4 bg-gray-100 rounded-xl border-none outline-none font-black text-gray-900" /></div>
                                 <div className="space-y-1"><label className="text-[11px] font-black text-gray-400 ml-1">카드 매출</label><input type="number" value={editData.sales.card} onChange={e=>setEditData({...editData, sales:{...editData.sales, card:e.target.value}})} className="w-full p-4 bg-gray-100 rounded-xl border-none outline-none font-black text-gray-900" /></div>
                                 <div className="col-span-2 space-y-1"><label className="text-[11px] font-black text-gray-400 ml-1">특이사항</label><textarea value={editData.notes} onChange={e=>setEditData({...editData, notes:e.target.value})} className="w-full p-4 bg-gray-100 rounded-xl border-none outline-none font-black text-gray-900" rows={3}/></div>
                              </div>
                              <div className="flex gap-2 pt-2"><button onClick={()=>setEditReportId(null)} className="flex-1 py-4 bg-gray-200 rounded-xl font-black text-gray-500">수정 취소</button><button onClick={saveEdit} className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-black shadow-lg">수정 저장</button></div>
                           </div>
                         ) : (
                           <>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100"><p className="text-[10px] font-black text-gray-400 mb-2 uppercase">매출 상세</p><p className="text-sm font-black text-gray-900">현금: {data.sales?.cash.toLocaleString()}원</p><p className="text-sm font-black text-gray-900">카드: {data.sales?.card.toLocaleString()}원</p></div>
                                <div className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100"><p className="text-[10px] font-black text-gray-400 mb-2 uppercase">재고/재료</p><p className="text-sm font-black text-gray-900">쌀 사용: {data.inventory?.usedRice}kg</p><p className="text-sm font-black text-gray-900">재고량: {data.inventory?.stockCount}개</p></div>
                                <div className="col-span-2 bg-rose-50 p-5 rounded-2xl border-2 border-rose-200">
                                   <p className="text-[10px] font-black text-rose-400 mb-1 uppercase tracking-widest">익일 쌀 현황</p>
                                   <p className="font-black text-lg text-gray-900">{data.inventory?.hasRiceForNextDay ? '충분함 (1.5박스↑)' : `부족함 (잔량: ${data.inventory?.remainingRiceAmount})`}</p>
                                </div>
                             </div>

                             <div className="bg-amber-50 p-5 rounded-2xl border-2 border-amber-200">
                                <p className="text-[10px] font-black text-amber-500 mb-3 uppercase tracking-widest font-sans">마감 체크리스트</p>
                                <div className="grid grid-cols-1 gap-2 text-[13px] font-black text-gray-800">
                                   {Object.entries(data.checklist || {}).map(([k,v]) => (
                                      <div key={k} className="flex items-center justify-between border-b border-amber-100 pb-1">{checklistNames[k] || k} {v ? <CheckCircle2 className="text-green-600" size={16}/> : <Circle className="text-gray-300" size={16}/>}</div>
                                   ))}
                                </div>
                             </div>

                             <div className="bg-blue-50 p-5 rounded-2xl border-2 border-blue-200">
                                <p className="text-[10px] font-black text-blue-400 mb-1 uppercase tracking-widest">부족 물품 요청</p>
                                <p className="font-black text-blue-900 text-base leading-snug">
                                   {Object.entries(data.supplies || {}).filter(([k,v]) => v === true).map(([k]) => supplyNames[k] || k).join(', ') || '요청 물품 없음'}
                                   {data.supplies?.extra && ` / 추가 내용: ${data.supplies.extra}`}
                                </p>
                             </div>

                             <div className="bg-gray-900 p-6 rounded-3xl text-white italic font-medium leading-relaxed shadow-xl">
                                <p className="text-[10px] font-black text-gray-500 mb-3 uppercase tracking-widest">MANAGER NOTES</p>
                                <span className="text-lg font-bold">"{data.notes || '전달 사항 없음'}"</span>
                             </div>

                             <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide pt-2">
                                {data.photos && Object.entries(data.photos).map(([k, v]) => v && (
                                  <div key={k} className="relative flex-shrink-0 active:scale-95 transition-transform" onClick={()=>setSelectedPhoto({url:String(v), name:photoNames[k] || k, date: data.date, worker: data.worker})}>
                                    <img src={String(v)} className="w-32 h-32 object-cover rounded-3xl border-4 border-gray-100 shadow-xl" />
                                    <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[9px] px-2.5 py-1 rounded-full font-black tracking-tighter">{photoNames[k] || k}</span>
                                  </div>
                                ))}
                             </div>

                             <div className="flex gap-4 pt-4">
                                <button onClick={()=>{setEditReportId(r.id); setEditData(JSON.parse(JSON.stringify(r)));}} className="flex-1 py-4.5 bg-blue-100 text-blue-700 rounded-2xl font-black text-base active:scale-95 transition-all shadow-md">정보 수정</button>
                                <button onClick={()=>setDeleteConfirmId(r.id)} className="flex-1 py-4.5 bg-red-100 text-red-700 rounded-2xl font-black text-base active:scale-95 transition-all shadow-md">리포트 삭제</button>
                             </div>
                           </>
                         )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {selectedPhoto && (
          <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center p-6 animate-in fade-in duration-300" onClick={()=>setSelectedPhoto(null)}>
            <div className="absolute top-8 right-8 flex gap-6">
               <a href={selectedPhoto.url} download={`하트뻥튀기_${selectedPhoto.date}_${selectedPhoto.name}.jpg`} className="p-4 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors" onClick={e=>e.stopPropagation()}><Download size={32}/></a>
               <button className="p-4 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"><X size={32}/></button>
            </div>
            <img src={selectedPhoto.url} className="max-w-full max-h-[80vh] rounded-3xl shadow-2xl border-4 border-white/20 animate-in zoom-in duration-500" />
            <div className="text-center mt-8 text-white font-black animate-in slide-in-from-bottom-4">
              <p className="text-3xl mb-2 tracking-tight">{String(selectedPhoto.name)}</p>
              <p className="text-gray-400 text-lg uppercase tracking-widest">{String(selectedPhoto.date)} | {String(selectedPhoto.worker)} MANAGER</p>
            </div>
          </div>
        )}

        {deleteConfirmId && (
          <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-8 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="bg-white p-10 rounded-[40px] w-full max-w-sm text-center border-8 border-red-600 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="bg-red-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><AlertCircle size={56} className="text-red-600"/></div>
                <p className="font-black text-gray-900 mb-10 text-2xl tracking-tight leading-snug">정말 이 리포트를<br/>영구 삭제할까요?</p>
                <div className="flex gap-3">
                   <button onClick={()=>setDeleteConfirmId(null)} className="flex-1 py-5 bg-gray-100 rounded-3xl font-black text-gray-500 hover:bg-gray-200 transition-colors">취소</button>
                   <button onClick={()=>executeDelete(deleteConfirmId)} className="flex-1 py-5 bg-red-600 text-white rounded-3xl font-black shadow-xl hover:bg-red-700 active:scale-95 transition-all">삭제 확정</button>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  }

  // --- Main Form View ---
  return (
    <div className="max-w-md mx-auto bg-white min-h-screen pb-40 font-sans">
      <header className="bg-white p-6 border-b-4 border-gray-900 sticky top-0 z-20 flex flex-col gap-2 shadow-md">
        <div className="flex justify-between items-center">
          <h1 className="font-black text-gray-900 text-lg sm:text-xl flex items-center gap-1 sm:gap-2 tracking-tight">
            <span className="text-rose-600 cursor-pointer active:scale-75 transition-transform" onClick={()=>setView('login')}>❤️</span> 
            하트뻥튀기 업무공유(처인휴게소)
          </h1>
        </div>
        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-3xl border-2 border-gray-900 mt-2 shadow-inner">
           <div className="flex-1 flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-0.5">TODAY WORK DATE</span>
              <span className="text-base font-black text-gray-900">{formData.date}</span>
           </div>
           <div className="flex gap-3">
              <div className="flex flex-col items-center">
                 <span className="text-[9px] font-black text-gray-400 mb-1 uppercase">상행선</span>
                 <span className={`text-[10px] font-black px-3 py-1 rounded-full border-2 transition-all duration-500 ${dailyStatus.상행선 === '제출완료' ? 'bg-green-600 text-white border-green-600 shadow-sm' : 'bg-white text-gray-300 border-gray-200'}`}>{dailyStatus.상행선}</span>
              </div>
              <div className="flex flex-col items-center">
                 <span className="text-[9px] font-black text-gray-400 mb-1 uppercase">하행선</span>
                 <span className={`text-[10px] font-black px-3 py-1 rounded-full border-2 transition-all duration-500 ${dailyStatus.하행선 === '제출완료' ? 'bg-green-600 text-white border-green-600 shadow-sm' : 'bg-white text-gray-300 border-gray-200'}`}>{dailyStatus.하행선}</span>
              </div>
           </div>
        </div>
      </header>

      <div className="p-4 space-y-8 animate-in slide-in-from-bottom-4 duration-700">
        <section className="bg-white p-6 rounded-[40px] border-4 border-gray-900 shadow-2xl space-y-6">
          <h2 className="text-sm font-black text-gray-900 border-l-8 border-rose-600 pl-4 uppercase tracking-widest">1. 기본 정보 및 매출</h2>
          <div className="space-y-5 pt-2">
             <div className="flex justify-between items-center">
                <label className="text-lg font-black text-gray-900">근무 매니저</label>
                <select value={formData.worker} onChange={e=>setFormData({...formData, worker:e.target.value})} className="bg-gray-100 p-4 rounded-2xl text-base font-black border-none outline-none focus:ring-4 ring-rose-500 text-gray-900 shadow-inner">
                  <option>정윤이</option><option>황진웅</option><option>최윤미</option><option>장유미</option><option>윤종규</option><option>직접입력</option>
                </select>
             </div>
             <div className="flex justify-between items-center">
                <label className="text-lg font-black text-gray-900">영업 위치</label>
                <div className="flex gap-2">
                  {['상행선','하행선'].map(l=>(
                    <button key={l} onClick={()=>setFormData({...formData, location:l})} className={`px-6 py-4 rounded-2xl text-sm font-black border-4 transition-all duration-300 active:scale-90 ${formData.location === l ? (l === '상행선' ? 'bg-red-600 border-red-600 text-white shadow-xl' : 'bg-blue-600 border-blue-600 text-white shadow-xl') : 'bg-white border-gray-100 text-gray-300'}`}>{l}</button>
                  ))}
                </div>
             </div>
          </div>
          <div className="space-y-4 pt-8 border-t-2 border-dashed border-gray-100">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 font-sans">DAILY SALES REVENUE</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-black text-gray-900 ml-1 uppercase">CASH 현금</label>
                <input type="number" value={formData.sales.cash} onChange={e=>setFormData({...formData, sales:{...formData.sales, cash:e.target.value}})} className="w-full p-5 bg-gray-100 rounded-3xl border-none outline-none font-black text-right text-gray-900 text-2xl shadow-inner focus:ring-4 ring-rose-200" placeholder="0" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-black text-gray-900 ml-1 uppercase">CARD 카드</label>
                <input type="number" value={formData.sales.card} onChange={e=>setFormData({...formData, sales:{...formData.sales, card:e.target.value}})} className="w-full p-5 bg-gray-100 rounded-3xl border-none outline-none font-black text-right text-gray-900 text-2xl shadow-inner focus:ring-4 ring-rose-200" placeholder="0" />
              </div>
            </div>
            <div className={`p-6 rounded-3xl flex justify-between items-center text-white shadow-2xl transition-all duration-700 transform ${formData.location === '상행선' ? 'bg-red-600' : 'bg-blue-600'} hover:scale-105`}>
              <div className="flex flex-col">
                <span className="text-[11px] font-black opacity-60 uppercase tracking-widest">Grand Total</span>
                <span className="text-xl font-black">오늘 마감 합계</span>
              </div>
              <span className="text-4xl font-black tracking-tight">{((Number(formData.sales.cash)||0)+(Number(formData.sales.card)||0)).toLocaleString()}원</span>
            </div>
          </div>
        </section>

        <section className="bg-white p-6 rounded-[40px] border-4 border-gray-900 shadow-2xl space-y-6">
          <h2 className="text-sm font-black text-gray-900 border-l-8 border-rose-600 pl-4 uppercase tracking-widest">2. 마감 체크리스트</h2>
          <div className="grid grid-cols-1 gap-3 pt-2">
            {Object.keys(checklistNames).map(k=>(
              <button key={k} onClick={()=>handleChecklist(k)} className={`w-full flex justify-between py-5 px-6 items-center rounded-3xl border-4 transition-all duration-200 transform active:scale-95 ${formData.checklist[k] ? 'bg-rose-50 border-rose-600 shadow-md' : 'border-gray-50 bg-gray-50/30'}`}>
                <span className={`text-lg font-black transition-colors ${formData.checklist[k] ? 'text-rose-700' : 'text-gray-900'}`}>{checklistNames[k]}</span>
                {formData.checklist[k] ? <CheckCircle2 className="text-rose-600" size={32}/> : <Circle className="text-gray-200" size={32}/>}
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white p-6 rounded-[40px] border-4 border-gray-900 shadow-2xl space-y-6">
          <h2 className="text-sm font-black text-gray-900 border-l-8 border-rose-600 pl-4 uppercase tracking-widest">3. 재료 및 재고 현황</h2>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <label className="text-[11px] font-black text-gray-900 ml-1 uppercase">STOCK 재고</label>
              <input type="number" value={formData.inventory.stockCount} onChange={e=>setFormData({...formData, inventory:{...formData.inventory, stockCount:e.target.value}})} className="w-full p-5 bg-gray-100 rounded-3xl border-none outline-none font-black text-right text-gray-900 text-2xl shadow-inner focus:ring-4 ring-rose-200" placeholder="0" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-black text-gray-900 ml-1 uppercase">RICE 쌀(kg)</label>
              <input type="number" value={formData.inventory.usedRice} onChange={e=>setFormData({...formData, inventory:{...formData.inventory, usedRice:e.target.value}})} className="w-full p-5 bg-gray-100 rounded-3xl border-none outline-none font-black text-right text-gray-900 text-2xl shadow-inner focus:ring-4 ring-rose-200" placeholder="0" />
            </div>
          </div>
          <div className="pt-8 border-t-2 border-dashed border-gray-100 space-y-5">
            <p className="text-xl font-black text-gray-900 text-center leading-tight">내일 사용할 쌀이 충분한가요?<br/><span className="text-xs text-rose-500 font-bold tracking-tighter uppercase">(1.5박스 이상 현황 파악 필수)</span></p>
            <div className="flex gap-4">
              <button onClick={()=>setFormData({...formData, inventory:{...formData.inventory, hasRiceForNextDay:true, remainingRiceAmount: ''}})} className={`flex-1 py-6 rounded-3xl font-black text-xl border-4 transition-all duration-300 transform active:scale-95 ${formData.inventory.hasRiceForNextDay===true?'bg-rose-600 border-rose-600 text-white shadow-2xl':'bg-white border-gray-100 text-gray-400'}`}>네, 충분함</button>
              <button onClick={()=>setFormData({...formData, inventory:{...formData.inventory, hasRiceForNextDay:false}})} className={`flex-1 py-6 rounded-3xl font-black text-xl border-4 transition-all duration-300 transform active:scale-95 ${formData.inventory.hasRiceForNextDay===false?'bg-gray-900 border-gray-900 text-white shadow-2xl':'bg-white border-gray-100 text-gray-400'}`}>아니오, 부족</button>
            </div>
            {formData.inventory.hasRiceForNextDay === false && (
                <div className="mt-4 p-6 bg-rose-50 rounded-3xl border-4 border-rose-500 space-y-4 animate-in slide-in-from-top-6 duration-500 shadow-xl">
                    <label className="text-xl font-black text-rose-800 block">쌀 잔량 정보 입력</label>
                    <input 
                      type="text" 
                      value={formData.inventory.remainingRiceAmount} 
                      onChange={e=>setFormData({...formData, inventory:{...formData.inventory, remainingRiceAmount: e.target.value}})} 
                      className="w-full p-5 bg-white rounded-2xl border-none outline-none font-black text-gray-900 text-2xl shadow-inner focus:ring-4 ring-rose-300 placeholder:text-gray-200" 
                      placeholder="예: 0.5박스 남음" 
                    />
                </div>
            )}
          </div>
        </section>

        <section className="bg-white p-6 rounded-[40px] border-4 border-gray-900 shadow-2xl space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-black text-gray-900 border-l-8 border-rose-600 pl-4 uppercase tracking-widest">4. 증빙 사진 촬영 (필수)</h2>
            {isUploading && <Loader2 className="w-8 h-8 text-rose-600 animate-spin"/>}
          </div>
          <div className="grid grid-cols-3 gap-4 pt-2">
            {Object.keys(photoNames).map(p=>(
              <label key={p} className={`aspect-square rounded-[32px] border-4 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden relative transition-all duration-200 transform active:scale-90 ${formData.photos[p] ? 'bg-gray-50 border-rose-500 shadow-2xl' : 'bg-gray-50 border-gray-200 hover:border-gray-900'}`}>
                <input type="file" accept="image/*" className="hidden" onChange={e=>handlePhotoChange(p, e)} disabled={isUploading} />
                {formData.photos[p] ? (
                  <img src={formData.photos[p]} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center opacity-40">
                    <Camera size={36} className="text-gray-900 mb-2"/>
                    <span className="text-[10px] font-black text-gray-900 uppercase tracking-tighter">{photoNames[p]}</span>
                  </div>
                )}
                {formData.photos[p] && <div className="absolute inset-0 bg-rose-600/10 flex items-center justify-center animate-in zoom-in duration-300"><CheckCircle2 className="text-rose-600" size={48}/></div>}
              </label>
            ))}
          </div>
        </section>

        <section className="bg-white p-6 rounded-[40px] border-4 border-gray-900 shadow-2xl space-y-6">
          <h2 className="text-sm font-black text-gray-900 border-l-8 border-rose-600 pl-4 uppercase tracking-widest">5. 대기 손님 파악</h2>
          <div className="flex gap-4 pt-2">
            <button onClick={()=>handleWaitingToggle(true)} className={`flex-1 py-6 rounded-3xl font-black text-xl border-4 transition-all duration-300 transform active:scale-95 ${formData.waiting.hadWaiting===true?'bg-blue-600 border-blue-600 text-white shadow-2xl':'bg-white border-gray-100 text-gray-400'}`}>손님 있었음</button>
            <button onClick={()=>handleWaitingToggle(false)} className={`flex-1 py-6 rounded-3xl font-black text-xl border-4 transition-all duration-300 transform active:scale-95 ${formData.waiting.hadWaiting===false?'bg-gray-900 border-gray-900 text-white shadow-2xl':'bg-white border-gray-100 text-gray-400'}`}>없었음</button>
          </div>
        </section>

        <section className="bg-white p-6 rounded-[40px] border-4 border-gray-900 shadow-2xl space-y-4">
          <h2 className="text-sm font-black text-gray-900 border-l-8 border-rose-600 pl-4 uppercase tracking-widest">6. 특이사항</h2>
          <textarea rows="5" value={formData.notes} onChange={e=>setFormData({...formData, notes:e.target.value})} className="w-full bg-gray-100 rounded-[32px] p-8 border-none outline-none text-lg font-black text-gray-900 placeholder:text-gray-300 shadow-inner focus:ring-4 ring-rose-100" placeholder="사장님께 전달할 추가 전달사항 입력..." />
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-5 pb-12 bg-white/90 backdrop-blur-xl border-t-4 border-gray-900 z-40">
        <button onClick={submitReport} disabled={isSubmitting || isUploading} className={`w-full py-7 rounded-[32px] font-black text-2xl text-white shadow-2xl transition-all transform active:scale-95 flex items-center justify-center gap-4 ${isSubmitting||isUploading?'bg-gray-400 border-gray-400 shadow-none':'bg-rose-600 hover:bg-rose-700 border-rose-700'}`}>
          {isSubmitting ? <Loader2 className="animate-spin" size={32}/> : null}
          {isSubmitting ? '전송 중...' : '업무공유 제출 완료하기'}
        </button>
      </div>

      {/* Success Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/95 z-[300] flex items-center justify-center p-8 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white p-12 rounded-[56px] w-full text-center shadow-2xl border-[10px] border-gray-900 animate-in zoom-in duration-500">
            <div className="bg-green-100 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner"><CheckCircle2 size={72} className="text-green-600"/></div>
            <h3 className="text-4xl font-black mb-4 text-gray-900 tracking-tighter">제출 성공!</h3>
            <p className="text-gray-500 mb-12 font-black text-xl leading-relaxed">매니저님, 고생 많으셨습니다.<br/>안전하게 귀가하세요! ✨</p>
            <button onClick={() => {
              closeAndResetForm();
              window.scrollTo(0, 0);
            }} className="w-full bg-gray-900 text-white py-7 rounded-[32px] font-black text-2xl shadow-2xl hover:bg-black active:scale-95 transition-all">메인으로 돌아가기</button>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertMessage && (
        <div className="fixed inset-0 bg-black/85 z-[310] flex items-center justify-center p-8 backdrop-blur-sm" onClick={()=>setAlertMessage('')}>
          <div className="bg-white p-10 rounded-[48px] w-full text-center border-8 border-rose-600 shadow-2xl animate-in zoom-in-95 duration-300" onClick={e=>e.stopPropagation()}>
            <div className="bg-amber-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><AlertCircle size={56} className="text-rose-600"/></div>
            <p className="text-gray-900 font-black text-xl mb-10 whitespace-pre-wrap leading-relaxed tracking-tight">{String(alertMessage)}</p>
            <button onClick={()=>setAlertMessage('')} className="w-full bg-gray-900 text-white py-6 rounded-[32px] font-black text-2xl hover:bg-black active:scale-95 transition-all">확인 완료</button>
          </div>
        </div>
      )}
    </div>
  );

  function handleAdminLogin(e) {
    e.preventDefault();
    if (adminPwd === '940329') { setView('admin'); setAdminPwd(''); }
    else setAlertMessage('인증 암호가 틀립니다. 다시 입력해 주세요.');
  }

  function closeAndResetForm() {
    setShowSubmitModal(false);
    setFormData(prev => ({ 
      ...prev, 
      date: getTodayString(),
      sales: { cash: '', card: '' },
      checklist: { readyCash: false, machineClean: false, acrylicClean: false, hideStock: false, receiptPaper: false, hideKey: false, changeEnough: false, posClose: false, submitLog: false },
      inventory: { stockCount: '', usedRice: '', leftRice: '', loss: '', hasRiceForNextDay: null, remainingRiceAmount: '' },
      photos: { riceBin: null, pot: null, desk: null, report: null, key: null },
      notes: '',
      waiting: { hadWaiting: null, lastNumber: '', missedTeams: '' }
    }));
  }
}