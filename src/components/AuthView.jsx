import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { FlaskConical, Mail, Lock, LogIn, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AuthView() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage({
          type: 'success',
          text: 'Đăng ký thành công! Nếu chưa tắt Confirm email trên Supabase, hãy xác nhận tài khoản trong mục Users trước khi đăng nhập.',
        });
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] px-4">
      <div className="max-w-md w-full bg-white border border-[#E4D8C8] rounded-2xl shadow-sm p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#F2EBE1] text-[#B85D3B] flex items-center justify-center mb-3">
            <FlaskConical className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-[#3B2F2F]">Teacher LMS — KHTN 9</h1>
          <p className="text-sm text-[#6E5D55] mt-1">
            Hệ thống quản lý phiếu học tập & phòng thí nghiệm ảo
          </p>
        </div>

        {message.text && (
          <div
            className={`mb-4 p-3 rounded-xl text-sm flex items-start gap-2 ${
              message.type === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            {message.type === 'error' ? (
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#6E5D55] mb-1.5">
              Email giáo viên
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#6E5D55] absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="giaovien@truongthcs.edu.vn"
                className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#E4D8C8] rounded-xl text-sm focus:outline-none focus:border-[#B85D3B]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#6E5D55] mb-1.5">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#6E5D55] absolute left-3.5 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#E4D8C8] rounded-xl text-sm focus:outline-none focus:border-[#B85D3B]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#B85D3B] hover:bg-[#9A4A2D] text-white font-medium rounded-xl text-sm flex items-center justify-center gap-2 transition disabled:opacity-60"
          >
            {isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            {loading ? 'Đang xử lý...' : isSignUp ? 'Tạo tài khoản giáo viên' : 'Đăng nhập bảng điều khiển'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-[#F2EBE1] text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setMessage({ type: '', text: '' });
            }}
            className="text-sm text-[#B85D3B] hover:underline font-medium"
          >
            {isSignUp ? 'Đã có tài khoản? Quay lại đăng nhập' : 'Chưa có tài khoản? Đăng ký giáo viên mới'}
          </button>
        </div>
      </div>
    </div>
  );
}
