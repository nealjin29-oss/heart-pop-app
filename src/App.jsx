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

// 💡 Firebase Path Helper (Rules Mandatory)
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
  const [filterType, setFilterType] = useState('ALL'); // ALL, WORKER, LOCATION
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
        console.error("Auth Error:", err);
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
    });
    return () => unsubscribe();
  }, [user]);

  // --- Submission Status for Current Day ---
  const dailyStatus = useMemo(() => {
    const today = formData.date;
    const sang = reports.find(r => r.date === today && r.location === '상행선');
    const ha = reports.find(r => r.date === today && r.location === '하행선');
    return {
      상행선: sang ? '제출완료' : '미제출',
      하행선: ha ? '제출완료' : '미제출'
    };
  }, [reports, formData.date]);

  // --- Monthly Statistics for Calendar ---
  const monthlyStats = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    
    const monthlyReports = reports.filter(r => {
      const d = new Date(r.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });

    const totalSales = monthlyReports.reduce((sum, r) => sum + (Number(r.totalSales) || 0), 0);
    
    // Attendance Count by Worker
    const attendance = {};
    monthlyReports.forEach(r => {
      const name = r.worker;
      attendance[name] = (attendance[name] || 0) + 1;
    });

    return { totalSales, attendance };
  }, [reports, calendarDate]);

  // --- Filtered Reports for Admin List ---
  const filteredReports = useMemo(() => {
    let result = reports;
    if (filterType === 'LOCATION') {
      result = reports.filter(r => r.location === filterValue);
    } else if (filterType === 'WORKER') {
      result = reports.filter(r => r.worker === filterValue);
    }
    return result;
  }, [reports, filterType, filterValue]);

  const totalFilteredSales = filteredReports.reduce((sum, r) => sum + (Number(r.totalSales) || 0), 0);

  // --- Handlers ---
  const handleChecklist = (key) => {
    setFormData(prev => ({
      ...prev,
      checklist: { ...prev.checklist, [key]: !prev.checklist[key] },
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
    if (!user) return;

    setIsSubmitting(true);
    const total = (Number(formData.sales.cash) || 0) + (Number(formData.sales.card) || 0);
    const id = Date.now().toString();
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'reports', id), {
        ...formData,
        totalSales: total,
        timestamp: new Date().toISOString()
      });
      setShowSubmitModal(true);
    } catch (e) {
      setAlertMessage("제출 실패: " + e.message);
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

  if (view === 'login') {
    return (
      <div className="max-w-md mx-auto min-h-screen flex items-center justify-center p-4 bg-white font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full border-2 border-gray-900">
          <h2 className="text-2xl font-black text-center mb-8 text-gray-900">관리자 보안 접속</h2>
          <form onSubmit={handleAdminLogin} className="space-y-6">
            <input type="password" value={adminPwd} onChange={e=>setAdminPwd(e.target.value)} className="w-full p-5 bg-gray-100 rounded-xl border-none outline-none text-center text-3xl font-black focus:ring-4 ring-rose-500" placeholder="••••••" />
            <button type="submit" className="w-full bg-gray-900 text-white py-5 rounded-xl font-black text-xl active:scale-95 transition-transform">인증하기</button>
          </form>
          <button onClick={()=>setView('form')} className="w-full mt-6 text-gray-900 font-bold text-sm underline">돌아가기</button>
        </div>
      </div>
    );
  }

  if (view === 'admin') {
    return (
      <div className="max-w-3xl mx-auto bg-white min-h-screen pb-32">
        <header className="bg-white p-6 sticky top-0 z-30 border-b-4 border-gray-900 flex justify-between items-center shadow-lg">
          <h1 className="font-black text-2xl flex items-center gap-2 text-gray-900"><BarChart3 className="text-rose-600"/> 업무공유 현황</h1>
          <button onClick={()=>setView('form')} className="p-3 bg-gray-100 rounded-full hover:bg-gray-200"><LogOut size={24} className="text-gray-900"/></button>
        </header>

        <div className="p-4 space-y-8">
          {/* Summary Dashboard */}
          <div className="bg-white p-6 rounded-3xl border-4 border-gray-900 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
               <div>
                  <h3 className="text-xs font-black text-gray-400 mb-1 uppercase">Selected Month Sales</h3>
                  <p className="text-4xl font-black text-rose-600 tracking-tight">{monthlyStats.totalSales.toLocaleString()}원</p>
               </div>
               <button onClick={downloadCSV} className="bg-green-600 text-white px-5 py-3 rounded-xl font-black text-sm flex items-center gap-2 active:scale-95"><FileSpreadsheet size={18}/> 엑셀(CSV) 저장</button>
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

          <div className="flex bg-gray-100 p-1.5 rounded-2xl">
            <button onClick={()=>setAdminViewMode('list')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${adminViewMode==='list'?'bg-white shadow-md text-gray-900':'text-gray-500'}`}>목록 필터링</button>
            <button onClick={()=>setAdminViewMode('calendar')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${adminViewMode==='calendar'?'bg-white shadow-md text-gray-900':'text-gray-500'}`}>종합 달력</button>
          </div>

          {adminViewMode === 'calendar' ? (
            <div className="bg-white p-6 rounded-3xl border-2 border-gray-900 animate-in fade-in">
              <div className="flex justify-between items-center mb-6">
                <button onClick={()=>setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth()-1, 1))} className="p-2 bg-gray-100 rounded-full"><ChevronLeft/></button>
                <span className="font-black text-xl text-gray-900">{calendarDate.getFullYear()}년 {calendarDate.getMonth()+1}월</span>
                <button onClick={()=>setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth()+1, 1))} className="p-2 bg-gray-100 rounded-full"><ChevronRight/></button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center mb-2 text-[10px] font-black text-gray-400">
                {['일','월','화','수','목','금','토'].map(d=><div key={d}>{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                 <button onClick={()=>setFilterType('ALL')} className={`px-5 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${filterType==='ALL'?'bg-rose-600 text-white shadow-lg':'bg-gray-100 text-gray-400'}`}>전체 내역</button>
                 <button onClick={()=>{setFilterType('LOCATION');setFilterValue('상행선')}} className={`px-5 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${filterType==='LOCATION'&&filterValue==='상행선'?'bg-red-600 text-white shadow-lg':'bg-gray-100 text-gray-400'}`}>상행선만</button>
                 <button onClick={()=>{setFilterType('LOCATION');setFilterValue('하행선')}} className={`px-5 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${filterType==='LOCATION'&&filterValue==='하행선'?'bg-blue-600 text-white shadow-lg':'bg-gray-100 text-gray-400'}`}>하행선만</button>
              </div>

              {filteredReports.map(r => {
                const isExpanded = expandedReportId === r.id;
                const isEditing = editReportId === r.id;
                const data = isEditing ? editData : r;
                
                return (
                  <div key={r.id} className={`p-6 rounded-3xl border-2 shadow-md transition-all ${isEditing ? 'border-blue-500 bg-blue-50' : 'bg-white border-gray-100'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] font-black text-gray-300 mb-1">{new Date(data.timestamp).toLocaleString('ko-KR')}</p>
                        <p className="font-black text-xl text-gray-900">{data.date} | {data.location}</p>
                      </div>
                      <span className={`px-4 py-2 rounded-full text-xs font-black text-white ${data.location==='상행선'?'bg-red-600':'bg-blue-600'}`}>{data.worker}</span>
                    </div>

                    <div className="flex justify-between items-end border-t border-gray-100 pt-4">
                       <span className="text-xs font-black text-gray-400">Total Sales</span>
                       <span className="text-3xl font-black text-gray-900 tracking-tight">{data.totalSales.toLocaleString()}원</span>
                    </div>

                    <button onClick={()=>setExpandedReportId(isExpanded ? null : r.id)} className="w-full mt-4 py-3.5 bg-gray-900 text-white rounded-2xl text-sm font-black transition-colors active:scale-95">
                       {isExpanded ? '리포트 접기' : '리포트 상세 보기 (수정/삭제)'}
                    </button>

                    {isExpanded && (
                      <div className="mt-6 space-y-6 pt-6 border-t-2 border-dashed border-gray-200 animate-in fade-in zoom-in-95">
                         {isEditing ? (
                           <div className="space-y-4 bg-white p-5 rounded-2xl border-2 border-blue-200">
                              <h4 className="font-black text-blue-700">리포트 데이터 수정</h4>
                              <div className="grid grid-cols-2 gap-3">
                                 <div><label className="text-[10px] font-black text-gray-400 block mb-1">현금</label><input type="number" value={editData.sales.cash} onChange={e=>setEditData({...editData, sales:{...editData.sales, cash:e.target.value}})} className="w-full p-3 bg-gray-100 rounded-xl border-none outline-none font-black" /></div>
                                 <div><label className="text-[10px] font-black text-gray-400 block mb-1">카드</label><input type="number" value={editData.sales.card} onChange={e=>setEditData({...editData, sales:{...editData.sales, card:e.target.value}})} className="w-full p-3 bg-gray-100 rounded-xl border-none outline-none font-black" /></div>
                                 <div className="col-span-2"><label className="text-[10px] font-black text-gray-400 block mb-1">특이사항</label><textarea value={editData.notes} onChange={e=>setEditData({...editData, notes:e.target.value})} className="w-full p-3 bg-gray-100 rounded-xl border-none outline-none font-black" rows={3}/></div>
                              </div>
                              <div className="flex gap-2 pt-2"><button onClick={()=>setEditReportId(null)} className="flex-1 py-3 bg-gray-200 rounded-xl font-black text-gray-500">취소</button><button onClick={saveEdit} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black">수정 저장</button></div>
                           </div>
                         ) : (
                           <>
                             {/* Full Report Details */}
                             <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-2xl"><p className="text-[10px] font-black text-gray-400 mb-1">매출 내역</p><p className="text-sm font-black">현금: {data.sales?.cash.toLocaleString()}원</p><p className="text-sm font-black">카드: {data.sales?.card.toLocaleString()}원</p></div>
                                <div className="bg-gray-50 p-4 rounded-2xl"><p className="text-[10px] font-black text-gray-400 mb-1">재고/재료</p><p className="text-sm font-black">쌀 사용: {data.inventory?.usedRice}kg</p><p className="text-sm font-black">재고량: {data.inventory?.stockCount}개</p></div>
                                <div className="col-span-2 bg-rose-50 p-4 rounded-2xl border border-rose-100">
                                   <p className="text-[10px] font-black text-rose-400 mb-1">익일 쌀 현황</p>
                                   <p className="font-black text-gray-800">{data.inventory?.hasRiceForNextDay ? '충분함 (1.5박스↑)' : `부족함 (남은양: ${data.inventory?.remainingRiceAmount})`}</p>
                                </div>
                             </div>

                             <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                                <p className="text-[10px] font-black text-amber-400 mb-2">마감 체크리스트 현황</p>
                                <div className="grid grid-cols-1 gap-1 text-[13px] font-black text-amber-800">
                                   {Object.entries(data.checklist || {}).map(([k,v]) => (
                                      <div key={k} className="flex items-center gap-2">{v ? <CheckCircle2 size={14}/> : <Circle size={14}/>} {checklistNames[k] || k}</div>
                                   ))}
                                </div>
                             </div>

                             <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                                <p className="text-[10px] font-black text-blue-400 mb-1">부족 물품 요청</p>
                                <p className="font-black text-blue-800 text-sm">
                                   {Object.entries(data.supplies || {}).filter(([k,v]) => v === true).map(([k]) => supplyNames[k] || k).join(', ') || '없음'}
                                   {data.supplies?.extra && ` (추가: ${data.supplies.extra})`}
                                </p>
                             </div>

                             <div className="bg-gray-900 p-5 rounded-2xl text-white italic font-medium leading-relaxed">
                                <p className="text-[10px] font-black opacity-40 mb-2">특이사항 및 전달사항</p>
                                "{data.notes || '전달 사항 없음'}"
                             </div>

                             <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                                {data.photos && Object.entries(data.photos).map(([k, v]) => v && (
                                  <div key={k} className="relative flex-shrink-0" onClick={()=>setSelectedPhoto({url:String(v), name:photoNames[k] || k, date: data.date, worker: data.worker})}>
                                    <img src={String(v)} className="w-28 h-28 object-cover rounded-2xl border-4 border-gray-100 shadow-md" />
                                    <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[9px] px-2 py-0.5 rounded-lg font-black">{photoNames[k] || k}</span>
                                  </div>
                                ))}
                             </div>

                             <div className="flex gap-3">
                                <button onClick={()=>startEditReport(r)} className="flex-1 py-4 bg-blue-100 text-blue-700 rounded-2xl font-black text-sm active:scale-95 transition-all">정보 수정하기</button>
                                <button onClick={()=>setDeleteConfirmId(r.id)} className="flex-1 py-4 bg-red-100 text-red-700 rounded-2xl font-black text-sm active:scale-95 transition-all">리포트 삭제</button>
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

        {/* Modals for Admin */}
        {selectedPhoto && (
          <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center p-6" onClick={()=>setSelectedPhoto(null)}>
            <div className="absolute top-8 right-8 flex gap-4">
               <a href={selectedPhoto.url} download={`하트뻥튀기_${selectedPhoto.date}_${selectedPhoto.name}.jpg`} className="p-4 bg-white/20 rounded-full text-white" onClick={e=>e.stopPropagation()}><Download size={28}/></a>
               <button className="p-4 bg-white/20 rounded-full text-white"><X size={28}/></button>
            </div>
            <img src={selectedPhoto.url} className="max-w-full max-h-[75vh] rounded-2xl shadow-2xl border-4 border-white/10" />
            <div className="text-center mt-6 text-white font-black">
              <p className="text-2xl mb-1">{String(selectedPhoto.name)}</p>
              <p className="text-gray-500">{String(selectedPhoto.date)} | {String(selectedPhoto.worker)} 매니저</p>
            </div>
          </div>
        )}

        {deleteConfirmId && (
          <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-8">
             <div className="bg-white p-10 rounded-3xl w-full max-w-xs text-center border-4 border-red-600 shadow-2xl">
                <AlertCircle size={48} className="text-red-600 mx-auto mb-4"/>
                <p className="font-black text-gray-900 mb-8 text-lg">정말 이 리포트를<br/>영구 삭제할까요?</p>
                <div className="flex gap-2">
                   <button onClick={()=>setDeleteConfirmId(null)} className="flex-1 py-4 bg-gray-100 rounded-xl font-black text-gray-500">취소</button>
                   <button onClick={()=>executeDelete(deleteConfirmId)} className="flex-1 py-4 bg-red-600 text-white rounded-xl font-black shadow-lg shadow-red-100">삭제</button>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  }

  // --- Main Manager Form View ---
  return (
    <div className="max-w-md mx-auto bg-white min-h-screen pb-40">
      <header className="bg-white p-6 border-b-4 border-gray-900 sticky top-0 z-20 flex flex-col gap-2 shadow-md">
        <div className="flex justify-between items-center">
          <h1 className="font-black text-gray-900 text-lg flex items-center gap-2">
            <span className="text-rose-600 cursor-pointer active:scale-75 transition-transform" onClick={()=>setView('login')}>❤️</span> 
            하트뻥튀기 업무공유(처인휴게소)
          </h1>
        </div>
        <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border-2 border-gray-900 mt-1">
           <div className="flex-1 flex flex-col">
              <span className="text-[10px] font-black text-gray-400">TODAY DATE</span>
              <span className="text-sm font-black text-gray-900">{formData.date}</span>
           </div>
           <div className="flex gap-3">
              <div className="flex flex-col items-center">
                 <span className="text-[8px] font-black text-gray-400 mb-0.5">상행선</span>
                 <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${dailyStatus.상행선 === '제출완료' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'}`}>{dailyStatus.상행선}</span>
              </div>
              <div className="flex flex-col items-center">
                 <span className="text-[8px] font-black text-gray-400 mb-0.5">하행선</span>
                 <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${dailyStatus.하행선 === '제출완료' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'}`}>{dailyStatus.하행선}</span>
              </div>
           </div>
        </div>
      </header>

      <div className="p-4 space-y-8">
        <section className="bg-white p-6 rounded-3xl border-4 border-gray-900 shadow-xl space-y-6 animate-in fade-in">
          <h2 className="text-sm font-black text-gray-900 border-l-8 border-rose-600 pl-3">1. 기본 정보 및 매출</h2>
          <div className="space-y-4">
             <div className="flex justify-between items-center">
                <label className="text-lg font-black text-gray-900">근무 매니저</label>
                <select value={formData.worker} onChange={e=>setFormData({...formData, worker:e.target.value})} className="bg-gray-100 p-3 rounded-xl text-sm font-black border-none outline-none focus:ring-4 ring-rose-500">
                  <option>정윤이</option><option>황진웅</option><option>최윤미</option><option>장유미</option><option>윤종규</option><option>직접입력</option>
                </select>
             </div>
             <div className="flex justify-between items-center">
                <label className="text-lg font-black text-gray-900">영업 위치</label>
                <div className="flex gap-2">
                  {['상행선','하행선'].map(l=>(
                    <button key={l} onClick={()=>setFormData({...formData, location:l})} className={`px-6 py-3 rounded-xl text-sm font-black border-4 transition-all ${formData.location === l ? (l === '상행선' ? 'bg-red-600 border-red-600 text-white shadow-lg' : 'bg-blue-600 border-blue-600 text-white shadow-lg') : 'bg-white border-gray-100 text-gray-400'}`}>{l}</button>
                  ))}
                </div>
             </div>
          </div>
          <div className="space-y-4 pt-6 border-t-2 border-gray-100">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">SALES DATA</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-900 ml-1">현금 매출액</label>
                <input type="number" value={formData.sales.cash} onChange={e=>setFormData({...formData, sales:{...formData.sales, cash:e.target.value}})} className="w-full p-4 bg-gray-100 rounded-2xl border-none outline-none font-black text-right text-gray-900 text-xl" placeholder="0" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-900 ml-1">카드 매출액</label>
                <input type="number" value={formData.sales.card} onChange={e=>setFormData({...formData, sales:{...formData.sales, card:e.target.value}})} className="w-full p-4 bg-gray-100 rounded-2xl border-none outline-none font-black text-right text-gray-900 text-xl" placeholder="0" />
              </div>
            </div>
            <div className={`p-5 rounded-2xl flex justify-between items-center text-white shadow-2xl transition-colors duration-500 ${formData.location === '상행선' ? 'bg-red-600' : 'bg-blue-600'}`}>
              <span className="text-lg font-black">오늘 정산 합계</span>
              <span className="text-3xl font-black">{((Number(formData.sales.cash)||0)+(Number(formData.sales.card)||0)).toLocaleString()}원</span>
            </div>
          </div>
        </section>

        <section className="bg-white p-6 rounded-3xl border-4 border-gray-900 shadow-xl space-y-6">
          <h2 className="text-sm font-black text-gray-900 border-l-8 border-rose-600 pl-3">2. 마감 체크리스트</h2>
          <div className="grid grid-cols-1 gap-2">
            {Object.keys(checklistNames).map(k=>(
              <button key={k} onClick={()=>handleChecklist(k)} className={`w-full flex justify-between py-5 px-5 items-center rounded-2xl border-4 transition-all ${formData.checklist[k] ? 'bg-rose-50 border-rose-600' : 'border-gray-50 bg-white'}`}>
                <span className={`text-base font-black ${formData.checklist[k] ? 'text-rose-700' : 'text-gray-900'}`}>{checklistNames[k]}</span>
                {formData.checklist[k] ? <CheckCircle2 className="text-rose-600" size={28}/> : <Circle className="text-gray-100" size={28}/>}
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white p-6 rounded-3xl border-4 border-gray-900 shadow-xl space-y-6">
          <h2 className="text-sm font-black text-gray-900 border-l-8 border-rose-600 pl-3">3. 재료 및 재고 현황</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-black text-gray-900 ml-1">오늘 총 재고 (개)</label>
              <input type="number" value={formData.inventory.stockCount} onChange={e=>setFormData({...formData, inventory:{...formData.inventory, stockCount:e.target.value}})} className="w-full p-5 bg-gray-100 rounded-2xl border-none outline-none font-black text-right text-gray-900 text-xl" placeholder="0" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black text-gray-900 ml-1">오늘 사용 쌀 (kg)</label>
              <input type="number" value={formData.inventory.usedRice} onChange={e=>setFormData({...formData, inventory:{...formData.inventory, usedRice:e.target.value}})} className="w-full p-5 bg-gray-100 rounded-2xl border-none outline-none font-black text-right text-gray-900 text-xl" placeholder="0" />
            </div>
          </div>
          <div className="pt-6 border-t-2 border-gray-100 space-y-4">
            <p className="text-lg font-black text-gray-900 text-center">내일 사용할 쌀이 충분한가요?<br/><span className="text-xs text-rose-500">(1.5박스 이상 유무 확인)</span></p>
            <div className="flex gap-4">
              <button onClick={()=>setFormData({...formData, inventory:{...formData.inventory, hasRiceForNextDay:true, remainingRiceAmount: ''}})} className={`flex-1 py-5 rounded-2xl font-black text-lg border-4 transition-all ${formData.inventory.hasRiceForNextDay===true?'bg-rose-600 border-rose-600 text-white shadow-xl':'bg-white border-gray-100 text-gray-400'}`}>네, 충분합니다</button>
              <button onClick={()=>setFormData({...formData, inventory:{...formData.inventory, hasRiceForNextDay:false}})} className={`flex-1 py-5 rounded-2xl font-black text-lg border-4 transition-all ${formData.inventory.hasRiceForNextDay===false?'bg-gray-900 border-gray-900 text-white shadow-xl':'bg-white border-gray-100 text-gray-400'}`}>아니오, 부족합니다</button>
            </div>
            {formData.inventory.hasRiceForNextDay === false && (
                <div className="mt-4 p-5 bg-rose-50 rounded-2xl border-4 border-rose-500 space-y-3 animate-in fade-in slide-in-from-top-4">
                    <label className="text-lg font-black text-rose-800 block">쌀이 얼마나 남아있나요? (잔량 입력)</label>
                    <input type="text" value={formData.inventory.remainingRiceAmount} onChange={e=>setFormData({...formData, inventory:{...formData.inventory, remainingRiceAmount: e.target.value}})} className="w-full p-4 bg-white rounded-xl border-none outline-none font-black text-gray-900 text-lg shadow-inner" placeholder="예: 0.5박스, 1박스 등 직접 입력" />
                </div>
            )}
          </div>
        </section>

        <section className="bg-white p-6 rounded-3xl border-4 border-gray-900 shadow-xl space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-black text-gray-900 border-l-8 border-rose-600 pl-3">4. 증빙 사진 촬영 (필수)</h2>
            {isUploading && <Loader2 className="w-6 h-6 text-rose-600 animate-spin"/>}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {Object.keys(photoNames).map(p=>(
              <label key={p} className={`aspect-square rounded-3xl border-4 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden relative transition-all ${formData.photos[p] ? 'bg-gray-50 border-rose-500 shadow-inner' : 'bg-gray-50 border-gray-200 hover:border-gray-900'}`}>
                <input type="file" accept="image/*" className="hidden" onChange={e=>handlePhotoChange(p, e)} disabled={isUploading} />
                {formData.photos[p] ? (
                  <img src={formData.photos[p]} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center opacity-40">
                    <Camera size={32}/>
                    <span className="text-[10px] font-black mt-1">{photoNames[p]}</span>
                  </div>
                )}
                {formData.photos[p] && <div className="absolute inset-0 bg-rose-600/10 flex items-center justify-center animate-in zoom-in"><CheckCircle2 className="text-rose-600" size={40}/></div>}
              </label>
            ))}
          </div>
        </section>

        <section className="bg-white p-6 rounded-3xl border-4 border-gray-900 shadow-xl">
          <h2 className="text-sm font-black text-gray-900 border-l-8 border-rose-600 pl-3 mb-6">5. 대기 손님 파악</h2>
          <div className="flex gap-4">
            <button onClick={()=>handleWaitingToggle(true)} className={`flex-1 py-5 rounded-2xl font-black text-lg border-4 transition-all ${formData.waiting.hadWaiting===true?'bg-blue-600 border-blue-600 text-white shadow-xl':'bg-white border-gray-100 text-gray-400'}`}>손님 있었음</button>
            <button onClick={()=>handleWaitingToggle(false)} className={`flex-1 py-5 rounded-2xl font-black text-lg border-4 transition-all ${formData.waiting.hadWaiting===false?'bg-gray-900 border-gray-900 text-white shadow-xl':'bg-white border-gray-100 text-gray-400'}`}>없었음</button>
          </div>
        </section>

        <section className="bg-white p-6 rounded-3xl border-4 border-gray-900 shadow-xl space-y-4">
          <h2 className="text-sm font-black text-gray-900 border-l-8 border-rose-600 pl-3">6. 특이사항</h2>
          <textarea rows="5" value={formData.notes} onChange={e=>setFormData({...formData, notes:e.target.value})} className="w-full bg-gray-100 rounded-3xl p-6 border-none outline-none text-base font-black text-gray-900 placeholder:text-gray-300" placeholder="사장님께 전달할 추가 내용을 적어주세요..." />
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-5 pb-12 bg-white/90 backdrop-blur-md border-t-4 border-gray-900 z-40">
        <button onClick={submitReport} disabled={isSubmitting || isUploading} className={`w-full py-6 rounded-3xl font-black text-2xl text-white shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 ${isSubmitting||isUploading?'bg-gray-400':'bg-rose-600 hover:bg-rose-700'}`}>
          {isSubmitting ? <Loader2 className="animate-spin" size={32}/> : null}
          {isSubmitting ? '보고서 제출 중...' : '업무공유 제출하기'}
        </button>
      </div>

      {/* Popups */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/90 z-[300] flex items-center justify-center p-8 backdrop-blur-md">
          <div className="bg-white p-12 rounded-[40px] w-full text-center shadow-2xl border-8 border-gray-900 animate-in zoom-in duration-300">
            <CheckCircle2 size={80} className="text-green-600 mx-auto mb-6"/>
            <h3 className="text-3xl font-black mb-4 text-gray-900 tracking-tight">제출 성공!</h3>
            <p className="text-gray-500 mb-12 font-black text-xl leading-relaxed">오늘 하루도 정말 고생 많으셨습니다.<br/>조심히 들어가세요!</p>
            <button onClick={closeAndResetForm} className="w-full bg-gray-900 text-white py-6 rounded-3xl font-black text-2xl shadow-xl active:scale-95">확인 완료</button>
          </div>
        </div>
      )}

      {alertMessage && (
        <div className="fixed inset-0 bg-black/80 z-[310] flex items-center justify-center p-8" onClick={()=>setAlertMessage('')}>
          <div className="bg-white p-10 rounded-[36px] w-full text-center border-4 border-rose-600 shadow-2xl animate-in fade-in" onClick={e=>e.stopPropagation()}>
            <AlertCircle size={60} className="text-rose-600 mx-auto mb-6"/>
            <p className="text-gray-900 font-black text-xl mb-10 whitespace-pre-wrap leading-relaxed tracking-tight">{String(alertMessage)}</p>
            <button onClick={()=>setAlertMessage('')} className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black text-xl active:scale-95">알겠습니다</button>
          </div>
        </div>
      )}
    </div>
  );

  function handleAdminLogin(e) {
    e.preventDefault();
    if (adminPwd === '940329') { setView('admin'); setAdminPwd(''); }
    else setAlertMessage('인증 암호가 일치하지 않습니다.');
  }
}