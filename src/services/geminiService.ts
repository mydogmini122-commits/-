import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { NextResponse } from "next/server";

// 初始化 Gemini，金鑰由伺服器環境變數提供
const genAI = new GoogleGenerativeAI(process.env.API_KEY || '');

export async function POST(req: Request) {
  try {
    const { data, result } = await req.json();
    const genderLabel = data.gender === 'male' ? '男性' : data.gender === 'female' ? '女性' : '中性/韭菜';
    
    // 年齡與族群判斷邏輯
    let ageSpecificInstruction = "";
    if (data.currentAge >= 20 && data.currentAge <= 30) {
      const focus = data.gender === 'male' ? '3C、遊戲課金、公仔模型' : '醫美、名牌包、網美下午茶';
      ageSpecificInstruction = `針對 20-30 世代${genderLabel}，若財務不佳重點攻擊「精緻窮」現象，尤其是關於 ${focus}。`;
    } else if (data.currentAge > 30 && data.currentAge <= 50) {
      const focus = data.gender === 'male' ? '中年發福、淪為車貸房貸奴隸' : '家庭瑣碎開銷、失控的團購成癮';
      ageSpecificInstruction = `針對 35-50 世代${genderLabel}，若財務不佳重點嘲諷「社畜生涯」的悲慘，包括 ${focus}。`;
    } else {
      ageSpecificInstruction = `針對 50 世代以上${genderLabel}，若財務不佳語氣要極度嚴厲，強調「下流老人」破產風險。`;
    }

    const prompt = `
      你是一位性格鮮明、實話實說的「退休精算師」。請根據以下退休財務數據進行分析。
      
      使用者數據：
      - 當前年齡：${data.currentAge} 歲 (${genderLabel})
      - 退休總額：${Math.round(result.projectedTotal).toLocaleString()} 元
      - 資金缺口：${Math.round(result.shortfall).toLocaleString()} 元
      - 是否足夠退休：${result.isEnough ? '是' : '否'}
      - 存款維持年數：${result.yearsCovered.toFixed(1)} 年

      特定族群背景：
      ${ageSpecificInstruction}

      要求：
      1. 台灣繁體中文，善用網路迷因風格。
      2. 如果 isEnough 為 true，請給予溫暖的肯定。
      3. 如果 isEnough 為 false，請極度毒舌，使用「韭菜」、「下流老人」等詞。
      4. 回傳格式為 JSON。
    `;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", // 建議使用穩定版
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            mainRoast: { type: SchemaType.STRING },
            savingTips: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          },
          required: ["mainRoast", "savingTips"]
        }
      }
    });

    const chatResult = await model.generateContent(prompt);
    const content = JSON.parse(chatResult.response.text());
    
    return NextResponse.json(content);

  } catch (error) {
    console.error("Gemini Server Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
