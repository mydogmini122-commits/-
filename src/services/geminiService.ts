
import { GoogleGenAI, Type } from "@google/genai";
import { RetirementData, CalculationResult, RoastResult } from "../types";

export const getToxicAdvice = async (data: RetirementData, result: CalculationResult): Promise<RoastResult> => {
  // 修正後的寫法 (支援 Vite 環境)
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY || process.env.API_KEY || '' });
  
  const genderLabel = data.gender === 'male' ? '男性' : data.gender === 'female' ? '女性' : '中性/韭菜';
  
  // Define age-specific roasting/advice logic
  let ageSpecificInstruction = "";
  if (data.currentAge >= 20 && data.currentAge <= 30) {
    const focus = data.gender === 'male' ? '3C、遊戲課金、公仔模型' : '醫美、名牌包、網美下午茶';
    ageSpecificInstruction = `針對 20-30 世代${genderLabel}，若財務不佳重點攻擊「精緻窮」現象，尤其是關於 ${focus}。若財務良好，則稱讚其為少數清醒的年輕人。`;
  } else if (data.currentAge > 30 && data.currentAge <= 50) {
    const focus = data.gender === 'male' ? '中年發福、淪為車貸房貸奴隸、買了也沒時間玩的電子產品' : '家庭瑣碎開銷、失控的團購成癮、消失的少女感';
    ageSpecificInstruction = `針對 35-50 世代${genderLabel}，若財務不佳重點嘲諷「社畜生涯」的悲慘，包括 ${focus}。若財務良好，肯定其在職場叢林生存的智慧。`;
  } else {
    ageSpecificInstruction = `針對 50 世代以上${genderLabel}，若財務不佳語氣要極度嚴厲，強調「下流老人」破產風險與醫療支出。若財務良好，恭喜其成功抵達安全彼岸。`;
  }

  const prompt = `
    你是一位性格鮮明、實話實說的「退休精算師」。請根據以下退休財務數據進行分析。
    
    使用者數據：
    - 當前年齡：${data.currentAge} 歲 (${genderLabel})
    - 預計退休年齡：${data.retireAge} 歲
    - 目前存款：${data.currentSavings.toLocaleString()} 元
    - 每月可投資金額：${data.monthlySavings.toLocaleString()} 元
    - 預期投資報酬率：${data.expectedROI}%
    - 預期通膨率：${data.inflationRate}%
    - 退休後預計每月支出：${data.monthlyExpenses.toLocaleString()} 元
    - 預期壽命：${data.expectedLifeSpan} 歲
    
    分析結果：
    - 退休時預計總額：${Math.round(result.projectedTotal).toLocaleString()} 元
    - 資金缺口：${Math.round(result.shortfall).toLocaleString()} 元
    - 是否足夠退休：${result.isEnough ? '是' : '否'}
    - 存款維持年數：${result.yearsCovered.toFixed(1)} 年

    特定族群背景：
    ${ageSpecificInstruction}

    語氣與風格要求：
    1. 語言：台灣繁體中文，善用網路迷因風格。
    2. **重要：如果結果為【可以足夠退休】(isEnough 為 true)**：
       - 請轉換語氣，給予「正面的肯定」與「讚賞」。
       - 稱讚其理財規劃有道，是同儕中的佼佼者。
       - 雖然可以帶一點點「別放鬆警惕」的幽默提醒，但整體必須是鼓勵且溫暖的，不要太毒舌。
    3. **如果結果為【不足以退休】(isEnough 為 false)**：
       - 保持「極度毒舌」且「無情」的風格。
       - 使用「韭菜」、「洗洗睡」、「下流老人」、「可撥社畜」等詞彙。
       - 狠狠打碎其對未來的幻想，讓其認清破產的現實。
    4. 回傳格式為 JSON。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.8,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mainRoast: { type: Type.STRING, description: "主要評價內容 (根據結果決定毒舌或讚美)" },
            savingTips: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "具體的行動建議"
            },
          },
          required: ["mainRoast", "savingTips"]
        }
      }
    });

    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr) as RoastResult;
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      mainRoast: "連 AI 都被你的財務黑洞嚇到當機了。我看你現在就去應徵大夜班保全比較實際。",
      savingTips: [
        "把手機賣了換成呼叫器吧，反正也沒人找你。",
        "星巴克？喝自來水比較符合你的身價。",
        "旅遊？家門口公園走兩圈就是環遊世界了。",
        "訂閱服務全砍了，去看鄰居家的電視牆吧。"
      ]
    };
  }
};
