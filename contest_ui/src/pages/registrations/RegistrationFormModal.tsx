import { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Award, AlertCircle } from 'lucide-react';
import type { Registration, JoinItem } from '../../services/contestService';
import { db } from '../../services/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

interface FormModalProps {
  registration: Registration | null; // null means create new manual registration
  contestId: string; // active contestId
  onClose: () => void;
  onSave: (reg: Registration) => Promise<boolean>;
}

interface Category {
  contestCategoryId: string;
  contestCategoryTitle: string;
  contestCategoryGender: string;
  contestCategoryPriceType: string;
}

interface Grade {
  contestGradeId: string;
  contestGradeTitle: string;
  refCategoryId: string;
}

export default function RegistrationFormModal({ registration, contestId, onClose, onSave }: FormModalProps) {
  // 모바일 화면 감지 상태
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [playerName, setPlayerName] = useState(registration?.playerName || '');
  const [playerGender, setPlayerGender] = useState<'m' | 'f'>(registration?.playerGender || 'm');
  const [playerBirth, setPlayerBirth] = useState(registration?.playerBirth || '');
  const [playerTel, setPlayerTel] = useState(registration?.playerTel || '');
  const [playerEmail, setPlayerEmail] = useState(registration?.playerEmail || '');
  const [playerGym, setPlayerGym] = useState(registration?.playerGym || '');
  const [playerText, setPlayerText] = useState(registration?.playerText || '');
  const [joins, setJoins] = useState<JoinItem[]>(registration?.joins || []);
  const [contestPriceSum, setContestPriceSum] = useState(registration?.contestPriceSum || 80000); // Default basic price
  const [contestPriceExtra, setContestPriceExtra] = useState(30000); // Default extra price
  const [contestPriceTotal, setContestPriceTotal] = useState(registration?.contestPriceTotal || 0);
  
  // Contest meta settings loaded from Firestore
  const [categories, setCategories] = useState<Category[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [selectedCatId, setSelectedCatId] = useState('');
  const [selectedGradeId, setSelectedGradeId] = useState('');
  const [isLoadingMeta, setIsLoadingMeta] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Phone number formatter (010-XXXX-XXXX)
  const formatPhoneNumber = (value: string) => {
    const clean = value.replace(/[^0-9]/g, '');
    if (clean.length < 4) return clean;
    if (clean.length < 8) return `${clean.slice(0, 3)}-${clean.slice(3)}`;
    return `${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7, 11)}`;
  };

  // Load contest meta structure (categories & grades)
  useEffect(() => {
    async function loadContestMeta() {
      if (!contestId) return;
      setIsLoadingMeta(true);
      try {
        // 1. 공고 정보(contest_notice) 먼저 조회 및 refContestId 추출
        let noticeDoc = await getDoc(doc(db, 'contest_notice', contestId));
        let refContestId = contestId;

        if (!noticeDoc.exists()) {
          // contestId가 refContestId(Contest ID)일 경우 refContestId 필드로 검색
          const noticeQuery = query(collection(db, 'contest_notice'), where('refContestId', '==', contestId));
          const noticeSnap = await getDocs(noticeQuery);
          if (!noticeSnap.empty) {
            noticeDoc = noticeSnap.docs[0];
          }
        }

        if (noticeDoc.exists()) {
          const noticeData = noticeDoc.data();
          refContestId = noticeData.refContestId;
          
          if (!refContestId) {
            throw new Error('대회 공고(contest_notice)에 연동된 대회 식별자(refContestId)가 누락되었습니다.');
          }

          const basic = noticeData.contestPriceBasic ? Number(noticeData.contestPriceBasic) : 80000;
          const extra = noticeData.contestPriceExtra ? Number(noticeData.contestPriceExtra) : 30000;
          
          if (!registration) {
            setContestPriceSum(basic);
            setContestPriceExtra(extra);
            setContestPriceTotal(joins.length === 0 ? 0 : basic + (joins.length - 1) * extra);
          } else {
            setContestPriceSum(registration.contestPriceSum || basic);
            setContestPriceExtra(extra);
          }
        }

        // 2. 실제 대회 상세(contests) 조회
        const contestDoc = await getDoc(doc(db, 'contests', refContestId));
        if (contestDoc.exists()) {
          const meta = contestDoc.data();
          
          // Load Categories
          if (meta.contestCategorysListId) {
            const catDoc = await getDoc(doc(db, 'contest_categorys_list', meta.contestCategorysListId));
            if (catDoc.exists()) {
              setCategories(catDoc.data().categorys || []);
            }
          }
          
          // Load Grades
          if (meta.contestGradesListId) {
            const gradeDoc = await getDoc(doc(db, 'contest_grades_list', meta.contestGradesListId));
            if (gradeDoc.exists()) {
              setGrades(gradeDoc.data().grades || []);
            }
          }
        }
      } catch (err) {
        console.error('대회 카테고리 정보 로드 실패:', err);
      } finally {
        setIsLoadingMeta(false);
      }
    }

    loadContestMeta();
  }, [contestId, registration, joins.length]);

  // Handle adding join item
  const handleAddJoin = () => {
    if (!selectedCatId || !selectedGradeId) return;

    const cat = categories.find((c) => c.contestCategoryId === selectedCatId);
    const gr = grades.find((g) => g.contestGradeId === selectedGradeId);

    if (!cat || !gr) return;

    // Check duplicate join
    const isDup = joins.some(
      (j) => j.contestCategoryId === selectedCatId && j.contestGradeId === selectedGradeId
    );

    if (isDup) {
      alert('이미 동일한 종목 및 체급이 추가되어 있습니다.');
      return;
    }

    const newItem: JoinItem = {
      contestCategoryId: cat.contestCategoryId,
      contestCategoryTitle: cat.contestCategoryTitle,
      contestGradeId: gr.contestGradeId,
      contestGradeTitle: gr.contestGradeTitle
    };

    const newJoins = [...joins, newItem];
    setJoins(newJoins);
    setSelectedGradeId(''); // reset grade

    // Recalculate price total
    const total = contestPriceSum + (newJoins.length - 1) * contestPriceExtra;
    setContestPriceTotal(total);
  };

  // Handle deleting join item
  const handleDeleteJoin = (idx: number) => {
    const newJoins = joins.filter((_, i) => i !== idx);
    setJoins(newJoins);

    // Recalculate price total
    const total = newJoins.length === 0 ? 0 : contestPriceSum + (newJoins.length - 1) * contestPriceExtra;
    setContestPriceTotal(total);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation
    if (!playerName.trim()) {
      setErrorMsg('참가자 이름을 입력해주세요.');
      return;
    }
    if (!playerBirth.trim()) {
      setErrorMsg('생년월일(YYYY-MM-DD)을 입력해주세요.');
      return;
    }
    if (!playerTel.trim() || playerTel.length < 12) {
      setErrorMsg('올바른 전화번호를 입력해주세요.');
      return;
    }
    if (!playerGym.trim()) {
      setErrorMsg('소속 헬스클럽(Gym)명을 입력해주세요.');
      return;
    }
    if (joins.length === 0) {
      setErrorMsg('최소 하나 이상의 참가 종목을 선택해주세요.');
      return;
    }

    const payload: Registration = {
      id: registration?.id || `invoice_${contestId}_manual_${Date.now()}`,
      playerUid: registration?.playerUid || `manual_${Date.now()}`,
      playerName: playerName.trim(),
      playerGender,
      playerBirth: playerBirth.trim(),
      playerTel: playerTel.trim(),
      playerEmail: playerEmail.trim() || undefined,
      playerGym: playerGym.trim(),
      playerText: playerText.trim() || undefined,
      playerPhotoUrl: registration?.playerPhotoUrl,
      playerPhotoUrls: registration?.playerPhotoUrls,
      playerService: registration?.playerService || false,
      joins,
      contestPriceSum,
      contestPriceTotal,
      playerAge: registration?.playerAge || null,
      isPriceCheck: registration?.isPriceCheck || false,
      isCanceled: registration?.isCanceled || false,
      invoiceEdited: true,
      createBy: registration?.createBy || 'admin_portal',
      invoiceCreateAt: registration?.invoiceCreateAt || new Date().toISOString(),
      submittedAt: registration?.submittedAt || new Date().toISOString(),
      contestId
    };

    const success = await onSave(payload);
    if (success) {
      onClose();
    }
  };

  // Filter grades list based on selected category
  const filteredGrades = grades.filter((g) => g.refCategoryId === selectedCatId);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            {registration ? '참가 신청 정보 수정' : '신규 수동 접수 등록'}
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {errorMsg && (
              <div className="alert-message error" style={{ margin: 0 }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>{errorMsg}</div>
              </div>
            )}

            {/* Basic Info Group */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">참가자명</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="본명을 입력하세요"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">성별 (Gender)</label>
                <select
                  className="form-select"
                  value={playerGender}
                  onChange={(e) => setPlayerGender(e.target.value as 'm' | 'f')}
                >
                  <option value="m">남성 (Male)</option>
                  <option value="f">여성 (Female)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">생년월일 (YYYY-MM-DD)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="예: 1995-04-12"
                  value={playerBirth}
                  onChange={(e) => setPlayerBirth(e.target.value)}
                  maxLength={10}
                />
              </div>

              <div className="form-group">
                <label className="form-label">연락처</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="예: 010-1234-5678"
                  value={playerTel}
                  onChange={(e) => setPlayerTel(formatPhoneNumber(e.target.value))}
                  maxLength={13}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">이메일 (Email)</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="예: athlete@domain.com"
                  value={playerEmail}
                  onChange={(e) => setPlayerEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">소속 (Gym)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="소속 헬스장명을 입력하세요"
                  value={playerGym}
                  onChange={(e) => setPlayerGym(e.target.value)}
                />
              </div>
            </div>

            {/* Category / Join Section */}
            <div className="joins-selector-box">
              <span className="form-label" style={{ marginBottom: '8px', display: 'block' }}>참가 종목 추가</span>
              
              {isLoadingMeta ? (
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>대회 카테고리를 로드하는 중...</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '8px' }}>
                  <select
                    className="form-select"
                    style={{ flex: 1, margin: 0 }}
                    value={selectedCatId}
                    onChange={(e) => {
                      setSelectedCatId(e.target.value);
                      setSelectedGradeId('');
                    }}
                  >
                    <option value="">-- 종목(카테고리) 선택 --</option>
                    {categories.map((c) => (
                      <option key={c.contestCategoryId} value={c.contestCategoryId}>
                        {c.contestCategoryTitle}
                      </option>
                    ))}
                  </select>

                  <select
                    className="form-select"
                    style={{ flex: 1, margin: 0 }}
                    value={selectedGradeId}
                    onChange={(e) => setSelectedGradeId(e.target.value)}
                    disabled={!selectedCatId}
                  >
                    <option value="">-- 체급/체급 선택 --</option>
                    {filteredGrades.map((g) => (
                      <option key={g.contestGradeId} value={g.contestGradeId}>
                        {g.contestGradeTitle}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className="btn-primary"
                    style={{ padding: isMobile ? '10px 16px' : '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={handleAddJoin}
                    disabled={!selectedCatId || !selectedGradeId}
                  >
                    <Plus size={16} />
                    추가
                  </button>
                </div>
              )}

              {/* Selected Joins List */}
              <div className="selected-joins-list">
                {joins.map((j, idx) => (
                  <div key={idx} className="selected-join-row">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                      <Award size={14} className="text-accent" style={{ color: 'var(--color-accent)' }} />
                      {j.contestCategoryTitle} - {j.contestGradeTitle}
                    </span>
                    <button type="button" onClick={() => handleDeleteJoin(idx)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Calculations */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', borderTop: '1px solid var(--color-divider)', paddingTop: '16px' }}>
              <div className="form-group">
                <label className="form-label">기본 참가비 (원)</label>
                <input
                  type="number"
                  className="form-input"
                  value={contestPriceSum}
                  onChange={(e) => {
                    const newSum = Number(e.target.value);
                    setContestPriceSum(newSum);
                    setContestPriceTotal(joins.length === 0 ? 0 : newSum + (joins.length - 1) * contestPriceExtra);
                  }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">최종 책정 참가비 (원)</label>
                <input
                  type="number"
                  className="form-input"
                  style={{ color: 'var(--color-accent)', fontWeight: 'bold' }}
                  value={contestPriceTotal}
                  onChange={(e) => setContestPriceTotal(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">비고 (전달 사항)</label>
              <textarea
                className="form-input"
                style={{ height: '80px', resize: 'none', fontFamily: 'inherit' }}
                placeholder="전달 및 보조 기록할 특이사항 기재"
                value={playerText}
                onChange={(e) => setPlayerText(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="btn-primary">
              <Save size={16} />
              저장하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
