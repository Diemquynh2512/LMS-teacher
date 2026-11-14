import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import AuthView from './components/AuthView';
import ApiConnectModal from './components/ApiConnectModal';
import SubmissionDrawer from './components/SubmissionDrawer';
import {
  FlaskConical,
  LogOut,
  Plus,
  KeyRound,
  FileSpreadsheet,
  Users,
  CheckCircle2,
  Clock,
  Eye,
  Power,
  Trash2,
  RefreshCw,
} from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Dữ liệu lớp học, phiếu học tập, bài nộp
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [worksheets, setWorksheets] = useState([]);
  const [selectedWorksheetCode, setSelectedWorksheetCode] = useState('');
  const [submissions, setSubmissions] = useState([]);

  // Form tạo lớp & tạo phiếu mới
  const [newClassName, setNewClassName] = useState('');
  const [newClassCode, setNewClassCode] = useState('');
  const [newWsTitle, setNewWsTitle] = useState('Phiếu học tập Bài 18: Tính chất chung của kim loại');

  // Modal API & Ngăn kéo xem bài nộp
  const [apiModalWs, setApiModalWs] = useState(null);
  const [activeSubmission, setActiveSubmission] = useState(null);
  const [creatingWs, setCreatingWs] = useState(false);

  // 1. Theo dõi phiên đăng nhập
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Tải danh sách lớp khi đã đăng nhập
  useEffect(() => {
    if (session) {
      fetchClasses();
    }
  }, [session]);

  // 3. Tải danh sách phiếu khi đổi lớp
  useEffect(() => {
    if (selectedClassId) {
      fetchWorksheets(selectedClassId);
    } else {
      setWorksheets([]);
      setSelectedWorksheetCode('');
    }
  }, [selectedClassId]);

  // 4. Tải bài nộp & lắng nghe Realtime khi chọn phiếu
  useEffect(() => {
    if (!selectedWorksheetCode) {
      setSubmissions([]);
      return;
    }

    fetchSubmissions(selectedWorksheetCode);

    const channel = supabase
      .channel(`submissions-${selectedWorksheetCode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'submissions',
          filter: `worksheet_code=eq.${selectedWorksheetCode}`,
        },
        () => {
          fetchSubmissions(selectedWorksheetCode);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedWorksheetCode]);

  const fetchClasses = async () => {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) {
      setClasses(data);
      if (data.length > 0 && !selectedClassId) {
        setSelectedClassId(data[0].id);
      }
    }
  };

  const fetchWorksheets = async (classId) => {
    const { data, error } = await supabase
      .from('worksheets')
      .select('*')
      .eq('class_id', classId)
      .order('created_at', { ascending: false });
    if (!error && data) {
      setWorksheets(data);
      if (data.length > 0) {
        setSelectedWorksheetCode(data[0].worksheet_code);
      } else {
        setSelectedWorksheetCode('');
      }
    }
  };

  const fetchSubmissions = async (wsCode) => {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('worksheet_code', wsCode)
      .order('submitted_at', { ascending: false });
    if (!error && data) {
      setSubmissions(data);
    }
  };

  // Tạo lớp học mới
  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!newClassName.trim() || !newClassCode.trim()) return;

    const cleanCode = newClassCode.trim().toUpperCase().replace(/\s+/g, '-');
    const { data, error } = await supabase
      .from('classes')
      .insert({
        teacher_id: session.user.id,
        class_name: newClassName.trim(),
        class_code: cleanCode,
      })
      .select()
      .single();

    if (error) {
      alert('Không thể tạo lớp (có thể mã lớp đã tồn tại): ' + error.message);
      return;
    }

    setNewClassName('');
    setNewClassCode('');
    await fetchClasses();
    setSelectedClassId(data.id);
  };

  // Tạo phiếu học tập & bật kết nối API ngay lập tức
  const handleCreateWorksheetAndApi = async (e) => {
    e.preventDefault();
    if (!selectedClassId || !newWsTitle.trim()) return;
    setCreatingWs(true);

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const generatedWsCode = `PHT-B18-${randomSuffix}`;

    const { data, error } = await supabase
      .from('worksheets')
      .insert({
        class_id: selectedClassId,
        worksheet_code: generatedWsCode,
        title: newWsTitle.trim(),
        api_active: true,
      })
      .select()
      .single();

    setCreatingWs(false);

    if (error) {
      alert('Lỗi tạo phiếu học tập: ' + error.message);
      return;
    }

    await fetchWorksheets(selectedClassId);
    setSelectedWorksheetCode(data.worksheet_code);
    // Mở ngay Modal cấp mã phiếu, mã lớp & thông tin tích hợp API
    setApiModalWs(data);
  };

  // Bật / Tắt cổng nhận bài của phiếu
  const toggleWorksheetApi = async (ws) => {
    const { error } = await supabase
      .from('worksheets')
      .update({ api_active: !ws.api_active })
      .eq('id', ws.id);
    if (!error) {
      fetchWorksheets(selectedClassId);
    }
  };

  // Xóa bài nộp
  const handleDeleteSubmission = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa bài nộp của nhóm này?')) return;
    const { error } = await supabase.from('submissions').delete().eq('id', id);
    if (!error) {
      fetchSubmissions(selectedWorksheetCode);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] text-[#6E5D55]">
        Đang tải dữ liệu hệ thống...
      </div>
    );
  }

  if (!session) {
    return <AuthView />;
  }

  const currentClass = classes.find((c) => c.id === selectedClassId);
  const currentWorksheet = worksheets.find((w) => w.worksheet_code === selectedWorksheetCode);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#3B2F2F]">
      {/* Thanh điều hướng trên cùng */}
      <header className="bg-white border-b border-[#E4D8C8] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#B85D3B] text-white flex items-center justify-center">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base text-[#3B2F2F]">Teacher LMS — KHTN 9</h1>
              <p className="text-xs text-[#6E5D55] hidden sm:block">
                Kết nối tự động Phiếu học tập & Phòng thí nghiệm ảo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[#6E5D55] hidden md:inline">{session.user.email}</span>
            <button
              onClick={() => supabase.auth.signOut()}
              className="px-3.5 py-2 rounded-xl border border-[#E4D8C8] hover:bg-[#F2EBE1] text-xs font-medium flex items-center gap-1.5 transition"
            >
              <LogOut className="w-4 h-4" />
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CỘT TRÁI: Quản lý Lớp & Tạo phiếu + Tạo kết nối API */}
        <div className="lg:col-span-4 space-y-6">
          {/* 1. Chọn / Tạo lớp học */}
          <section className="bg-white border border-[#E4D8C8] rounded-2xl p-5 shadow-2xs">
            <h2 className="font-bold text-sm uppercase tracking-wider text-[#6E5D55] mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#B85D3B]" />
              1. Lớp học giảng dạy
            </h2>

            {classes.length > 0 && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-[#6E5D55] mb-1">Chọn lớp đang dạy:</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E4D8C8] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#B85D3B]"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.class_name} (Mã: {c.class_code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <form onSubmit={handleCreateClass} className="space-y-2.5 pt-2 border-t border-[#F2EBE1]">
              <p className="text-xs font-semibold text-[#3B2F2F]">Thêm lớp mới:</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="Tên lớp (VD: Lớp 9A1)"
                  className="px-3 py-2 bg-[#FAF7F2] border border-[#E4D8C8] rounded-xl text-xs focus:outline-none focus:border-[#B85D3B]"
                />
                <input
                  type="text"
                  required
                  value={newClassCode}
                  onChange={(e) => setNewClassCode(e.target.value)}
                  placeholder="Mã lớp (VD: KHTN9-9A1)"
                  className="px-3 py-2 bg-[#FAF7F2] border border-[#E4D8C8] rounded-xl text-xs uppercase focus:outline-none focus:border-[#B85D3B]"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-3 bg-[#F2EBE1] hover:bg-[#E4D8C8] text-[#3B2F2F] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Tạo lớp học
              </button>
            </form>
          </section>

          {/* 2. Tạo phiếu & Cấp kết nối API */}
          <section className="bg-white border border-[#E4D8C8] rounded-2xl p-5 shadow-2xs">
            <h2 className="font-bold text-sm uppercase tracking-wider text-[#6E5D55] mb-3 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#B85D3B]" />
              2. Phiếu học tập & Kết nối API
            </h2>

            {!selectedClassId ? (
              <p className="text-xs text-[#6E5D55] italic">
                Hãy tạo một lớp học ở mục trên trước khi tạo phiếu học tập.
              </p>
            ) : (
              <>
                <form onSubmit={handleCreateWorksheetAndApi} className="space-y-3 mb-5">
                  <div>
                    <label className="block text-xs font-medium text-[#6E5D55] mb-1">
                      Tên phiếu học tập mới:
                    </label>
                    <input
                      type="text"
                      required
                      value={newWsTitle}
                      onChange={(e) => setNewWsTitle(e.target.value)}
                      className="w-full px-3.5 py-2 bg-[#FAF7F2] border border-[#E4D8C8] rounded-xl text-xs focus:outline-none focus:border-[#B85D3B]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={creatingWs}
                    className="w-full py-2.5 px-4 bg-[#B85D3B] hover:bg-[#9A4A2D] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-2xs transition"
                  >
                    <KeyRound className="w-4 h-4" />
                    {creatingWs ? 'Đang khởi tạo...' : 'Tạo phiếu & Tạo kết nối API'}
                  </button>
                </form>

                {/* Danh sách phiếu của lớp */}
                <div className="space-y-2.5 border-t border-[#F2EBE1] pt-4">
                  <p className="text-xs font-semibold text-[#6E5D55]">
                    Danh sách phiếu của lớp ({worksheets.length}):
                  </p>
                  {worksheets.length === 0 ? (
                    <p className="text-xs text-[#6E5D55] italic">Chưa có phiếu nào được tạo.</p>
                  ) : (
                    worksheets.map((ws) => {
                      const isSelected = ws.worksheet_code === selectedWorksheetCode;
                      return (
                        <div
                          key={ws.id}
                          onClick={() => setSelectedWorksheetCode(ws.worksheet_code)}
                          className={`p-3 rounded-xl border cursor-pointer transition ${
                            isSelected
                              ? 'bg-[#F2EBE1] border-[#B85D3B]'
                              : 'bg-[#FAF7F2] border-[#E4D8C8] hover:border-[#B85D3B]/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs font-bold text-[#3B2F2F]">{ws.title}</p>
                              <span className="inline-block mt-1 text-[11px] font-mono px-2 py-0.5 rounded-md bg-white border border-[#E4D8C8] text-[#B85D3B]">
                                {ws.worksheet_code}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                ws.api_active
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-stone-200 text-stone-600'
                              }`}
                            >
                              {ws.api_active ? 'Đang mở' : 'Đã khóa'}
                            </span>
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-[#E4D8C8]/60 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setApiModalWs(ws);
                              }}
                              className="text-[11px] font-semibold text-[#B85D3B] hover:underline flex items-center gap-1"
                            >
                              <KeyRound className="w-3 h-3" />
                              Xem mã API & Link HS
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleWorksheetApi(ws);
                              }}
                              className="text-[11px] text-[#6E5D55] hover:text-[#3B2F2F] flex items-center gap-1"
                            >
                              <Power className="w-3 h-3" />
                              {ws.api_active ? 'Khóa cổng nộp' : 'Mở lại cổng'}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </section>
        </div>

        {/* CỘT PHẢI: Bảng tiếp nhận bài làm của các nhóm (Realtime) */}
        <div className="lg:col-span-8">
          <section className="bg-white border border-[#E4D8C8] rounded-2xl p-6 shadow-2xs min-h-[520px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F2EBE1]">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-base text-[#3B2F2F]">
                    Bài nộp của các nhóm học sinh
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#B85D3B] text-white">
                    {submissions.length} nhóm
                  </span>
                </div>
                <p className="text-xs text-[#6E5D55] mt-0.5">
                  {currentWorksheet
                    ? `${currentWorksheet.title} — Mã phiếu: ${currentWorksheet.worksheet_code}`
                    : 'Chọn hoặc tạo một phiếu học tập ở cột bên trái để theo dõi bài nộp'}
                </p>
              </div>

              {selectedWorksheetCode && (
                <button
                  onClick={() => fetchSubmissions(selectedWorksheetCode)}
                  className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#E4D8C8] hover:bg-[#F2EBE1] text-xs font-medium flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Làm mới
                </button>
              )}
            </div>

            {!selectedWorksheetCode ? (
              <div className="py-20 text-center text-sm text-[#6E5D55]">
                Chưa chọn phiếu học tập nào. Hãy tạo phiếu và nhấn <strong>Tạo kết nối API</strong> để bắt đầu nhận bài.
              </div>
            ) : submissions.length === 0 ? (
              <div className="py-20 text-center space-y-2">
                <p className="text-sm font-medium text-[#3B2F2F]">
                  Chưa có nhóm nào nộp bài cho phiếu {selectedWorksheetCode}
                </p>
                <p className="text-xs text-[#6E5D55]">
                  Hệ thống đang lắng nghe tự động (Realtime). Ngay khi học sinh nhấn Nộp phiếu, bài làm sẽ xuất hiện tại đây.
                </p>
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E4D8C8] text-[11px] font-bold uppercase tracking-wider text-[#6E5D55]">
                      <th className="py-3 px-3">Nhóm / Thành viên</th>
                      <th className="py-3 px-3">Thời gian nộp</th>
                      <th className="py-3 px-3">Trạng thái</th>
                      <th className="py-3 px-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2EBE1] text-sm">
                    {submissions.map((sub) => (
                      <tr
                        key={sub.id}
                        onClick={() => setActiveSubmission(sub)}
                        className="hover:bg-[#FAF7F2] cursor-pointer transition"
                      >
                        <td className="py-3.5 px-3">
                          <p className="font-bold text-[#3B2F2F]">{sub.group_name}</p>
                          <p className="text-xs text-[#6E5D55] line-clamp-1">
                            {sub.members || 'Không ghi danh sách thành viên'}
                          </p>
                        </td>
                        <td className="py-3.5 px-3 text-xs text-[#6E5D55]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(sub.submitted_at).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            - {new Date(sub.submitted_at).toLocaleDateString('vi-VN')}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          {sub.teacher_score !== null && sub.teacher_score !== undefined ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {sub.teacher_score} điểm
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                              Chờ chấm
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveSubmission(sub);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-[#B85D3B] hover:bg-[#9A4A2D] text-white text-xs font-medium inline-flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Xem bài làm
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSubmission(sub.id);
                              }}
                              title="Xóa bài nộp"
                              className="p-1.5 rounded-lg text-[#6E5D55] hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Modal cấp mã & cấu hình kết nối API */}
      <ApiConnectModal
        isOpen={Boolean(apiModalWs)}
        onClose={() => setApiModalWs(null)}
        worksheet={apiModalWs}
        classObj={currentClass}
      />

      {/* Ngăn kéo xem chi tiết toàn bộ câu trả lời từng nhóm */}
      <SubmissionDrawer
        submission={activeSubmission}
        onClose={() => setActiveSubmission(null)}
        onSaved={() => fetchSubmissions(selectedWorksheetCode)}
      />
    </div>
  );
}
