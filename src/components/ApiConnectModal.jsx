import React, { useState } from 'react';
import { X, Copy, Check, Link2, Code2, Sparkles, ExternalLink } from 'lucide-react';

export default function ApiConnectModal({ isOpen, onClose, worksheet, classObj }) {
  const [copiedKey, setCopiedKey] = useState('');
  const [studentAppUrl, setStudentAppUrl] = useState('https://username.github.io/khtn9-bai18-lab/');

  if (!isOpen || !worksheet || !classObj) return null;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wdcvqhvroqldopyspzcp.supabase.co';
  const apiEndpoint = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/submit-worksheet`;

  const configSnippet = `const LMS_CONFIG = {
  API_URL: "${apiEndpoint}",
  DEFAULT_CLASS_CODE: "${classObj.class_code}",
  DEFAULT_WORKSHEET_CODE: "${worksheet.worksheet_code}"
};`;

  const cleanBaseUrl = studentAppUrl.trim().replace(/\/$/, '');
  const autoFillStudentLink = `${cleanBaseUrl}/?class=${encodeURIComponent(
    classObj.class_code
  )}&ws=${encodeURIComponent(worksheet.worksheet_code)}`;

  const handleCopy = (key, text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white border border-[#E4D8C8] rounded-2xl max-w-2xl w-full shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-[#F2EBE1] border-b border-[#E4D8C8] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#B85D3B] text-white flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-[#3B2F2F] text-base">Thông tin Kết nối API Phiếu học tập</h2>
              <p className="text-xs text-[#6E5D55]">
                {worksheet.title} • Lớp {classObj.class_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#6E5D55] hover:bg-[#E4D8C8]/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {/* Bước 2: Mã định danh */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E4D8C8]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6E5D55]">
                Mã lớp (Class Code)
              </span>
              <div className="mt-1 flex items-center justify-between">
                <code className="text-base font-bold text-[#B85D3B]">{classObj.class_code}</code>
                <button
                  onClick={() => handleCopy('class', classObj.class_code)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-white border border-[#E4D8C8] hover:border-[#B85D3B] flex items-center gap-1"
                >
                  {copiedKey === 'class' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey === 'class' ? 'Đã chép' : 'Sao chép'}
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E4D8C8]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6E5D55]">
                Mã phiếu (Worksheet Code)
              </span>
              <div className="mt-1 flex items-center justify-between">
                <code className="text-base font-bold text-[#B85D3B]">{worksheet.worksheet_code}</code>
                <button
                  onClick={() => handleCopy('ws', worksheet.worksheet_code)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-white border border-[#E4D8C8] hover:border-[#B85D3B] flex items-center gap-1"
                >
                  {copiedKey === 'ws' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey === 'ws' ? 'Đã chép' : 'Sao chép'}
                </button>
              </div>
            </div>
          </div>

          {/* Endpoint API */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6E5D55] mb-1.5">
              1. Endpoint tiếp nhận bài nộp (Supabase Edge Function)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={apiEndpoint}
                className="flex-1 px-3.5 py-2 bg-[#FAF7F2] border border-[#E4D8C8] rounded-xl text-xs font-mono text-[#3B2F2F]"
              />
              <button
                onClick={() => handleCopy('endpoint', apiEndpoint)}
                className="px-3 py-2 rounded-xl bg-[#F2EBE1] hover:bg-[#E4D8C8] text-[#3B2F2F] text-xs font-medium flex items-center gap-1.5 shrink-0"
              >
                {copiedKey === 'endpoint' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copiedKey === 'endpoint' ? 'Đã chép' : 'Chép URL'}
              </button>
            </div>
          </div>

          {/* Đoạn mã cấu hình dán vào file HTML phiếu học tập */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#6E5D55] flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-[#B85D3B]" />
                2. Cấu hình nhúng vào Website Phiếu học tập
              </label>
              <button
                onClick={() => handleCopy('snippet', configSnippet)}
                className="text-xs font-medium text-[#B85D3B] hover:underline flex items-center gap-1"
              >
                {copiedKey === 'snippet' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === 'snippet' ? 'Đã sao chép đoạn mã' : 'Sao chép khối cấu hình'}
              </button>
            </div>
            <pre className="p-3.5 rounded-xl bg-[#2B2320] text-[#FAF7F2] text-xs font-mono overflow-x-auto leading-relaxed">
              {configSnippet}
            </pre>
          </div>

          {/* Tạo link gửi thẳng cho học sinh (tự điền mã) */}
          <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E4D8C8] space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#6E5D55] flex items-center gap-1.5">
              <Link2 className="w-4 h-4 text-[#B85D3B]" />
              3. Tạo đường link gửi học sinh (Tự động điền sẵn Mã lớp & Mã phiếu)
            </label>
            <input
              type="url"
              value={studentAppUrl}
              onChange={(e) => setStudentAppUrl(e.target.value)}
              placeholder="Nhập URL trang web phiếu học tập của bạn..."
              className="w-full px-3 py-2 bg-white border border-[#E4D8C8] rounded-lg text-xs focus:outline-none focus:border-[#B85D3B]"
            />
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                readOnly
                value={autoFillStudentLink}
                className="flex-1 px-3 py-2 bg-white border border-[#E4D8C8] rounded-lg text-xs font-mono text-[#B85D3B]"
              />
              <button
                onClick={() => handleCopy('studentLink', autoFillStudentLink)}
                className="px-3.5 py-2 rounded-lg bg-[#B85D3B] hover:bg-[#9A4A2D] text-white text-xs font-medium flex items-center gap-1.5 shrink-0"
              >
                {copiedKey === 'studentLink' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === 'studentLink' ? 'Đã chép link' : 'Chép link HS'}
              </button>
              <a
                href={autoFillStudentLink}
                target="_blank"
                rel="noreferrer"
                title="Mở thử trang phiếu học tập"
                className="p-2 rounded-lg border border-[#E4D8C8] bg-white hover:bg-[#F2EBE1] text-[#3B2F2F]"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#FAF7F2] border-t border-[#E4D8C8] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#3B2F2F] text-white text-sm font-medium hover:opacity-90"
          >
            Hoàn tất
          </button>
        </div>
      </div>
    </div>
  );
}
