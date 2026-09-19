'use client';

import { useState } from 'react';

type Props = {
  currentTab: 'plants' | 'coffee' | 'golf';
  setCurrentTab: (tab: 'plants' | 'coffee' | 'golf') => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
};

export default function Navbar({
  currentTab,
  setCurrentTab,
  selectedMonth,
  setSelectedMonth,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  // 直近12ヶ月分の月リスト（例: 2026-09）を生成
  const getMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      options.push(`${year}-${month}`);
    }
    return options;
  };

  const navItems = [
    { id: 'plants', label: '🪴 観葉植物' },
    { id: 'coffee', label: '☕ コーヒー' },
    { id: 'golf', label: '⛳ ゴルフ' },
  ] as const;

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* ハンバーガーボタン */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-xl text-gray-700 hover:bg-gray-100 transition"
          aria-label="メニューを開く"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* アプリタイトル */}
        <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 via-amber-600 to-emerald-800 bg-clip-text text-transparent">
          マイ趣味ログ
        </h1>

        {/* 月別絞り込みドロップダウン */}
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-gray-700"
        >
          <option value="all">すべての月</option>
          {getMonthOptions().map((m) => (
            <option key={m} value={m}>
              {m.replace('-', '年')}月
            </option>
          ))}
        </select>
      </div>

      {/* スライド式ドロワーメニュー */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* 背景オーバーレイ */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* サイドバー */}
          <div className="relative bg-white w-72 max-w-[80vw] h-full shadow-2xl p-6 flex flex-col justify-between z-10">
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-lg font-bold text-gray-800">趣味カテゴリ</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>

              <nav className="space-y-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentTab(item.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-2xl font-medium transition flex items-center gap-3 ${
                      currentTab === item.id
                        ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xl">{item.label.split(' ')[0]}</span>
                    <span>{item.label.split(' ')[1]}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="text-xs text-gray-400 text-center border-t pt-4">
              © My Hobby Log App
            </div>
          </div>
        </div>
      )}
    </header>
  );
}