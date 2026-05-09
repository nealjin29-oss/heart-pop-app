import React, { useState, useMemo, useEffect } from 'react';
import { Camera, CheckCircle2, Circle, MapPin, Calendar, DollarSign, AlertCircle, FileText, User, Lock, Download, Image as ImageIcon, BarChart3, Users, LogOut, ChevronDown, ChevronUp, X, ChevronLeft, ChevronRight, CalendarDays, List, HelpCircle, Edit2, Trash2, Save } from 'lucide-react';

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
const appId = typeof __app_id !== 'undefined' ? __app_id : 'heart-pop-app-prod';

// --- 물품 이름 매핑 ---
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

// 오늘 날짜 문자열 함수 (YYYY-MM-DD)
const getTodayString = () => new Date().toISOString().split('T')[0];

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
  const [isUploading, setIsUploading] = useState(false); // 사진 압축 중 로딩 표시용

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

  // --- 사진 압축 로직 (이미지 용량 문제 해결) ---
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
        const MAX_WIDTH = 800; // 가로 최대 800px로 축소
        const MAX_HEIGHT = 800; // 세로 최대 800px로 축소
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // JPEG 화질을 0.6(60%)으로 낮춰서 용량을 획기적으로 줄임
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
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

    const totalSales = (Number(formData.sales.cash) || 0) + (Number(formData.sales.card) || 0);
    const newReportId = Date.now().toString();
    
    const newReport = {
      timestamp: new Date().toISOString(),
      date: formData.date,
      worker: formData.worker === '직접입력' ? formData.customWorker : formData.worker,
      location: formData.location,
      sales: { ...formData.sales },
      totalSales: totalSales,
      supplies: { ...formData.supplies },
      suppliesStock: { ...formData.suppliesStock },
      inventory: { ...formData.inventory },
      notes: formData.notes,
      checklist: { ...formData.checklist },
      waiting: { ...formData.waiting },
      photos: { ...formData.photos }
    };
    
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'reports', newReportId);
      await setDoc(docRef, newReport);
      setShowSubmitModal(true); 
    } catch (error) {
      // 1MB 제한 오류인 경우 더 친절하게 안내
      if (error.message.includes('too large')) {
        setAlertMessage("사진 용량이 너무 큽니다. 사진을 다시 한 번 찍어주시거나, 한 장씩만 첨부해 보세요.");
      } else {
        setAlertMessage("제출 중 오류가 발생했습니다: " + error.message);
      }
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
    const headers = ['일자', '제출시간', '근무자', '위치', '총매출', '현금', '카드', '물품요청여부'];
    const rows = reports.map(r => {
      const isShort = Object.values(r.supplies).some(v => v === true) ? '요청됨' : '정상';
      return [r.date, new Date(r.timestamp).toLocaleTimeString('ko-KR'), r.worker, r.location, r.totalSales, r.sales.cash || 0, r.sales.card || 0, isShort].join(',');
    });
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(',') + '\n' + rows.join('\n');
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `마감보고_${getTodayString()}.csv`);
    link.click();
  };

  const filteredReports = useMemo(() => {
    if (filterType === 'ALL') return reports;
    if (filterType === 'WORKER') return reports.filter(r => r.worker === filterValue);
    if (filterType === 'LOCATION') return reports.filter(r => r.location === filterValue);
    return reports;
  }, [reports, filterType, filterValue]);

  const totalFilteredSales = filteredReports.reduce((sum, r) => sum + r.totalSales, 0);

  const monthlyTotalSales = useMemo(() => {
    return filteredReports.filter(r => {
      const rDate = new Date(r.date);
      return rDate.getFullYear() === calendarDate.getFullYear() && rDate.getMonth() === calendarDate.getMonth();
    }).reduce((sum, r) => sum + r.totalSales, 0);
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
      const dailySales = filteredReports.filter(r => r.date === dateStr).reduce((sum, r) => sum + r.totalSales, 0);
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
            <div className="bg-white rounded-3xl w-full max-w-sm p-6 text-center shadow-2xl">
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
      <div className="max-w-2xl mx-auto bg-gray-100 min-h-screen font-sans pb-24 print:bg-white print:max-w-full">
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
            <h2 className="text-sm font-bold text-gray-500 mb-4">데이터 필터</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 mb-2 block">근무자별</label>
                <div className="flex flex-wrap gap-2">
                  {['정윤이', '황진웅', '최윤미', '장유미', '윤종규'].map(name => (
                    <button key={name} onClick={() => { setFilterType('WORKER'); setFilterValue(name); }} className={`px-3 py-1.5 rounded-lg text-sm ${filterType === 'WORKER' && filterValue === name ? 'bg-gray-800 text-white' : 'bg-gray-100'}`}>{name}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 mb-2 block">위치별</label>
                <div className="flex gap-2">
                  {['상행선', '하행선'].map(loc => (
                    <button key={loc} onClick={() => { setFilterType('LOCATION'); setFilterValue(loc); }} className={`px-4 py-2 rounded-lg text-sm ${filterType === 'LOCATION' && filterValue === loc ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>{loc}</button>
                  ))}
                </div>
              </div>
              <button onClick={() => { setFilterType('ALL'); setFilterValue(''); }} className="w-full py-2.5 rounded-lg text-sm font-bold border-2 border-gray-200">필터 초기화</button>
            </div>
            <div className="mt-6 p-5 bg-gray-50 rounded-xl border border-gray-200 text-right">
              <span className="text-gray-500 text-sm block mb-1">매출 합계</span>
              <span className="text-3xl font-black text-rose-600">{totalFilteredSales.toLocaleString()}원</span>
            </div>
          </section>

          <div className="flex bg-gray-200 p-1 rounded-xl print:hidden">
            <button onClick={() => setAdminViewMode('list')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${adminViewMode === 'list' ? 'bg-white shadow' : 'text-gray-500'}`}>목록</button>
            <button onClick={() => setAdminViewMode('calendar')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${adminViewMode === 'calendar' ? 'bg-white shadow' : 'text-gray-500'}`}>달력</button>
          </div>

          {adminViewMode === 'calendar' && (
            <section className="bg-white p-5 rounded-2xl border-2 border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}><ChevronLeft /></button>
                <h3 className="text-lg font-bold">{calendarDate.getFullYear()}년 {calendarDate.getMonth() + 1}월</h3>
                <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}><ChevronRight /></button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-6 text-center text-xs font-bold">{['일','월','화','수','목','금','토'].map(d=><div key={d}>{d}</div>)}</div>
              <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
              <div className="mt-6 bg-gray-800 p-4 rounded-xl text-white flex justify-between items-center">
                <span className="text-sm">월 합계</span>
                <span className="text-2xl font-black">{monthlyTotalSales.toLocaleString()}원</span>
              </div>
            </section>
          )}

          {adminViewMode === 'list' && (
            <section className="space-y-4">
              {filteredReports.map((report) => {
                const isEditing = editReportId === report.id;
                const rData = isEditing ? editData : report;
                const hasShortage = Object.values(rData.supplies).some(v => v === true);
                const unchecked = rData.checklist ? Object.entries(rData.checklist).filter(([k, v]) => v === false).map(([k]) => checklistNames[k]) : [];
                const photos = rData.photos ? Object.entries(rData.photos).filter(([k, v]) => v !== null) : [];
                
                return (
                  <div key={report.id} className={`p-5 rounded-2xl border-2 ${isEditing ? 'border-blue-400 bg-blue-50/30' : hasShortage ? 'border-red-400 bg-red-50' : 'bg-white'}`}>
                    <div className="flex justify-between mb-3 font-bold">
                      <span>{rData.date} | {rData.location}</span>
                      <span className="bg-gray-800 text-white px-3 py-1 rounded-full text-xs">{rData.worker}</span>
                    </div>
                    {isEditing ? (
                      <div className="space-y-3 p-3 bg-white border rounded-xl mt-3">
                        <div className="grid grid-cols-2 gap-2">
                          <input type="number" value={editData.sales.cash} onChange={e=>setEditData({...editData, sales:{...editData.sales, cash:e.target.value}})} className="border p-2 text-sm rounded" placeholder="현금" />
                          <input type="number" value={editData.sales.card} onChange={e=>setEditData({...editData, sales:{...editData.sales, card:e.target.value}})} className="border p-2 text-sm rounded" placeholder="카드" />
                        </div>
                        <textarea value={editData.notes} onChange={e=>setEditData({...editData, notes:e.target.value})} className="w-full border p-2 text-sm rounded" placeholder="특이사항"></textarea>
                        <div className="flex gap-2"><button onClick={()=>setEditReportId(null)} className="flex-1 bg-gray-200 py-2 rounded font-bold">취소</button><button onClick={saveEditReport} className="flex-1 bg-blue-600 text-white py-2 rounded font-bold">저장</button></div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-end pt-3 border-t">
                          <div className="text-xs text-gray-500">현금 {Number(rData.sales.cash).toLocaleString()} / 카드 {Number(rData.sales.card).toLocaleString()}</div>
                          <div className="text-xl font-black">{rData.totalSales.toLocaleString()}원</div>
                        </div>
                        <button onClick={() => setExpandedReportId(expandedReportId === rData.id ? null : rData.id)} className="w-full mt-3 py-2 bg-gray-50 text-xs font-bold text-gray-500 rounded-lg">상세보기</button>
                        {expandedReportId === rData.id && (
                          <div className="mt-4 pt-4 border-t space-y-3">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => startEditReport(rData)} className="text-blue-600 text-xs font-bold">수정</button>
                              <button onClick={() => setDeleteConfirmId(rData.id)} className="text-red-600 text-xs font-bold">삭제</button>
                            </div>
                            {unchecked.length > 0 && <div className="bg-amber-50 p-2 text-xs border rounded">미체크: {unchecked.join(', ')}</div>}
                            {rData.waiting?.hadWaiting && <div className="bg-blue-50 p-2 text-xs border rounded">대기: {rData.waiting.lastNumber}번 / {rData.waiting.missedTeams}팀 놓침</div>}
                            <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2 rounded">
                              <div>재고: {rData.inventory?.stockCount}개</div>
                              <div>사용쌀: {rData.inventory?.usedRice}kg</div>
                              {rData.inventory?.hasRiceForNextDay !== undefined && (
                                <div className="col-span-2">다음날 쌀: {rData.inventory.hasRiceForNextDay ? '있음(1.5박스↑)' : '없음'}</div>
                              )}
                            </div>
                            {rData.notes && <div className="bg-rose-50 p-2 text-xs border rounded italic">"{rData.notes}"</div>}
                            {photos.length > 0 && <div className="flex gap-2 overflow-x-auto pt-2">{photos.map(([k,v])=><img key={k} src={v} className="w-20 h-20 object-cover rounded border" />)}</div>}
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

        {deleteConfirmId && (
          <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-sm p-6 text-center shadow-2xl">
              <h3 className="text-xl font-black mb-2">삭제 확인</h3>
              <p className="text-gray-600 mb-6">정말 삭제하시겠습니까?</p>
              <div className="flex gap-2"><button onClick={() => setDeleteConfirmId(null)} className="flex-1 bg-gray-200 py-3 rounded-xl font-bold">취소</button><button onClick={executeDelete} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold">삭제</button></div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen font-sans pb-24">
      <header className="bg-white border-b px-5 py-4 sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800"><span className="text-rose-500 cursor-pointer" onClick={() => setView('login')}>❤️</span> 하트뻥튀기</h1>
      </header>

      <div className="bg-gray-50 px-4 py-3 border-b flex justify-between text-[11px] font-bold">
        <span className="text-gray-500">{formData.date} 현황</span>
        <div className="flex gap-2">
          <div className={isSangSubmitted ? 'text-green-600' : 'text-gray-400'}>상행 {isSangSubmitted ? '완료' : '미제출'}</div>
          <div className={isHaSubmitted ? 'text-green-600' : 'text-gray-400'}>하행 {isHaSubmitted ? '완료' : '미제출'}</div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <section className="bg-white p-5 rounded-2xl shadow-sm border space-y-4">
          <div className="flex justify-between items-center"><label className="text-sm font-bold flex items-center gap-1"><User className="w-4 h-4 text-rose-400"/> 근무자</label>
            <select value={formData.worker} onChange={e=>setFormData({...formData, worker:e.target.value})} className="border p-2 text-sm rounded-lg w-1/2 bg-gray-50">
              <option>정윤이</option><option>황진웅</option><option>최윤미</option><option>장유미</option><option>윤종규</option><option>직접입력</option>
            </select>
          </div>
          <div className="flex justify-between items-center"><label className="text-sm font-bold flex items-center gap-1"><MapPin className="w-4 h-4 text-rose-400"/> 위치</label>
            <div className="flex gap-1">{['상행선', '하행선'].map(l=><button key={l} onClick={()=>setFormData({...formData, location:l})} className={`px-3 py-1.5 text-xs rounded-lg ${formData.location===l?'bg-rose-500 text-white':'bg-gray-100'}`}>{l}</button>)}</div>
          </div>
          <div className="flex justify-between items-center"><label className="text-sm font-bold flex items-center gap-1"><Calendar className="w-4 h-4 text-rose-400"/> 날짜</label>
            <input type="date" value={formData.date} onChange={e=>setFormData({...formData, date:e.target.value})} className="border p-1.5 text-sm rounded bg-gray-50" />
          </div>
          <div className="pt-4 border-t space-y-3">
            <div className="flex justify-between items-center text-sm font-bold"><span className="text-gray-600">현금</span><input type="number" value={formData.sales.cash} onChange={e=>setFormData({...formData, sales:{...formData.sales, cash:e.target.value}})} className="border p-2 rounded w-1/2 text-right bg-gray-50" /></div>
            <div className="flex justify-between items-center text-sm font-bold"><span className="text-gray-600">카드</span><input type="number" value={formData.sales.card} onChange={e=>setFormData({...formData, sales:{...formData.sales, card:e.target.value}})} className="border p-2 rounded w-1/2 text-right bg-gray-50" /></div>
            <div className="p-3 bg-rose-50 rounded-xl flex justify-between font-bold text-rose-700"><span>합계</span><span>{((Number(formData.sales.cash)||0)+(Number(formData.sales.card)||0)).toLocaleString()}원</span></div>
          </div>
        </section>

        <section className="bg-white p-5 rounded-2xl border space-y-1">
          <h2 className="text-xs font-bold text-gray-400 uppercase mb-2">마감 체크</h2>
          {Object.keys(checklistNames).map(k=>(
            <button key={k} onClick={()=>handleChecklist(k)} className="w-full flex justify-between py-2 items-center text-sm">
              <span className={formData.checklist[k]?'text-gray-900 font-medium':'text-gray-500'}>{checklistNames[k]}</span>
              {formData.checklist[k] ? <CheckCircle2 className="text-rose-500 w-5 h-5"/> : <Circle className="text-gray-300 w-5 h-5"/>}
            </button>
          ))}
        </section>

        <section className="bg-white p-5 rounded-2xl border">
          <h2 className="text-xs font-bold text-gray-400 uppercase mb-4">재료 파악</h2>
          <div className="grid grid-cols-2 gap-4 text-sm font-bold text-gray-600">
            <div><label className="block text-[10px] mb-1">재고</label><input type="number" value={formData.inventory.stockCount} onChange={e=>setFormData({...formData, inventory:{...formData.inventory, stockCount:e.target.value}})} className="w-full border p-2 rounded bg-gray-50 text-right" /></div>
            <div><label className="block text-[10px] mb-1">사용쌀(kg)</label><input type="number" value={formData.inventory.usedRice} onChange={e=>setFormData({...formData, inventory:{...formData.inventory, usedRice:e.target.value}})} className="w-full border p-2 rounded bg-gray-50 text-right" /></div>
            
            {/* 다음날 쌀 질문 추가 */}
            <div className="col-span-2 pt-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">다음날 사용할 쌀이 있나요?</label>
              <p className="text-[10px] text-gray-400 mb-2 leading-tight">1.5박스 이상 있다면 예라고 눌러주세요.</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setFormData({ ...formData, inventory: { ...formData.inventory, hasRiceForNextDay: true } })} 
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-colors ${formData.inventory.hasRiceForNextDay === true ? 'bg-rose-500 border-rose-500 text-white' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                >
                  예
                </button>
                <button 
                  onClick={() => setFormData({ ...formData, inventory: { ...formData.inventory, hasRiceForNextDay: false } })} 
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-colors ${formData.inventory.hasRiceForNextDay === false ? 'bg-gray-700 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                >
                  아니오
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white p-5 rounded-2xl border space-y-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase">부족 물품</h2>
          {Object.entries(supplyNames).map(([id, label])=>(
            <div key={id} className={`p-3 rounded-xl border flex flex-col gap-2 ${formData.supplies[id]?'bg-amber-50 border-amber-200':'bg-white'}`}>
              <button onClick={()=>setFormData({...formData, supplies:{...formData.supplies, [id]:!formData.supplies[id]}})} className="flex justify-between items-center text-sm font-bold">
                <span>{label}</span><span className={formData.supplies[id]?'text-amber-700':'text-gray-400'}>{formData.supplies[id]?'요청됨':'충분함'}</span>
              </button>
              {formData.supplies[id] && <input type="number" placeholder="현재 재고수량" value={formData.suppliesStock[id]} onChange={e=>setFormData({...formData, suppliesStock:{...formData.suppliesStock, [id]:e.target.value}})} className="border p-2 rounded text-xs" />}
            </div>
          ))}
        </section>

        <section className="bg-white p-5 rounded-2xl border">
          <h2 className="text-xs font-bold text-gray-400 uppercase mb-4 flex justify-between items-center">
            사진 첨부 <span className="text-rose-500 font-bold">필수</span>
            {isUploading && <span className="text-[10px] text-blue-500 animate-pulse">압축 중...</span>}
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'riceBin', label: '쌀통' }, { id: 'pot', label: '솥' }, { id: 'desk', label: '매대' }, { id: 'report', label: '판매일보' }, { id: 'key', label: '열쇠' }
            ].map(p=>(
              <label key={p.id} className={`aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer overflow-hidden ${formData.photos[p.id]?'bg-rose-50 border-rose-200':'bg-gray-50 border-gray-200'}`}>
                <input type="file" accept="image/*" className="hidden" onChange={e=>handlePhotoChange(p.id, e)} disabled={isUploading} />
                {formData.photos[p.id] ? <img src={formData.photos[p.id]} className="w-full h-full object-cover" /> : <><Camera className="w-5 h-5 text-gray-400 mb-1"/><span className="text-[10px] text-gray-500">{p.label}</span></>}
              </label>
            ))}
          </div>
        </section>

        <section className="bg-white p-5 rounded-2xl border">
          <h2 className="text-xs font-bold text-gray-400 uppercase mb-4 flex justify-between">대기 손님 파악 <span className="text-rose-500">필수</span></h2>
          <div className="flex gap-2 mb-4">
            <button onClick={()=>handleWaitingToggle(true)} className={`flex-1 py-3 rounded-xl font-bold text-sm border ${formData.waiting.hadWaiting===true?'bg-blue-500 text-white':'bg-gray-50'}`}>예</button>
            <button onClick={()=>handleWaitingToggle(false)} className={`flex-1 py-3 rounded-xl font-bold text-sm border ${formData.waiting.hadWaiting===false?'bg-gray-700 text-white':'bg-gray-50'}`}>아니오</button>
          </div>
          {formData.waiting.hadWaiting === true && (
            <div className="space-y-3 pt-3 border-t">
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">대기번호가 몇 번까지 갔나요?</label>
                <input type="number" value={formData.waiting.lastNumber} onChange={e=>setFormData({...formData, waiting:{...formData.waiting, lastNumber:e.target.value}})} className="w-full border p-3 rounded-lg text-sm bg-blue-50 outline-none" />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">놓친 손님이 몇 팀인가요?</label>
                <input type="number" value={formData.waiting.missedTeams} onChange={e=>setFormData({...formData, waiting:{...formData.waiting, missedTeams:e.target.value}})} className="w-full border p-3 rounded-lg text-sm bg-blue-50 outline-none" />
              </div>
            </div>
          )}
        </section>

        <section className="bg-white p-5 rounded-2xl border">
          <h2 className="text-xs font-bold text-gray-400 uppercase mb-3">특이사항</h2>
          <textarea rows="3" value={formData.notes} onChange={e=>setFormData({...formData, notes:e.target.value})} className="w-full border p-3 rounded-xl text-sm bg-gray-50 resize-none outline-none" placeholder="반품 사유, 특이사항 입력..."></textarea>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t p-4 pb-6 shadow-lg">
        <button onClick={submitReport} className="w-full bg-rose-500 text-white font-bold text-lg py-4 rounded-xl transition-transform active:scale-95" disabled={isUploading}>
          {isUploading ? "사진 준비 중..." : "제출하기"}
        </button>
      </div>

      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 text-center shadow-2xl animate-in fade-in zoom-in">
            <div className="bg-rose-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"><CheckCircle2 className="w-10 h-10 text-rose-500" /></div>
            <h3 className="text-2xl font-black text-gray-800 mb-2">제출 완료!</h3>
            <p className="text-gray-600 mb-8 font-medium">수고하셨습니다!<br/>안전하게 귀가하세요.</p>
            <button onClick={closeAndResetForm} className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl">확인 (초기화)</button>
          </div>
        </div>
      )}

      {alertMessage && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 text-center shadow-2xl">
            <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle className="w-8 h-8 text-amber-500" /></div>
            <p className="text-gray-600 mb-6 font-medium whitespace-pre-wrap leading-relaxed">{alertMessage}</p>
            <button onClick={() => setAlertMessage('')} className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl">확인</button>
          </div>
        </div>
      )}
    </div>
  );
}