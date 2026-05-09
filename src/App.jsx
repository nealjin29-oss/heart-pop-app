import React, { useState, useMemo, useEffect } from 'react';
import { Camera, CheckCircle2, Circle, MapPin, Calendar, DollarSign, AlertCircle, FileText, User, Lock, Download, Image as ImageIcon, BarChart3, Users, LogOut, ChevronDown, ChevronUp, X, ChevronLeft, ChevronRight, CalendarDays, List, HelpCircle, Edit2, Trash2, Save, Maximize2, Loader2 } from 'lucide-react';

// === Firebase 데이터베이스 연동 ===
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc, query } from 'firebase/firestore';

// =====================================================================
// 💡 사장님이 제공해주신 실제 Firebase 설정값이 적용되었습니다.
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
// 💡 오류 수정: appId 내의 슬래시(/)를 제거하여 Firebase 경로가 꼬이지 않게 함
const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'heart-pop-app-prod';
const appId = rawAppId.replace(/\//g, '_');

// --- 데이터 매핑 정보 ---
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

// 오늘 날짜 문자열 함수 (YYYY-MM-DD)
const getTodayString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const localISOTime = (new Date(now - offset)).toISOString().split('T')[0];
  return localISOTime;
};

export default function App() {
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
  
  // 사진 크게 보기 모달용 상태
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const [formData, setFormData] = useState({
    location: '상행선',
    date: getTodayString(), 
    worker: '정윤이',
    customWorker: '',
    sales: { cash: '', card: '' },
    checklist: { readyCash: false, machineClean: false, acrylicClean: false, hideStock: false, receiptPaper: false, hideKey: false, changeEnough: false, posClose: false, submitLog: false },
    inventory: { stockCount: '', usedRice: '', leftRice: '', loss: '', hasRiceForNextDay: null },
    supplies: { breadTieShort: false, plasticBagShort: false, gloveShort: false, earmuffShort: false, maskShort: false, extra: '' },
    suppliesStock: { breadTieShort: '', plasticBagShort: '', gloveShort: '', earmuffShort: '', maskShort: '', extra: '' },
    photos: { riceBin: null, pot: null, desk: null, report: null, key: null },
    notes: '',
    waiting: { hadWaiting: null, lastNumber: '', missedTeams: '' }
  });

  // --- DB 연동 및 로그인 처리 ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("인증 에러:", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // --- 실시간 데이터 불러오기 ---
  useEffect(() => {
    if (!user) return;
    
    // 💡 안전한 컬렉션 경로 생성
    const reportsRef = collection(db, 'artifacts', appId, 'public', 'data', 'reports');
    const unsubscribe = onSnapshot(reportsRef, (snapshot) => {
      const fetchedReports = [];
      snapshot.forEach((doc) => {
        fetchedReports.push({ id: doc.id, ...doc.data() });
      });
      fetchedReports.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setReports(fetchedReports);
    }, (error) => {
      console.error("데이터 동기화 오류:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const handleChecklist = (key) => {
    setFormData((prev) => ({
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
        const MAX_WIDTH = 1200; 
        const MAX_HEIGHT = 1200; 
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7); 
        setFormData((prev) => ({
          ...prev,
          photos: { ...prev.photos, [key]: dataUrl },
        }));
        setIsUploading(false);
      };
    };
  };

  const submitReport = async () => {
    if (formData.sales.cash === '' || formData.sales.card === '') {
      setAlertMessage("앗! 미입력 항목이 있습니다.\n현금 매출과 카드 매출을 모두 입력해주세요.");
      return;
    }
    if (formData.inventory.hasRiceForNextDay === null) {
      setAlertMessage("앗! 미입력 항목이 있습니다.\n'다음날 사용할 쌀' 여부를 선택해주세요.");
      return;
    }
    if (formData.waiting.hadWaiting === null) {
      setAlertMessage("앗! 미입력 항목이 있습니다.\n'대기 손님 파악' 질문에 '예' 또는 '아니오'를 선택해주세요.");
      return;
    }
    if (!user) {
      setAlertMessage("연결 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setIsSubmitting(true);
    const totalSales = (Number(formData.sales.cash) || 0) + (Number(formData.sales.card) || 0);
    const newReportId = Date.now().toString();
    
    const newReport = {
      timestamp: new Date().toISOString(),
      date: formData.date,
      worker: String(formData.worker === '직접입력' ? formData.customWorker : formData.worker),
      location: String(formData.location),
      sales: { ...formData.sales },
      totalSales: totalSales,
      supplies: { ...formData.supplies },
      suppliesStock: { ...formData.suppliesStock },
      inventory: { ...formData.inventory },
      notes: String(formData.notes),
      checklist: { ...formData.checklist },
      waiting: { ...formData.waiting },
      photos: { ...formData.photos }
    };
    
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'reports', newReportId);
      await setDoc(docRef, newReport);
      setShowSubmitModal(true); 
    } catch (error) {
      setAlertMessage("제출 중 오류가 발생했습니다: " + error.message);
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
      inventory: { stockCount: '', usedRice: '', leftRice: '', loss: '', hasRiceForNextDay: null },
      supplies: { breadTieShort: false, plasticBagShort: false, gloveShort: false, earmuffShort: false, maskShort: false, extra: '' },
      suppliesStock: { breadTieShort: '', plasticBagShort: '', gloveShort: '', earmuffShort: '', maskShort: '', extra: '' },
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
    const totalSales = (Number(editData.sales.cash) || 0) + (Number(editData.sales.card) || 0);
    const updatedReport = { ...editData, totalSales };
    const docId = editData.id;
    delete updatedReport.id;
    
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'reports', docId.toString());
      await setDoc(docRef, updatedReport);
      setEditReportId(null);
      setEditData(null);
    } catch (error) {
      alert("수정 실패: " + error.message);
    }
  };

  const executeDelete = async () => {
    if (!user || !deleteConfirmId) return;
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'reports', deleteConfirmId.toString());
      await deleteDoc(docRef);
      setDeleteConfirmId(null);
      setExpandedReportId(null);
    } catch (error) {
      alert("삭제 실패: " + error.message);
    }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPwd === '940329') {
      setView('admin');
      setAdminPwd('');
    } else {
      setAlertMessage('비밀번호가 틀렸습니다.');
    }
  };

  const downloadCSV = () => {
    const headers = ['일자', '제출시간', '근무자', '위치', '총매출', '현금', '카드', '물품요청여부', '다음날쌀있음'];
    const rows = reports.map(r => {
      const isShort = Object.values(r.supplies || {}).some(v => v === true) ? '요청됨' : '정상';
      const hasNextRice = r.inventory?.hasRiceForNextDay ? 'O' : 'X';
      return [r.date, new Date(r.timestamp).toLocaleTimeString('ko-KR'), r.worker, r.location, r.totalSales, r.sales?.cash || 0, r.sales?.card || 0, isShort, hasNextRice].join(',');
    });
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(',') + '\n' + rows.join('\n');
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `하트뻥튀기_마감보고_${getTodayString()}.csv`);
    link.click();
  };

  const filteredReports = useMemo(() => {
    if (filterType === 'ALL') return reports;
    if (filterType === 'WORKER') return reports.filter(r => r.worker === filterValue);
    if (filterType === 'LOCATION') return reports.filter(r => r.location === filterValue);
    return reports;
  }, [reports, filterType, filterValue]);

  const totalFilteredSales = filteredReports.reduce((sum, r) => sum + (Number(r.totalSales) || 0), 0);

  const monthlyTotalSales = useMemo(() => {
    return filteredReports.filter(r => {
      const rDate = new Date(r.date);
      return rDate.getFullYear() === calendarDate.getFullYear() && rDate.getMonth() === calendarDate.getMonth();
    }).reduce((sum, r) => sum + (Number(r.totalSales) || 0), 0);
  }, [filteredReports, calendarDate]);

  const isSangSubmitted = useMemo(() => reports.some(r => r.date === formData.date && r.location === '상행선'), [reports, formData.date]);
  const isHaSubmitted = useMemo(() => reports.some(r => r.date === formData.date && r.location === '하행선'), [reports, formData.date]);

  const renderCalendar = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 border border-transparent"></div>);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dailySales = filteredReports.filter(r => r.date === dateStr).reduce((sum, r) => sum + (Number(r.totalSales) || 0), 0);
      const isToday = dateStr === getTodayString();

      days.push(
        <div key={d} className={`p-1.5 border border-gray-200 min-h-[80px] flex flex-col rounded-lg shadow-sm ${isToday ? 'bg-rose-50 border-rose-200' : 'bg-white'}`}>
          <span className={`text-xs font-bold mb-1 ${isToday ? 'text-rose-600' : 'text-gray-500'}`}>{d}</span>
          {dailySales > 0 && (
            <span className="text-[10px] sm:text-xs font-bold text-gray-800 text-right mt-auto break-all bg-gray-50 rounded p-1">
              {dailySales.toLocaleString()}
            </span>
          )}
        </div>
      );
    }
    return days;
  };

  if (view === 'login') {
    return (
      <div className="max-w-md mx-auto bg-gray-50 min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm">
          <div className="flex justify-center mb-6">
            <div className="bg-rose-100 p-3 rounded-full">
              <Lock className="w-8 h-8 text-rose-500" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-center text-gray-800 mb-6">관리자 접속</h2>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <input
              type="password"
              placeholder="비밀번호 입력"
              value={adminPwd}
              onChange={(e) => setAdminPwd(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-center text-xl rounded-xl p-4 focus:ring-rose-500 focus:border-rose-500 tracking-[0.3em]"
              autoFocus
            />
            <button type="submit" className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-4 rounded-xl transition-colors">접속</button>
          </form>
          <button onClick={() => setView('form')} className="w-full mt-4 text-gray-500 text-sm hover:underline">돌아가기</button>
        </div>
        {alertMessage && (
          <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-sm p-6 text-center shadow-2xl">
              <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle className="w-8 h-8 text-amber-500" /></div>
              <p className="text-gray-600 mb-6 font-medium whitespace-pre-wrap">{alertMessage}</p>
              <button onClick={() => setAlertMessage('')} className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl">확인</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view === 'admin') {
    return (
      <div className="max-w-2xl mx-auto bg-gray-100 min-h-screen font-sans pb-24 print:bg-white print:max-w-full relative">
        <header className="bg-white border-b border-gray-200 px-5 py-4 sticky top-0 z-10 flex justify-between items-center print:hidden">
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2"><BarChart3 className="w-6 h-6 text-rose-500" /> 대시보드</h1>
          <button onClick={() => setView('form')} className="p-2 bg-gray-100 rounded-full flex items-center gap-1 text-sm font-bold text-gray-600"><LogOut className="w-4 h-4" /> 나가기</button>
        </header>

        <div className="p-4 space-y-6">
          <div className="flex gap-2 print:hidden">
            <button onClick={downloadCSV} className="flex-1 bg-green-600 text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2"><Download className="w-5 h-5" /> CSV</button>
            <button onClick={() => window.print()} className="flex-1 bg-blue-600 text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2"><ImageIcon className="w-5 h-5" /> PDF/이미지</button>
          </div>

          <section className="bg-white p-5 rounded-2xl shadow-sm print:shadow-none print:border">
            <h2 className="text-sm font-bold text-gray-500 mb-4 text-center">매출 분석 리포트</h2>
            <div className="space-y-4">
              <div className="flex bg-gray-50 p-1 rounded-xl">
                <button onClick={() => { setFilterType('ALL'); setFilterValue(''); }} className={`flex-1 py-2 text-xs font-bold rounded-lg ${filterType === 'ALL' ? 'bg-white shadow text-gray-800' : 'text-gray-400'}`}>전체</button>
                <button onClick={() => { setFilterType('LOCATION'); setFilterValue('상행선'); }} className={`flex-1 py-2 text-xs font-bold rounded-lg ${filterType === 'LOCATION' && filterValue === '상행선' ? 'bg-white shadow text-gray-800' : 'text-gray-400'}`}>상행선</button>
                <button onClick={() => { setFilterType('LOCATION'); setFilterValue('하행선'); }} className={`flex-1 py-2 text-xs font-bold rounded-lg ${filterType === 'LOCATION' && filterValue === '하행선' ? 'bg-white shadow text-gray-800' : 'text-gray-400'}`}>하행선</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {['정윤이', '황진웅', '최윤미', '장유미', '윤종규'].map(name => (
                  <button key={name} onClick={() => { setFilterType('WORKER'); setFilterValue(name); }} className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${filterType === 'WORKER' && filterValue === name ? 'bg-gray-800 border-gray-800 text-white' : 'bg-white text-gray-600'}`}>{name}</button>
                ))}
              </div>
            </div>
            <div className="mt-6 p-5 bg-gradient-to-br from-rose-50 to-white rounded-xl border border-rose-100 text-right">
              <span className="text-gray-500 text-xs block mb-1">검색된 매출 합계</span>
              <span className="text-3xl font-black text-rose-600">{(totalFilteredSales || 0).toLocaleString()}원</span>
            </div>
          </section>

          <div className="flex bg-gray-200 p-1 rounded-xl print:hidden">
            <button onClick={() => setAdminViewMode('list')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${adminViewMode === 'list' ? 'bg-white shadow' : 'text-gray-500'}`}>목록</button>
            <button onClick={() => setAdminViewMode('calendar')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${adminViewMode === 'calendar' ? 'bg-white shadow' : 'text-gray-500'}`}>달력</button>
          </div>

          {adminViewMode === 'calendar' && (
            <section className="bg-white p-5 rounded-2xl border-2 border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))} className="p-2 bg-gray-50 rounded-full"><ChevronLeft /></button>
                <h3 className="text-lg font-bold">{calendarDate.getFullYear()}년 {calendarDate.getMonth() + 1}월</h3>
                <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))} className="p-2 bg-gray-50 rounded-full"><ChevronRight /></button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-6 text-center text-[10px] font-bold text-gray-400">{['일','월','화','수','목','금','토'].map(d=><div key={d}>{d}</div>)}</div>
              <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
              <div className="mt-6 bg-gray-800 p-4 rounded-xl text-white flex justify-between items-center">
                <span className="text-xs">이달의 합계</span>
                <span className="text-2xl font-black">{(monthlyTotalSales || 0).toLocaleString()}원</span>
              </div>
            </section>
          )}

          {adminViewMode === 'list' && (
            <section className="space-y-4">
              {filteredReports.map((report) => {
                const isEditing = editReportId === report.id;
                const rData = isEditing ? editData : report;
                const hasShortage = Object.values(rData.supplies || {}).some(v => v === true);
                const unchecked = rData.checklist ? Object.entries(rData.checklist).filter(([k, v]) => v === false).map(([k]) => checklistNames[k] || k) : [];
                const photos = rData.photos ? Object.entries(rData.photos).filter(([k, v]) => v !== null) : [];
                
                return (
                  <div key={report.id} className={`p-5 rounded-2xl border-2 shadow-sm transition-all ${isEditing ? 'border-blue-400 bg-blue-50/30' : hasShortage ? 'border-red-400 bg-red-50' : 'bg-white border-gray-100'}`}>
                    <div className="flex justify-between mb-3 font-bold items-start">
                      <div>
                        <div className="text-[10px] text-gray-400 font-normal">{new Date(rData.timestamp).toLocaleString('ko-KR')}</div>
                        <div className="text-lg">{String(rData.date)} | {String(rData.location)}</div>
                      </div>
                      <span className="bg-gray-800 text-white px-3 py-1.5 rounded-full text-xs">{String(rData.worker)}</span>
                    </div>
                    {isEditing ? (
                      <div className="space-y-3 p-3 bg-white border rounded-xl mt-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div><label className="text-[10px] text-gray-400 mb-1 block">현금</label><input type="number" value={editData.sales?.cash || ''} onChange={e=>setEditData({...editData, sales:{...editData.sales, cash:e.target.value}})} className="border p-2 text-sm rounded w-full" /></div>
                          <div><label className="text-[10px] text-gray-400 mb-1 block">카드</label><input type="number" value={editData.sales?.card || ''} onChange={e=>setEditData({...editData, sales:{...editData.sales, card:e.target.value}})} className="border p-2 text-sm rounded w-full" /></div>
                        </div>
                        <textarea value={editData.notes || ''} onChange={e=>setEditData({...editData, notes:e.target.value})} className="w-full border p-2 text-sm rounded" rows="3"></textarea>
                        <div className="flex gap-2"><button onClick={()=>setEditReportId(null)} className="flex-1 bg-gray-200 py-3 rounded-lg font-bold">취소</button><button onClick={saveEditReport} className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold">저장</button></div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-end pt-3 border-t border-gray-100">
                          <div className="text-xs text-gray-500">현금 {(Number(rData.sales?.cash) || 0).toLocaleString()} / 카드 {(Number(rData.sales?.card) || 0).toLocaleString()}</div>
                          <div className="text-2xl font-black text-gray-900">{(Number(rData.totalSales) || 0).toLocaleString()}원</div>
                        </div>
                        <button onClick={() => setExpandedReportId(expandedReportId === rData.id ? null : rData.id)} className="w-full mt-3 py-2.5 bg-gray-50 text-xs font-bold text-gray-500 rounded-xl hover:bg-gray-100 transition-colors">상세 리포트 확인</button>
                        {expandedReportId === rData.id && (
                          <div className="mt-4 pt-4 border-t border-gray-50 space-y-4">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => startEditReport(rData)} className="flex items-center gap-1 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-bold"><Edit2 className="w-3 h-3"/> 수정</button>
                              <button onClick={() => setDeleteConfirmId(rData.id)} className="flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold"><Trash2 className="w-3 h-3"/> 삭제</button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-3 rounded-xl border border-gray-100">
                              <div className="flex justify-between"><span>재고:</span><span className="font-bold">{rData.inventory?.stockCount}개</span></div>
                              <div className="flex justify-between"><span>사용쌀:</span><span className="font-bold">{rData.inventory?.usedRice}kg</span></div>
                              <div className="col-span-2 mt-2 pt-2 border-t border-gray-200 flex justify-between">
                                <span>다음날 사용할 쌀:</span>
                                <span className={`font-bold ${rData.inventory?.hasRiceForNextDay ? 'text-green-600' : 'text-red-500'}`}>
                                  {rData.inventory?.hasRiceForNextDay ? '충분함 (1.5박스↑)' : '없음/부족함'}
                                </span>
                              </div>
                            </div>

                            {unchecked.length > 0 && (
                              <div className="bg-amber-50 p-3 text-xs border border-amber-100 rounded-xl">
                                <h4 className="font-bold text-amber-700 mb-1">미체크 항목</h4>
                                <div className="text-amber-600 leading-relaxed">{unchecked.join(', ')}</div>
                              </div>
                            )}

                            {rData.waiting?.hadWaiting && (
                              <div className="bg-blue-50 p-3 text-xs border border-blue-100 rounded-xl">
                                <h4 className="font-bold text-blue-700 mb-1">대기 현황</h4>
                                <div className="text-blue-600 font-medium">대기번호 {rData.waiting?.lastNumber}번까지 / {rData.waiting?.missedTeams}팀 놓침</div>
                              </div>
                            )}

                            {rData.notes && (
                              <div className="bg-gray-50 p-3 text-xs border rounded-xl italic text-gray-700 leading-relaxed">
                                <FileText className="w-3 h-3 inline mr-1 mb-1 opacity-50"/>"{String(rData.notes)}"
                              </div>
                            )}

                            {photos.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="text-[10px] font-bold text-gray-400">첨부된 사진 (클릭 시 확대)</h4>
                                <div className="flex gap-2 overflow-x-auto pt-1 pb-3 scrollbar-hide">
                                  {photos.map(([k,v])=>(
                                    <div key={k} className="relative flex-shrink-0 cursor-pointer group" onClick={() => setSelectedPhoto({ name: photoNames[k] || k, url: v, date: rData.date, worker: rData.worker })}>
                                      <img src={v} className="w-24 h-24 object-cover rounded-xl border shadow-sm group-hover:brightness-75 transition-all" />
                                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ImageIcon className="text-white w-6 h-6 drop-shadow" />
                                      </div>
                                      <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] px-1.5 py-0.5 rounded-full">{photoNames[k] || k}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </section>
          )}
        </div>

        {selectedPhoto && (
          <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center p-4 animate-in fade-in" onClick={() => setSelectedPhoto(null)}>
            <div className="absolute top-6 right-6 flex gap-4">
              <a 
                href={selectedPhoto.url} 
                download={`하트뻥튀기_${selectedPhoto.date}_${selectedPhoto.worker}_${selectedPhoto.name}.jpg`}
                className="bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors text-white"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="w-6 h-6" />
              </a>
              <button onClick={() => setSelectedPhoto(null)} className="bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
              <img src={selectedPhoto.url} className="w-full max-h-[70vh] object-contain rounded-2xl shadow-2xl" alt={selectedPhoto.name} />
              <div className="mt-6 text-center text-white">
                <h3 className="font-bold text-xl">{String(selectedPhoto.name)}</h3>
                <p className="text-gray-400 text-sm mt-1">{String(selectedPhoto.date)} | {String(selectedPhoto.worker)} 매니저 제출</p>
                <div className="mt-8 flex gap-3">
                  <a 
                    href={selectedPhoto.url} 
                    download={`하트뻥튀기_${selectedPhoto.date}_${selectedPhoto.worker}_${selectedPhoto.name}.jpg`}
                    className="flex-1 bg-rose-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Download className="w-5 h-5" /> 내 기기에 저장하기
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {deleteConfirmId && (
          <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-sm p-8 text-center shadow-2xl scale-in-center">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="text-red-500 w-8 h-8"/></div>
              <h3 className="text-xl font-black mb-2">리포트 삭제</h3>
              <p className="text-gray-600 mb-8 font-medium">정말 이 마감 리포트를 삭제하시겠습니까?<br/>삭제 후에는 복구할 수 없습니다.</p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 bg-gray-100 py-4 rounded-2xl font-bold text-gray-500 transition-colors">취소</button>
                <button onClick={executeDelete} className="flex-1 bg-red-500 text-white py-4 rounded-2xl font-bold transition-colors">삭제</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen font-sans pb-24 relative overflow-x-hidden">
      <header className="bg-white border-b px-5 py-5 sticky top-0 z-20 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span className="text-rose-500 cursor-pointer active:scale-75 transition-transform" onClick={() => setView('login')}>❤️</span> 
          하트뻥튀기 마감보고
        </h1>
      </header>

      <div className="bg-white/80 backdrop-blur-sm px-4 py-3 border-b flex justify-between text-[11px] font-black sticky top-[64px] z-10">
        <span className="text-gray-400 flex items-center gap-1"><CalendarDays className="w-3 h-3"/> {String(formData.date)} 현황</span>
        <div className="flex gap-2">
          <div className={`flex items-center gap-1 ${isSangSubmitted ? 'text-green-600' : 'text-gray-300'}`}>상행선 {isSangSubmitted ? '● 완료' : '○ 미제출'}</div>
          <div className={`flex items-center gap-1 ${isHaSubmitted ? 'text-green-600' : 'text-gray-300'}`}>하행선 {isHaSubmitted ? '● 완료' : '○ 미제출'}</div>
        </div>
      </div>

      <div className="p-4 space-y-6 pt-6">
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-5">
          <h2 className="text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2"><User className="w-3 h-3"/> 기본 정보</h2>
          
          <div className="flex justify-between items-center">
            <label className="text-sm font-bold text-gray-700">근무자</label>
            <select value={formData.worker} onChange={e=>setFormData({...formData, worker:e.target.value})} className="border border-gray-100 p-2.5 text-sm rounded-xl w-1/2 bg-gray-50 outline-none font-medium">
              <option>정윤이</option><option>황진웅</option><option>최윤미</option><option>장유미</option><option>윤종규</option><option>직접입력</option>
            </select>
          </div>
          {formData.worker === '직접입력' && (
            <input type="text" placeholder="근무자 성함 입력" value={formData.customWorker} onChange={e=>setFormData({...formData, customWorker:e.target.value})} className="w-full border-2 border-rose-100 p-3 rounded-xl text-sm outline-none focus:border-rose-400" />
          )}

          <div className="flex justify-between items-center">
            <label className="text-sm font-bold text-gray-700">위치</label>
            <div className="flex gap-1.5">
              {['상행선', '하행선'].map(l=><button key={l} onClick={()=>setFormData({...formData, location:l})} className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${formData.location===l?'bg-rose-500 text-white shadow-lg shadow-rose-200':'bg-gray-50 text-gray-400'}`}>{l}</button>)}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <label className="text-sm font-bold text-gray-700">보고 날짜</label>
            <input type="date" value={formData.date} onChange={e=>setFormData({...formData, date:e.target.value})} className="border border-gray-100 p-2 text-sm rounded-xl bg-gray-50 outline-none font-bold text-gray-600" />
          </div>

          <div className="pt-5 border-t border-gray-50 space-y-4">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2"><DollarSign className="w-4 h-4 text-rose-500"/> 매출 입력</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-gray-400 mb-1 ml-1 font-bold">현금 매출</label>
                <div className="relative">
                  <input type="number" value={formData.sales.cash} onChange={e=>setFormData({...formData, sales:{...formData.sales, cash:e.target.value}})} className="w-full border-none p-3.5 rounded-2xl bg-gray-50 text-right outline-none font-bold text-gray-800 focus:ring-2 ring-rose-200" placeholder="0" />
                  <span className="absolute left-3 top-3.5 text-gray-300 text-[10px] font-bold">₩</span>
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-1 ml-1 font-bold">카드 매출</label>
                <div className="relative">
                  <input type="number" value={formData.sales.card} onChange={e=>setFormData({...formData, sales:{...formData.sales, card:e.target.value}})} className="w-full border-none p-3.5 rounded-2xl bg-gray-50 text-right outline-none font-bold text-gray-800 focus:ring-2 ring-rose-200" placeholder="0" />
                  <span className="absolute left-3 top-3.5 text-gray-300 text-[10px] font-bold">₩</span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gradient-to-r from-rose-500 to-rose-400 rounded-2xl flex justify-between items-center text-white shadow-xl shadow-rose-100">
              <span className="text-xs font-bold opacity-80">오늘 총 매출</span>
              <span className="text-xl font-black">{((Number(formData.sales.cash)||0)+(Number(formData.sales.card)||0)).toLocaleString()}<span className="text-sm font-normal ml-0.5">원</span></span>
            </div>
          </div>
        </section>

        <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2"><CheckCircle2 className="w-3 h-3"/> 마감 체크리스트</h2>
          <div className="space-y-1">
            {Object.keys(checklistNames).map(k=>(
              <button key={k} onClick={()=>handleChecklist(k)} className={`w-full flex justify-between py-3.5 px-3 items-center rounded-2xl transition-all ${formData.checklist[k] ? 'bg-rose-50/50' : 'hover:bg-gray-50'}`}>
                <span className={`text-[14px] ${formData.checklist[k] ? 'text-rose-600 font-bold' : 'text-gray-500 font-medium'}`}>{checklistNames[k]}</span>
                {formData.checklist[k] ? <div className="bg-rose-500 rounded-full p-0.5"><CheckCircle2 className="text-white w-5 h-5"/></div> : <Circle className="text-gray-200 w-6 h-6"/>}
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-5">
          <h2 className="text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2"><BarChart3 className="w-3 h-3"/> 재료 및 재고 파악</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-gray-400 mb-1.5 ml-1 font-bold">오늘 재고 (개)</label>
              <input type="number" value={formData.inventory.stockCount} onChange={e=>setFormData({...formData, inventory:{...formData.inventory, stockCount:e.target.value}})} className="w-full border-none p-3.5 rounded-2xl bg-gray-50 text-right outline-none font-black text-gray-800" placeholder="0" />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-1.5 ml-1 font-bold">오늘 사용 쌀 (kg)</label>
              <input type="number" value={formData.inventory.usedRice} onChange={e=>setFormData({...formData, inventory:{...formData.inventory, usedRice:e.target.value}})} className="w-full border-none p-3.5 rounded-2xl bg-gray-50 text-right outline-none font-black text-gray-800" placeholder="0" />
            </div>
            <div className="col-span-2 pt-2 space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-bold text-gray-700">다음날 사용할 쌀이 있나요?</label>
                <p className="text-[10px] text-gray-400 leading-tight">가게에 1.5박스 이상 있다면 '예'를 선택해 주세요.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setFormData({ ...formData, inventory: { ...formData.inventory, hasRiceForNextDay: true } })} className={`flex-1 py-3.5 rounded-2xl text-sm font-bold border-2 transition-all ${formData.inventory.hasRiceForNextDay === true ? 'bg-rose-500 border-rose-500 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-300'}`}>예</button>
                <button onClick={() => setFormData({ ...formData, inventory: { ...formData.inventory, hasRiceForNextDay: false } })} className={`flex-1 py-3.5 rounded-2xl text-sm font-bold border-2 transition-all ${formData.inventory.hasRiceForNextDay === false ? 'bg-gray-700 border-gray-700 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-300'}`}>아니오</button>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-5">
          <h2 className="text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2"><AlertCircle className="w-3 h-3"/> 부족 물품 요청</h2>
          <div className="space-y-3">
            {Object.entries(supplyNames).map(([id, label])=>(
              <div key={id} className={`p-4 rounded-2xl border-2 transition-all ${formData.supplies[id]?'bg-amber-50 border-amber-200':'bg-white border-gray-50'}`}>
                <button onClick={()=>setFormData({...formData, supplies:{...formData.supplies, [id]:!formData.supplies[id]}})} className="flex justify-between items-center w-full">
                  <span className={`text-[14px] font-bold ${formData.supplies[id] ? 'text-amber-800' : 'text-gray-400'}`}>{label}</span>
                  <span className={`text-[11px] font-black px-3 py-1 rounded-full ${formData.supplies[id] ? 'bg-amber-200 text-amber-900' : 'bg-gray-100 text-gray-300'}`}>{formData.supplies[id] ? '요청됨' : '충분함'}</span>
                </button>
                {formData.supplies[id] && (
                  <div className="mt-3 pt-3 border-t border-amber-100">
                    <label className="text-[10px] font-bold text-amber-600 block mb-1">현재 남은 수량 입력</label>
                    <input type="number" placeholder="현재 수량" value={formData.suppliesStock[id]} onChange={e=>setFormData({...formData, suppliesStock:{...formData.suppliesStock, [id]:e.target.value}})} className="w-full border-none p-3 rounded-xl bg-white text-sm outline-none text-amber-900 font-bold" />
                  </div>
                )}
              </div>
            ))}
            <div className="pt-2">
              <label className="block text-[10px] text-gray-400 mb-2 ml-1 font-bold">기타 요청 사항</label>
              <input type="text" placeholder="예: 물티슈, 소독제 등" value={formData.supplies.extra || ''} onChange={e=>setFormData({...formData, supplies:{...formData.supplies, extra:e.target.value}})} className="w-full border-none p-4 rounded-2xl bg-gray-50 text-sm outline-none" />
            </div>
          </div>
        </section>

        <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-5">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2"><ImageIcon className="w-3 h-3"/> 마감 사진 첨부 (필수)</h2>
            {isUploading && <span className="text-rose-500 animate-pulse text-[10px] font-bold">압축 중...</span>}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'riceBin', label: '쌀통' }, { id: 'pot', label: '솥' }, { id: 'desk', label: '매대' }, { id: 'report', label: '판매일보' }, { id: 'key', label: '열쇠' }
            ].map(p=>(
              <label key={p.id} className={`aspect-square border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all relative ${formData.photos[p.id]?'bg-rose-50 border-rose-200 shadow-inner':'bg-gray-50 border-gray-100 hover:bg-gray-100'}`}>
                <input type="file" accept="image/*" className="hidden" onChange={e=>handlePhotoChange(p.id, e)} disabled={isUploading} />
                {formData.photos[p.id] ? (
                  <img src={formData.photos[p.id]} className="w-full h-full object-cover" alt={p.label} />
                ) : (
                  <div className="flex flex-col items-center">
                    <Camera className="w-6 h-6 text-gray-200 mb-1.5"/>
                    <span className="text-[10px] font-bold text-gray-300">{p.label}</span>
                  </div>
                )}
                {formData.photos[p.id] && <div className="absolute inset-0 bg-black/10 flex items-center justify-center"><CheckCircle2 className="text-white w-8 h-8 drop-shadow-md"/></div>}
              </label>
            ))}
          </div>
        </section>

        <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-5">
          <h2 className="text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2"><Users className="w-3 h-3"/> 대기 손님 현황 (필수)</h2>
          <div className="flex gap-2">
            <button onClick={()=>handleWaitingToggle(true)} className={`flex-1 py-4 rounded-2xl font-bold text-sm border-2 transition-all ${formData.waiting.hadWaiting===true?'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-100':'bg-white border-gray-100 text-gray-300'}`}>예 (있었음)</button>
            <button onClick={()=>handleWaitingToggle(false)} className={`flex-1 py-4 rounded-2xl font-bold text-sm border-2 transition-all ${formData.waiting.hadWaiting===false?'bg-gray-700 border-gray-700 text-white shadow-lg':'bg-white border-gray-100 text-gray-300'}`}>아니오 (없었음)</button>
          </div>
          {formData.waiting.hadWaiting === true && (
            <div className="space-y-4 pt-4 border-t border-gray-50 animate-in slide-in-from-top">
              <div>
                <label className="block text-[11px] text-gray-400 mb-1.5 ml-1 font-bold">대기번호 끝 번호</label>
                <div className="relative">
                  <input type="number" value={formData.waiting.lastNumber || ''} onChange={e=>setFormData({...formData, waiting:{...formData.waiting, lastNumber:e.target.value}})} className="w-full border-none p-4 rounded-2xl bg-blue-50 text-right outline-none font-black text-blue-900" placeholder="번호 입력" />
                  <span className="absolute left-4 top-4 text-blue-200 text-xs font-bold">No.</span>
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-gray-400 mb-1.5 ml-1 font-bold">못 드시고 가신 팀 수</label>
                <div className="relative">
                  <input type="number" value={formData.waiting.missedTeams || ''} onChange={e=>setFormData({...formData, waiting:{...formData.waiting, missedTeams:e.target.value}})} className="w-full border-none p-4 rounded-2xl bg-blue-50 text-right outline-none font-black text-blue-900" placeholder="팀 수 입력" />
                  <span className="absolute left-4 top-4 text-blue-200 text-xs font-bold">Team.</span>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2"><FileText className="w-3 h-3"/> 특이사항 및 전달사항</h2>
          <textarea rows="4" value={formData.notes || ''} onChange={e=>setFormData({...formData, notes:e.target.value})} className="w-full border-none p-4 rounded-2xl text-sm bg-gray-50 resize-none outline-none font-medium placeholder:text-gray-300 focus:ring-2 ring-rose-100" placeholder="반품 사유, 기기 이상, 기타 전달하실 내용을 적어주세요..."></textarea>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-md border-t p-5 pb-8 shadow-2xl z-20">
        <button 
          onClick={submitReport} 
          disabled={isUploading || isSubmitting}
          className={`w-full text-white font-black text-lg py-4.5 rounded-2xl shadow-xl shadow-rose-200 transition-all active:scale-95 flex items-center justify-center gap-3 ${isUploading || isSubmitting ? 'bg-gray-400' : 'bg-rose-500 hover:bg-rose-600'}`}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin"/> 제출 중...</span>
          ) : isUploading ? (
            <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin"/> 사진 준비 중...</span>
          ) : (
            "마감 보고 제출하기"
          )}
        </button>
      </div>

      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] w-full max-w-sm p-10 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-rose-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><CheckCircle2 className="w-12 h-12 text-rose-500" /></div>
            <h3 className="text-2xl font-black text-gray-800 mb-3">제출 성공!</h3>
            <p className="text-gray-500 mb-10 font-bold leading-relaxed">오늘 하루도 정말 고생 많으셨습니다.<br/>조심히, 안전하게 귀가하세요!</p>
            <button onClick={closeAndResetForm} className="w-full bg-gray-900 text-white font-black py-4.5 rounded-3xl text-lg hover:bg-black transition-colors shadow-lg">확인 및 초기화</button>
          </div>
        </div>
      )}

      {alertMessage && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setAlertMessage('')}>
          <div className="bg-white rounded-[32px] w-full max-w-sm p-8 text-center shadow-2xl animate-in zoom-in-90" onClick={e=>e.stopPropagation()}>
            <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle className="w-8 h-8 text-amber-500" /></div>
            <h4 className="text-lg font-black text-gray-800 mb-2">안내</h4>
            <p className="text-gray-500 mb-8 font-bold whitespace-pre-wrap leading-relaxed">{String(alertMessage)}</p>
            <button onClick={() => setAlertMessage('')} className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl">확인</button>
          </div>
        </div>
      )}
    </div>
  );
}