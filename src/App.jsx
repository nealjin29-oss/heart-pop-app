import React, { useState, useMemo, useEffect } from 'react';
import { Camera, CheckCircle2, Circle, MapPin, Calendar, DollarSign, AlertCircle, FileText, User, Lock, Download, Image as ImageIcon, BarChart3, Users, LogOut, ChevronDown, ChevronUp, X, ChevronLeft, ChevronRight, CalendarDays, List, HelpCircle, Edit2, Trash2, Save } from 'lucide-react';

// === Firebase 데이터베이스 연동 ===
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

// =====================================================================
// 💡 사장님! Netlify 실제 배포를 위해 아래 설정값을 사장님의 Firebase 정보로 채워주세요!
// (Canvas 테스트 환경에서는 자동 적용됩니다.)
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

  const [formData, setFormData] = useState({
    location: '상행선',
    date: new Date().toISOString().split('T')[0], 
    worker: '정윤이',
    customWorker: '',
    sales: { cash: '', card: '' },
    checklist: { readyCash: false, machineClean: false, acrylicClean: false, hideStock: false, receiptPaper: false, hideKey: false, changeEnough: false, posClose: false, submitLog: false },
    inventory: { stockCount: '', usedRice: '', leftRice: '', loss: '' },
    supplies: { breadTieShort: false, plasticBagShort: false, gloveShort: false, earmuffShort: false, maskShort: false, extra: '' },
    suppliesStock: { breadTieShort: '', plasticBagShort: '', gloveShort: '', earmuffShort: '', maskShort: '', extra: '' },
    photos: { riceBin: null, pot: null, desk: null, report: null, key: null },
    notes: '',
    waiting: { hadWaiting: null, lastNumber: '', missedTeams: '' }
  });

  // --- DB 연동 및 로그인 처리 (컴포넌트 로드 시 1회 실행) ---
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

  // --- 실시간 데이터 불러오기 (로그인 후 실행) ---
  useEffect(() => {
    if (!user) return;
    
    // DB에서 데이터 실시간 구독
    const reportsRef = collection(db, 'artifacts', appId, 'public', 'data', 'reports');
    const unsubscribe = onSnapshot(reportsRef, (snapshot) => {
      const fetchedReports = [];
      snapshot.forEach((doc) => {
        fetchedReports.push({ id: doc.id, ...doc.data() });
      });
      // 최신순 정렬
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
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          photos: { ...prev.photos, [key]: reader.result },
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const submitReport = async () => {
    if (formData.sales.cash === '' || formData.sales.card === '') {
      setAlertMessage("앗! 미입력 항목이 있습니다.\n현금 매출과 카드 매출을 모두 입력해주세요.\n(매출이 없는 항목은 '0'을 입력하세요.)");
      return;
    }
    if (formData.waiting.hadWaiting === null) {
      setAlertMessage("앗! 미입력 항목이 있습니다.\n'대기 손님 파악' 질문에 '예' 또는 '아니오'를 반드시 선택해주세요.");
      return;
    }
    if (!user) {
      setAlertMessage("데이터베이스 연결 중입니다. 잠시 후 다시 시도해주세요.");
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
      // 데이터베이스에 저장
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'reports', newReportId);
      await setDoc(docRef, newReport);
      setShowSubmitModal(true); 
    } catch (error) {
      setAlertMessage("제출 중 오류가 발생했습니다. 다시 시도해주세요.");
      console.error(error);
    }
  };

  const closeAndResetForm = () => {
    setShowSubmitModal(false);
    setFormData(prev => ({ 
      ...prev, 
      sales: { cash: '', card: '' },
      checklist: { readyCash: false, machineClean: false, acrylicClean: false, hideStock: false, receiptPaper: false, hideKey: false, changeEnough: false, posClose: false, submitLog: false },
      inventory: { stockCount: '', usedRice: '', leftRice: '', loss: '' },
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
    delete updatedReport.id; // DB 저장 시 id는 문서 키로 사용되므로 내용물에서 제외
    
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'reports', editData.id.toString());
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
      setAlertMessage('비밀번호가 틀렸습니다. 다시 확인해주세요.');
    }
  };

  const downloadCSV = () => {
    const headers = ['일자', '제출시간', '근무자', '위치', '총매출', '현금', '카드', '물품요청여부', '대기여부'];
    const rows = reports.map(r => {
      const isShort = Object.values(r.supplies).some(v => v === true) ? '요청됨' : '정상';
      const waitStr = r.waiting?.hadWaiting ? `대기O (최종:${r.waiting.lastNumber}번/놓침:${r.waiting.missedTeams}팀)` : '대기X';
      return [
        r.date, 
        new Date(r.timestamp).toLocaleTimeString('ko-KR'), 
        r.worker, 
        r.location, 
        r.totalSales, 
        r.sales.cash || 0, 
        r.sales.card || 0, 
        isShort,
        waitStr
      ].join(',');
    });
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(',') + '\n' + rows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `하트뻥튀기_마감보고_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      const isToday = dateStr === new Date().toISOString().split('T')[0];

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
          <h2 className="text-xl font-bold text-center text-gray-800 mb-6">관리자 페이지 접속</h2>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <input
              type="password"
              placeholder="비밀번호 입력"
              value={adminPwd}
              onChange={(e) => setAdminPwd(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-center text-xl rounded-xl p-4 focus:ring-rose-500 focus:border-rose-500 tracking-[0.3em]"
              autoFocus
            />
            <button type="submit" className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-4 rounded-xl transition-colors">
              접속하기
            </button>
          </form>
          <button onClick={() => setView('form')} className="w-full mt-4 text-gray-500 text-sm hover:underline">
            일반 마감보고 창으로 돌아가기
          </button>
        </div>

        {alertMessage && (
          <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-sm p-6 text-center shadow-2xl">
              <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-xl font-black text-gray-800 mb-2">안내</h3>
              <p className="text-gray-600 mb-6 font-medium whitespace-pre-wrap">{alertMessage}</p>
              <button onClick={() => setAlertMessage('')} className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold text-lg py-4 rounded-xl transition-colors">확인</button>
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
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-rose-500" /> 사장님 대시보드
          </h1>
          <button onClick={() => setView('form')} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 flex items-center gap-1 text-sm font-bold text-gray-600">
            <LogOut className="w-4 h-4" /> 나가기
          </button>
        </header>

        <div className="p-4 space-y-6">
          <div className="flex gap-2 print:hidden">
            <button onClick={downloadCSV} className="flex-1 bg-green-600 hover:bg-green-700 text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-colors">
              <Download className="w-5 h-5" /> CSV 다운로드
            </button>
            <button onClick={() => window.print()} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-colors">
              <ImageIcon className="w-5 h-5" /> 화면 이미지 저장
            </button>
          </div>

          <section className="bg-white p-5 rounded-2xl shadow-sm print:shadow-none print:border">
            <h2 className="text-sm font-bold text-gray-500 mb-4">데이터 분석 필터</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 mb-2 block"><Users className="w-4 h-4 inline mr-1 -mt-1"/>근무자별 합계</label>
                <div className="flex flex-wrap gap-2">
                  {['정윤이', '황진웅', '최윤미', '장유미', '윤종규'].map(name => (
                    <button key={name} onClick={() => { setFilterType('WORKER'); setFilterValue(name); }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterType === 'WORKER' && filterValue === name ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 mb-2 block"><MapPin className="w-4 h-4 inline mr-1 -mt-1"/>위치별 합계</label>
                <div className="flex gap-2">
                  {['상행선', '하행선'].map(loc => (
                    <button key={loc} onClick={() => { setFilterType('LOCATION'); setFilterValue(loc); }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterType === 'LOCATION' && filterValue === loc ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}>
                      {loc}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <button onClick={() => { setFilterType('ALL'); setFilterValue(''); }}
                  className={`w-full py-2.5 rounded-lg text-sm font-bold border-2 transition-colors ${filterType === 'ALL' ? 'border-rose-500 text-rose-600 bg-rose-50' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  필터 해제 (전체 매출 보기)
                </button>
              </div>
            </div>
            <div className="mt-6 p-5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 flex flex-col items-end">
              <span className="text-gray-500 font-medium text-sm mb-1">
                {filterType === 'ALL' ? '전체 누적 매출' : `'${filterValue}' 누적 매출`}
              </span>
              <span className="text-3xl font-black text-rose-600">{totalFilteredSales.toLocaleString()}<span className="text-xl text-gray-600 ml-1">원</span></span>
            </div>
          </section>

          <div className="flex bg-gray-200 p-1 rounded-xl print:hidden">
            <button 
              onClick={() => setAdminViewMode('list')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-colors ${adminViewMode === 'list' ? 'bg-white text-gray-800 shadow' : 'text-gray-500'}`}
            >
              <List className="w-4 h-4" /> 리포트 목록
            </button>
            <button 
              onClick={() => setAdminViewMode('calendar')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-colors ${adminViewMode === 'calendar' ? 'bg-white text-gray-800 shadow' : 'text-gray-500'}`}
            >
              <CalendarDays className="w-4 h-4" /> 달력 보기
            </button>
          </div>

          {adminViewMode === 'calendar' && (
            <section className="bg-white p-5 rounded-2xl shadow-sm border-2 border-gray-100 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full">
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h3 className="text-lg font-bold text-gray-800">
                  {calendarDate.getFullYear()}년 {calendarDate.getMonth() + 1}월
                </h3>
                <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full">
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                  <div key={day} className={`text-xs font-bold ${day === '일' ? 'text-red-500' : day === '토' ? 'text-blue-500' : 'text-gray-500'}`}>{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 mb-6">
                {renderCalendar()}
              </div>
              <div className="mt-auto bg-gray-800 p-4 rounded-xl flex justify-between items-center text-white">
                <div className="text-sm font-medium text-gray-300">
                  해당 월({calendarDate.getMonth() + 1}월) 누적 합계
                </div>
                <div className="text-2xl font-black">
                  {monthlyTotalSales.toLocaleString()}<span className="text-base font-normal ml-1">원</span>
                </div>
              </div>
            </section>
          )}

          {adminViewMode === 'list' && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <Calendar className="w-5 h-5 text-gray-500" />
                <h2 className="text-sm font-bold text-gray-600">마감 보고 내역 ({filteredReports.length}건)</h2>
              </div>
              
              {filteredReports.map((report) => {
                const isEditing = editReportId === report.id;
                const rData = isEditing ? editData : report;
                const hasShortage = Object.values(rData.supplies).some(val => val === true && typeof val === 'boolean');
                const uncheckedItems = rData.checklist ? Object.entries(rData.checklist).filter(([k, v]) => v === false).map(([k]) => checklistNames[k]) : [];
                const photosToDisplay = rData.photos ? Object.entries(rData.photos).filter(([k, v]) => v !== null) : [];
                
                return (
                  <div key={report.id} className={`p-5 rounded-2xl shadow-sm border-2 transition-all ${isEditing ? 'border-blue-400 bg-blue-50/30' : hasShortage ? 'border-red-400 bg-red-50' : 'border-gray-100 bg-white'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-xs text-gray-500">{new Date(rData.timestamp).toLocaleString('ko-KR')}</div>
                        <div className="font-bold text-lg text-gray-800 mt-1">{rData.date} | {rData.location}</div>
                      </div>
                      <div className="bg-gray-800 px-3 py-1.5 rounded-full text-sm font-bold text-white shadow-sm">
                        {rData.worker}
                      </div>
                    </div>
                    
                    {isEditing ? (
                      <div className="mt-4 p-4 bg-white border border-blue-200 rounded-xl space-y-4">
                        <h3 className="font-bold text-blue-800 border-b pb-2">보고서 내용 수정</h3>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">현금 매출</label>
                            <input type="number" value={editData.sales.cash} onChange={(e) => setEditData({...editData, sales: {...editData.sales, cash: e.target.value}})} className="w-full border rounded p-2 text-sm" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">카드 매출</label>
                            <input type="number" value={editData.sales.card} onChange={(e) => setEditData({...editData, sales: {...editData.sales, card: e.target.value}})} className="w-full border rounded p-2 text-sm" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">재고 개수</label>
                            <input type="number" value={editData.inventory.stockCount} onChange={(e) => setEditData({...editData, inventory: {...editData.inventory, stockCount: e.target.value}})} className="w-full border rounded p-2 text-sm" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">로스</label>
                            <input type="number" step="0.1" value={editData.inventory.loss} onChange={(e) => setEditData({...editData, inventory: {...editData.inventory, loss: e.target.value}})} className="w-full border rounded p-2 text-sm" />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">특이사항</label>
                          <textarea rows="2" value={editData.notes} onChange={(e) => setEditData({...editData, notes: e.target.value})} className="w-full border rounded p-2 text-sm resize-none"></textarea>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button onClick={() => setEditReportId(null)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-bold text-sm">취소</button>
                          <button onClick={saveEditReport} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-1"><Save className="w-4 h-4"/> 저장</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-end border-t border-gray-200/60 pt-3 mt-3">
                          <div className="text-sm text-gray-600 font-medium space-y-1">
                            <div>현금 : {Number(rData.sales.cash || 0).toLocaleString()}원</div>
                            <div>카드 : {Number(rData.sales.card || 0).toLocaleString()}원</div>
                          </div>
                          <div className="text-2xl font-black text-gray-900">
                            {rData.totalSales.toLocaleString()}원
                          </div>
                        </div>

                        {hasShortage && (
                          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-red-800 leading-tight">
                              <span className="font-bold">요청 물품 및 남은 재고: </span>
                              <ul className="mt-1 space-y-1 list-disc list-inside">
                                {Object.entries(rData.supplies)
                                  .filter(([k, v]) => v === true && k !== 'extra')
                                  .map(([k]) => (
                                    <li key={k}>{supplyNames[k]} (현재 재고: <span className="font-bold">{rData.suppliesStock?.[k] || '미입력'}</span>)</li>
                                  ))}
                                {rData.supplies.extra && rData.supplies.extra.trim() !== '' && <li>기타: {rData.supplies.extra}</li>}
                              </ul>
                            </div>
                          </div>
                        )}

                        <button 
                          onClick={() => setExpandedReportId(expandedReportId === rData.id ? null : rData.id)}
                          className="w-full mt-3 py-2 flex items-center justify-center gap-1 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors bg-gray-50 rounded-lg"
                        >
                          {expandedReportId === rData.id ? (
                            <><ChevronUp className="w-4 h-4" /> 접기</>
                          ) : (
                            <><ChevronDown className="w-4 h-4" /> 상세 내역 확인</>
                          )}
                        </button>

                        {expandedReportId === rData.id && (
                          <div className="mt-4 pt-4 border-t border-gray-100 text-sm space-y-4">
                            
                            {/* 관리자 수정/삭제 메뉴 */}
                            <div className="flex justify-end gap-2 mb-2">
                              <button onClick={() => startEditReport(rData)} className="flex items-center gap-1 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-blue-100"><Edit2 className="w-3.5 h-3.5"/> 수정</button>
                              <button onClick={() => setDeleteConfirmId(rData.id)} className="flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-red-100"><Trash2 className="w-3.5 h-3.5"/> 삭제</button>
                            </div>

                            {uncheckedItems.length > 0 && (
                              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                                <h4 className="font-bold text-amber-800 mb-2 flex items-center gap-1">
                                  <AlertCircle className="w-4 h-4" /> 미체크 마감 항목 (확인 요망)
                                </h4>
                                <ul className="list-disc list-inside space-y-1 text-amber-700 font-medium">
                                  {uncheckedItems.map((item, idx) => (
                                    <li key={idx}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {rData.waiting && rData.waiting.hadWaiting !== null && (
                              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                <h4 className="font-bold text-blue-800 mb-2">대기 현황</h4>
                                {rData.waiting.hadWaiting ? (
                                  <div className="text-blue-700 font-medium">
                                    대기 발생: <span className="font-bold">최종 {rData.waiting.lastNumber || '입력안됨'}번</span> / 놓친 손님: <span className="font-bold">{rData.waiting.missedTeams || '0'}팀</span>
                                  </div>
                                ) : (
                                  <div className="text-blue-700">대기 인원 없었음</div>
                                )}
                              </div>
                            )}

                            {rData.inventory && (
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <h4 className="font-bold text-gray-700 mb-2">재고 파악</h4>
                                <div className="grid grid-cols-2 gap-2 text-gray-600">
                                  <div>재고: {rData.inventory.stockCount}개</div>
                                  <div>로스: {rData.inventory.loss}</div>
                                  <div>사용 쌀: {rData.inventory.usedRice}kg</div>
                                  <div>남은 쌀: {rData.inventory.leftRice}kg</div>
                                </div>
                              </div>
                            )}
                            
                            {rData.notes && (
                              <div className="bg-rose-50 p-3 rounded-lg border border-rose-100">
                                <h4 className="font-bold text-rose-800 mb-1">특이사항 및 반품</h4>
                                <p className="text-rose-700 whitespace-pre-wrap">{rData.notes}</p>
                              </div>
                            )}

                            {/* 사진 첨부 내역 표시 */}
                            {photosToDisplay.length > 0 && (
                              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-1"><ImageIcon className="w-4 h-4"/> 첨부된 사진 ({photosToDisplay.length}장)</h4>
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                  {photosToDisplay.map(([key, url]) => (
                                    <div key={key} className="flex-shrink-0 relative">
                                      <img src={url} alt={key} className="w-24 h-24 object-cover rounded-md border border-gray-300 bg-white" />
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
              
              {filteredReports.length === 0 && (
                <div className="text-center text-gray-400 py-12 bg-white rounded-2xl border border-gray-100">
                  해당 조건의 마감 보고가 없습니다.
                </div>
              )}
            </section>
          )}
        </div>

        {/* 삭제 확인 모달 */}
        {deleteConfirmId && (
          <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-sm p-6 text-center shadow-2xl">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-black text-gray-800 mb-2">보고서 삭제</h3>
              <p className="text-gray-600 mb-6 font-medium">정말 이 마감 보고서를 삭제하시겠습니까?<br/>삭제 후에는 복구할 수 없습니다.</p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 rounded-xl transition-colors">취소</button>
                <button onClick={executeDelete} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors">삭제하기</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- 일반 마감보고 폼 화면 ---
  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen font-sans pb-24 selection:bg-rose-200">
      <header className="bg-white border-b border-gray-200 px-5 py-4 sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span className="text-rose-500 cursor-pointer hover:scale-125 transition-transform active:scale-90" onClick={() => setView('login')} title="관리자 페이지">❤️</span> 
          하트뻥튀기 마감
        </h1>
      </header>

      <div className="bg-white border-b border-gray-200 shadow-sm mb-4">
        <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
            <CalendarDays className="w-4 h-4" /> {formData.date} 현황
          </span>
          <div className="flex gap-2">
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${isSangSubmitted ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>
              상행선 {isSangSubmitted ? '완료' : '미제출'}
            </div>
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${isHaSubmitted ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>
              하행선 {isHaSubmitted ? '완료' : '미제출'}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6 pt-0">
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">기본 정보</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-gray-700 font-medium">
                <User className="w-5 h-5 text-rose-400" /> 근무자
              </label>
              <div className="flex flex-col gap-2 w-1/2">
                <select value={formData.worker} onChange={(e) => setFormData({ ...formData, worker: e.target.value })} className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-rose-500 focus:border-rose-500 block p-2.5 w-full">
                  <option value="정윤이">정윤이</option>
                  <option value="황진웅">황진웅</option>
                  <option value="최윤미">최윤미</option>
                  <option value="장유미">장유미</option>
                  <option value="윤종규">윤종규</option>
                  <option value="직접입력">직접 입력</option>
                </select>
                {formData.worker === '직접입력' && (
                  <input type="text" placeholder="이름 직접 입력" value={formData.customWorker} onChange={(e) => setFormData({ ...formData, customWorker: e.target.value })} className="bg-white border border-rose-300 text-gray-900 text-sm rounded-lg focus:ring-rose-500 focus:border-rose-500 block p-2.5 w-full"/>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-gray-700 font-medium">
                <MapPin className="w-5 h-5 text-rose-400" /> 위치
              </label>
              <div className="flex gap-2">
                {['상행선', '하행선'].map((loc) => (
                  <button key={loc} onClick={() => setFormData({ ...formData, location: loc })} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${formData.location === loc ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-gray-700 font-medium">
                <Calendar className="w-5 h-5 text-rose-400" /> 날짜
              </label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-rose-500 focus:border-rose-500 block p-2.5"/>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <label className="flex items-center gap-2 text-gray-700 font-medium mb-3">
                <DollarSign className="w-5 h-5 text-rose-400" /> 매출 (마감기준) <span className="text-xs text-rose-500 font-normal">*필수</span>
              </label>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-600 w-16">현금</span>
                  <div className="relative flex-1">
                    <input type="number" placeholder="예: 200000" value={formData.sales.cash} onChange={(e) => setFormData({ ...formData, sales: { ...formData.sales, cash: e.target.value } })} className="bg-gray-50 border border-gray-200 text-gray-900 text-right rounded-lg focus:ring-rose-500 focus:border-rose-500 block w-full p-2.5 pr-8"/>
                    <span className="absolute right-3 top-2.5 text-gray-500 text-sm">원</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-600 w-16">카드</span>
                  <div className="relative flex-1">
                    <input type="number" placeholder="예: 460000" value={formData.sales.card} onChange={(e) => setFormData({ ...formData, sales: { ...formData.sales, card: e.target.value } })} className="bg-gray-50 border border-gray-200 text-gray-900 text-right rounded-lg focus:ring-rose-500 focus:border-rose-500 block w-full p-2.5 pr-8"/>
                    <span className="absolute right-3 top-2.5 text-gray-500 text-sm">원</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 mt-2 p-3 bg-rose-50 rounded-xl">
                  <span className="text-sm font-bold text-rose-700">총 매출 합계</span>
                  <span className="text-lg font-bold text-rose-700">{((Number(formData.sales.cash) || 0) + (Number(formData.sales.card) || 0)).toLocaleString()} 원</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">마감 리스트</h2>
          <div className="space-y-1">
            {Object.keys(checklistNames).map((itemKey) => (
              <button key={itemKey} onClick={() => handleChecklist(itemKey)} className="w-full flex items-center justify-between py-3 px-2 rounded-lg hover:bg-gray-50 transition-colors">
                <span className={`text-[15px] ${formData.checklist[itemKey] ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>{checklistNames[itemKey]}</span>
                {formData.checklist[itemKey] ? <CheckCircle2 className="w-6 h-6 text-rose-500" /> : <Circle className="w-6 h-6 text-gray-300" />}
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">재료 파악</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">재고 개수</label>
              <div className="relative">
                <input type="number" value={formData.inventory.stockCount} onChange={(e) => setFormData({ ...formData, inventory: { ...formData.inventory, stockCount: e.target.value } })} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 pr-8 text-sm"/>
                <span className="absolute right-3 top-2.5 text-gray-400 text-sm">개</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">사용 쌀</label>
              <div className="relative">
                <input type="number" value={formData.inventory.usedRice} onChange={(e) => setFormData({ ...formData, inventory: { ...formData.inventory, usedRice: e.target.value } })} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 pr-8 text-sm"/>
                <span className="absolute right-3 top-2.5 text-gray-400 text-sm">kg</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">남은 쌀</label>
              <div className="relative">
                <input type="number" value={formData.inventory.leftRice} onChange={(e) => setFormData({ ...formData, inventory: { ...formData.inventory, leftRice: e.target.value } })} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 pr-8 text-sm"/>
                <span className="absolute right-3 top-2.5 text-gray-400 text-sm">kg</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">로스 (Loss)</label>
              <input type="number" step="0.1" value={formData.inventory.loss} onChange={(e) => setFormData({ ...formData, inventory: { ...formData.inventory, loss: e.target.value } })} className="w-full bg-rose-50 border border-rose-200 text-rose-700 rounded-lg p-2.5 font-semibold text-sm"/>
            </div>
          </div>
        </section>

        <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <h2 className="text-sm font-bold text-gray-800">부족한 물품 체크</h2>
          </div>
          
          <div className="space-y-3">
            {[
              { id: 'breadTieShort', label: '빵끈', desc: '최소 250개 필요' },
              { id: 'plasticBagShort', label: '포장 비닐', desc: '최소 250개 필요' },
              { id: 'gloveShort', label: '위생장갑', desc: '최소 1박스 필요' },
              { id: 'earmuffShort', label: '귀마개', desc: '최소 1박스 필요' },
              { id: 'maskShort', label: '마스크', desc: '최소 1박스 필요' },
            ].map((item) => (
              <div key={item.id} className="space-y-2 border border-gray-100 rounded-xl overflow-hidden bg-white">
                <button
                  onClick={() => setFormData({ ...formData, supplies: { ...formData.supplies, [item.id]: !formData.supplies[item.id] } })}
                  className={`w-full flex items-center justify-between p-3 transition-colors ${
                    formData.supplies[item.id] ? 'bg-amber-50 text-amber-800' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-left">
                    <div className="font-medium text-sm">{item.label}</div>
                    <div className="text-xs opacity-70">{item.desc}</div>
                  </div>
                  <span className="text-sm font-bold">{formData.supplies[item.id] ? '요청됨' : '충분함'}</span>
                </button>
                
                {/* 재고 입력칸 (요청됨 상태일 때만 표시) */}
                {formData.supplies[item.id] && (
                  <div className="px-3 pb-3 bg-amber-50">
                    <div className="flex items-center bg-white rounded-lg border border-amber-200 px-3 py-2">
                      <span className="text-xs text-amber-700 font-bold whitespace-nowrap mr-2">현재 재고:</span>
                      <input 
                        type="number" 
                        placeholder="몇 개 남았나요?" 
                        value={formData.suppliesStock[item.id]} 
                        onChange={(e) => setFormData({ ...formData, suppliesStock: { ...formData.suppliesStock, [item.id]: e.target.value } })}
                        className="w-full text-sm outline-none bg-transparent"
                      />
                      <span className="text-xs text-gray-400 ml-1">개</span>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div className="pt-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">기타 부족 물품</label>
              <input type="text" placeholder="예: 물티슈, 소독제 등" value={formData.supplies.extra} onChange={(e) => setFormData({ ...formData, supplies: { ...formData.supplies, extra: e.target.value } })} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm"/>
            </div>
          </div>
        </section>

        <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider flex justify-between items-center">
            사진 첨부
            <span className="text-xs font-normal text-rose-500 bg-rose-50 px-2 py-1 rounded-full">필수</span>
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'riceBin', label: '1. 쌀통' },
              { id: 'pot', label: '2. 솥' },
              { id: 'desk', label: '3. 매대 정면' },
              { id: 'report', label: '4. 판매일보' },
              { id: 'key', label: '5. 열쇠' },
            ].map((photo) => (
              <label key={photo.id} className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 border-dashed transition-all aspect-square cursor-pointer overflow-hidden ${formData.photos[photo.id] ? 'border-rose-400 bg-rose-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoChange(photo.id, e)} />
                {formData.photos[photo.id] ? (
                  <>
                    <img src={formData.photos[photo.id]} alt="preview" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 bg-black/10"></div>
                    <CheckCircle2 className="w-8 h-8 text-white relative z-10 drop-shadow-md" />
                    <span className="text-[10px] text-white font-bold relative z-10 drop-shadow-md mt-1 bg-black/40 px-2 py-0.5 rounded-full">다시 찍기</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-6 h-6 text-gray-400 mb-2" />
                    <span className="text-[11px] font-medium text-gray-500 text-center">{photo.label}</span>
                  </>
                )}
              </label>
            ))}
          </div>
        </section>

        <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-gray-600" />
            <h2 className="text-sm font-bold text-gray-800">특이사항 및 반품 사유</h2>
          </div>
          <textarea rows="3" placeholder="실수로 4만원 결제, 기기 이상 등 전달할 내용..." value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-rose-500 focus:border-rose-500 resize-none"></textarea>
        </section>

        <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              <h2 className="text-sm font-bold text-gray-800">대기 손님 파악</h2>
            </div>
            <span className="text-xs font-normal text-rose-500 bg-rose-50 px-2 py-1 rounded-full">필수</span>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">오늘 대기가 있었나요?</label>
              <div className="flex gap-2">
                <button onClick={() => handleWaitingToggle(true)} className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-colors ${formData.waiting.hadWaiting === true ? 'bg-blue-500 border-blue-500 text-white' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>예</button>
                <button onClick={() => handleWaitingToggle(false)} className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-colors ${formData.waiting.hadWaiting === false ? 'bg-gray-700 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>아니오</button>
              </div>
            </div>

            {formData.waiting.hadWaiting === true && (
              <div className="space-y-4 pt-4 border-t border-gray-100 transition-all">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">대기번호가 몇번까지 갔나요?</label>
                  <div className="relative">
                    <input type="number" placeholder="예: 45" value={formData.waiting.lastNumber} onChange={(e) => setFormData({ ...formData, waiting: { ...formData.waiting, lastNumber: e.target.value } })} className="w-full bg-blue-50 border border-blue-200 text-blue-900 rounded-lg p-3 pr-8 text-sm focus:ring-blue-500 focus:border-blue-500"/>
                    <span className="absolute right-3 top-3 text-blue-400 font-bold text-sm">번</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">놓친 손님은 몇팀인가요?</label>
                  <div className="relative">
                    <input type="number" placeholder="예: 3" value={formData.waiting.missedTeams} onChange={(e) => setFormData({ ...formData, waiting: { ...formData.waiting, missedTeams: e.target.value } })} className="w-full bg-blue-50 border border-blue-200 text-blue-900 rounded-lg p-3 pr-8 text-sm focus:ring-blue-500 focus:border-blue-500"/>
                    <span className="absolute right-3 top-3 text-blue-400 font-bold text-sm">팀</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 p-4 pb-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button onClick={submitReport} className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold text-lg py-4 rounded-xl shadow-md transition-transform active:scale-[0.98]">마감 보고 제출하기</button>
      </div>

      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 text-center shadow-2xl transform transition-all duration-200">
            <div className="bg-rose-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-10 h-10 text-rose-500" />
            </div>
            <h3 className="text-2xl font-black text-gray-800 mb-2">제출 완료!</h3>
            <p className="text-gray-600 mb-8 font-medium">오늘 하루도 정말 고생 많으셨습니다.<br/>조심히 들어가세요!</p>
            <button onClick={closeAndResetForm} className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold text-lg py-4 rounded-xl transition-colors">확인 (초기화)</button>
          </div>
        </div>
      )}

      {alertMessage && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 text-center shadow-2xl transform transition-all duration-200">
            <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-xl font-black text-gray-800 mb-2">안내</h3>
            <p className="text-gray-600 mb-6 font-medium whitespace-pre-wrap leading-relaxed">{alertMessage}</p>
            <button onClick={() => setAlertMessage('')} className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold text-lg py-4 rounded-xl transition-colors">확인</button>
          </div>
        </div>
      )}
    </div>
  );
}