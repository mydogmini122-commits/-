
import React, { useState, useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { RetirementData, CalculationResult, RoastResult } from './types';
import { getToxicAdvice } from './services/geminiService';

const App: React.FC = () => {
  const [data, setData] = useState<RetirementData>({
    gender: 'male',
    currentAge: 30,
    retireAge: 65,
    currentSavings: 500000,
    monthlySavings: 15000,
    expectedROI: 5,
    inflationRate: 2,
    monthlyExpenses: 40000,
    expectedLifeSpan: 85,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [roast, setRoast] = useState<RoastResult | null>(null);

  const calculateResults = useMemo((): CalculationResult => {
    const yearsToRetire = Math.max(0, data.retireAge - data.currentAge);
    const yearsInRetirement = Math.max(0, data.expectedLifeSpan - data.retireAge);
    
    const monthlyROI = (data.expectedROI / 100) / 12;
    const monthlyInflation = (data.inflationRate / 100) / 12;

    const dataPoints: Array<{ age: number; balance: number }> = [];
    let currentBalance = data.currentSavings;
    let projectedTotalAtRetirement = 0;
    
    // Phase 1: Accumulation
    for (let month = 0; month <= yearsToRetire * 12; month++) {
      const age = data.currentAge + month / 12;
      if (month % 12 === 0) {
        dataPoints.push({ age: Math.floor(age), balance: Math.max(0, Math.round(currentBalance)) });
      }
      currentBalance = (currentBalance + data.monthlySavings) * (1 + monthlyROI);
    }
    projectedTotalAtRetirement = currentBalance;

    // Phase 2: Retirement
    let totalNeededForRetirement = 0;
    let tempBalance = projectedTotalAtRetirement;
    let currentMonthlyExpense = data.monthlyExpenses;
    
    // Adjust expense to the start of retirement
    currentMonthlyExpense = data.monthlyExpenses * Math.pow(1 + data.inflationRate / 100, yearsToRetire);

    for (let month = 1; month <= yearsInRetirement * 12; month++) {
      const age = data.retireAge + month / 12;
      tempBalance = (tempBalance - currentMonthlyExpense) * (1 + monthlyROI);
      currentMonthlyExpense *= (1 + monthlyInflation);
      
      if (month % 12 === 0) {
        dataPoints.push({ age: Math.floor(age), balance: Math.max(0, Math.round(tempBalance)) });
      }
      totalNeededForRetirement += currentMonthlyExpense;
    }

    const isEnough = tempBalance >= 0;
    const shortfall = isEnough ? 0 : Math.abs(tempBalance);
    
    // Estimate years covered if balance runs out
    let yearsCovered = 0;
    let testBalance = projectedTotalAtRetirement;
    let testExpense = data.monthlyExpenses * Math.pow(1 + data.inflationRate / 100, yearsToRetire);
    while (testBalance > 0 && yearsCovered < 100) {
      testBalance = (testBalance - (testExpense * 12)) * (1 + data.expectedROI / 100);
      testExpense *= (1 + data.inflationRate / 100);
      if (testBalance > 0) yearsCovered++;
    }

    return { 
      totalNeeded: totalNeededForRetirement, 
      projectedTotal: projectedTotalAtRetirement, 
      shortfall, 
      isEnough, 
      yearsCovered, 
      dataPoints 
    };
  }, [data]);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const result = await getToxicAdvice(data, calculateResults);
    setRoast(result);
    setIsLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setData(prev => ({ 
      ...prev, 
      [name]: type === 'number' ? Number(value) : value 
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 text-slate-100 font-sans">
      <header className="max-w-6xl mx-auto text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-purple-500 to-indigo-500 mb-4 italic">
          毒舌退休精算師
        </h1>
        <p className="text-slate-400 text-lg font-bold">別做夢了，讓我們來算算你離破產還有多久。</p>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side: Input Form */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
          <div>
            <h2 className="text-2xl font-bold text-white mb-6 border-b border-slate-800 pb-2">老實交代你的現狀</h2>
            <form onSubmit={handleCalculate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1 font-bold">性別</label>
                  <select name="gender" value={data.gender} onChange={handleInputChange} className="w-full bg-slate-800 border-0 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 cursor-pointer">
                    <option value="male">男性</option>
                    <option value="female">女性</option>
                    <option value="other">其他 / 韭菜</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1 font-bold">目前年齡</label>
                  <input type="number" name="currentAge" value={data.currentAge} onChange={handleInputChange} className="w-full bg-slate-800 border-0 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1 font-bold">預計退休年齡</label>
                  <input type="number" name="retireAge" value={data.retireAge} onChange={handleInputChange} className="w-full bg-slate-800 border-0 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1 font-bold">預計壽命</label>
                  <input type="number" name="expectedLifeSpan" value={data.expectedLifeSpan} onChange={handleInputChange} className="w-full bg-slate-800 border-0 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1 font-bold">預期投報率 (%)</label>
                  <input type="number" step="0.1" name="expectedROI" value={data.expectedROI} onChange={handleInputChange} className="w-full bg-slate-800 border-0 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1 font-bold">每年通膨率 (%)</label>
                  <input type="number" step="0.1" name="inflationRate" value={data.inflationRate} onChange={handleInputChange} className="w-full bg-slate-800 border-0 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1 font-bold">目前存款總額 (TWD)</label>
                <input type="number" name="currentSavings" value={data.currentSavings} onChange={handleInputChange} className="w-full bg-slate-800 border-0 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500" />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1 font-bold">每月可投資金額 (TWD)</label>
                <input type="number" name="monthlySavings" value={data.monthlySavings} onChange={handleInputChange} className="w-full bg-slate-800 border-0 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500" />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1 font-bold">退休後預計月開銷 (今日幣值 TWD)</label>
                <input type="number" name="monthlyExpenses" value={data.monthlyExpenses} onChange={handleInputChange} className="w-full bg-slate-800 border-0 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500" />
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className={`w-full py-4 mt-4 rounded-xl font-black text-xl transition-all ${
                  isLoading 
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-500 hover:to-purple-500 text-white shadow-lg shadow-purple-500/20 active:scale-95'
                }`}
              >
                {isLoading ? '正在分析你未來是財富自由還是吃泡麵' : '開始殘酷大解析'}
              </button>
            </form>
          </div>
        </section>

        {/* Right Side: Results & Roast */}
        <section className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4">資產趨勢分析 (含複利與通膨)</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={calculateResults.dataPoints}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={calculateResults.isEnough ? "#10b981" : "#ef4444"} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={calculateResults.isEnough ? "#10b981" : "#ef4444"} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="age" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip 
                    formatter={(value: number) => `NT$${value.toLocaleString()}`}
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Area type="monotone" dataKey="balance" stroke={calculateResults.isEnough ? "#10b981" : "#ef4444"} fillOpacity={1} fill="url(#colorBalance)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-slate-800 p-3 rounded-lg">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">退休時預計總額</p>
                <p className="text-lg font-bold text-white">NT${(calculateResults.projectedTotal / 10000).toFixed(0)}萬</p>
              </div>
              <div className={`p-3 rounded-lg ${calculateResults.isEnough ? 'bg-emerald-900/30' : 'bg-red-900/30'}`}>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">目前還差多少錢退休</p>
                <p className={`text-lg font-bold ${calculateResults.isEnough ? 'text-emerald-400' : 'text-red-400'}`}>
                  NT${(calculateResults.shortfall / 10000).toFixed(0)}萬
                </p>
              </div>
            </div>
          </div>

          {roast && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              <div className={`bg-gradient-to-br border rounded-2xl p-6 relative overflow-hidden ${
                calculateResults.isEnough 
                ? 'from-emerald-900/40 to-slate-900 border-emerald-500/30' 
                : 'from-purple-900/40 to-slate-900 border-purple-500/30'
              }`}>
                <div className="absolute top-0 right-0 p-2 text-6xl opacity-10 pointer-events-none">"</div>
                <h3 className={`text-xl font-black mb-2 uppercase tracking-widest ${
                  calculateResults.isEnough ? 'text-emerald-400' : 'text-purple-400'
                }`}>
                  {calculateResults.isEnough ? '毒舌教練的驚訝讚許' : '毒舌教練的無情回饋'}
                </h3>
                <p className="text-slate-200 leading-relaxed italic text-lg font-medium">
                  {roast.mainRoast}
                </p>
              </div>

              <div className={`border rounded-2xl p-6 ${
                calculateResults.isEnough 
                ? 'bg-emerald-950/20 border-emerald-500/20' 
                : 'bg-red-950/20 border-red-500/20'
              }`}>
                <h3 className={`text-xl font-black mb-4 flex items-center ${
                  calculateResults.isEnough ? 'text-emerald-500' : 'text-red-500'
                }`}>
                  <span className="mr-2 text-2xl">{calculateResults.isEnough ? '🛡️' : '🚨'}</span> 
                  {calculateResults.isEnough ? '守財指南（別敗光了）' : '活命指南（既然你這麼窮）'}
                </h3>
                <div className="space-y-3">
                  {roast.savingTips.map((tip, idx) => (
                    <div key={idx} className="flex items-start bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                      <span className={`font-bold mr-3 ${calculateResults.isEnough ? 'text-emerald-500' : 'text-red-500'}`}>
                        {idx + 1}.
                      </span>
                      <p className="text-slate-300 text-sm md:text-base font-medium">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Results Podcast CTA */}
              <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-8 text-center shadow-2xl space-y-4">
                <div className="space-y-1">
                  <p className="text-white font-black text-2xl tracking-tight">想改變未來，從現在開始 !</p>
                  <p className="text-indigo-400 font-bold text-xl">歡迎收聽 1968退休倒計時</p>
                </div>
                
                <a 
                  href="https://open.firstory.me/user/retirement1968/episodes" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black py-5 px-8 rounded-2xl w-full transition-all shadow-lg hover:shadow-indigo-500/30 group active:scale-95"
                >
                  <span className="text-lg">🎧 點擊即可免費收聽增加你的財商唷 !</span>
                  {/* Play Button Symbol instead of Arrow */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 transform group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="max-w-6xl mx-auto mt-16 pb-8 text-center text-slate-600 text-sm font-medium">
        <p className="mb-1 italic">© 2024 1968退休倒計時 x 毒舌退休精算師</p>
        <p>投資有風險，不存錢風險更大。AI 嘲諷僅供參考。</p>
      </footer>
    </div>
  );
};

export default App;
