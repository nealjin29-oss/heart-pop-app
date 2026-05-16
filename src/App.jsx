import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Camera, CheckCircle2, Circle, MapPin, Calendar, DollarSign, AlertCircle, FileText, User, Lock, Download, Image as ImageIcon, BarChart3, Users, LogOut, ChevronDown, ChevronUp, X, ChevronLeft, ChevronRight, CalendarDays, List, HelpCircle, Edit2, Trash2, Save, Maximize2, Loader2, FileSpreadsheet, TrendingUp, Menu, MessageSquare, BookOpen, Clock, Power, Key, Thermometer, Droplets, Wind, Package, Trash, Shirt, Box, Play, Layers, PiggyBank, CreditCard, Coins, ShoppingCart, Percent, UserPlus, UserMinus, PlusCircle, MinusCircle, History } from 'lucide-react';

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

// --- Helper Functions for Formatting ---
const formatComma = (val) => {
  if (!val && val !== 0) return '';
  const num = val.toString().replace(/[^0-9]/g, '');
  return num ? Number(num).toLocaleString() : '';
};

const parseComma = (val) => {
  return val.toString().replace(/[^0-9]/g, '');
};

// 고정 매니저 리스트
const managerList = ['정윤이', '황진웅', '최윤미', '장유미', '윤종규'];

// 매니저별 은은한 배경색 리스트
const managerColorMap = {
  '정윤이': 'bg-rose-100 text-rose-700 border-rose-200',
  '황진웅': 'bg-blue-100 text-blue-700 border-blue-200',
  '최윤미': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  '장유미': 'bg-purple-100 text-purple-700 border-purple-200',
  '윤종규': 'bg-amber-100 text-amber-700 border-amber-200',
  'default': 'bg-gray-100 text-gray-700 border-gray-200'
};

const dynamicColors = [
  'bg-cyan-100 text-cyan-700 border-cyan-200',
  'bg-indigo-100 text-indigo-700 border-indigo-200',
  'bg-orange-100 text-orange-700 border-orange-200',
  'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
  'bg-lime-100 text-lime-700 border-lime-200'
];

// 이름에 따른 고유 색상 배정 함수
const getManagerColor = (name) => {
  if (managerColorMap[name]) return managerColorMap[name];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return dynamicColors[hash % dynamicColors.length];
};

const checklistNames = {
  readyCash: '영업준비금 10만원 확인',
  changeEnough: '5천원권 충분'
};

const photoNames = {
  riceBin: '쌀통',
  pot: '솥',
  desk: '매대 정면',
  report: '판매일보',
  key: '열쇠'
};

const inventoryTypeNames = {
  rice: '뻥쌀',
  tie: '빵끈',
  bag: '포장 비닐'
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
  const [isAdmin, setIsAdmin] = useState(false); 
  const [reports, setReports] = useState([]);
  const [qnas, setQnas] = useState([]); 
  const [holidays, setHolidays] = useState([]);
  const [schedules, setSchedules] = useState({});
  const [dbManagers, setDbManagers] = useState([]); 
  const [deletedDefaults, setDeletedDefaults] = useState([]); 
  
  // 재고 관리 상태 
  const [inventoryLogs, setInventoryLogs] = useState([]);
  const [adjustType, setAdjustType] = useState('rice');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustPrice, setAdjustPrice] = useState(''); 
  const [editLogId, setEditLogId] = useState(null);
  const [editLogData, setEditLogData] = useState(null);

  const [view, setView] = useState('form'); 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [adminPwd, setAdminPwd] = useState('');
  const [filterType, setFilterType] = useState('ALL'); 
  const [filterValue, setFilterValue] = useState('');
  const [expandedReportId, setExpandedReportId] = useState(null);
  const [adminViewMode, setAdminViewMode] = useState('calendar'); 
  const [calendarDate, setCalendarDate] = useState(new Date()); 
  const [editReportId, setEditReportId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState(''); 
  const [isUploading, setIsUploading] = useState(false); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [scheduleSelection, setScheduleSelection] = useState(null); 
  const [scheduleWage, setScheduleWage] = useState(''); 
  const [customScheduleWorker, setCustomScheduleWorker] = useState('');
  const [newManagerName, setNewManagerName] = useState('');
  
  // Q&A 폼용 상태
  const [qnaQuestion, setQnaQuestion] = useState('');
  const [qnaAuthor, setQnaAuthor] = useState('정윤이');
  const [qnaReplyId, setQnaReplyId] = useState(null);
  const [qnaReplyContent, setQnaReplyContent] = useState('');

  const [openChecks, setOpenChecks] = useState({});
  const [closeChecks, setCloseChecks] = useState({});

  const [formData, setFormData] = useState({
    location: '상행선',
    date: getTodayString(), 
    worker: '정윤이',
    customWorker: '',
    sales: { cash: '', card: '' },
    checklist: { readyCash: false, changeEnough: false },
    inventory: { 
      stockCount: '', 
      usedRice: '', 
      loss: '', 
      leftRice: '', 
      riceStatus: null, 
      bagStatus: null,
      tieStatus: null,
      otherSupplies: ''
    },
    photos: { riceBin: null, pot: null, desk: null, report: null, key: null },
    notes: '',
    waiting: { hadWaiting: null, lastNumber: '', missedTeams: '' }
  });

  // 활성화된 기본 매니저 (삭제되지 않은 매니저만)
  const activeDefaults = useMemo(() => {
    return managerList.filter(m => !deletedDefaults.includes(m));
  }, [deletedDefaults]);

  // 통합 매니저 리스트 (활성 기본 + DB 추가)
  const allManagers = useMemo(() => {
    return [...new Set([...activeDefaults, ...dbManagers.map(m => m.name)])];
  }, [activeDefaults, dbManagers]);

  // Q&A 작성자 기본값을 로드된 매니저의 첫번째로 설정
  useEffect(() => {
    if (allManagers.length > 0 && (!qnaAuthor || !allManagers.includes(qnaAuthor))) {
      setQnaAuthor(allManagers[0]);
    }
  }, [allManagers]);

  // --- Authentication ---
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

  useEffect(() => {
    if (view !== 'manual_open') setOpenChecks({});
    if (view !== 'manual_close') setCloseChecks({});
  }, [view]);

  // --- Data Subscription ---
  useEffect(() => {
    if (!user) return;
    const reportsRef = collection(db, 'artifacts', appId, 'public', 'data', 'reports');
    const qnaRef = collection(db, 'artifacts', appId, 'public', 'data', 'qna');
    const holidaysRef = collection(db, 'artifacts', appId, 'public', 'data', 'holidays');
    const schedulesRef = collection(db, 'artifacts', appId, 'public', 'data', 'schedules');
    const managersRef = collection(db, 'artifacts', appId, 'public', 'data', 'managers');
    const inventoryLogsRef = collection(db, 'artifacts', appId, 'public', 'data', 'inventoryLogs');
    const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'managerSettings');
    
    const unsubReports = onSnapshot(reportsRef, (snapshot) => {
      const fetched = [];
      snapshot.forEach((doc) => fetched.push({ id: doc.id, ...doc.data() }));
      fetched.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setReports(fetched);
    }, (err) => console.error(err));

    const unsubQna = onSnapshot(qnaRef, (snapshot) => {
      const fetched = [];
      snapshot.forEach((doc) => fetched.push({ id: doc.id, ...doc.data() }));
      fetched.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setQnas(fetched);
    }, (err) => console.error(err));

    const unsubHolidays = onSnapshot(holidaysRef, (snapshot) => {
      const fetched = [];
      snapshot.forEach((doc) => fetched.push(doc.id));
      setHolidays(fetched);
    }, (err) => console.error(err));

    const unsubSchedules = onSnapshot(schedulesRef, (snapshot) => {
      const fetched = {};
      snapshot.forEach((doc) => {
         const data = doc.data();
         fetched[doc.id] = {
            manager: data.manager,
            wage: data.wage || 0
         };
      });
      setSchedules(fetched);
    }, (err) => console.error(err));

    const unsubManagers = onSnapshot(managersRef, (snapshot) => {
      const fetched = [];
      snapshot.forEach(doc => fetched.push({ id: doc.id, name: doc.data().name }));
      setDbManagers(fetched);
    }, (err) => console.error(err));

    const unsubInventoryLogs = onSnapshot(inventoryLogsRef, (snapshot) => {
      const fetched = [];
      snapshot.forEach(doc => fetched.push({ id: doc.id, ...doc.data() }));
      fetched.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setInventoryLogs(fetched);
    }, (err) => console.error(err));

    const unsubSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        setDeletedDefaults(docSnap.data().deletedDefaults || []);
      }
    }, (err) => console.error(err));

    return () => { unsubReports(); unsubQna(); unsubHolidays(); unsubSchedules(); unsubManagers(); unsubInventoryLogs(); unsubSettings(); };
  }, [user]);

  // --- Handlers ---
  const handleChecklist = (key) => {
    setFormData(prev => ({ ...prev, checklist: { ...prev.checklist, [key]: !prev.checklist[key] } }));
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
    if (holidays.includes(formData.date)) {
      return setAlertMessage("해당 일자는 휴무일로 설정되어 리포트를 제출할 수 없습니다.");
    }
    if (!formData.sales.cash || !formData.sales.card) return setAlertMessage("현금/카드 매출을 모두 입력해 주세요.");
    
    if (!user) return setAlertMessage("인증 중입니다. 잠시만 기다려 주세요.");
    setIsSubmitting(true);
    
    const cashVal = Number(parseComma(formData.sales.cash)) || 0;
    const cardVal = Number(parseComma(formData.sales.card)) || 0;
    const total = cashVal + cardVal;
    const finalWorker = formData.worker;

    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'reports', Date.now().toString()), {
        ...formData, 
        worker: finalWorker,
        sales: { cash: cashVal, card: cardVal },
        totalSales: total, 
        timestamp: new Date().toISOString()
      });
      setShowSubmitModal(true);
    } catch (e) { setAlertMessage("제출 실패: " + e.message); } finally { setIsSubmitting(false); }
  };

  const submitQna = async () => {
    if (!qnaQuestion.trim() || !user) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'qna'), {
        author: qnaAuthor || '정윤이', 
        question: qnaQuestion, 
        answer: null, 
        timestamp: new Date().toISOString(), 
        date: getTodayString()
      });
      setQnaQuestion('');
      setAlertMessage("질문이 성공적으로 등록되었습니다.");
    } catch (e) { setAlertMessage("등록 실패: " + e.message); }
  };

  const submitQnaReply = async (id) => {
    if (!qnaReplyContent.trim() || !user) return;
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'qna', id), { answer: qnaReplyContent }, { merge: true });
      setQnaReplyId(null);
      setQnaReplyContent('');
      setAlertMessage("답변이 등록되었습니다.");
    } catch (e) { setAlertMessage("답변 실패: " + e.message); }
  };

  const toggleHoliday = async (dateStr) => {
    if (!user) return;
    try {
      if (holidays.includes(dateStr)) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'holidays', dateStr));
      } else {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'holidays', dateStr), { isHoliday: true });
      }
    } catch (e) { setAlertMessage("휴무 설정 오류: " + e.message); }
  };

  const assignWorkerToSchedule = async (manager) => {
    if (!user || !scheduleSelection) return;
    const { date, location } = scheduleSelection;
    const docId = `${date}_${location}`;
    const finalManager = manager;
    const wage = Number(parseComma(scheduleWage)) || 0;

    try {
      if (manager === 'CLEAR') {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'schedules', docId));
      } else {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'schedules', docId), { manager: finalManager, wage: wage });
      }
      setScheduleSelection(null);
      setScheduleWage('');
    } catch (e) { setAlertMessage("배정 실패: " + e.message); }
  };

  const executeDelete = async (id) => {
    if (!user) return;
    try {
      let col = 'reports';
      if (view === 'qna') col = 'qna';
      if (adminViewMode === 'inventory' && view === 'admin') col = 'inventoryLogs';

      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', col, id));
      setDeleteConfirmId(null);
    } catch (e) { setAlertMessage("삭제 오류: " + e.message); }
  };

  const startEdit = (report) => {
    setEditReportId(report.id);
    setEditData({ ...report });
  };

  const saveEdit = async () => {
    if (!user || !editData) return;
    const cashVal = Number(parseComma(editData.sales.cash)) || 0;
    const cardVal = Number(parseComma(editData.sales.card)) || 0;
    const total = cashVal + cardVal;
    
    const id = editData.id;
    const updated = { ...editData, sales: { cash: cashVal, card: cardVal }, totalSales: total };
    delete updated.id;
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'reports', id), updated);
      setEditReportId(null);
      setEditData(null);
      setAlertMessage("리포트가 성공적으로 수정되었습니다.");
    } catch (e) { setAlertMessage("저장 오류: " + e.message); }
  };

  const toggleOpenManualCheck = (id) => setOpenChecks(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleCloseManualCheck = (id) => setCloseChecks(prev => ({ ...prev, [id]: !prev[id] }));

  // --- Custom Manager Handlers ---
  const handleAddManager = async () => {
    if (!newManagerName.trim() || !user) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'managers'), { name: newManagerName.trim(), timestamp: serverTimestamp() });
      setNewManagerName('');
    } catch (e) { setAlertMessage("추가 실패: " + e.message); }
  };

  const handleRemoveManager = async (id) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'managers', id));
    } catch (e) { setAlertMessage("삭제 실패: " + e.message); }
  };

  const handleRemoveDefaultManager = async (name) => {
    if (!user) return;
    try {
      const newDeleted = [...deletedDefaults, name];
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'managerSettings'), { deletedDefaults: newDeleted }, { merge: true });
    } catch (e) { setAlertMessage("기본 매니저 삭제 실패: " + e.message); }
  };

  // --- Inventory Adjust Handler (Log Based) ---
  const handleAdjustInventory = async (isAdd) => {
    if (!user || !adjustAmount) return;
    const amount = Number(adjustAmount);
    const price = Number(parseComma(adjustPrice)) || 0;

    if (isNaN(amount) || amount <= 0) return setAlertMessage("올바른 수량을 입력하세요.");

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'inventoryLogs'), {
        type: adjustType,
        action: isAdd ? 'add' : 'remove',
        amount: amount,
        price: price,
        date: getTodayString(),
        timestamp: new Date().toISOString()
      });
      setAdjustAmount('');
      setAdjustPrice('');
      setAlertMessage(`성공적으로 재고가 ${isAdd ? '입고' : '출고'} 기록되었습니다.`);
    } catch (e) {
      setAlertMessage("재고 반영 실패: " + e.message);
    }
  };

  const startEditLog = (log) => {
    setEditLogId(log.id);
    setEditLogData({ ...log, priceStr: formatComma(log.price || 0) });
  };

  const saveLogEdit = async () => {
    if (!user || !editLogData) return;
    const price = Number(parseComma(editLogData.priceStr)) || 0;
    const amount = Number(editLogData.amount) || 0;
    
    if (isNaN(amount) || amount <= 0) return setAlertMessage("올바른 수량을 입력하세요.");

    const updated = { ...editLogData, amount, price };
    delete updated.priceStr;
    delete updated.id;

    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'inventoryLogs', editLogId), updated);
      setEditLogId(null);
      setEditLogData(null);
      setAlertMessage("기록이 성공적으로 수정되었습니다.");
    } catch (e) {
      setAlertMessage("수정 오류: " + e.message);
    }
  };

  // --- Statistics & Inventory Calculations ---
  const inventoryTotals = useMemo(() => {
    let rice = 0, tie = 0, bag = 0, totalSpent = 0;
    let riceSpent = 0, tieSpent = 0, bagSpent = 0;

    inventoryLogs.forEach(log => {
      const mult = log.action === 'add' ? 1 : -1;
      if (log.type === 'rice') rice += log.amount * mult;
      if (log.type === 'tie') tie += log.amount * mult;
      if (log.type === 'bag') bag += log.amount * mult;

      const price = Number(log.price) || 0;
      if (log.action === 'add') {
        totalSpent += price;
        if (log.type === 'rice') riceSpent += price;
        if (log.type === 'tie') tieSpent += price;
        if (log.type === 'bag') bagSpent += price;
      } else if (log.action === 'remove') {
        totalSpent -= price;
        if (log.type === 'rice') riceSpent -= price;
        if (log.type === 'tie') tieSpent -= price;
        if (log.type === 'bag') bagSpent -= price;
      }
    });
    return { rice, tie, bag, totalSpent, riceSpent, tieSpent, bagSpent };
  }, [inventoryLogs]);

  const currentStock = useMemo(() => {
    let usedRice = 0;
    let usedTieAndBag = 0;
    
    reports.forEach(r => {
      usedRice += Number(r.inventory?.usedRice || 0);
      const sales = Number(r.totalSales || 0);
      usedTieAndBag += Math.floor(sales / 5000);
    });

    return {
      riceKg: inventoryTotals.rice - usedRice,
      tie: inventoryTotals.tie - usedTieAndBag,
      bag: inventoryTotals.bag - usedTieAndBag,
      totalSpent: inventoryTotals.totalSpent,
      riceSpent: inventoryTotals.riceSpent,
      tieSpent: inventoryTotals.tieSpent,
      bagSpent: inventoryTotals.bagSpent
    };
  }, [reports, inventoryTotals]);

  const dailyStatus = useMemo(() => {
    const today = formData.date;
    return {
      상행선: reports.some(r => r.date === today && r.location === '상행선') ? '제출완료' : '미제출',
      하행선: reports.some(r => r.date === today && r.location === '하행선') ? '제출완료' : '미제출'
    };
  }, [reports, formData.date]);

  const allTimeStats = useMemo(() => {
    const total = reports.reduce((s, r) => s + (Number(r.totalSales) || 0), 0);
    const cash = reports.reduce((s, r) => s + (Number(r.sales?.cash) || 0), 0);
    const card = reports.reduce((s, r) => s + (Number(r.sales?.card) || 0), 0);
    const sang = reports.filter(r => r.location === '상행선').reduce((s, r) => s + (Number(r.totalSales) || 0), 0);
    const ha = reports.filter(r => r.location === '하행선').reduce((s, r) => s + (Number(r.totalSales) || 0), 0);
    const commission = total * 0.4;
    const profit = total * 0.6; 
    return { total, cash, card, sang, ha, commission, profit };
  }, [reports]);

  const monthlyStats = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const mReports = reports.filter(r => { const d = new Date(r.date); return d.getFullYear() === year && d.getMonth() === month; });
    
    const dailyMap = {};
    mReports.forEach(r => {
      if (!dailyMap[r.date]) dailyMap[r.date] = 0;
      dailyMap[r.date] += (Number(r.totalSales) || 0);
    });

    let validDays = Object.keys(dailyMap).filter(date => !holidays.includes(date) && dailyMap[date] > 0);
    let maxDay = null;
    let minDay = null;

    if (validDays.length > 0) {
      validDays.sort((a, b) => dailyMap[b] - dailyMap[a]); 
      maxDay = { date: validDays[0], sales: dailyMap[validDays[0]] };
      minDay = { date: validDays[validDays.length - 1], sales: dailyMap[validDays[validDays.length - 1]] };
    }

    const total = mReports.reduce((s, r) => s + (Number(r.totalSales) || 0), 0);
    const profit = total * 0.6; 
    const sang = mReports.filter(r => r.location === '상행선').reduce((s, r) => s + (Number(r.totalSales) || 0), 0);
    const ha = mReports.filter(r => r.location === '하행선').reduce((s, r) => s + (Number(r.totalSales) || 0), 0);
    const cash = mReports.reduce((s, r) => s + (Number(r.sales?.cash) || 0), 0);
    const card = mReports.reduce((s, r) => s + (Number(r.sales?.card) || 0), 0);
    const cashPercent = total > 0 ? Math.round((cash / total) * 100) : 0;
    const cardPercent = total > 0 ? Math.round((card / total) * 100) : 0;
    const totalRice = mReports.reduce((s, r) => s + (Number(r.inventory?.usedRice) || 0), 0);
    
    const uniqueDaysCount = new Set(mReports.map(r => r.date)).size;
    const monthHolidaysCount = holidays.filter(h => {
      const d = new Date(h);
      return d.getFullYear() === year && d.getMonth() === month;
    }).length;

    const avgRicePerDay = uniqueDaysCount > 0 ? (totalRice / uniqueDaysCount).toFixed(1) : 0;
    const cumulativeRiceCost = totalRice * 2500;
    
    const expectedSales = totalRice * 42735;
    const lossAmount = expectedSales - total;
    const avgDailySales = uniqueDaysCount > 0 ? Math.round(total / uniqueDaysCount) : 0;
    const targetDifference = avgDailySales - 1900000;
    
    return { total, profit, sang, ha, cash, card, cashPercent, cardPercent, avgRicePerDay, cumulativeRiceCost, workingDays: uniqueDaysCount, holidayCount: monthHolidaysCount, maxDay, minDay, expectedSales, lossAmount, avgDailySales, targetDifference };
  }, [reports, calendarDate, holidays]);

  const filteredReports = useMemo(() => {
    let result = [...reports];
    if (filterType === 'LOCATION') {
      result = reports.filter(r => r.location === filterValue);
    } else if (filterType === 'WORKER') {
      result = reports.filter(r => r.worker === filterValue);
    }
    return result;
  }, [reports, filterType, filterValue]);

  // 스케쥴 및 급여 통합 계산 로직 (4대보험 및 식대 포함) - 업데이트된 기준 반영
  const scheduleStats = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const managerMonthlyStats = {};
    let grandTotalWage = 0;
    let grandTotalMeal = 0;
    let grandTotalInsurance = 0;

    const FULL_INSURANCE_RATE = 0.0965; // 사업주 부담분 약 9.65% (4대보험 전면)
    const PARTIAL_INSURANCE_RATE = 0.0215; // 사업주 부담분 약 2.15% (고용/산재만)
    const MEAL_ALLOWANCE = 9900;

    Object.entries(schedules).forEach(([key, data]) => {
      const [dateStr, loc] = key.split('_');
      const d = new Date(dateStr);
      if (d.getFullYear() === year && d.getMonth() === month && !holidays.includes(dateStr)) {
        if (!managerMonthlyStats[data.manager]) {
          managerMonthlyStats[data.manager] = { totalDays: 0, totalWage: 0, sangDays: 0, sangWage: 0, haDays: 0, haWage: 0, weeklyDays: {} };
        }
        managerMonthlyStats[data.manager].totalDays += 1;
        managerMonthlyStats[data.manager].totalWage += (data.wage || 0);

        // Calculate Week Number for "주 15시간(주 2일) 이상" check
        const wYear = d.getFullYear();
        const wNum = Math.ceil(((d - new Date(wYear, 0, 1)) / 86400000 + new Date(wYear, 0, 1).getDay() + 1) / 7);
        const weekKey = `${wYear}-W${wNum}`;
        managerMonthlyStats[data.manager].weeklyDays[weekKey] = (managerMonthlyStats[data.manager].weeklyDays[weekKey] || 0) + 1;

        if (loc === '상행선') {
          managerMonthlyStats[data.manager].sangDays += 1;
          managerMonthlyStats[data.manager].sangWage += (data.wage || 0);
        } else if (loc === '하행선') {
          managerMonthlyStats[data.manager].haDays += 1;
          managerMonthlyStats[data.manager].haWage += (data.wage || 0);
        }
      }
    });

    Object.values(managerMonthlyStats).forEach(stats => {
      stats.totalHours = stats.totalDays * 10;
      
      // 한 주라도 2일 이상(20시간) 근무한 적이 있는지 여부
      stats.isOver15hPerWeek = Object.values(stats.weeklyDays).some(c => c >= 2);
      // 월 전체 60시간(6일) 이상 근무 여부
      stats.isOver60hPerMonth = stats.totalHours >= 60;

      if (stats.isOver15hPerWeek || stats.isOver60hPerMonth) {
        stats.insuranceType = 'FULL';
        stats.insuranceRate = FULL_INSURANCE_RATE;
      } else {
        stats.insuranceType = 'PARTIAL';
        stats.insuranceRate = PARTIAL_INSURANCE_RATE;
      }

      stats.totalMeal = stats.totalDays * MEAL_ALLOWANCE;
      stats.totalInsurance = Math.round(stats.totalWage * stats.insuranceRate);
      stats.totalCost = stats.totalWage + stats.totalMeal + stats.totalInsurance;

      grandTotalWage += stats.totalWage;
      grandTotalMeal += stats.totalMeal;
      grandTotalInsurance += stats.totalInsurance;
    });

    return {
      managerMonthlyStats,
      grandTotalWage,
      grandTotalMeal,
      grandTotalInsurance,
      grandTotalLaborCost: grandTotalWage + grandTotalMeal + grandTotalInsurance,
      FULL_INSURANCE_RATE,
      PARTIAL_INSURANCE_RATE,
      MEAL_ALLOWANCE
    };
  }, [schedules, calendarDate, holidays]);

  const downloadCSV = () => {
    const headers = ['일자', '위치', '매니저', '총매출', '현금', '카드', '사용한쌀(kg)', '로스(kg)', '재고(개)', '특이사항'];
    const rows = filteredReports.map(r => [
      r.date, r.location, r.worker, r.totalSales, r.sales?.cash, r.sales?.card, 
      r.inventory?.usedRice, r.inventory?.loss || 0, r.inventory?.stockCount, 
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
      const dayReports = reports.filter(r => r.date === dStr);
      const sangSales = dayReports.filter(r => r.location === '상행선').reduce((s, r) => s + (Number(r.totalSales)||0), 0);
      const haSales = dayReports.filter(r => r.location === '하행선').reduce((s, r) => s + (Number(r.totalSales)||0), 0);
      const sales = sangSales + haSales;
      const isHoliday = holidays.includes(dStr);
      
      days.push(
        <div 
          key={d} 
          onClick={() => toggleHoliday(dStr)}
          className={`p-1.5 border border-gray-200 min-h-[90px] flex flex-col rounded-lg cursor-pointer transition-all hover:scale-[1.03] ${dStr === getTodayString() ? 'bg-rose-50 border-rose-300' : isHoliday ? 'bg-gray-100 border-gray-300' : 'bg-white'}`}
        >
          <span className={`text-xs font-black ${isHoliday ? 'text-gray-400' : 'text-gray-500'}`}>{d}</span>
          {isHoliday && <span className="text-[10px] font-black text-gray-400 mt-1 uppercase tracking-tighter text-center">휴무</span>}
          {!isHoliday && (sangSales > 0 || haSales > 0) && (
            <div className="mt-auto flex flex-col items-end space-y-[2px] pt-1">
              {sangSales > 0 && <span className="text-[8px] font-black text-red-600 leading-none">상:{formatComma(sangSales)}</span>}
              {haSales > 0 && <span className="text-[8px] font-black text-blue-600 leading-none">하:{formatComma(haSales)}</span>}
              <span className="text-[9px] font-black text-gray-900 border-t border-gray-200 pt-[2px] mt-[2px] w-full text-right leading-none">합:{formatComma(sales)}</span>
            </div>
          )}
        </div>
      );
    }
    return days;
  };

  const renderScheduleCalendar = (location) => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${location}-${i}`} className="p-2"></div>);
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const isHoliday = holidays.includes(dStr);
      const scheduleData = schedules[`${dStr}_${location}`];
      const assignedManager = scheduleData?.manager;
      const assignedWage = scheduleData?.wage || 0;
      const isToday = dStr === getTodayString();
      
      days.push(
        <div 
          key={d} 
          onClick={() => {
             if (!isHoliday) {
                setScheduleSelection({ date: dStr, location });
                setScheduleWage(scheduleData && scheduleData.wage ? String(scheduleData.wage) : '');
             }
          }}
          className={`p-1 border min-h-[70px] flex flex-col rounded-lg transition-all ${isToday ? 'border-red-500 border-2' : 'border-gray-200'} ${isHoliday ? 'bg-gray-50 border-gray-100 cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-gray-900 bg-white active:scale-95'}`}
        >
          <span className={`text-xs font-black ${isToday ? 'text-red-500' : isHoliday ? 'text-gray-300' : 'text-gray-400'}`}>{d}</span>
          {isHoliday && (
             <div className="mt-auto bg-gray-200 text-gray-400 p-1 rounded text-center text-[10px] font-black font-sans uppercase">휴무</div>
          )}
          {!isHoliday && assignedManager && (
            <div className={`mt-auto px-0 py-[2px] rounded text-center text-[9px] font-black animate-in fade-in zoom-in font-sans border whitespace-nowrap overflow-hidden text-ellipsis tracking-tighter flex flex-col ${getManagerColor(assignedManager)}`}>
              <span>{assignedManager}</span>
              {assignedWage > 0 && <span className="text-[7px] border-t border-black/10 pt-[1px] mt-[1px] opacity-80">{formatComma(assignedWage)}원</span>}
            </div>
          )}
        </div>
      );
    }
    return days;
  };

  const NavigationMenu = () => (
    <div className={`fixed inset-0 z-50 flex transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
      <div className={`relative w-64 bg-white h-full shadow-2xl transition-transform duration-300 transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b-4 border-gray-900 bg-rose-600 text-white font-black">
          <h2 className="font-black text-xl flex items-center gap-2">❤️ 하트메뉴</h2>
        </div>
        <div className="p-4 space-y-2">
          <button onClick={() => { setView('form'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 p-4 rounded-2xl font-black transition-all ${view === 'form' ? 'bg-rose-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}>
            <FileText size={20}/> 업무공유 리포트
          </button>
          <button onClick={() => { setView('qna'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 p-4 rounded-2xl font-black transition-all ${view === 'qna' ? 'bg-rose-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}>
            <HelpCircle size={20}/> 질문과 답변 (Q&A)
          </button>
          <div className="pt-4 pb-2 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans font-black">Manuals</div>
          <button onClick={() => { setView('manual_open'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 p-4 rounded-2xl font-black transition-all ${view === 'manual_open' ? 'bg-rose-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}>
            <BookOpen size={20}/> 오픈 매뉴얼
          </button>
          <button onClick={() => { setView('manual_close'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 p-4 rounded-2xl font-black transition-all ${view === 'manual_close' ? 'bg-rose-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}>
            <Clock size={20}/> 마감 매뉴얼
          </button>
          <div className="pt-8 mt-8 border-t-2 border-gray-100">
            <button onClick={() => { setView('login'); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 p-4 rounded-2xl font-black text-gray-400 hover:text-gray-900 transition-all font-black">
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
        <div className="max-w-md mx-auto min-h-screen flex items-center justify-center p-4 bg-white font-sans font-black">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full border-2 border-gray-900 text-center font-black">
            <h2 className="text-2xl font-black mb-8 text-gray-900">관리자 보안 접속</h2>
            <form onSubmit={(e) => { e.preventDefault(); if (adminPwd === '940329') { setView('admin'); setIsAdmin(true); setAdminPwd(''); } else setAlertMessage('인증 암호가 일치하지 않습니다.'); }} className="space-y-6">
              <input type="password" autoFocus value={adminPwd} onChange={e=>setAdminPwd(e.target.value)} className="w-full p-5 bg-gray-100 rounded-xl border-none outline-none text-center text-3xl font-black focus:ring-4 ring-rose-500 text-gray-900 shadow-inner" placeholder="••••••" />
              <button type="submit" className="w-full bg-gray-900 text-white py-5 rounded-xl font-black text-xl active:scale-95 transition-transform font-black">인증하기</button>
            </form>
            <button onClick={()=>setView('form')} className="mt-6 text-gray-900 font-bold text-sm underline font-black">돌아가기</button>
          </div>
        </div>
      );
    }

    if (view === 'admin') {
      return (
        <div className="max-w-4xl mx-auto bg-white min-h-screen pb-32 font-sans font-black">
          <header className="bg-white p-6 sticky top-0 z-30 border-b-4 border-gray-900 flex justify-between items-center shadow-lg font-black font-black">
            <h1 className="font-black text-xl flex items-center gap-2 text-gray-900"><BarChart3 className="text-rose-600"/> 하트뻥튀기 (처인휴게소)</h1>
            <button onClick={()=>{setView('form'); setIsAdmin(false);}} className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><LogOut size={24} className="text-gray-900"/></button>
          </header>
          <div className="p-4 space-y-8 font-black font-black">
            <div className="bg-white p-6 rounded-[40px] border-4 border-gray-900 shadow-xl space-y-6 animate-in slide-in-from-top-4 font-black">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <div className="space-y-1">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest font-sans font-black">월간 누적 매출</h3>
                    <p className="text-5xl font-black text-rose-600 tracking-tight leading-none">{monthlyStats.total.toLocaleString()}원</p>
                    <p className="text-sm font-black text-gray-400 mt-2 font-sans tracking-tight">💰 정산 예정 금액 (60%): {(monthlyStats.total * 0.6).toLocaleString()}원</p>
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
              <div className="grid grid-cols-2 gap-4 pt-2">
                 <div className="bg-gray-50 p-5 rounded-3xl border-2 border-gray-200 shadow-sm">
                    <h4 className="text-[10px] font-black text-gray-400 mb-1 uppercase tracking-tighter">현금 누적 ({monthlyStats.cashPercent}%)</h4>
                    <p className="text-2xl font-black text-gray-700">{monthlyStats.cash.toLocaleString()}원</p>
                 </div>
                 <div className="bg-gray-50 p-5 rounded-3xl border-2 border-gray-200 shadow-sm">
                    <h4 className="text-[10px] font-black text-gray-400 mb-1 uppercase tracking-tighter">카드 누적 ({monthlyStats.cardPercent}%)</h4>
                    <p className="text-2xl font-black text-gray-700">{monthlyStats.card.toLocaleString()}원</p>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t-2 border-dashed border-gray-100">
                 <div className="bg-emerald-50 p-5 rounded-3xl border-2 border-emerald-200 shadow-sm">
                    <h4 className="text-[10px] font-black text-emerald-400 mb-1 uppercase tracking-tighter">1일 평균 쌀 사용량</h4>
                    <p className="text-2xl font-black text-emerald-700">{monthlyStats.avgRicePerDay}kg</p>
                 </div>
                 <div className="bg-emerald-50 p-5 rounded-3xl border-2 border-emerald-200 shadow-sm">
                    <h4 className="text-[10px] font-black text-emerald-400 mb-1 uppercase tracking-tighter">누적 쌀 금액 (환산)</h4>
                    <p className="text-2xl font-black text-emerald-700">{Number(monthlyStats.cumulativeRiceCost).toLocaleString()}원</p>
                 </div>
              </div>
              
              {/* 기대 매출 및 로스/시식 환산액 */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t-2 border-dashed border-gray-100">
                 <div className="bg-purple-50 p-5 rounded-3xl border-2 border-purple-200 shadow-sm">
                    <h4 className="text-[10px] font-black text-purple-400 mb-1 uppercase tracking-tighter">기대 매출 (쌀 기준)</h4>
                    <p className="text-2xl font-black text-purple-700">{monthlyStats.expectedSales.toLocaleString()}원</p>
                 </div>
                 <div className="bg-amber-50 p-5 rounded-3xl border-2 border-amber-200 shadow-sm">
                    <h4 className="text-[10px] font-black text-amber-400 mb-1 uppercase tracking-tighter">로스+시식 환산액</h4>
                    <p className="text-2xl font-black text-amber-700">{monthlyStats.lossAmount.toLocaleString()}원</p>
                 </div>
              </div>
            </div>

            <div className="flex flex-wrap bg-gray-100 p-2 rounded-[32px] border-2 border-gray-200 font-black">
              <button onClick={()=>setAdminViewMode('calendar')} className={`flex-1 min-w-[80px] py-4 rounded-2xl text-sm font-black transition-all ${adminViewMode==='calendar'?'bg-white shadow-xl text-gray-900':'text-gray-500'}`}>집계 달력</button>
              <button onClick={()=>setAdminViewMode('list')} className={`flex-1 min-w-[80px] py-4 rounded-2xl text-sm font-black transition-all ${adminViewMode==='list'?'bg-white shadow-xl text-gray-900':'text-gray-500'}`}>리포트 목록</button>
              <button onClick={()=>setAdminViewMode('labor')} className={`flex-1 min-w-[80px] py-4 rounded-2xl text-sm font-black transition-all ${adminViewMode==='labor'?'bg-white shadow-xl text-gray-900':'text-gray-500'}`}>근로/급여</button>
              <button onClick={()=>setAdminViewMode('inventory')} className={`flex-1 min-w-[80px] py-4 rounded-2xl text-sm font-black transition-all ${adminViewMode==='inventory'?'bg-white shadow-xl text-gray-900':'text-gray-500'}`}>재고 관리</button>
            </div>

            {adminViewMode === 'calendar' && (
              <div className="space-y-6 font-black">
                <div className="bg-white p-6 rounded-[40px] border-4 border-gray-900 shadow-xl animate-in fade-in font-black">
                  <div className="flex justify-between items-center mb-8 px-4">
                    <button onClick={()=>setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth()-1, 1))} className="p-3 bg-gray-100 rounded-full hover:bg-gray-200"><ChevronLeft size={28} className="text-gray-900"/></button>
                    <span className="font-black text-3xl text-gray-900">{calendarDate.getFullYear()}년 {calendarDate.getMonth()+1}월</span>
                    <button onClick={()=>setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth()+1, 1))} className="p-3 bg-gray-100 rounded-full hover:bg-gray-200"><ChevronRight size={28} className="text-gray-900"/></button>
                  </div>
                  <p className="text-center text-[10px] font-black text-gray-400 mb-4 uppercase tracking-widest">* 날짜를 클릭하면 휴무일로 설정할 수 있습니다.</p>
                  <div className="grid grid-cols-7 gap-1 text-center mb-3 text-[12px] font-black text-gray-400 uppercase tracking-widest font-black">
                    {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=><div key={d}>{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
                  
                  <div className="mt-8 grid grid-cols-2 gap-4 border-t-2 border-dashed border-gray-100 pt-8 font-black">
                    <div className="bg-rose-50 p-6 rounded-3xl border-2 border-rose-100 flex flex-col items-center">
                       <span className="text-[10px] font-black text-rose-400 mb-1 uppercase tracking-widest">총 영업 일수</span>
                       <span className="text-3xl font-black text-rose-600 font-sans font-black">{monthlyStats.workingDays}일</span>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-3xl border-2 border-gray-200 flex flex-col items-center">
                       <span className="text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">총 휴무 일수</span>
                       <span className="text-3xl font-black text-gray-600 font-sans font-black">{monthlyStats.holidayCount}일</span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 font-black">
                    <div className="bg-blue-50 p-6 rounded-3xl border-2 border-blue-100 flex flex-col items-center">
                       <span className="text-[10px] font-black text-blue-400 mb-1 uppercase tracking-widest">월 최고 매출일</span>
                       {monthlyStats.maxDay ? (
                         <>
                           <span className="text-xl font-black text-blue-700 font-sans tracking-tighter">{monthlyStats.maxDay.date.split('-').slice(1).join('/')}</span>
                           <span className="text-2xl font-black text-blue-600 font-sans">{monthlyStats.maxDay.sales.toLocaleString()}원</span>
                         </>
                       ) : (
                         <span className="text-sm font-black text-blue-300 mt-2">데이터 없음</span>
                       )}
                    </div>
                    <div className="bg-orange-50 p-6 rounded-3xl border-2 border-orange-100 flex flex-col items-center">
                       <span className="text-[10px] font-black text-orange-400 mb-1 uppercase tracking-widest">월 최저 매출일</span>
                       {monthlyStats.minDay ? (
                         <>
                           <span className="text-xl font-black text-orange-700 font-sans tracking-tighter">{monthlyStats.minDay.date.split('-').slice(1).join('/')}</span>
                           <span className="text-2xl font-black text-orange-600 font-sans">{monthlyStats.minDay.sales.toLocaleString()}원</span>
                         </>
                       ) : (
                         <span className="text-sm font-black text-orange-300 mt-2">데이터 없음</span>
                       )}
                    </div>
                  </div>

                  {/* 일 평균 매출 및 목표 대비 과부족 */}
                  <div className="mt-4 grid grid-cols-2 gap-4 font-black">
                    <div className="bg-teal-50 p-6 rounded-3xl border-2 border-teal-100 flex flex-col items-center">
                       <span className="text-[10px] font-black text-teal-400 mb-1 uppercase tracking-widest">일 평균 매출</span>
                       <span className="text-2xl font-black text-teal-600 font-sans">{monthlyStats.avgDailySales.toLocaleString()}원</span>
                    </div>
                    <div className="bg-indigo-50 p-6 rounded-3xl border-2 border-indigo-100 flex flex-col items-center">
                       <span className="text-[10px] font-black text-indigo-400 mb-1 uppercase tracking-widest">목표(190만) 과부족</span>
                       <span className={`text-2xl font-black font-sans ${monthlyStats.targetDifference >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                         {monthlyStats.targetDifference > 0 ? '+' : ''}{monthlyStats.targetDifference.toLocaleString()}원
                       </span>
                    </div>
                  </div>

                </div>

                {/* 시스템 전체 통계 */}
                <div className="bg-white p-10 rounded-[56px] border-4 border-gray-900 shadow-2xl space-y-12">
                   <div className="text-center space-y-4">
                      <div className="inline-flex items-center gap-3 bg-rose-50 text-rose-600 px-6 py-2 rounded-full border border-rose-200 font-black text-sm uppercase tracking-widest font-black"><TrendingUp size={18}/> 시스템 전체 기간 매출 통계</div>
                      <h3 className="text-xl font-black text-gray-900">시스템 전체 기간 매출 통계</h3>
                   </div>
                   <div className="space-y-6">
                      <div className="bg-gray-900 p-8 rounded-[40px] text-white flex flex-col items-center justify-center space-y-2 shadow-xl border-4 border-gray-800">
                         <span className="text-xs font-black opacity-50 uppercase tracking-[0.2em] font-black">총 누적 매출</span>
                         <span className="text-4xl font-black tracking-tight">{allTimeStats.total.toLocaleString()}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-black font-black">
                         <div className="bg-rose-600 p-8 rounded-[40px] text-white flex flex-col items-center justify-center space-y-2 shadow-xl border-4 border-rose-500 font-black">
                            <div className="flex items-center gap-2"><Percent size={14}/><span className="text-xs font-black opacity-70 uppercase tracking-[0.2em]">누적 판매 수수료 (40%)</span></div>
                            <span className="text-3xl font-black tracking-tight">{allTimeStats.commission.toLocaleString()}</span>
                         </div>
                         <div className="bg-blue-600 p-8 rounded-[40px] text-white flex flex-col items-center justify-center space-y-2 shadow-xl border-4 border-blue-500 font-black">
                            <div className="flex items-center gap-2"><PiggyBank size={14}/><span className="text-xs font-black opacity-70 uppercase tracking-[0.2em]">누적 영업이익 (60%)</span></div>
                            <span className="text-3xl font-black tracking-tight">{allTimeStats.profit.toLocaleString()}</span>
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6 font-black">
                         <div className="bg-white p-8 rounded-[40px] border-4 border-gray-900 flex flex-col items-center justify-center space-y-2 shadow-lg">
                            <Coins className="text-amber-500" size={32}/>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-black">누적 현금 매출</span>
                            <span className="text-xl font-black text-gray-900">{allTimeStats.cash.toLocaleString()}</span>
                         </div>
                         <div className="bg-white p-8 rounded-[40px] border-4 border-gray-900 flex flex-col items-center justify-center space-y-2 shadow-lg">
                            <CreditCard className="text-blue-500" size={32}/>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-black">누적 카드 매출</span>
                            <span className="text-xl font-black text-gray-900">{allTimeStats.card.toLocaleString()}</span>
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6 font-black">
                         <div className="bg-red-50 p-8 rounded-[40px] border-4 border-red-200 flex flex-col items-center justify-center space-y-2 shadow-sm font-black">
                            <MapPin className="text-red-500" size={32}/>
                            <span className="text-[10px] font-black text-red-300 uppercase tracking-widest font-black">상행선 누적 매출</span>
                            <span className="text-xl font-black text-red-600">{allTimeStats.sang.toLocaleString()}원</span>
                         </div>
                         <div className="bg-blue-50 p-8 rounded-[40px] border-4 border-blue-200 flex flex-col items-center justify-center space-y-2 shadow-sm font-black">
                            <MapPin className="text-blue-500" size={32}/>
                            <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest font-black">하행선 누적 매출</span>
                            <span className="text-xl font-black text-blue-600">{allTimeStats.ha.toLocaleString()}원</span>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            )}

            {adminViewMode === 'labor' && (
              <div className="space-y-6 animate-in fade-in font-black font-black">
                 {/* 근로 기준 및 4대보험 안내 */}
                 <div className="bg-blue-50 p-6 rounded-[32px] border-2 border-blue-200 shadow-sm space-y-3 font-black">
                   <h4 className="text-blue-800 text-lg font-black flex items-center gap-2"><AlertCircle size={20}/> 근로 기준 및 4대보험 가입 안내</h4>
                   <ul className="text-xs text-blue-700 space-y-1.5 list-disc pl-5 leading-relaxed">
                     <li>매니저가 1일 근무 시 <strong>실 근로시간은 10시간</strong> 기준입니다.</li>
                     <li><strong>주 15시간 이상(한 주에 2일 이상)</strong> 또는 <strong>월 60시간 이상(월 6일 이상)</strong> 근무 시 <strong>4대보험 전면 가입</strong> 대상입니다. (사업주 부담 약 9.65%)</li>
                     <li>위 조건 미달 시(월 60시간 미만 단시간 근로)에는 <strong>고용보험, 산재보험만 가입</strong>됩니다. (연금/건강 미가입, 사업주 부담 약 2.15%)</li>
                     <li>예상 인건비는 <strong>1일 급여 + 자동 계산된 해당 보험료 + 1일 식대(9,900원)</strong>가 합산되어 노출됩니다.</li>
                   </ul>
                 </div>

                 {/* 매니저 이름 추가 및 삭제 패널 */}
                 <div className="bg-white p-8 rounded-[48px] border-4 border-gray-900 shadow-2xl space-y-6">
                    <h3 className="text-xl font-black text-gray-900 border-l-8 border-rose-600 pl-4 py-1">매니저 명단 관리</h3>
                    <div className="flex gap-3">
                       <input 
                         type="text" 
                         value={newManagerName} 
                         onChange={e=>setNewManagerName(e.target.value)} 
                         className="flex-1 p-5 bg-gray-100 rounded-3xl border-none outline-none font-black text-gray-900 shadow-inner" 
                         placeholder="새로운 매니저 이름 입력" 
                       />
                       <button onClick={handleAddManager} className="px-8 py-5 bg-gray-900 text-white rounded-3xl font-black flex items-center gap-2 active:scale-95">
                          <UserPlus size={20}/> 추가
                       </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                       {/* 기본 매니저 렌더링 */}
                       {activeDefaults.map(m => (
                          <div key={m} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border-2 border-gray-100">
                             <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${getManagerColor(m)} border`}></div>
                                <span className="font-black text-gray-600">{m} <span className="text-[10px] text-gray-400 ml-1">(기본)</span></span>
                             </div>
                             <button onClick={()=>handleRemoveDefaultManager(m)} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><UserMinus size={18}/></button>
                          </div>
                       ))}
                       {/* DB 추가 매니저 렌더링 */}
                       {dbManagers.map(m => (
                          <div key={m.id} className="flex justify-between items-center p-4 bg-white rounded-2xl border-2 border-gray-900 shadow-sm">
                             <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${getManagerColor(m.name)} border`}></div>
                                <span className="font-black text-gray-900">{m.name}</span>
                             </div>
                             <button onClick={()=>handleRemoveManager(m.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><UserMinus size={18}/></button>
                          </div>
                       ))}
                    </div>
                    <p className="text-[10px] text-gray-400 italic text-center">* 여기서 추가된 이름은 업무보고 작성 폼과 스케쥴 배정 목록에 자동으로 나타납니다.</p>
                 </div>

                 {/* 근무자 스케쥴 관리 패널 */}
                 <div className="bg-white p-10 rounded-[56px] border-4 border-gray-900 shadow-2xl space-y-10 mt-12">
                    <div className="text-center space-y-4 mb-4">
                       <div className="inline-flex items-center gap-3 bg-blue-50 text-blue-600 px-6 py-2 rounded-full border border-blue-200 font-black text-sm uppercase tracking-widest font-black"><CalendarDays size={18}/> 이번 달 근무자 스케쥴 관리</div>
                       <h3 className="text-xl font-black text-gray-900">근무자 스케쥴 관리</h3>
                    </div>
                    
                    <div className="flex justify-between items-center px-4 mb-8 bg-gray-50 p-4 rounded-3xl border-2 border-gray-100">
                      <button onClick={()=>setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth()-1, 1))} className="p-3 bg-white rounded-full hover:bg-gray-200 shadow-sm border-2 border-gray-200"><ChevronLeft size={24}/></button>
                      <span className="font-black text-2xl text-gray-900">{calendarDate.getFullYear()}년 {calendarDate.getMonth()+1}월</span>
                      <button onClick={()=>setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth()+1, 1))} className="p-3 bg-white rounded-full hover:bg-gray-200 shadow-sm border-2 border-gray-200"><ChevronRight size={24}/></button>
                    </div>

                    {/* 월 총 인건비 요약 대시보드 */}
                    <div className="bg-gray-900 p-8 rounded-[40px] text-white shadow-xl space-y-6 relative overflow-hidden mb-8 border-4 border-gray-800">
                      <div className="relative z-10 text-center space-y-2">
                        <p className="text-rose-400 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
                           <DollarSign size={16}/> 이번 달 총 예상 인건비
                        </p>
                        <p className="text-5xl font-black tracking-tight text-white">{scheduleStats.grandTotalLaborCost.toLocaleString()}원</p>
                      </div>
                      <div className="relative z-10 grid grid-cols-3 gap-2 sm:gap-4 pt-6 border-t-2 border-gray-700">
                        <div className="text-center">
                          <p className="text-[10px] text-gray-400 mb-1">총 예상 급여</p>
                          <p className="text-lg sm:text-xl font-black">{scheduleStats.grandTotalWage.toLocaleString()}원</p>
                        </div>
                        <div className="text-center border-x-2 border-gray-700">
                          <p className="text-[10px] text-gray-400 mb-1 leading-tight">총 4대보험/고용산재<br/>(사업주 부담분)</p>
                          <p className="text-lg sm:text-xl font-black">{scheduleStats.grandTotalInsurance.toLocaleString()}원</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-gray-400 mb-1 leading-tight">총 식대<br/>(9,900원/일)</p>
                          <p className="text-lg sm:text-xl font-black">{scheduleStats.grandTotalMeal.toLocaleString()}원</p>
                        </div>
                      </div>
                    </div>

                    {/* 상행선 스케쥴 */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 border-l-8 border-red-600 pl-4 py-1">
                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">상행선 스케쥴</h2>
                      </div>
                      <div className="bg-white p-4 rounded-[40px] border-4 border-gray-900 shadow-xl">
                        <div className="grid grid-cols-7 gap-1 text-center mb-3 text-[10px] font-black text-gray-400">
                          {['SUN','MON','TUE','WED','THU','FRI','SAT'].map(d=><div key={d}>{d}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-1">{renderScheduleCalendar('상행선')}</div>
                      </div>
                    </div>

                    {/* 하행선 스케쥴 */}
                    <div className="space-y-4 mt-8">
                      <div className="flex items-center gap-2 border-l-8 border-blue-600 pl-4 py-1">
                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">하행선 스케쥴</h2>
                      </div>
                      <div className="bg-white p-4 rounded-[40px] border-4 border-gray-900 shadow-xl">
                        <div className="grid grid-cols-7 gap-1 text-center mb-3 text-[10px] font-black text-gray-400">
                          {['SUN','MON','TUE','WED','THU','FRI','SAT'].map(d=><div key={d}>{d}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-1">{renderScheduleCalendar('하행선')}</div>
                      </div>
                    </div>

                    {/* 통합 근무 스케쥴 및 급여 합산 */}
                    <div className="mt-12 space-y-4">
                      <div className="flex items-center gap-2 border-l-8 border-purple-600 pl-4 py-1">
                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">이번 달 통합 근무 일수 및 예상 급여 (인건비 합산)</h2>
                      </div>
                      <div className="bg-white p-4 rounded-[40px] border-4 border-gray-900 shadow-xl">
                        <div className="flex flex-col gap-3">
                          {Object.entries(scheduleStats.managerMonthlyStats).filter(([_, s]) => s.totalDays > 0).sort((a, b) => b[1].totalDays - a[1].totalDays).length > 0 ? (
                             Object.entries(scheduleStats.managerMonthlyStats)
                               .filter(([_, stats]) => stats.totalDays > 0)
                               .sort((a, b) => b[1].totalDays - a[1].totalDays)
                               .map(([mgr, stats]) => {
                                  return (
                                     <div key={mgr} className={`p-4 rounded-3xl border-2 flex flex-col gap-3 shadow-sm ${getManagerColor(mgr)}`}>
                                        <div className="flex justify-between items-center border-b border-black/10 pb-2">
                                          <span className="text-sm font-black">{mgr} 매니저</span>
                                          <div className="flex items-center gap-1">
                                             <span className="bg-white/90 px-2 py-1 rounded-lg text-[10px] font-black border border-black/5 shadow-sm">총 {stats.totalDays}일 근무 (상:{stats.sangDays}/하:{stats.haDays})</span>
                                             {stats.insuranceType === 'FULL' ? (
                                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-[10px] font-black border border-blue-200 shadow-sm">4대보험 (9.65%)</span>
                                             ) : (
                                                <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-lg text-[10px] font-black border border-orange-200 shadow-sm">고용·산재 (2.15%)</span>
                                             )}
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs font-black">
                                          <div className="bg-white/60 p-2 rounded-xl border border-black/5 flex justify-between"><span>기본 급여</span><span>{stats.totalWage.toLocaleString()}원</span></div>
                                          <div className="bg-white/60 p-2 rounded-xl border border-black/5 flex justify-between"><span>식대 (일 9.9k)</span><span>{stats.totalMeal.toLocaleString()}원</span></div>
                                          <div className="bg-white/60 p-2 rounded-xl border border-black/5 flex justify-between col-span-2 text-blue-800">
                                            <span>{stats.insuranceType === 'FULL' ? '4대보험료 (사업주 9.65%)' : '고용/산재 (사업주 2.15%)'}</span>
                                            <span>{stats.totalInsurance.toLocaleString()}원</span>
                                          </div>
                                        </div>
                                        <div className="bg-white/90 p-3 rounded-xl border border-black/10 flex justify-between items-center shadow-inner mt-1">
                                          <span className="text-xs font-black opacity-80">인건비 합계</span>
                                          <span className="text-lg font-black">{stats.totalCost.toLocaleString()}원</span>
                                        </div>
                                     </div>
                                  );
                               })
                          ) : (
                            <span className="text-xs text-gray-400 font-black px-2">배정된 근무자가 없습니다.</span>
                          )}
                        </div>
                      </div>
                    </div>
                 </div>
              </div>
            )}

            {adminViewMode === 'inventory' && (
              <div className="space-y-6 animate-in fade-in font-black font-black">
                 {/* 누적 지출 비용 현황 및 세부내역 */}
                 <div className="bg-emerald-600 p-8 rounded-[48px] border-4 border-emerald-800 shadow-2xl text-center space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-20"><PiggyBank size={100} color="white"/></div>
                    
                    {/* 전체 합산 */}
                    <div className="relative z-10 space-y-2 pt-2">
                       <p className="text-emerald-200 text-xs font-black uppercase tracking-widest">총 재고 지출 누적액</p>
                       <p className="text-5xl font-black text-white tracking-tight">{currentStock.totalSpent.toLocaleString()}<span className="text-2xl ml-1">원</span></p>
                       <p className="text-[10px] text-emerald-300">* 하단에 입력된 모든 입출고 내역 금액의 합산입니다.</p>
                    </div>

                    {/* 품목별 지출 세부 내역 */}
                    <div className="grid grid-cols-3 gap-2 mt-8 pt-6 border-t-2 border-emerald-500/50 relative z-10">
                       <div className="flex flex-col items-center justify-center">
                          <span className="text-[10px] text-emerald-300 uppercase tracking-widest mb-1">뻥쌀 지출</span>
                          <span className="text-xl font-black text-white">{currentStock.riceSpent.toLocaleString()}원</span>
                       </div>
                       <div className="flex flex-col items-center justify-center border-x-2 border-emerald-500/50">
                          <span className="text-[10px] text-emerald-300 uppercase tracking-widest mb-1">빵끈 지출</span>
                          <span className="text-xl font-black text-white">{currentStock.tieSpent.toLocaleString()}원</span>
                       </div>
                       <div className="flex flex-col items-center justify-center">
                          <span className="text-[10px] text-emerald-300 uppercase tracking-widest mb-1">비닐 지출</span>
                          <span className="text-xl font-black text-white">{currentStock.bagSpent.toLocaleString()}원</span>
                       </div>
                    </div>
                 </div>

                 <div className="bg-white p-8 rounded-[48px] border-4 border-gray-900 shadow-2xl space-y-6">
                    <h3 className="text-xl font-black text-gray-900 border-l-8 border-rose-600 pl-4 py-1">현재 재고 현황</h3>
                    <p className="text-[10px] text-gray-400">* 빵끈과 포장비닐은 누적 매출 5,000원당 1개씩 자동 차감됩니다.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                       <div className="bg-amber-50 p-6 rounded-3xl border-4 border-amber-200 flex flex-col items-center justify-center space-y-2 shadow-sm">
                          <Box className="text-amber-500 mb-1" size={36}/>
                          <span className="text-xs font-black text-amber-500 uppercase tracking-widest">뻥쌀 재고</span>
                          <span className="text-4xl font-black text-amber-700 tracking-tight">{currentStock.riceKg.toLocaleString()}<span className="text-lg">kg</span></span>
                          <span className="text-sm font-black text-amber-600">약 {(currentStock.riceKg / 20).toFixed(1)}박스</span>
                          <div className="w-full border-t-2 border-amber-200 mt-2 pt-2 text-center">
                             <span className="text-xs text-amber-600">자산 가치: {(currentStock.riceKg * 2500).toLocaleString()}원</span>
                          </div>
                       </div>
                       <div className="bg-blue-50 p-6 rounded-3xl border-4 border-blue-200 flex flex-col items-center justify-center space-y-2 shadow-sm">
                          <Package className="text-blue-500 mb-1" size={36}/>
                          <span className="text-xs font-black text-blue-500 uppercase tracking-widest">빵끈 재고</span>
                          <span className="text-4xl font-black text-blue-700 tracking-tight">{currentStock.tie.toLocaleString()}<span className="text-lg">개</span></span>
                          <span className="text-sm font-black text-blue-50/0 select-none">-</span>
                          <div className="w-full border-t-2 border-blue-200 mt-2 pt-2 text-center">
                             <span className="text-xs text-blue-600">자산 가치: {(currentStock.tie * 5).toLocaleString()}원</span>
                          </div>
                       </div>
                       <div className="bg-rose-50 p-6 rounded-3xl border-4 border-rose-200 flex flex-col items-center justify-center space-y-2 shadow-sm">
                          <ShoppingCart className="text-rose-500 mb-1" size={36}/>
                          <span className="text-xs font-black text-rose-500 uppercase tracking-widest">포장 비닐 재고</span>
                          <span className="text-4xl font-black text-rose-700 tracking-tight">{currentStock.bag.toLocaleString()}<span className="text-lg">개</span></span>
                          <span className="text-sm font-black text-rose-50/0 select-none">-</span>
                          <div className="w-full border-t-2 border-rose-200 mt-2 pt-2 text-center">
                             <span className="text-xs text-rose-600">자산 가치: {(currentStock.bag * 40).toLocaleString()}원</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="bg-white p-8 rounded-[48px] border-4 border-gray-900 shadow-2xl space-y-6">
                    <h3 className="text-xl font-black text-gray-900 border-l-8 border-gray-900 pl-4 py-1">재고 수동 입출고 반영</h3>
                    <p className="text-[11px] text-gray-500 bg-gray-50 p-4 rounded-2xl border-2 border-gray-100 leading-relaxed">
                       * 판매 및 영업으로 인한 재고 차감은 매니저 리포트를 기반으로 <span className="text-rose-600">자동 반영</span>됩니다.<br/>
                       * 따라서 물건이 <span className="text-blue-600">새로 입고</span>되었거나 특이 사항으로 인한 <span className="text-red-600">재고 조정(출고)</span>이 필요할 때만 작성해 주세요. 금액을 비워두면 0원으로 기록됩니다.
                    </p>
                    <div className="space-y-4 pt-2">
                       <div className="flex flex-col gap-3">
                          <div className="flex gap-2">
                            <select value={adjustType} onChange={e=>setAdjustType(e.target.value)} className="w-1/3 p-5 bg-gray-100 rounded-3xl border-none outline-none font-black text-gray-900 shadow-inner text-sm">
                               <option value="rice">뻥쌀 (kg)</option>
                               <option value="tie">빵끈 (개)</option>
                               <option value="bag">포장 비닐 (개)</option>
                            </select>
                            <input type="number" value={adjustAmount} onChange={e=>setAdjustAmount(e.target.value)} placeholder="수량 입력" className="w-2/3 p-5 bg-gray-100 rounded-3xl border-none outline-none font-black text-gray-900 text-right shadow-inner focus:ring-4 ring-gray-200 text-xl" />
                          </div>
                          <div className="w-full">
                            <input type="text" value={formatComma(adjustPrice)} onChange={e=>setAdjustPrice(parseComma(e.target.value))} placeholder="단가 또는 총 금액 입력 (선택사항, 원)" className="w-full p-5 bg-emerald-50 rounded-3xl border-none outline-none font-black text-emerald-900 text-right shadow-inner focus:ring-4 ring-emerald-200 text-lg placeholder:text-emerald-300" />
                          </div>
                       </div>
                       <div className="flex gap-3 pt-2">
                          <button onClick={()=>handleAdjustInventory(true)} className="flex-1 py-5 bg-blue-600 text-white rounded-3xl font-black shadow-lg active:scale-95 transition-all text-base border-b-4 border-blue-800 flex items-center justify-center gap-2"><PlusCircle size={20}/> 입고 (추가)</button>
                          <button onClick={()=>handleAdjustInventory(false)} className="flex-1 py-5 bg-red-600 text-white rounded-3xl font-black shadow-lg active:scale-95 transition-all text-base border-b-4 border-red-800 flex items-center justify-center gap-2"><MinusCircle size={20}/> 출고 (차감)</button>
                       </div>
                    </div>
                 </div>

                 {/* 입출고 상세 내역 (히스토리) 리스트 */}
                 <div className="space-y-4 pt-6">
                    <div className="flex items-center gap-2 mb-4 px-2">
                       <History className="text-gray-900" size={24}/>
                       <h3 className="text-xl font-black text-gray-900">재고 입출고 상세 내역</h3>
                    </div>
                    {inventoryLogs.length === 0 ? (
                       <p className="text-center text-gray-400 py-10 font-black text-sm bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">기록된 입출고 내역이 없습니다.</p>
                    ) : (
                       inventoryLogs.map(log => (
                          <div key={log.id} className="bg-white p-6 rounded-[36px] border-4 border-gray-900 shadow-md flex flex-col animate-in slide-in-from-bottom-2">
                             {editLogId === log.id ? (
                                <div className="space-y-4 bg-gray-50 p-5 rounded-2xl border-2 border-gray-200 shadow-inner">
                                   <div className="flex justify-between items-center mb-2">
                                     <span className="text-xs font-black text-gray-500">내역 수정</span>
                                     <span className="text-[10px] text-gray-400">{log.date}</span>
                                   </div>
                                   <div className="grid grid-cols-2 gap-3">
                                      <select value={editLogData.type} onChange={e=>setEditLogData({...editLogData, type: e.target.value})} className="p-3 bg-white rounded-xl border-none font-black text-sm text-gray-900 shadow-sm">
                                         <option value="rice">뻥쌀</option>
                                         <option value="tie">빵끈</option>
                                         <option value="bag">포장 비닐</option>
                                      </select>
                                      <select value={editLogData.action} onChange={e=>setEditLogData({...editLogData, action: e.target.value})} className="p-3 bg-white rounded-xl border-none font-black text-sm text-gray-900 shadow-sm">
                                         <option value="add">입고(+)</option>
                                         <option value="remove">출고(-)</option>
                                      </select>
                                      <div className="col-span-2 flex gap-3">
                                         <input type="number" value={editLogData.amount} onChange={e=>setEditLogData({...editLogData, amount: e.target.value})} className="flex-1 p-3 bg-white rounded-xl border-none font-black text-right text-gray-900 shadow-sm" placeholder="수량" />
                                         <input type="text" value={formatComma(editLogData.priceStr)} onChange={e=>setEditLogData({...editLogData, priceStr: parseComma(e.target.value)})} className="flex-1 p-3 bg-emerald-50 rounded-xl border-none font-black text-right text-emerald-900 shadow-sm" placeholder="금액" />
                                      </div>
                                   </div>
                                   <div className="flex gap-2 pt-2">
                                      <button onClick={saveLogEdit} className="flex-1 bg-green-600 text-white py-3 rounded-xl text-sm font-black shadow-md"><Save size={16} className="inline mr-1"/>저장</button>
                                      <button onClick={()=>{setEditLogId(null); setEditLogData(null);}} className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-xl text-sm font-black">취소</button>
                                   </div>
                                </div>
                             ) : (
                                <>
                                   <div className="flex justify-between items-start border-b-2 border-gray-100 pb-4 mb-4">
                                      <div>
                                         <span className={`px-3 py-1 rounded-full text-[10px] font-black mr-2 ${log.action === 'add' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                            {log.action === 'add' ? '입고' : '출고'}
                                         </span>
                                         <span className="font-black text-lg text-gray-900">{inventoryTypeNames[log.type]}</span>
                                      </div>
                                      <div className="text-right">
                                         <span className="text-[10px] text-gray-400 block">{log.date}</span>
                                         <span className="text-[10px] text-gray-400 block">{formatTime(log.timestamp)}</span>
                                      </div>
                                   </div>
                                   <div className="flex justify-between items-end mb-4 px-1">
                                      <div className="space-y-1">
                                         <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest block">수량</span>
                                         <span className={`text-2xl font-black ${log.action === 'add' ? 'text-blue-600' : 'text-red-600'}`}>
                                            {log.action === 'add' ? '+' : '-'}{log.amount.toLocaleString()} <span className="text-sm">{log.type === 'rice' ? 'kg' : '개'}</span>
                                         </span>
                                      </div>
                                      <div className="space-y-1 text-right">
                                         <span className="text-[10px] text-emerald-600/70 font-black uppercase tracking-widest block">비용/금액</span>
                                         <span className="text-xl font-black text-emerald-600">{Number(log.price || 0).toLocaleString()}원</span>
                                      </div>
                                   </div>
                                   <div className="flex gap-2 font-black">
                                      <button onClick={()=>startEditLog(log)} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-2xl text-xs font-black active:scale-95 transition-transform flex items-center justify-center gap-1"><Edit2 size={14}/> 수정</button>
                                      <button onClick={()=>setDeleteConfirmId({ id: log.id, col: 'inventoryLogs' })} className="flex-1 bg-red-50 text-red-600 py-3 rounded-2xl text-xs font-black active:scale-95 transition-transform flex items-center justify-center gap-1"><Trash2 size={14}/> 삭제</button>
                                   </div>
                                </>
                             )}
                          </div>
                       ))
                    )}
                 </div>
              </div>
            )}

            {adminViewMode === 'list' && (
              <div className="space-y-6 font-black">
                <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                  <button onClick={()=>setFilterType('ALL')} className={`px-5 py-3 rounded-2xl border-4 font-black text-sm whitespace-nowrap transition-all ${filterType==='ALL' ? 'bg-gray-900 text-white border-gray-900 shadow-lg' : 'bg-white border-gray-100 text-gray-400'}`}>전체보기</button>
                  {allManagers.map(name => (
                    <button key={name} onClick={()=>{setFilterType('WORKER');setFilterValue(name)}} className={`px-5 py-3 rounded-2xl border-4 font-black text-sm whitespace-nowrap transition-all ${filterType==='WORKER' && filterValue===name ? 'bg-gray-900 text-white border-gray-900 shadow-lg' : 'bg-white border-gray-100 text-gray-400'}`}>{name}</button>
                  ))}
                </div>
                {filteredReports.map(r => (
                  <div key={r.id} className="p-8 rounded-[40px] border-4 shadow-2xl bg-white border-gray-900 animate-in slide-in-from-bottom-4 font-black">
                    <div className="flex justify-between items-start mb-6 font-black font-black">
                      <div>
                        <p className="text-[11px] text-gray-400 mb-1 uppercase tracking-widest font-sans font-black font-black font-black">{new Date(r.timestamp).toLocaleString('ko-KR')}</p>
                        <p className="text-2xl text-gray-900 tracking-tighter">{r.date} | {r.location}</p>
                      </div>
                      <span className={`px-5 py-2.5 rounded-full text-xs text-white shadow-md ${r.location==='상행선'?'bg-red-600':'bg-blue-600'}`}>{r.worker}</span>
                    </div>
                    <div className="flex justify-between items-end border-t-4 border-gray-50 pt-6 font-black font-sans font-black">
                       <span className="text-xs text-gray-500 uppercase tracking-widest font-sans font-black">매출 합계</span>
                       <span className="text-4xl text-gray-900 tracking-tight">{Number(r.totalSales || 0).toLocaleString()}원</span>
                    </div>
                    <button onClick={()=>setExpandedReportId(expandedReportId === r.id ? null : r.id)} className="w-full mt-6 py-5 bg-gray-900 text-white rounded-[24px] text-base font-black active:scale-95 flex items-center justify-center gap-2 shadow-xl font-black">
                      {expandedReportId === r.id ? <ChevronUp/> : <ChevronDown/>} {expandedReportId === r.id ? '상세 닫기' : '상세 보기'}
                    </button>
                    {expandedReportId === r.id && (
                      <div className="mt-8 space-y-6 pt-8 border-t-4 border-dashed border-gray-100 animate-in fade-in zoom-in-95 font-black">
                         {editReportId === r.id ? (
                           <div className="space-y-4 bg-gray-50 p-6 rounded-3xl border-2 border-gray-200 shadow-inner font-black font-black">
                             <p className="text-xs text-rose-600 uppercase mb-4 font-black">리포트 수정 모드</p>
                             <div className="grid grid-cols-2 gap-4 font-black">
                               <div className="space-y-1">
                                 <label className="text-[10px] text-gray-400 font-black">현금 매출</label>
                                 <input type="text" value={formatComma(editData.sales?.cash || '')} onChange={e=>setEditData({...editData, sales:{...editData.sales, cash:parseComma(e.target.value)}})} className="w-full p-3 bg-white rounded-xl border-none font-black text-gray-900 text-right font-black" />
                               </div>
                               <div className="space-y-1 font-black">
                                 <label className="text-[10px] text-gray-400 font-black">카드 매출</label>
                                 <input type="text" value={formatComma(editData.sales?.card || '')} onChange={e=>setEditData({...editData, sales:{...editData.sales, card:parseComma(e.target.value)}})} className="w-full p-3 bg-white rounded-xl border-none font-black text-gray-900 text-right font-black" />
                               </div>
                             </div>
                             <div className="grid grid-cols-2 gap-4 font-black">
                               <div className="space-y-1 font-black">
                                 <label className="text-[10px] text-gray-400 font-black">사용한 쌀 (kg)</label>
                                 <input type="number" value={editData.inventory?.usedRice || ''} onChange={e=>setEditData({...editData, inventory:{...editData.inventory, usedRice:e.target.value}})} className="w-full p-3 bg-white rounded-xl border-none font-black text-gray-900 text-right font-black" />
                               </div>
                               <div className="space-y-1 font-black">
                                 <label className="text-[10px] text-gray-400 font-black">재고 (개)</label>
                                 <input type="number" value={editData.inventory?.stockCount || ''} onChange={e=>setEditData({...editData, inventory:{...editData.inventory, stockCount:e.target.value}})} className="w-full p-3 bg-white rounded-xl border-none font-black text-gray-900 text-right font-black" />
                               </div>
                             </div>
                             <div className="space-y-1 font-black">
                               <label className="text-[10px] text-gray-400 font-black">특이사항</label>
                               <textarea value={editData.notes || ''} onChange={e=>setEditData({...editData, notes:e.target.value})} className="w-full p-3 bg-white rounded-xl border-none font-black text-gray-900 font-black" rows={3} />
                             </div>
                             <div className="flex gap-2 pt-2">
                               <button onClick={saveEdit} className="flex-1 py-4 bg-green-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg font-black"><Save size={18}/> 저장하기</button>
                               <button onClick={()=>{setEditReportId(null);setEditData(null)}} className="px-6 py-4 bg-gray-300 text-gray-700 rounded-2xl font-black font-black">취소</button>
                             </div>
                           </div>
                         ) : (
                           <div className="space-y-6 font-black font-black">
                             <div className="grid grid-cols-2 gap-4 font-black">
                                <div className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100 font-black">
                                  <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-widest font-sans font-black">매출 정보</p>
                                  <div className="flex justify-between items-center mb-1 text-gray-900 font-black">
                                    <span className="text-xs text-gray-500">현금</span>
                                    <span>{Number(r.sales?.cash || 0).toLocaleString()}원</span>
                                  </div>
                                  <div className="flex justify-between items-center text-gray-900 font-black">
                                    <span className="text-xs text-gray-500">카드</span>
                                    <span>{Number(r.sales?.card || 0).toLocaleString()}원</span>
                                  </div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100 font-black">
                                  <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-widest font-sans font-black">재고 정보</p>
                                  <div className="flex justify-between items-center mb-1 text-gray-900 font-black">
                                    <span className="text-xs text-gray-500 font-black">쌀 사용량</span>
                                    <span>{r.inventory?.usedRice || 0}kg</span>
                                  </div>
                                  <div className="flex justify-between items-center text-gray-900 font-black">
                                    <span className="text-xs text-gray-500 font-black">재고 수량</span>
                                    <span>{r.inventory?.stockCount || 0}개</span>
                                  </div>
                                </div>
                             </div>

                             <div className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100 font-black mt-4">
                                <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-widest font-sans font-black">익일 자재 상태</p>
                                <div className="flex justify-between items-center mb-1 text-gray-900">
                                  <span className="text-xs text-gray-500">뻥쌀</span>
                                  <span className={r.inventory?.riceStatus === '부족' ? 'text-red-600' : 'text-blue-600'}>{r.inventory?.riceStatus || '미기입'}</span>
                                </div>
                                <div className="flex justify-between items-center mb-1 text-gray-900">
                                  <span className="text-xs text-gray-500">포장 비닐</span>
                                  <span className={r.inventory?.bagStatus === '부족' ? 'text-red-600' : 'text-blue-600'}>{r.inventory?.bagStatus || '미기입'}</span>
                                </div>
                                <div className="flex justify-between items-center text-gray-900">
                                  <span className="text-xs text-gray-500">빵끈</span>
                                  <span className={r.inventory?.tieStatus === '부족' ? 'text-red-600' : 'text-blue-600'}>{r.inventory?.tieStatus || '미기입'}</span>
                                </div>
                             </div>

                             <div className="bg-gray-900 p-6 rounded-3xl text-white italic leading-relaxed shadow-xl font-black">
                               <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-widest not-italic font-sans font-black">매니저 전달사항</p>
                               "{r.notes || '전달사항 없음'}"
                             </div>
                             <div className="grid grid-cols-5 gap-2 font-black">
                               {r.photos && Object.entries(r.photos).map(([key, url]) => (
                                 url && (
                                   <div key={key} onClick={()=>setSelectedPhoto({url, name: photoNames[key], date: r.date, worker: r.worker})} className="aspect-square bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200 cursor-pointer hover:border-rose-500 transition-all font-black">
                                      <img src={url} className="w-full h-full object-cover" />
                                   </div>
                                 )
                               ))}
                             </div>
                             <div className="flex gap-4 pt-4 font-black">
                                <button onClick={()=>startEdit(r)} className="flex-1 py-5 bg-blue-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"><Edit2 size={20}/> 리포트 수정</button>
                                <button onClick={()=>setDeleteConfirmId({ id: r.id, col: 'reports' })} className="flex-1 py-5 bg-red-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"><Trash2 size={20}/> 리포트 삭제</button>
                             </div>
                           </div>
                         )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 관리자 모드에서만 나타나는 스케쥴 배정 팝업 */}
          {view === 'admin' && scheduleSelection && (
            <div className="fixed inset-0 bg-black/90 z-[300] flex items-center justify-center p-8 backdrop-blur-md animate-in fade-in duration-300">
              <div className="bg-white p-10 rounded-[56px] w-full max-w-sm border-[10px] border-gray-900 shadow-2xl animate-in zoom-in-95 font-black">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">{scheduleSelection.location}</p>
                    <h3 className="text-3xl font-black text-gray-900">{scheduleSelection.date}</h3>
                  </div>
                  <button onClick={()=>setScheduleSelection(null)} className="p-3 bg-gray-100 rounded-2xl"><X size={24}/></button>
                </div>
                
                <div className="mb-6 space-y-2">
                  <label className="text-xs text-gray-500 font-black uppercase tracking-widest pl-2">해당일 근무 임금 (선택)</label>
                  <input
                    type="text"
                    value={formatComma(scheduleWage)}
                    onChange={e => setScheduleWage(parseComma(e.target.value))}
                    className="w-full p-4 bg-gray-100 rounded-2xl border-none outline-none font-black text-right text-gray-900 text-xl shadow-inner focus:ring-4 ring-blue-200"
                    placeholder="0 원"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {allManagers.map(m => (
                    <button key={m} onClick={() => assignWorkerToSchedule(m)} className={`py-5 rounded-3xl border-4 transition-all font-black text-sm ${getManagerColor(m)}`}>
                      {m} 배정
                    </button>
                  ))}
                </div>

                <button onClick={() => assignWorkerToSchedule('CLEAR')} className="w-full py-5 bg-red-50 text-red-600 rounded-3xl font-black border-4 border-red-100 flex items-center justify-center gap-2 shadow-sm">
                  <Trash2 size={20}/> 배정 삭제
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (view === 'qna') {
      return (
        <div className="max-w-md mx-auto bg-white min-h-screen pb-40 font-sans animate-in fade-in font-black">
          <header className="bg-white p-6 border-b-4 border-gray-900 flex justify-between items-center sticky top-0 z-20 shadow-md">
            <button onClick={() => setIsMenuOpen(true)} className="p-3 bg-gray-100 rounded-2xl active:scale-90 font-black"><Menu size={24}/></button>
            <h1 className="font-black text-gray-900 text-xl tracking-tight">질문과 답변 (Q&A)</h1>
            <div className="w-10"></div>
          </header>
          <div className="p-4 space-y-6 font-black">
            <div className="bg-white p-6 rounded-[36px] border-4 border-gray-900 shadow-xl space-y-4">
              <h2 className="text-sm font-black text-rose-600 border-l-8 border-rose-600 pl-3 uppercase tracking-widest font-black">새로운 질문 남기기</h2>
              <div className="bg-gray-50 rounded-2xl border-2 border-gray-100 p-2 flex flex-col gap-2 shadow-inner">
                <select value={qnaAuthor} onChange={e=>setQnaAuthor(e.target.value)} className="w-full p-3 bg-white rounded-xl border-none outline-none font-black text-gray-900 shadow-sm text-sm">
                  {allManagers.map(m => <option key={m} value={m}>{m} 매니저</option>)}
                </select>
                <textarea value={qnaQuestion} onChange={e=>setQnaQuestion(e.target.value)} className="w-full bg-transparent p-3 font-black text-gray-900 border-none outline-none" rows={3} placeholder="궁금한 점을 자유롭게 남겨주세요... (예: 포장 비닐은 어디에 있나요?)"/>
              </div>
              <button onClick={submitQna} className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black text-xl shadow-lg active:scale-95 transition-all">질문 등록하기</button>
            </div>
            
            <div className="space-y-4 font-black">
               {qnas.map(q => (
                 <div key={q.id} className="bg-white p-6 rounded-[32px] border-4 border-gray-900 shadow-md animate-in slide-in-from-bottom-2 font-black">
                    <div className="flex justify-between items-center mb-4">
                       <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">{q.author}</span>
                          <span className="text-[10px] font-black text-gray-400 flex items-center gap-1"><Clock size={10}/> {formatTime(q.timestamp)}</span>
                       </div>
                       {isAdmin && <button onClick={() => setDeleteConfirmId({ id: q.id, col: 'qna' })} className="text-[10px] font-black text-red-500">삭제</button>}
                    </div>
                    <p className="font-black text-gray-900 text-lg whitespace-pre-wrap leading-relaxed px-1">{q.question}</p>
                    
                    {/* 답변 영역 */}
                    <div className="mt-5 pt-5 border-t-2 border-dashed border-gray-100">
                      {q.answer ? (
                        <div className="bg-blue-50 p-5 rounded-2xl border-2 border-blue-100 shadow-inner">
                          <p className="text-[11px] font-black text-blue-600 mb-2 flex items-center gap-1 uppercase tracking-widest"><CheckCircle2 size={14}/> 답변 완료</p>
                          <p className="font-black text-blue-900 whitespace-pre-wrap text-base">{q.answer}</p>
                        </div>
                      ) : (
                        qnaReplyId === q.id ? (
                          <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border-2 border-gray-200">
                            <textarea value={qnaReplyContent} onChange={e=>setQnaReplyContent(e.target.value)} className="w-full bg-white rounded-xl p-4 font-black text-sm text-gray-900 border-none outline-none shadow-inner focus:ring-2 ring-blue-300" rows={3} placeholder="답변 내용을 입력하세요..."/>
                            <div className="flex gap-2">
                               <button onClick={()=>submitQnaReply(q.id)} className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-black shadow-md">답변 등록</button>
                               <button onClick={()=>setQnaReplyId(null)} className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-xl text-sm font-black">취소</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={()=>{setQnaReplyId(q.id); setQnaReplyContent('');}} className="w-full py-4 bg-gray-100 text-gray-600 rounded-2xl text-sm font-black hover:bg-gray-200 border-2 border-gray-200 transition-colors">답변 남기기</button>
                        )
                      )}
                    </div>
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
        <div className="max-w-md mx-auto bg-white min-h-screen pb-40 font-sans animate-in fade-in font-black">
          <header className="bg-white p-6 border-b-4 border-gray-900 flex justify-between items-center sticky top-0 z-20 shadow-md">
            <button onClick={() => setIsMenuOpen(true)} className="p-3 bg-gray-100 rounded-2xl active:scale-90 font-black transition-all"><Menu size={24}/></button>
            <h1 className="font-black text-gray-900 text-xl tracking-tight">하트뻥튀기 (처인휴게소)</h1>
            <div className="w-10"></div>
          </header>
          <div className="p-4 space-y-6">
            <div className="bg-white p-6 rounded-[44px] border-4 border-gray-900 shadow-xl space-y-6 animate-in slide-in-from-top-4">
              <div className="flex justify-between items-end font-black font-black">
                <h2 className="text-sm text-rose-600 border-l-8 border-rose-600 pl-4 uppercase tracking-widest font-black">
                  {isOpen ? '오픈 매뉴얼' : '마감 매뉴얼'}
                </h2>
                <span className="text-3xl font-sans font-black">{progress}%</span>
              </div>
              <div className="w-full h-6 bg-gray-100 rounded-full border-2 border-gray-900 overflow-hidden shadow-inner font-black">
                <div className="h-full bg-rose-600 transition-all duration-500 ease-out font-black" style={{ width: `${progress}%` }} />
              </div>
              <div className="bg-rose-50 p-5 rounded-3xl border-2 border-rose-200">
                <p className="text-sm font-black text-rose-800 leading-relaxed text-center italic font-black">
                  {isOpen ? '"적혀있는 순서대로 오픈하기를 권장드립니다."' : '"깨끗한 매장을 위해 마감 수칙을 꼭 지켜주세요. 오늘도 수고하셨습니다."'}
                </p>
              </div>
            </div>
            <div className="space-y-3 font-black font-black">
              {manualItems.map((item) => (
                <button 
                  key={item.id}
                  onClick={() => toggleFn(item.id)}
                  className={`w-full flex items-center gap-5 p-5 rounded-3xl border-4 transition-all duration-300 transform active:scale-[0.98] ${checks[item.id] ? 'bg-rose-50 border-rose-600 shadow-xl' : 'bg-white border-gray-100 shadow-lg'} font-black`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md flex-shrink-0 ${checks[item.id] ? 'bg-rose-600 text-white' : 'bg-gray-100'} font-black`}>
                    {checks[item.id] ? <CheckCircle2 size={28}/> : item.icon}
                  </div>
                  <span className={`flex-1 text-left font-black text-base leading-tight ${checks[item.id] ? 'text-rose-700 line-through opacity-60' : 'text-gray-900'} font-black`}>
                    {item.title}
                  </span>
                  {!checks[item.id] && <Circle size={28} className="text-gray-200 flex-shrink-0 font-black"/>}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-md mx-auto bg-white min-h-screen pb-20 font-sans font-black">
        <header className="bg-white p-6 border-b-4 border-gray-900 sticky top-0 z-20 flex justify-between items-center shadow-md font-black">
          <button onClick={() => setIsMenuOpen(true)} className="p-3 bg-gray-100 rounded-2xl active:scale-90 font-black"><Menu size={24}/></button>
          <h1 className="font-black text-gray-900 text-lg sm:text-xl flex items-center gap-1 sm:gap-2 tracking-tight font-black font-black">❤️ 하트뻥튀기 (처인휴게소)</h1>
          <div className="w-10"></div>
        </header>

        <div className="p-4 space-y-8 animate-in slide-in-from-bottom-4 duration-700 font-black font-black">
          <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-[28px] border-2 border-gray-900 mt-2 shadow-inner font-black">
             <div className="flex-1 flex flex-col font-black">
                <span className="text-[10px] text-gray-400 uppercase tracking-tighter mb-0.5 font-sans font-black">오늘 날짜</span>
                <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="text-base text-gray-900 bg-transparent border-none p-0 focus:ring-0 cursor-pointer font-black" />
             </div>
             <div className="flex gap-3">
                <div className="flex flex-col items-center">
                   <span className="text-[9px] text-gray-400 mb-1 font-sans font-black">상행선</span>
                   <span className={`text-[10px] px-3 py-1 rounded-full border-2 transition-all duration-500 font-black ${dailyStatus.상행선 === '제출완료' ? 'bg-green-600 text-white border-green-600 shadow-md' : 'bg-white text-gray-300 border-gray-200'}`}>{dailyStatus.상행선}</span>
                </div>
                <div className="flex flex-col items-center">
                   <span className="text-[9px] text-gray-400 mb-1 font-sans font-black">하행선</span>
                   <span className={`text-[10px] px-3 py-1 rounded-full border-2 transition-all duration-500 font-black ${dailyStatus.하행선 === '제출완료' ? 'bg-green-600 text-white border-green-600 shadow-md' : 'bg-white text-gray-300 border-gray-200'}`}>{dailyStatus.하행선}</span>
                </div>
             </div>
          </div>

          <section className="bg-white p-6 rounded-[44px] border-4 border-gray-900 shadow-2xl space-y-6 font-black">
            <h2 className="text-sm text-gray-900 border-l-8 border-rose-600 pl-4 uppercase tracking-widest font-black">1. 기본 정보 및 매출</h2>
            <div className="space-y-6 pt-2 font-black">
               <div className="flex flex-col gap-4 font-black">
                  <label className="text-lg text-gray-900 font-black font-black">근무 매니저</label>
                  <div className="grid grid-cols-3 gap-2 font-black font-black">
                    {allManagers.map(m => (
                      <button 
                        key={m} 
                        onClick={() => setFormData({...formData, worker: m})} 
                        className={`py-4 rounded-2xl text-sm font-black border-4 transition-all active:scale-95 ${formData.worker === m ? 'bg-gray-900 border-gray-900 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-400'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
               </div>
               <div className="flex justify-between items-center font-black">
                  <label className="text-lg text-gray-900 font-black">영업 위치</label>
                  <div className="flex gap-3 font-black">
                    {['상행선','하행선'].map(l=>(
                      <button key={l} onClick={()=>setFormData({...formData, location:l})} className={`px-7 py-4 rounded-2xl text-base font-black border-4 transition-all duration-300 active:scale-90 shadow-sm ${formData.location === l ? (l === '상행선' ? 'bg-red-600 border-red-600 text-white shadow-xl' : 'bg-blue-600 border-blue-600 text-white shadow-xl') : 'bg-white border-gray-100 text-gray-300'} font-black`}>{l}</button>
                    ))}
                  </div>
               </div>
            </div>
            <div className="space-y-4 pt-8 border-t-2 border-dashed border-gray-100 font-black font-black">
              <div className="grid grid-cols-2 gap-4 font-black">
                <div className="space-y-1">
                  <label className="text-[11px] text-gray-900 ml-1 uppercase font-sans font-black">현금 매출</label>
                  <input type="text" value={formatComma(formData.sales.cash)} onChange={e=>setFormData({...formData, sales:{...formData.sales, cash:parseComma(e.target.value)}})} className="w-full p-5 bg-gray-100 rounded-[28px] border-none outline-none font-black text-right text-gray-900 text-2xl shadow-inner focus:ring-4 ring-rose-200" placeholder="0" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-gray-900 ml-1 uppercase font-sans font-black">카드 매출</label>
                  <input type="text" value={formatComma(formData.sales.card)} onChange={e=>setFormData({...formData, sales:{...formData.sales, card:parseComma(e.target.value)}})} className="w-full p-5 bg-gray-100 rounded-[28px] border-none outline-none font-black text-right text-gray-900 text-2xl shadow-inner focus:ring-4 ring-rose-200" placeholder="0" />
                </div>
              </div>
              <div className={`p-4 rounded-[28px] flex justify-between items-center text-white shadow-2xl transition-all duration-700 transform ${formData.location === '상행선' ? 'bg-red-600' : 'bg-blue-600'} hover:scale-[1.01] font-black`}>
                <span className="text-sm font-black">오늘 마감 합계</span>
                <span className="text-xl font-black tracking-tight">{((Number(parseComma(formData.sales.cash))||0)+(Number(parseComma(formData.sales.card))||0)).toLocaleString()}원</span>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-[44px] border-4 border-gray-900 shadow-2xl space-y-6 font-black font-black">
            <h2 className="text-sm text-gray-900 border-l-8 border-rose-600 pl-4 uppercase tracking-widest font-black">2. 마감 체크리스트</h2>
            <div className="grid grid-cols-1 gap-3 pt-2 font-black">
              {Object.keys(checklistNames).map(k=>(
                <button key={k} onClick={()=>handleChecklist(k)} className={`w-full flex justify-between py-5 px-7 items-center rounded-[28px] border-4 transition-all duration-200 transform active:scale-95 ${formData.checklist[k] ? 'bg-rose-50 border-rose-600 shadow-xl' : 'border-gray-50 bg-gray-50/50'}`}>
                  <span className={`text-lg font-black transition-colors ${formData.checklist[k] ? 'text-rose-700' : 'text-gray-900'}`}>{checklistNames[k]}</span>
                  {formData.checklist[k] ? <CheckCircle2 className="text-rose-600" size={32}/> : <Circle className="text-gray-200" size={32}/>}
                </button>
              ))}
            </div>
          </section>

          <section className="bg-white p-6 rounded-[44px] border-4 border-gray-900 shadow-2xl space-y-6 font-black font-black">
            <h2 className="text-sm text-gray-900 border-l-8 border-rose-600 pl-4 uppercase tracking-widest font-black">3. 재료 및 재고 현황</h2>
            <div className="grid grid-cols-3 gap-3 pt-2 font-black">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-900 ml-1 uppercase font-sans font-black">재고(개)</label>
                <input type="number" value={formData.inventory.stockCount} onChange={e=>setFormData({...formData, inventory:{...formData.inventory, stockCount:e.target.value}})} className="w-full p-4 bg-gray-100 rounded-[24px] border-none outline-none font-black text-right text-gray-900 text-xl shadow-inner focus:ring-4 ring-rose-200" placeholder="0" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-900 ml-1 uppercase font-sans font-black">오늘 사용한 쌀(kg)</label>
                <input type="number" value={formData.inventory.usedRice} onChange={e=>setFormData({...formData, inventory:{...formData.inventory, usedRice:e.target.value}})} className="w-full p-4 bg-gray-100 rounded-[24px] border-none outline-none font-black text-right text-gray-900 text-xl shadow-inner focus:ring-4 ring-rose-200" placeholder="0" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-900 ml-1 uppercase font-sans font-black">로스(kg)</label>
                <input type="number" value={formData.inventory.loss} onChange={e=>setFormData({...formData, inventory:{...formData.inventory, loss:e.target.value}})} className="w-full p-4 bg-gray-100 rounded-[24px] border-none outline-none font-black text-right text-gray-900 text-xl shadow-inner focus:ring-4 ring-rose-200" placeholder="0" />
              </div>
            </div>
            
            <div className="pt-8 border-t-2 border-dashed border-gray-100 space-y-8 font-black font-black">
              <div className="grid grid-cols-1 gap-6 font-black font-black">
                <div className="space-y-3 font-black">
                  <p className="text-base text-gray-900 border-l-4 border-gray-900 pl-3">뻥쌀 (최소 2박스)</p>
                  <div className="flex gap-3">
                    <button onClick={()=>setFormData({...formData, inventory:{...formData.inventory, riceStatus:'충분'}})} className={`flex-1 py-4 rounded-2xl border-4 transition-all font-black ${formData.inventory.riceStatus==='충분'?'bg-blue-600 border-blue-600 text-white shadow-lg':'bg-white border-gray-100 text-gray-300'}`}>충분함</button>
                    <button onClick={()=>setFormData({...formData, inventory:{...formData.inventory, riceStatus:'부족'}})} className={`flex-1 py-4 rounded-2xl border-4 transition-all font-black ${formData.inventory.riceStatus==='부족'?'bg-red-600 border-red-600 text-white shadow-lg':'bg-white border-gray-100 text-gray-300'}`}>부족함</button>
                  </div>
                </div>
                <div className="space-y-3 font-black">
                  <p className="text-base text-gray-900 border-l-4 border-gray-900 pl-3">포장 비닐 (최소 300장)</p>
                  <div className="flex gap-3">
                    <button onClick={()=>setFormData({...formData, inventory:{...formData.inventory, bagStatus:'충분'}})} className={`flex-1 py-4 rounded-2xl border-4 transition-all font-black ${formData.inventory.bagStatus==='충분'?'bg-blue-600 border-blue-600 text-white shadow-lg':'bg-white border-gray-100 text-gray-300'}`}>충분함</button>
                    <button onClick={()=>setFormData({...formData, inventory:{...formData.inventory, bagStatus:'부족'}})} className={`flex-1 py-4 rounded-2xl border-4 transition-all font-black ${formData.inventory.bagStatus==='부족'?'bg-red-600 border-red-600 text-white shadow-lg':'bg-white border-gray-100 text-gray-300'}`}>부족함</button>
                  </div>
                </div>
                <div className="space-y-3 font-black">
                  <p className="text-base text-gray-900 border-l-4 border-gray-900 pl-3 font-black">빵끈 (최소 250개)</p>
                  <div className="flex gap-3 font-black">
                    <button onClick={()=>setFormData({...formData, inventory:{...formData.inventory, tieStatus:'충분'}})} className={`flex-1 py-4 rounded-2xl border-4 transition-all font-black ${formData.inventory.tieStatus==='충분'?'bg-blue-600 border-blue-600 text-white shadow-lg':'bg-white border-gray-100 text-gray-300'}`}>충분함</button>
                    <button onClick={()=>setFormData({...formData, inventory:{...formData.inventory, tieStatus:'부족'}})} className={`flex-1 py-4 rounded-2xl border-4 transition-all font-black ${formData.inventory.tieStatus==='부족'?'bg-red-600 border-red-600 text-white shadow-lg':'bg-white border-gray-100 text-gray-300'}`}>부족함</button>
                  </div>
                </div>
                <div className="space-y-3 font-black">
                  <p className="text-base text-gray-900 border-l-4 border-gray-900 pl-3 font-black font-black">기타 (직접 입력)</p>
                  <input type="text" value={formData.inventory.otherSupplies} onChange={e=>setFormData({...formData, inventory:{...formData.inventory, otherSupplies:e.target.value}})} className="w-full p-5 bg-gray-100 rounded-3xl border-none outline-none font-black text-gray-900 text-lg shadow-inner focus:ring-4 ring-rose-200" placeholder="그 외 부족한 물품을 적어주세요..." />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-[44px] border-4 border-gray-900 shadow-2xl space-y-6 font-black font-black font-black">
            <div className="flex justify-between items-center font-black">
              <h2 className="text-sm text-gray-900 border-l-8 border-rose-600 pl-4 uppercase tracking-widest font-black">4. 증빙 사진 촬영 (필수)</h2>
              {isUploading && <Loader2 className="w-8 h-8 text-rose-600 animate-spin"/>}
            </div>
            <div className="grid grid-cols-3 gap-4 pt-2 font-black font-black">
              {Object.keys(photoNames).map(p=>(
                <label key={p} className={`aspect-square rounded-[36px] border-4 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden relative transition-all duration-200 transform active:scale-90 ${formData.photos[p] ? 'bg-gray-50 border-rose-500 shadow-2xl scale-[1.02]' : 'bg-gray-50 border-gray-200 hover:border-gray-900'}`}>
                  <input type="file" accept="image/*" className="hidden" onChange={e=>handlePhotoChange(p, e)} disabled={isUploading} />
                  {formData.photos[p] ? <img src={formData.photos[p]} className="w-full h-full object-cover" /> : <div className="flex flex-col items-center opacity-40"><Camera size={40} className="text-gray-900 mb-2"/><span className="text-[11px] text-gray-900 uppercase tracking-tighter">{photoNames[p]}</span></div>}
                  {formData.photos[p] && <div className="absolute inset-0 bg-rose-600/10 flex items-center justify-center animate-in zoom-in duration-300"><CheckCircle2 className="text-rose-600" size={56}/></div>}
                </label>
              ))}
            </div>
          </section>

          <section className="bg-white p-6 rounded-[44px] border-4 border-gray-900 shadow-2xl space-y-6 font-black font-black font-black">
            <h2 className="text-sm text-gray-900 border-l-8 border-rose-600 pl-4 uppercase tracking-widest font-black">5. 대기 손님 파악</h2>
            <div className="flex gap-4 pt-2 font-black font-black">
              <button onClick={()=>handleWaitingToggle(true)} className={`flex-1 py-7 rounded-[28px] font-black text-xl border-4 transition-all duration-300 transform active:scale-95 ${formData.waiting.hadWaiting===true?'bg-blue-600 border-blue-600 text-white shadow-2xl':'bg-white border-gray-100 text-gray-400'}`}>손님 있었음</button>
              <button onClick={()=>handleWaitingToggle(false)} className={`flex-1 py-7 rounded-[28px] font-black text-xl border-4 transition-all duration-300 transform active:scale-95 ${formData.waiting.hadWaiting===false?'bg-gray-900 border-gray-900 text-white shadow-2xl':'bg-white border-gray-100 text-gray-400'}`}>없었음</button>
            </div>
          </section>

          <section className="bg-white p-6 rounded-[44px] border-4 border-gray-900 shadow-2xl space-y-4 font-black font-black">
            <h2 className="text-sm text-gray-900 border-l-8 border-rose-600 pl-4 uppercase tracking-widest font-black">6. 특이사항</h2>
            <textarea rows="5" value={formData.notes} onChange={e=>setFormData({...formData, notes:e.target.value})} className="w-full bg-gray-100 rounded-[36px] p-8 border-none outline-none text-lg font-black text-gray-900 placeholder:text-gray-300 shadow-inner focus:ring-4 ring-rose-100 font-black font-black font-black" placeholder="사장님께 전달할 특별한 내용이 있다면 입력해 주세요..." />
          </section>

          <div className="mt-12 p-5 pb-12 bg-white border-t-4 border-gray-900 font-black font-black font-black">
            <button onClick={submitReport} disabled={isSubmitting || isUploading} className={`w-full py-7 rounded-[32px] font-black text-2xl text-white shadow-[0_15px_40px_rgba(225,29,72,0.3)] transition-all transform active:scale-95 flex items-center justify-center gap-4 ${isSubmitting||isUploading?'bg-gray-400 border-gray-400 font-black':'bg-rose-600 hover:bg-rose-700 border-rose-700 font-black font-black font-black'}`}>
              {isSubmitting ? <Loader2 className="animate-spin font-black" size={36}/> : null} {isSubmitting ? '보고서 전송 중...' : '업무공유 제출 완료하기'}
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
        <div className="fixed inset-0 bg-black/95 z-[300] flex items-center justify-center p-8 backdrop-blur-2xl animate-in fade-in duration-300 font-black">
          <div className="bg-white p-12 rounded-[64px] w-full text-center shadow-2xl border-[12px] border-gray-900 animate-in zoom-in duration-500 font-black">
            <div className="bg-green-100 w-36 h-36 rounded-full flex items-center justify-center mx-auto mb-10 shadow-inner font-black"><CheckCircle2 size={84} className="text-green-600"/></div>
            <h3 className="text-4xl font-black mb-6 text-gray-900 tracking-tighter uppercase font-sans font-black">SUCCESS</h3>
            <p className="text-gray-500 mb-14 font-black text-2xl leading-relaxed font-black font-black">매니저님, 정말 고생 많으셨습니다!<br/>조심히 들어가세요. ✨</p>
            <button onClick={() => { window.location.reload(); }} className="w-full bg-gray-900 text-white py-8 rounded-[36px] font-black text-2xl shadow-2xl active:scale-95 transition-all uppercase tracking-widest font-sans font-black">Main Return</button>
          </div>
        </div>
      )}
      {alertMessage && (
        <div className="fixed inset-0 bg-black/85 z-[310] flex items-center justify-center p-8 backdrop-blur-sm font-black" onClick={()=>setAlertMessage('')}>
          <div className="bg-white p-12 rounded-[56px] w-full text-center border-8 border-rose-600 shadow-2xl animate-in zoom-in-95 duration-300 font-black" onClick={e=>e.stopPropagation()}>
            <div className="bg-amber-50 w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner font-black font-black font-black font-black"><AlertCircle size={64} className="text-rose-600"/></div>
            <p className="text-gray-900 font-black text-2xl mb-12 whitespace-pre-wrap leading-relaxed tracking-tight font-black font-black">{String(alertMessage)}</p>
            <button onClick={()=>setAlertMessage('')} className="w-full bg-gray-900 text-white py-7 rounded-[32px] font-black text-2xl active:scale-95 transition-all font-black">확인 완료</button>
          </div>
        </div>
      )}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/98 z-[100] flex flex-col items-center justify-center p-6 animate-in fade-in duration-300 font-black font-black font-black" onClick={()=>setSelectedPhoto(null)}>
          <div className="absolute top-8 right-8 flex gap-8 font-black font-black">
             <a href={selectedPhoto.url} download={`하트뻥튀기_${selectedPhoto.date}_${selectedPhoto.name}.jpg`} className="p-5 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors shadow-2xl font-black font-black font-black" onClick={e=>e.stopPropagation()}><Download size={36}/></a>
             <button className="p-5 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors shadow-2xl font-black font-black"><X size={36}/></button>
          </div>
          <img src={selectedPhoto.url} className="max-w-full max-h-[80vh] rounded-[40px] shadow-2xl border-4 border-white/20 animate-in zoom-in duration-500 font-black font-black font-black" />
          <div className="text-center mt-10 text-white font-black animate-in slide-in-from-bottom-4 font-black font-black">
            <p className="text-4xl mb-3 tracking-tighter uppercase font-sans font-black font-black">{String(selectedPhoto.name)}</p>
            <p className="text-gray-500 text-xl uppercase tracking-[0.2em] font-sans font-black font-black font-black">{String(selectedPhoto.date)} | {String(selectedPhoto.worker)} MANAGER</p>
          </div>
        </div>
      )}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/85 z-[200] flex items-center justify-center p-8 backdrop-blur-md animate-in fade-in duration-200 font-black font-black font-black font-black">
           <div className="bg-white p-12 rounded-[56px] w-full max-w-sm text-center border-[10px] border-red-600 shadow-2xl animate-in zoom-in-95 duration-300 font-black font-black font-black">
              <div className="bg-red-50 w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner font-black"><AlertCircle size={64} className="text-red-600"/></div>
              <p className="font-black text-gray-900 mb-12 text-3xl tracking-tight leading-tight font-black">정말 이 항목을<br/>영구 삭제하시겠습니까?</p>
              <div className="flex gap-4 font-black font-black font-black">
                 <button onClick={()=>setDeleteConfirmId(null)} className="flex-1 py-6 bg-gray-100 rounded-[28px] font-black text-xl text-gray-500 hover:bg-gray-200 transition-colors font-black font-black">취소</button>
                 <button onClick={()=>executeDelete(deleteConfirmId.id)} className="flex-1 py-6 bg-red-600 text-white rounded-[28px] font-black shadow-2xl active:scale-95 transition-all font-black font-black font-black font-black font-black">삭제 승인</button>
              </div>
           </div>
        </div>
      )}
    </>
  );
}