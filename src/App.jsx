import React, { useState, useMemo, useEffect } from 'react';
import { Camera, CheckCircle2, Circle, MapPin, Calendar, DollarSign, AlertCircle, FileText, User, Lock, Download, Image as ImageIcon, BarChart3, Users, LogOut, ChevronDown, ChevronUp, X, ChevronLeft, ChevronRight, CalendarDays, List, HelpCircle, Edit2, Trash2, Save, Maximize2, Loader2 } from 'lucide-react';

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

// 💡 필수 수정: appId 내의 슬래시를 제거하여 경로 오류 방지 (Firestore 규칙과 매칭)
const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'heart-pop-app-prod';
const appId = rawAppId.replace(/\//g, '_');

// --- UI 데이터 매핑 ---
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
  // --- 상태 관리 ---
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

  // --- 1. 인증 처리 (Rule 3 준수) ---
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
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // --- 2. 실시간 데이터 로드 (인증 완료 후 실행) ---
  useEffect(() => {
    if (!user) return; // 인증되지 않았으면 실행하지 않음 (권한 에러 방지)
    
    // 경로: /artifacts/{appId}/public/data/reports (5 segments)
    const reportsRef = collection(db, 'artifacts', appId, 'public', 'data', 'reports');
    const q = query(reportsRef);
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const fetched = [];
        snapshot.forEach((doc) => {
          fetched.push({ id: doc.id, ...doc.data() });
        });
        fetched.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setReports(fetched);
      }, 
      (error) => {
        console.error("데이터 동기화 에러 (Firestore 규칙 확인 필요):", error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // --- 이벤트 핸들러 ---
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
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX) { height *= MAX / width; width = MAX; }
        } else {
          if (height > MAX) { width *= MAX / height; height = MAX; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7); 
        setFormData(prev => ({
          ...prev,
          photos: { ...prev.photos, [key]: dataUrl },
        }));
        setIsUploading(false);
      };
    };
  };

  const submitReport = async () => {
    if (!formData.sales.cash || !formData.sales.card) {
      setAlertMessage("현금 매출과 카드 매출을 모두 입력해 주세요.");
      return;
    }
    if (formData.inventory.hasRiceForNextDay === null) {
      setAlertMessage("'다음날 사용할 쌀' 여부를 선택해 주세요.");
      return;
    }
    if (formData.inventory.hasRiceForNextDay === false && !formData.inventory.remainingRiceAmount) {
        setAlertMessage("쌀이 얼마나 남아있는지 입력해 주세요.");
        return;
    }
    if (formData.waiting.hadWaiting === null) {
      setAlertMessage("'대기 손님 파악' 질문을 완료해 주세요.");
      return;
    }
    if (!user) return;

    setIsSubmitting(true);
    const total = (Number(formData.sales.cash) || 0) + (Number(formData.sales.card) || 0);
    const reportId = Date.now().toString();
    
    const payload = {
      timestamp: new Date().toISOString(),
      date: String(formData.date),
      worker: String(formData.worker === '직접입력' ? formData.customWorker : formData.worker),
      location: String(formData.location),
      sales: { ...formData.sales },
      totalSales: total,
      supplies: { ...formData.supplies },
      suppliesStock: { ...formData.suppliesStock },
      inventory: { ...formData.inventory },
      notes: String(formData.notes),
      checklist: { ...formData.checklist },
      waiting: { ...formData.waiting },
      photos: { ...formData.photos }
    };
    
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'reports', reportId);
      await setDoc(docRef, payload);
      setShowSubmitModal(true); 
    } catch (error) {
      setAlertMessage("제출 실패: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeAndResetForm = () => {
    setShowSubmitModal(false);
    setFormData(prev => ({ 
      ...prev, 
      date: getTodayString(),
      sales: { cash: '', card: '' },
      checklist: { readyCash: false, machineClean: false, acrylicClean: false, hideStock: false, receiptPaper: false, hideKey: false, changeEnough: false, posClose: false, submitLog: false },
      inventory: { stockCount: '', usedRice: '', leftRice: '', loss: '', hasRiceForNextDay: null, remainingRiceAmount: '' },
      supplies: { breadTieShort: false, plasticBagShort: false, gloveShort: false, earmuffShort: false, maskShort: false, extra: '' },
      photos: { riceBin: null, pot: null, desk: null, report: null, key: null },
      notes: '',
      waiting: { hadWaiting: null, lastNumber: '', missedTeams: '' }
    }));
  };

  const startEditReport = (report) => {
    setEditReportId(report.id);
    setEditData(JSON.parse(JSON.stringify(report))); 
  };

  const saveEditReport = async () => {
    if (!user) return;
    const total = (Number(editData.sales.cash) || 0) + (Number(editData.sales.card) || 0);
    const updated = { ...editData, totalSales: total };
    const docId = editData.id;
    delete updated.id;
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'reports', docId), updated);
      setEditReportId(null);
    } catch (e) { alert(e.message); }
  };

  const executeDelete = async () => {
    if (!user || !deleteConfirmId) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'reports', deleteConfirmId));
      setDeleteConfirmId(null);
      setExpandedReportId(null);
    } catch (e) { alert(e.message); }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPwd === '940329') { setView('admin'); setAdminPwd(''); }
    else { setAlertMessage('비밀번호가 틀렸습니다.'); }
  };

  const downloadCSV = () => {
    const headers = ['일자', '근무자', '위치', '총매출', '다음날쌀'];
    const rows = reports.map(r => [
      String(r.date), String(r.worker), String(r.location), String(r.totalSales), r.inventory?.hasRiceForNextDay ? 'O' : 'X'
    ].join(','));
    const content = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(',') + '\n' + rows.join('\n');
    const link = document.createElement("a");
    link.href = encodeURI(content);
    link.download = `보고_${getTodayString()}.csv`;
    link.click();
  };

  const filteredReports = useMemo(() => {
    if (filterType === 'ALL') return reports;
    if (filterType === 'WORKER') return reports.filter(r => r.worker === filterValue);
    if (filterType === 'LOCATION') return reports.filter(r => r.location === filterValue);
    return reports;
  }, [reports, filterType, filterValue]);

  const totalFilteredSales = filteredReports.reduce((sum, r) => sum + (Number(r.totalSales) || 0), 0);

  const renderCalendar = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="p-2"></div>);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const sales = filteredReports.filter(r => r.date === dateStr).reduce((sum, r) => sum + (Number(r.totalSales) || 0), 0);
      days.push(
        <div key={d} className={`p-1.5 border border-gray-200 min-h-[70px] flex flex-col rounded-lg ${dateStr === getTodayString() ? 'bg-rose-50 border-rose-200' : 'bg-white'}`}>
          <span className="text-[10px] font-bold text-gray-500">{d}</span>
          {sales > 0 && <span className="text-[9px] font-black text-rose-600 mt-auto">{sales.toLocaleString()}</span>}
        </div>
      );
    }
    return days;
  };

  const isCurrentSubmitted = useMemo(() => {
    return reports.some(r => r.date === formData.date && r.location === formData.location);
  }, [reports, formData.date, formData.location]);

  // --- Views ---
  if (view === 'login') {
    return (
      <div className="max-w-md mx-auto min-h-screen flex items-center justify-center p-4 bg-white">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full border border-gray-300">
          <h2 className="text-2xl font-black text-center mb-8 text-gray-900">관리자 로그인</h2>
          <form onSubmit={handleAdminLogin} className="space-y-6">
            <input 
              type="password" 
              value={adminPwd} 
              onChange={e=>setAdminPwd(e.target.value)} 
              className="w-full p-5 bg-gray-100 rounded-xl border-none outline-none text-center text-3xl font-black focus:ring-2 ring-rose-500" 
              placeholder="••••••" 
            />
            <button type="submit" className="w-full bg-gray-900 text-white py-5 rounded-xl font-black text-lg active:scale-95">접속하기</button>
          </form>
          <button onClick={()=>setView('form')} className="w-full mt-6 text-gray-600 font-bold text-sm">돌아가기</button>
        </div>
      </div>
    );
  }

  if (view === 'admin') {
    return (
      <div className="max-w-2xl mx-auto bg-white min-h-screen pb-32">
        <header className="bg-white p-6 sticky top-0 z-30 border-b-2 flex justify-between items-center">
          <h1 className="font-black text-xl flex items-center gap-2 text-gray-900"><BarChart3 className="text-rose-600"/> 업무공유 현황</h1>
          <button onClick={()=>setView('form')} className="p-3 bg-gray-100 rounded-full"><LogOut size={22} className="text-gray-900"/></button>
        </header>

        <div className="p-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-md">
            <div className="flex gap-2 mb-5 overflow-x-auto pb-2">
              <button onClick={()=>setFilterType('ALL')} className={`px-5 py-2.5 rounded-xl text-sm font-black whitespace-nowrap ${filterType==='ALL'?'bg-rose-600 text-white shadow-lg':'bg-gray-100 text-gray-700'}`}>전체 내역</button>
              {['정윤이','황진웅','최윤미','장유미','윤종규'].map(n=>(
                <button key={n} onClick={()=>{setFilterType('WORKER');setFilterValue(n)}} className={`px-5 py-2.5 rounded-xl text-sm font-black whitespace-nowrap ${filterType==='WORKER'&&filterValue===n?'bg-rose-600 text-white shadow-lg':'bg-gray-100 text-gray-700'}`}>{n}</button>
              ))}
            </div>
            <div className="text-right pt-4 border-t">
              <p className="text-xs font-black text-gray-500 mb-1">총 매출 합계</p>
              <p className="text-4xl font-black text-rose-600 tracking-tight">{(totalFilteredSales || 0).toLocaleString()}원</p>
            </div>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button onClick={()=>setAdminViewMode('list')} className={`flex-1 py-3 rounded-lg text-sm font-black ${adminViewMode==='list'?'bg-white shadow text-gray-900':'text-gray-500'}`}>목록 보기</button>
            <button onClick={()=>setAdminViewMode('calendar')} className={`flex-1 py-3 rounded-lg text-sm font-black ${adminViewMode==='calendar'?'bg-white shadow text-gray-900':'text-gray-500'}`}>달력 보기</button>
          </div>

          {adminViewMode === 'calendar' ? (
            <div className="bg-white p-6 rounded-2xl border-2 border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <button onClick={()=>setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth()-1, 1))}><ChevronLeft/></button>
                <span className="font-black text-lg text-gray-900">{calendarDate.getFullYear()}년 {calendarDate.getMonth()+1}월</span>
                <button onClick={()=>setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth()+1, 1))}><ChevronRight/></button>
              </div>
              <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReports.map(r => (
                <div key={r.id} className="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-xs font-black text-gray-500 mb-1">{r.timestamp ? new Date(r.timestamp).toLocaleString('ko-KR') : ''}</p>
                      <p className="font-black text-lg text-gray-900">{String(r.date)} | {String(r.location)}</p>
                    </div>
                    <span className="bg-gray-900 text-white px-4 py-1.5 rounded-full text-xs font-black">{String(r.worker)}</span>
                  </div>
                  <div className="flex justify-between items-end border-t pt-4">
                    <span className="text-sm font-black text-gray-500">마감 금액</span>
                    <span className="text-2xl font-black text-rose-600">{(Number(r.totalSales)||0).toLocaleString()}원</span>
                  </div>
                  <button onClick={()=>setExpandedReportId(expandedReportId===r.id?null:r.id)} className="w-full mt-4 py-3 bg-gray-100 rounded-xl text-sm font-black text-gray-700">상세 정보 보기</button>
                  {expandedReportId === r.id && (
                    <div className="mt-5 space-y-5 pt-5 border-t border-dashed">
                      <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50 p-4 rounded-xl">
                        <div className="flex justify-between text-gray-900"><span>재고:</span><span className="font-black">{r.inventory?.stockCount}개</span></div>
                        <div className="flex justify-between text-gray-900"><span>쌀 사용:</span><span className="font-black">{r.inventory?.usedRice}kg</span></div>
                        <div className="col-span-2 flex flex-col pt-2 mt-2 border-t text-gray-900">
                          <div className="flex justify-between">
                            <span>다음날 쌀:</span>
                            <span className={`font-black ${r.inventory?.hasRiceForNextDay ? 'text-green-600' : 'text-red-500'}`}>{r.inventory?.hasRiceForNextDay ? '충분' : '부족'}</span>
                          </div>
                          {r.inventory?.hasRiceForNextDay === false && r.inventory?.remainingRiceAmount && (
                            <div className="flex justify-between mt-1 text-xs">
                                <span>남은 잔량:</span>
                                <span className="font-black text-gray-900">{r.inventory.remainingRiceAmount}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {r.notes && <div className="text-sm bg-gray-100 p-4 rounded-xl italic text-gray-800 font-bold leading-relaxed">"{String(r.notes)}"</div>}
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {r.photos && Object.entries(r.photos).map(([k, v]) => v && (
                          <div key={k} className="relative flex-shrink-0" onClick={()=>setSelectedPhoto({url:String(v), name:photoNames[k] || k, date: r.date, worker: r.worker})}>
                            <img src={String(v)} className="w-24 h-24 object-cover rounded-xl border-2 border-gray-200" />
                            <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-lg font-black">{photoNames[k] || k}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={()=>startEditReport(r)} className="flex-1 py-3 bg-blue-100 text-blue-700 rounded-xl text-sm font-black">수정</button>
                        <button onClick={()=>setDeleteConfirmId(r.id)} className="flex-1 py-3 bg-red-100 text-red-700 rounded-xl text-sm font-black">삭제</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedPhoto && (
          <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center p-6" onClick={()=>setSelectedPhoto(null)}>
            <div className="absolute top-8 right-8 flex gap-4">
               <a href={selectedPhoto.url} download className="p-3 bg-white/20 rounded-full text-white" onClick={e=>e.stopPropagation()}><Download size={24}/></a>
               <button className="p-3 bg-white/20 rounded-full text-white"><X size={24}/></button>
            </div>
            <img src={selectedPhoto.url} className="max-w-full max-h-[70vh] rounded-xl shadow-2xl" />
            <div className="text-center mt-6 text-white">
              <p className="font-black text-xl mb-1">{String(selectedPhoto.name)}</p>
              <p className="text-gray-400 text-sm font-bold">{String(selectedPhoto.date)} | {String(selectedPhoto.worker)}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- 메인 폼 (근무자용) ---
  return (
    <div className="max-w-md mx-auto bg-white min-h-screen pb-40">
      <header className="bg-white p-6 border-b-2 sticky top-0 z-20 flex justify-between items-center shadow-md">
        <h1 className="font-black text-gray-900 text-xl flex items-center gap-2">
          <span className="text-rose-600 cursor-pointer active:scale-75 transition-transform" onClick={()=>setView('login')}>❤️</span> 
          하트뻥튀기 업무공유
        </h1>
        {isCurrentSubmitted && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-green-100 rounded-full">
            <CheckCircle2 className="text-green-600" size={14}/>
            <span className="text-[11px] font-black text-green-700">업무공유 완료</span>
          </div>
        )}
      </header>

      <div className="p-4 space-y-8">
        {/* 기본 정보 및 매출 */}
        <section className="bg-white p-6 rounded-2xl border-2 border-gray-200 shadow-sm space-y-6">
          <h2 className="text-sm font-black text-gray-700 border-l-4 border-rose-600 pl-2">기본 정보</h2>
          
          <div className="space-y-4">
             <div className="flex justify-between items-center">
                <label className="text-base font-black text-gray-900">근무 매니저</label>
                <select value={formData.worker} onChange={e=>setFormData({...formData, worker:e.target.value})} className="bg-gray-100 p-3 rounded-xl text-sm font-black border-none outline-none">
                  <option>정윤이</option><option>황진웅</option><option>최윤미</option><option>장유미</option><option>윤종규</option><option>직접입력</option>
                </select>
             </div>
             <div className="flex justify-between items-center">
                <label className="text-base font-black text-gray-900">영업 위치</label>
                <div className="flex gap-2">
                  {['상행선','하행선'].map(l=>(
                    <button 
                        key={l} 
                        onClick={()=>setFormData({...formData, location:l})} 
                        className={`px-5 py-2.5 rounded-xl text-sm font-black border-2 transition-all 
                            ${formData.location === l 
                                ? (l === '상행선' ? 'bg-red-600 border-red-600 text-white shadow-md' : 'bg-blue-600 border-blue-600 text-white shadow-md') 
                                : 'bg-white border-gray-200 text-gray-400'
                            }`}
                    >
                        {l}
                    </button>
                  ))}
                </div>
             </div>
             <div className="flex justify-between items-center">
                <label className="text-base font-black text-gray-900">날짜</label>
                <span className="font-black text-gray-900 bg-gray-100 px-4 py-2 rounded-xl">{formData.date}</span>
             </div>
          </div>

          <div className="space-y-4 pt-6 border-t">
            <h3 className="text-sm font-black text-gray-700">금액 입력</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-900 ml-1">현금 매출</label>
                <input type="number" value={formData.sales.cash} onChange={e=>setFormData({...formData, sales:{...formData.sales, cash:e.target.value}})} className="w-full p-4 bg-gray-100 rounded-xl border-none outline-none font-black text-right text-gray-900 text-lg" placeholder="0" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-900 ml-1">카드 매출</label>
                <input type="number" value={formData.sales.card} onChange={e=>setFormData({...formData, sales:{...formData.sales, card:e.target.value}})} className="w-full p-4 bg-gray-100 rounded-xl border-none outline-none font-black text-right text-gray-900 text-lg" placeholder="0" />
              </div>
            </div>
          </div>

          <div className="bg-rose-600 p-5 rounded-2xl flex justify-between items-center text-white shadow-lg">
            <span className="text-base font-black">오늘 총 매출</span>
            <span className="text-3xl font-black">{((Number(formData.sales.cash)||0)+(Number(formData.sales.card)||0)).toLocaleString()}원</span>
          </div>
        </section>

        {/* 체크리스트 */}
        <section className="bg-white p-6 rounded-2xl border-2 border-gray-200 shadow-sm">
          <h3 className="text-sm font-black text-gray-700 mb-6 border-l-4 border-rose-600 pl-2">마감 체크리스트</h3>
          <div className="space-y-2">
            {Object.keys(checklistNames).map(k=>(
              <button key={k} onClick={()=>handleChecklist(k)} className={`w-full flex justify-between py-4 px-4 items-center rounded-xl border-2 transition-all ${formData.checklist[k]?'bg-rose-50 border-rose-500':'border-gray-100 bg-white'}`}>
                <span className={`text-base font-black ${formData.checklist[k]?'text-rose-700':'text-gray-900'}`}>{checklistNames[k]}</span>
                {formData.checklist[k] ? <CheckCircle2 className="text-rose-600" size={24}/> : <Circle className="text-gray-200" size={24}/>}
              </button>
            ))}
          </div>
        </section>

        {/* 재고 관리 */}
        <section className="bg-white p-6 rounded-2xl border-2 border-gray-200 shadow-sm space-y-6">
          <h3 className="text-sm font-black text-gray-700 border-l-4 border-rose-600 pl-2">재료 및 재고 관리</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-black text-gray-900 ml-1">오늘 재고 (개)</label>
              <input type="number" value={formData.inventory.stockCount} onChange={e=>setFormData({...formData, inventory:{...formData.inventory, stockCount:e.target.value}})} className="w-full p-4 bg-gray-100 rounded-xl border-none outline-none font-black text-right text-gray-900" placeholder="0" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black text-gray-900 ml-1">사용 쌀 (kg)</label>
              <input type="number" value={formData.inventory.usedRice} onChange={e=>setFormData({...formData, inventory:{...formData.inventory, usedRice:e.target.value}})} className="w-full p-4 bg-gray-100 rounded-xl border-none outline-none font-black text-right text-gray-900" placeholder="0" />
            </div>
          </div>
          <div className="pt-6 border-t space-y-4">
            <p className="text-base font-black text-gray-900">다음날 사용할 쌀이 있나요? (1.5박스↑)</p>
            <div className="flex gap-4">
              <button onClick={()=>setFormData({...formData, inventory:{...formData.inventory, hasRiceForNextDay:true, remainingRiceAmount: ''}})} className={`flex-1 py-4 rounded-xl font-black text-base border-2 ${formData.inventory.hasRiceForNextDay===true?'bg-rose-600 border-rose-600 text-white shadow-md':'bg-white border-gray-300 text-gray-400'}`}>네, 충분합니다</button>
              <button onClick={()=>setFormData({...formData, inventory:{...formData.inventory, hasRiceForNextDay:false}})} className={`flex-1 py-4 rounded-xl font-black text-base border-2 ${formData.inventory.hasRiceForNextDay===false?'bg-gray-800 border-gray-800 text-white shadow-md':'bg-white border-gray-300 text-gray-400'}`}>아니오, 부족합니다</button>
            </div>
            {formData.inventory.hasRiceForNextDay === false && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border-2 border-gray-200 space-y-2 animate-in fade-in slide-in-from-top-2">
                    <label className="text-sm font-black text-gray-900 block">쌀이 얼마나 남아있나요?</label>
                    <input 
                        type="text" 
                        value={formData.inventory.remainingRiceAmount} 
                        onChange={e=>setFormData({...formData, inventory:{...formData.inventory, remainingRiceAmount: e.target.value}})}
                        className="w-full p-4 bg-white rounded-xl border-none outline-none font-black text-gray-900" 
                        placeholder="예: 0.5박스, 1박스 등 직접 입력"
                    />
                </div>
            )}
          </div>
        </section>

        {/* 증빙 사진 */}
        <section className="bg-white p-6 rounded-2xl border-2 border-gray-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black text-gray-700 border-l-4 border-rose-600 pl-2">증빙 사진 (필수)</h3>
            {isUploading && <Loader2 className="w-5 h-5 text-rose-600 animate-spin"/>}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {Object.keys(photoNames).map(p=>(
              <label key={p} className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden relative ${formData.photos[p]?'bg-gray-50 border-rose-500':'bg-gray-50 border-gray-300'}`}>
                <input type="file" accept="image/*" className="hidden" onChange={e=>handlePhotoChange(p, e)} disabled={isUploading} />
                {formData.photos[p] ? (
                  <img src={formData.photos[p]} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center">
                    <Camera className="text-gray-400 mb-1" size={28}/>
                    <span className="text-xs text-gray-500 font-black">{photoNames[p]}</span>
                  </div>
                )}
                {formData.photos[p] && <div className="absolute inset-0 bg-rose-600/10 flex items-center justify-center"><CheckCircle2 className="text-rose-600" size={36}/></div>}
              </label>
            ))}
          </div>
        </section>

        {/* 대기 손님 */}
        <section className="bg-white p-6 rounded-2xl border-2 border-gray-200 shadow-sm space-y-6">
          <h3 className="text-sm font-black text-gray-700 border-l-4 border-rose-600 pl-2">대기 손님 파악</h3>
          <div className="flex gap-4">
            <button onClick={()=>handleWaitingToggle(true)} className={`flex-1 py-5 rounded-xl font-black text-lg border-2 ${formData.waiting.hadWaiting===true?'bg-blue-600 border-blue-600 text-white shadow-md':'bg-white border-gray-300 text-gray-400'}`}>손님 있었음</button>
            <button onClick={()=>handleWaitingToggle(false)} className={`flex-1 py-5 rounded-xl font-black text-lg border-2 ${formData.waiting.hadWaiting===false?'bg-gray-800 border-gray-800 text-white shadow-md':'bg-white border-gray-300 text-gray-400'}`}>없었음</button>
          </div>
        </section>

        {/* 특이사항 */}
        <section className="bg-white p-6 rounded-2xl border-2 border-gray-200 shadow-sm">
          <h3 className="text-sm font-black text-gray-700 mb-4 border-l-4 border-rose-600 pl-2">특이사항</h3>
          <textarea rows="4" value={formData.notes} onChange={e=>setFormData({...formData, notes:e.target.value})} className="w-full bg-gray-100 rounded-xl p-5 border-none outline-none text-base font-black text-gray-900" placeholder="전달하실 내용을 적어주세요..." />
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-5 pb-10 bg-white/90 backdrop-blur-md border-t-2 z-40">
        <button 
          onClick={submitReport} 
          disabled={isSubmitting || isUploading} 
          className={`w-full py-5 rounded-2xl font-black text-xl text-white shadow-xl flex items-center justify-center gap-3 ${isSubmitting||isUploading?'bg-gray-400':'bg-rose-600'}`}
        >
          {isSubmitting ? <Loader2 className="animate-spin" size={24}/> : null}
          {isSubmitting ? '제출 중...' : '업무공유 제출하기'}
        </button>
      </div>

      {/* 성공 팝업 */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/80 z-[300] flex items-center justify-center p-8">
          <div className="bg-white p-12 rounded-3xl w-full text-center shadow-2xl">
            <div className="bg-rose-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8"><CheckCircle2 size={56} className="text-rose-600"/></div>
            <h3 className="text-3xl font-black mb-4 text-gray-900">제출 성공!</h3>
            <p className="text-gray-600 mb-12 font-black text-lg">오늘 하루도 정말 고생 많으셨습니다.<br/>조심히 들어가세요!</p>
            <button onClick={closeAndResetForm} className="w-full bg-gray-900 text-white py-6 rounded-xl font-black text-xl">확인</button>
          </div>
        </div>
      )}

      {/* 알림 팝업 */}
      {alertMessage && (
        <div className="fixed inset-0 bg-black/70 z-[310] flex items-center justify-center p-8" onClick={()=>setAlertMessage('')}>
          <div className="bg-white p-8 rounded-2xl w-full text-center" onClick={e=>e.stopPropagation()}>
            <div className="bg-amber-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"><AlertCircle size={44} className="text-amber-500"/></div>
            <p className="text-gray-900 font-black text-lg mb-10 whitespace-pre-wrap leading-relaxed">{String(alertMessage)}</p>
            <button onClick={()=>setAlertMessage('')} className="w-full bg-gray-900 text-white py-5 rounded-xl font-black text-lg">알겠습니다</button>
          </div>
        </div>
      )}
    </div>
  );
}