'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import Navbar from '@/components/Navbar';
import PlantsTab from '@/components/PlantsTab';
import CoffeeTab from '@/components/CoffeeTab';
import GolfTab from '@/components/GolfTab'; // ← 追加

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState('');

  const [currentTab, setCurrentTab] = useState<'plants' | 'coffee' | 'golf'>('plants');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setAuthError(error.message);
      else {
        alert('登録完了！ログインしてください。');
        setIsSignUp(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setAuthError('ログインに失敗しました。');
    }
  };

  if (!user) {
    return (
      <main className="min-h-screen p-8 bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full space-y-6">
          <h1 className="text-2xl font-bold text-center text-gray-900">
            {isSignUp ? '新規アカウント作成' : '趣味ログにログイン'}
          </h1>
          {authError && <p className="text-red-500 text-sm text-center">{authError}</p>}
          <form onSubmit={handleAuth} className="space-y-4">
            <input
              type="email"
              required
              placeholder="メールアドレス"
              className="w-full border rounded p-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="パスワード"
              className="w-full border rounded p-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="w-full bg-emerald-600 text-white py-2 rounded font-semibold">
              {isSignUp ? '登録する' : 'ログイン'}
            </button>
          </form>
          <button
            onClick={() => { setIsSignUp(!isSignUp); setAuthError(''); }}
            className="w-full text-sm text-emerald-600 hover:underline text-center block"
          >
            {isSignUp ? 'ログイン画面へ' : '新規アカウント作成'}
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
      />
      <main className="max-w-4xl mx-auto px-4 py-6">
        {currentTab === 'plants' && <PlantsTab selectedMonth={selectedMonth} />}
        {currentTab === 'coffee' && <CoffeeTab selectedMonth={selectedMonth} />}
        {currentTab === 'golf' && <GolfTab selectedMonth={selectedMonth} />} {/* ← 差し替え */}
      </main>
    </div>
  );
}