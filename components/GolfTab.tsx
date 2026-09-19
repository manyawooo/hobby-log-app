'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type GolfScore = {
  id: number;
  course_name: string;
  play_date: string;
  total_score: number;
  total_putts?: number;
  memo?: string;
};

type Props = {
  selectedMonth: string;
};

export default function GolfTab({ selectedMonth }: Props) {
  const [scores, setScores] = useState<GolfScore[]>([]);

  // 入力フォーム
  const [courseName, setCourseName] = useState('');
  const [playDate, setPlayDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalScore, setTotalScore] = useState<number | ''>(90);
  const [totalPutts, setTotalPutts] = useState<number | ''>(36);
  const [memo, setMemo] = useState('');

  useEffect(() => {
    fetchScores();
  }, [selectedMonth]);

  const fetchScores = async () => {
    let query = supabase
      .from('golf_scores')
      .select('*')
      .order('play_date', { ascending: false });

    if (selectedMonth !== 'all') {
      const start = `${selectedMonth}-01`;
      const [year, month] = selectedMonth.split('-').map(Number);
      const nextMonth = new Date(year, month, 0).getDate();
      const end = `${selectedMonth}-${nextMonth}`;
      query = query.gte('play_date', start).lte('play_date', end);
    }

    const { data } = await query;
    if (data) setScores(data);
  };

  const handleAddScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName.trim() || !totalScore) return;

    const { error } = await supabase.from('golf_scores').insert([
      {
        course_name: courseName,
        play_date: playDate,
        total_score: Number(totalScore),
        total_putts: totalPutts ? Number(totalPutts) : null,
        memo,
      },
    ]);

    if (!error) {
      setCourseName('');
      setMemo('');
      fetchScores();
    }
  };

  // ベストスコアと平均スコアの計算
  const bestScore = scores.length > 0 ? Math.min(...scores.map((s) => s.total_score)) : null;
  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((acc, s) => acc + s.total_score, 0) / scores.length)
      : null;

  return (
    <div className="space-y-6">
      {/* スタッツ表示エリア */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm text-center">
          <div className="text-xs text-gray-500 font-semibold mb-1">ベストスコア</div>
          <div className="text-3xl font-extrabold text-green-600">
            {bestScore !== null ? bestScore : '-'}
          </div>
        </div>
        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm text-center">
          <div className="text-xs text-gray-500 font-semibold mb-1">平均スコア</div>
          <div className="text-3xl font-extrabold text-slate-700">
            {avgScore !== null ? avgScore : '-'}
          </div>
        </div>
      </div>

      {/* 登録フォーム */}
      <details className="bg-white p-4 rounded-3xl shadow-sm border border-green-100">
        <summary className="font-bold text-green-900 cursor-pointer">⛳ ラウンド結果を記録する</summary>
        <form onSubmit={handleAddScore} className="mt-4 space-y-3">
          <input
            type="text"
            placeholder="ゴルフ場名（例: ○○カントリークラブ）"
            required
            className="w-full border rounded-xl p-2.5 text-sm"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              type="date"
              required
              className="border rounded-xl p-2.5 text-xs"
              value={playDate}
              onChange={(e) => setPlayDate(e.target.value)}
            />
            <input
              type="number"
              placeholder="スコア"
              required
              className="border rounded-xl p-2.5 text-xs"
              value={totalScore}
              onChange={(e) => setTotalScore(Number(e.target.value) || '')}
            />
            <input
              type="number"
              placeholder="パット数"
              className="border rounded-xl p-2.5 text-xs"
              value={totalPutts}
              onChange={(e) => setTotalPutts(Number(e.target.value) || '')}
            />
          </div>
          <input
            type="text"
            placeholder="メモ（天候、課題、使用ドライバーなど）"
            className="w-full border rounded-xl p-2.5 text-sm"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
          <button
            type="submit"
            className="w-full bg-green-600 text-white rounded-xl py-2 text-sm font-semibold hover:bg-green-700 transition"
          >
            スコアを保存
          </button>
        </form>
      </details>

      {/* スコア一覧表示 */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-gray-600">Round History</h2>
        {scores.length === 0 ? (
          <p className="text-xs text-gray-400 bg-white p-4 rounded-2xl">ラウンド記録がありません。</p>
        ) : (
          <div className="space-y-2">
            {scores.map((s) => (
              <div
                key={s.id}
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between"
              >
                <div>
                  <div className="text-xs text-gray-400">{s.play_date}</div>
                  <div className="font-bold text-gray-800 text-sm">{s.course_name}</div>
                  {s.memo && <div className="text-xs text-gray-500 mt-1">{s.memo}</div>}
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-green-700">{s.total_score}</div>
                  {s.total_putts && (
                    <div className="text-xs text-gray-400">{s.total_putts} putts</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}