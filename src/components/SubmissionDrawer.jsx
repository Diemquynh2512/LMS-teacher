import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  X,
  Users,
  Clock,
  CheckCircle2,
  Award,
  MessageSquare,
  FlaskConical,
  Eye,
  Lightbulb,
  Save,
} from 'lucide-react';

export default function SubmissionDrawer({ submission, onClose, onSaved }) {
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (submission) {
      setScore(submission.teacher_score ?? '');
      setFeedback(submission.teacher_feedback ?? '');
      setSavedNotice(false);
    }
  }, [submission]);

  if (!submission) return null;

  const answers = submission.answers || {};
  const task1 = answers.task1_predictions || answers.predictions || {};
  const task2 = answers.task2_observations || answers.observations || [];
  const task3 = answers.task3_explanations || answers.explanations || {};

  const handleSaveGrade = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedNotice(false);

    try {
      const numericScore = score === '' ? null : parseFloat(score);
      const { error } = await supabase
        .from('submissions')
        .update({
          teacher_score: numericScore,
          teacher_feedback: feedback,
        })
        .eq('id', submission.id);

      if (error) throw error;
      setSavedNotice(true);
      if (onSaved) onSaved();
    } catch (err) {
      alert('Lỗi khi lưu điểm: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Hàm hỗ trợ hiển thị linh hoạt nhiều cấu trúc JSON bài làm
  const renderGenericEntries = (data) => {
    if (!data) return <p className="text-sm text-[#6E5D55] italic">Nhóm chưa nhập dữ liệu phần này.</p>;
    if (typeof data === 'string') return <p className="text-sm whitespace-pre-line">{data}</p>;

    if (Array.isArray(data)) {
      if (data.length === 0) return <p className="text-sm text-[#6E5D55] italic">Chưa có dòng dữ liệu nào.</p>;
      return (
        <div className="space-y-3">
          {data.map((item, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E4D8C8] text-sm space-y-1.5">
              {typeof item === 'object' && item !== null ? (
                Object.entries(item).map(([k, v]) => (
                  <div key={k} className="flex flex-col sm:flex-row sm:gap-2">
                    <span className="font-semibold text-[#6E5D55] min-w-[140px]">{k}:</span>
                    <span className="text-[#3B2F2F] whitespace-pre-line">{String(v || '—')}</span>
                  </div>
                ))
              ) : (
                <span>{String(item)}</span>
              )}
            </div>
          ))}
        </div>
      );
    }

    const entries = Object.entries(data);
    if (entries.length === 0) {
      return <p className="text-sm text-[#6E5D55] italic">Nhóm chưa nhập dữ liệu phần này.</p>;
    }

    return (
      <div className="divide-y divide-[#F2EBE1] border border-[#E4D8C8] rounded-xl overflow-hidden bg-white">
        {entries.map(([key, val]) => (
          <div key={key} className="p-3.5 flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wide text-[#B85D3B]">{key}</span>
            <span className="text-sm text-[#3B2F2F] whitespace-pre-line">
              {typeof val === 'object' && val !== null ? JSON.stringify(val, null, 2) : String(val || '—')}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-3xl bg-[#FAF7F2] h-full shadow-2xl border-l border-[#E4D8C8] flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header ngăn kéo */}
        <div className="px-6 py-4 bg-white border-b border-[#E4D8C8] flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F2EBE1] text-[#B85D3B]">
                {submission.class_code}
              </span>
              <span className="text-xs font-mono text-[#6E5D55]">{submission.worksheet_code}</span>
            </div>
            <h2 className="text-lg font-bold text-[#3B2F2F] mt-1">{submission.group_name}</h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#6E5D55] mt-1">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                Thành viên: {submission.members || 'Không ghi'}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Nộp lúc: {new Date(submission.submitted_at).toLocaleString('vi-VN')}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F2EBE1] text-[#3B2F2F] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung toàn bộ câu trả lời của nhóm */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Nhiệm vụ 1 */}
          <section className="bg-white border border-[#E4D8C8] rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-[#F2EBE1] text-[#B85D3B] flex items-center justify-center">
                <FlaskConical className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-[#3B2F2F]">
                Nhiệm vụ 1: Dự đoán hiện tượng phản ứng của kim loại
              </h3>
            </div>
            {renderGenericEntries(task1)}
          </section>

          {/* Nhiệm vụ 2 */}
          <section className="bg-white border border-[#E4D8C8] rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-[#F2EBE1] text-[#B85D3B] flex items-center justify-center">
                <Eye className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-[#3B2F2F]">
                Nhiệm vụ 2: Nhật ký quan sát thí nghiệm & Cấp độ vi mô
              </h3>
            </div>

            {Array.isArray(task2) && task2.length > 0 && typeof task2[0] === 'object' ? (
              <div className="overflow-x-auto border border-[#E4D8C8] rounded-xl">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#F2EBE1] text-[#3B2F2F] text-xs uppercase">
                      {Object.keys(task2[0]).map((col) => (
                        <th key={col} className="py-2.5 px-3 border-b border-[#E4D8C8] font-bold">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2EBE1]">
                    {task2.map((row, idx) => (
                      <tr key={idx} className="hover:bg-[#FAF7F2]">
                        {Object.values(row).map((val, cIdx) => (
                          <td key={cIdx} className="py-2.5 px-3 align-top whitespace-pre-line">
                            {String(val || '—')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              renderGenericEntries(task2)
            )}
          </section>

          {/* Nhiệm vụ 3 */}
          <section className="bg-white border border-[#E4D8C8] rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-[#F2EBE1] text-[#B85D3B] flex items-center justify-center">
                <Lightbulb className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-[#3B2F2F]">
                Nhiệm vụ 3: Giải thích cơ chế & Bản chất phản ứng
              </h3>
            </div>
            {renderGenericEntries(task3)}
          </section>
        </div>

        {/* Thanh chấm điểm & nhận xét cố định ở đáy */}
        <form
          onSubmit={handleSaveGrade}
          className="p-4 bg-white border-t border-[#E4D8C8] shrink-0 space-y-3"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="sm:w-36">
              <label className="block text-[11px] font-bold uppercase text-[#6E5D55] mb-1 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-[#B85D3B]" />
                Điểm số (0-10)
              </label>
              <input
                type="number"
                step="0.25"
                min="0"
                max="10"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="VD: 9.5"
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E4D8C8] rounded-xl text-sm font-bold text-[#3B2F2F] focus:outline-none focus:border-[#B85D3B]"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-bold uppercase text-[#6E5D55] mb-1 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-[#B85D3B]" />
                Nhận xét của giáo viên
              </label>
              <input
                type="text"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Nhập nhận xét gửi lại cho nhóm..."
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E4D8C8] rounded-xl text-sm focus:outline-none focus:border-[#B85D3B]"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-5 py-2 bg-[#B85D3B] hover:bg-[#9A4A2D] text-white rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Đang lưu...' : 'Lưu đánh giá'}
              </button>
            </div>
          </div>
          {savedNotice && (
            <p className="text-xs text-emerald-700 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Đã lưu điểm và nhận xét cho {submission.group_name}!
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
