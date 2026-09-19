'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import imageCompression from 'browser-image-compression';

type Plant = {
  id: number;
  name: string;
  species?: string;
  purchase_date?: string;
  purchase_location?: string;
  location_tag?: string;
  sunlight_condition?: string;
  main_image_url?: string;
  last_watered_at?: string;
};

type PlantLog = {
  id: number;
  plant_id: number;
  log_date: string;
  action_type: string;
  memo?: string;
  image_url?: string;
};

type Props = {
  selectedMonth: string;
};

export default function PlantsTab({ selectedMonth }: Props) {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [logs, setLogs] = useState<PlantLog[]>([]);
  const [selectedPlantId, setSelectedPlantId] = useState<number | null>(null);

  // 新規植物フォーム
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [locationTag, setLocationTag] = useState('');
  const [plantImage, setPlantImage] = useState<File | null>(null);

  // お手入れログフォーム
  const [actionType, setActionType] = useState('水やり');
  const [memo, setMemo] = useState('');
  const [logImage, setLogImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchPlants();
  }, []);

  useEffect(() => {
    if (selectedPlantId) {
      fetchLogs(selectedPlantId);
    }
  }, [selectedPlantId, selectedMonth]);

  const fetchPlants = async () => {
    const { data } = await supabase.from('plants').select('*').order('id', { ascending: false });
    if (data) {
      setPlants(data);
      if (data.length > 0 && !selectedPlantId) {
        setSelectedPlantId(data[0].id);
      }
    }
  };

  const fetchLogs = async (plantId: number) => {
    let query = supabase
      .from('plant_logs')
      .select('*')
      .eq('plant_id', plantId)
      .order('log_date', { ascending: false });

    if (selectedMonth !== 'all') {
      const start = `${selectedMonth}-01`;
      const [year, month] = selectedMonth.split('-').map(Number);
      const nextMonth = new Date(year, month, 0).getDate();
      const end = `${selectedMonth}-${nextMonth}`;
      query = query.gte('log_date', start).lte('log_date', end);
    }

    const { data } = await query;
    if (data) setLogs(data);
  };

  // 画像圧縮 & アップロード関数
  const uploadCompressedImage = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      const options = {
        maxWidthOrHeight: 1000,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      const fileName = `${Date.now()}_${compressedFile.name}`;

      const { error: uploadError } = await supabase.storage
        .from('hobby-images')
        .upload(fileName, compressedFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('hobby-images').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (e) {
      alert('画像のアップロードに失敗しました。');
      return null;
    } finally {
      setUploading(false);
    }
  };

  // 植物登録
  const handleAddPlant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let imageUrl: string | null = null;
    if (plantImage) {
      imageUrl = await uploadCompressedImage(plantImage);
    }

    const { data, error } = await supabase
      .from('plants')
      .insert([{ name, species, location_tag: locationTag, main_image_url: imageUrl }])
      .select();

    if (!error && data) {
      setName('');
      setSpecies('');
      setLocationTag('');
      setPlantImage(null);
      fetchPlants();
      setSelectedPlantId(data[0].id);
    }
  };

  // お手入れログ追加
  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlantId) return;

    let imageUrl: string | null = null;
    if (logImage) {
      imageUrl = await uploadCompressedImage(logImage);
    }

    const nowIso = new Date().toISOString();

    const { error } = await supabase.from('plant_logs').insert([
      {
        plant_id: selectedPlantId,
        action_type: actionType,
        memo,
        image_url: imageUrl,
      },
    ]);

    if (!error) {
      // 水やりの場合は last_watered_at を更新
      if (actionType === '水やり') {
        await supabase
          .from('plants')
          .update({ last_watered_at: nowIso })
          .eq('id', selectedPlantId);
        fetchPlants();
      }

      setMemo('');
      setLogImage(null);
      fetchLogs(selectedPlantId);
    }
  };

  // 前回水やりからの経過日数を計算
  const getDaysSinceWatered = (lastWateredAt?: string) => {
    if (!lastWateredAt) return null;
    const last = new Date(lastWateredAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - last.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const selectedPlant = plants.find((p) => p.id === selectedPlantId);
  const daysSinceWater = selectedPlant ? getDaysSinceWatered(selectedPlant.last_watered_at) : null;

  return (
    <div className="space-y-6">
      {/* 新規植物の追加フォーム */}
      <details className="bg-white p-4 rounded-3xl shadow-sm border border-emerald-100">
        <summary className="font-bold text-emerald-800 cursor-pointer">🪴 新しい植物をお迎え・登録する</summary>
        <form onSubmit={handleAddPlant} className="mt-4 space-y-3">
          <input
            type="text"
            placeholder="植物の名前（例: モンステラ）"
            required
            className="w-full border rounded-xl p-2.5 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="text"
            placeholder="品種・学名"
            className="w-full border rounded-xl p-2.5 text-sm"
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
          />
          <input
            type="text"
            placeholder="設置場所（例: リビング窓際）"
            className="w-full border rounded-xl p-2.5 text-sm"
            value={locationTag}
            onChange={(e) => setLocationTag(e.target.value)}
          />
          <div>
            <label className="block text-xs text-gray-500 mb-1">メイン写真</label>
            <input
              type="file"
              accept="image/*"
              className="text-xs"
              onChange={(e) => setPlantImage(e.target.files?.[0] || null)}
            />
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-emerald-600 text-white rounded-xl py-2 text-sm font-semibold hover:bg-emerald-700 transition"
          >
            植物を登録
          </button>
        </form>
      </details>

      {/* 植物一覧（横スクロール選択） */}
      <div>
        <h2 className="text-sm font-bold text-gray-600 mb-2">My Plants</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {plants.map((plant) => {
            const days = getDaysSinceWatered(plant.last_watered_at);
            return (
              <button
                key={plant.id}
                onClick={() => setSelectedPlantId(plant.id)}
                className={`shrink-0 p-3 rounded-2xl border text-left transition flex items-center gap-3 ${
                  selectedPlantId === plant.id
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                    : 'bg-white text-gray-800 border-gray-200'
                }`}
              >
                {plant.main_image_url ? (
                  <img
                    src={plant.main_image_url}
                    alt={plant.name}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-xl shrink-0">
                    🪴
                  </div>
                )}
                <div>
                  <div className="font-bold text-sm">{plant.name}</div>
                  <div className={`text-xs ${selectedPlantId === plant.id ? 'text-emerald-100' : 'text-gray-500'}`}>
                    {days !== null ? `💧 ${days}日前` : '水やり未記録'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 選択中植物のログと追加フォーム */}
      {selectedPlant && (
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-800">{selectedPlant.name}</h2>
              <p className="text-xs text-gray-500">
                {selectedPlant.species} {selectedPlant.location_tag && `📍 ${selectedPlant.location_tag}`}
              </p>
            </div>
            <div className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
              daysSinceWater === null
                ? 'bg-gray-100 text-gray-500'
                : daysSinceWater >= 7
                ? 'bg-red-100 text-red-700'
                : 'bg-blue-100 text-blue-700'
            }`}>
              {daysSinceWater === null
                ? '水やり未記録'
                : daysSinceWater === 0
                ? '💧 今日水やり済み'
                : `💧 最後の水やりから ${daysSinceWater}日経過`}
            </div>
          </div>

          {/* お手入れログ追加フォーム */}
          <form onSubmit={handleAddLog} className="bg-gray-50 p-4 rounded-2xl space-y-3">
            <div className="flex gap-2">
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="bg-white border rounded-xl px-3 py-1.5 text-sm font-medium"
              >
                <option value="水やり">💧 水やり</option>
                <option value="葉水">🌿 葉水</option>
                <option value="肥料">🧪 肥料/活力剤</option>
                <option value="剪定">✂️ 剪定</option>
                <option value="植え替え">🪴 植え替え</option>
                <option value="成長記録">📷 成長記録</option>
              </select>
              <input
                type="text"
                placeholder="メモ（新芽が出た、など）"
                className="flex-1 bg-white border rounded-xl px-3 py-1.5 text-sm"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
              />
            </div>
            <div className="flex justify-between items-center">
              <input
                type="file"
                accept="image/*"
                className="text-xs text-gray-500"
                onChange={(e) => setLogImage(e.target.files?.[0] || null)}
              />
              <button
                type="submit"
                disabled={uploading}
                className="bg-emerald-600 text-white px-4 py-1.5 rounded-xl text-xs font-semibold hover:bg-emerald-700 transition"
              >
                記録する
              </button>
            </div>
          </form>

          {/* タイムライン表示 */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-700">お手入れタイムライン</h3>
            {logs.length === 0 ? (
              <p className="text-xs text-gray-400">選択した期間の記録はありません。</p>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="p-3 bg-gray-50 rounded-2xl flex gap-3 items-start">
                    <span className="text-xs font-bold bg-white px-2.5 py-1 rounded-xl shadow-sm shrink-0">
                      {log.action_type}
                    </span>
                    <div className="flex-1 space-y-1">
                      <div className="text-xs text-gray-400">{log.log_date}</div>
                      {log.memo && <p className="text-sm text-gray-700">{log.memo}</p>}
                      {log.image_url && (
                        <img
                          src={log.image_url}
                          alt="Log image"
                          className="w-24 h-24 rounded-xl object-cover mt-2"
                        />
                      )}
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