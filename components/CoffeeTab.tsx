'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

type CoffeeBean = {
  id: number;
  name: string;
  shop_name?: string;
  origin_country?: string;
  roast_level?: string;
};

type Recipe = {
  id: number;
  bean_id: number;
  brew_style: string;
  bean_weight_g?: number;
  water_volume_ml?: number;
  acidity: number;
  bitterness: number;
  sweetness: number;
  body: number;
  aroma: number;
  memo?: string;
  created_at: string;
};

type Props = {
  selectedMonth: string;
};

export default function CoffeeTab({ selectedMonth }: Props) {
  const [beans, setBeans] = useState<CoffeeBean[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedBeanId, setSelectedBeanId] = useState<number | null>(null);

  // 豆フォーム
  const [beanName, setBeanName] = useState('');
  const [shopName, setShopName] = useState('');
  const [originCountry, setOriginCountry] = useState('');
  const [roastLevel, setRoastLevel] = useState('中煎り');

  // レシピフォーム
  const [brewStyle, setBrewStyle] = useState('ハンドドリップ');
  const [beanWeight, setBeanWeight] = useState<number | ''>(15);
  const [waterVolume, setWaterVolume] = useState<number | ''>(230);
  const [acidity, setAcidity] = useState(3);
  const [bitterness, setBitterness] = useState(3);
  const [sweetness, setSweetness] = useState(3);
  const [body, setBody] = useState(3);
  const [aroma, setAroma] = useState(3);
  const [memo, setMemo] = useState('');

  useEffect(() => {
    fetchBeans();
  }, []);

  useEffect(() => {
    if (selectedBeanId) {
      fetchRecipes(selectedBeanId);
    }
  }, [selectedBeanId, selectedMonth]);

  const fetchBeans = async () => {
    const { data } = await supabase.from('coffee_beans').select('*').order('id', { ascending: false });
    if (data) {
      setBeans(data);
      if (data.length > 0 && !selectedBeanId) setSelectedBeanId(data[0].id);
    }
  };

  const fetchRecipes = async (beanId: number) => {
    let query = supabase
      .from('coffee_recipes')
      .select('*')
      .eq('bean_id', beanId)
      .order('created_at', { ascending: false });

    if (selectedMonth !== 'all') {
      const start = `${selectedMonth}-01T00:00:00`;
      const [year, month] = selectedMonth.split('-').map(Number);
      const nextMonth = new Date(year, month, 0).getDate();
      const end = `${selectedMonth}-${nextMonth}T23:59:59`;
      query = query.gte('created_at', start).lte('created_at', end);
    }

    const { data } = await query;
    if (data) setRecipes(data);
  };

  const handleAddBean = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!beanName.trim()) return;

    const { data, error } = await supabase
      .from('coffee_beans')
      .insert([{ name: beanName, shop_name: shopName, origin_country: originCountry, roast_level: roastLevel }])
      .select();

    if (!error && data) {
      setBeanName('');
      setShopName('');
      setOriginCountry('');
      fetchBeans();
      setSelectedBeanId(data[0].id);
    }
  };

  const handleAddRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBeanId) return;

    const { error } = await supabase.from('coffee_recipes').insert([
      {
        bean_id: selectedBeanId,
        brew_style: brewStyle,
        bean_weight_g: beanWeight || null,
        water_volume_ml: waterVolume || null,
        acidity,
        bitterness,
        sweetness,
        body,
        aroma,
        memo,
      },
    ]);

    if (!error) {
      setMemo('');
      fetchRecipes(selectedBeanId);
    }
  };

  const selectedBean = beans.find((b) => b.id === selectedBeanId);

  return (
    <div className="space-y-6">
      <details className="bg-white p-4 rounded-3xl shadow-sm border border-amber-100">
        <summary className="font-bold text-amber-900 cursor-pointer">☕ 新しいコーヒー豆を登録する</summary>
        <form onSubmit={handleAddBean} className="mt-4 space-y-3">
          <input
            type="text"
            placeholder="豆の名前・銘柄"
            required
            className="w-full border rounded-xl p-2.5 text-sm"
            value={beanName}
            onChange={(e) => setBeanName(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="ショップ・ロースター名"
              className="border rounded-xl p-2.5 text-sm"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
            />
            <input
              type="text"
              placeholder="生産国"
              className="border rounded-xl p-2.5 text-sm"
              value={originCountry}
              onChange={(e) => setOriginCountry(e.target.value)}
            />
          </div>
          <select
            value={roastLevel}
            onChange={(e) => setRoastLevel(e.target.value)}
            className="w-full border rounded-xl p-2.5 text-sm"
          >
            <option value="浅煎り">浅煎り</option>
            <option value="中煎り">中煎り</option>
            <option value="深煎り">深煎り</option>
          </select>

          <button type="submit" className="w-full bg-amber-700 text-white rounded-xl py-2 text-sm font-semibold">
            豆を登録
          </button>
        </form>
      </details>

      <div>
        <h2 className="text-sm font-bold text-gray-600 mb-2">Coffee Beans</h2>
        {beans.length === 0 ? (
          <p className="text-xs text-gray-400 bg-white p-4 rounded-2xl">登録されたコーヒー豆がありません。</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {beans.map((bean) => (
              <button
                key={bean.id}
                onClick={() => setSelectedBeanId(bean.id)}
                className={`shrink-0 p-3 rounded-2xl border text-left transition flex items-center gap-3 ${
                  selectedBeanId === bean.id
                    ? 'bg-amber-700 text-white border-amber-700 shadow-md'
                    : 'bg-white text-gray-800 border-gray-200'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-xl shrink-0">☕</div>
                <div>
                  <div className="font-bold text-sm">{bean.name}</div>
                  <div className={`text-xs ${selectedBeanId === bean.id ? 'text-amber-100' : 'text-gray-500'}`}>
                    {bean.shop_name || bean.roast_level}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedBean && (
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{selectedBean.name}</h2>
            <p className="text-xs text-gray-500">
              {selectedBean.shop_name && `🏪 ${selectedBean.shop_name} `}
              🔥 {selectedBean.roast_level}
            </p>
          </div>

          <form onSubmit={handleAddRecipe} className="bg-amber-50/40 p-4 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-amber-900">☕ 抽出レシピ & テイスティング</h3>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="抽出方法"
                className="border bg-white rounded-xl p-2 text-xs"
                value={brewStyle}
                onChange={(e) => setBrewStyle(e.target.value)}
              />
              <input
                type="number"
                placeholder="豆量(g)"
                className="border bg-white rounded-xl p-2 text-xs"
                value={beanWeight}
                onChange={(e) => setBeanWeight(Number(e.target.value) || '')}
              />
              <input
                type="number"
                placeholder="湯量(ml)"
                className="border bg-white rounded-xl p-2 text-xs"
                value={waterVolume}
                onChange={(e) => setWaterVolume(Number(e.target.value) || '')}
              />
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <label>酸味: {acidity} <input type="range" min="1" max="5" value={acidity} onChange={(e) => setAcidity(Number(e.target.value))} className="w-full" /></label>
              <label>苦味: {bitterness} <input type="range" min="1" max="5" value={bitterness} onChange={(e) => setBitterness(Number(e.target.value))} className="w-full" /></label>
              <label>甘味: {sweetness} <input type="range" min="1" max="5" value={sweetness} onChange={(e) => setSweetness(Number(e.target.value))} className="w-full" /></label>
              <label>コク: {body} <input type="range" min="1" max="5" value={body} onChange={(e) => setBody(Number(e.target.value))} className="w-full" /></label>
              <label>香り: {aroma} <input type="range" min="1" max="5" value={aroma} onChange={(e) => setAroma(Number(e.target.value))} className="w-full" /></label>
            </div>

            <input
              type="text"
              placeholder="メモ"
              className="w-full border bg-white rounded-xl p-2 text-xs"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />

            <button type="submit" className="w-full bg-amber-700 text-white py-2 rounded-xl text-xs font-semibold">
              レシピを保存
            </button>
          </form>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-700">抽出履歴 & レーダーチャート</h3>
            {recipes.length === 0 ? (
              <p className="text-xs text-gray-400">レシピログはありません。</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recipes.map((r) => (
                  <div key={r.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-lg">{r.brew_style}</span>
                      <span>{r.created_at.split('T')[0]}</span>
                    </div>

                    <div className="w-full h-44 flex justify-center">
                      <Radar
                        data={{
                          labels: ['酸味', '苦味', '甘味', 'ボディ', '香り'],
                          datasets: [
                            {
                              label: '味評価',
                              data: [r.acidity, r.bitterness, r.sweetness, r.body, r.aroma],
                              backgroundColor: 'rgba(180, 83, 9, 0.2)',
                              borderColor: 'rgba(180, 83, 9, 1)',
                              borderWidth: 2,
                            },
                          ],
                        }}
                        options={{
                          scales: { r: { min: 0, max: 5, ticks: { stepSize: 1, display: false } } },
                          plugins: { legend: { display: false } },
                          maintainAspectRatio: false,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}