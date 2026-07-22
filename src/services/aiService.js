// AI Batch Processing Service with Multimodal Audio/Vision and Direct Transcription
import { storageService } from './storageService';

export const SYSTEM_PROMPT = `你是一个智能随手记 AI 归类与结构化分析助手。
用户的随手记包含乱序的碎片信息，其中可能附带录音音频和拍照图片。

请对用户录入的所有随手记进行【三级目录】式的上下文归类，并在归类的基础上，同步生成对应的【预测提醒、知识总结与财务小计】。格式与层级必须与三级目录保持一致！

标准【一级大类 (main_category)】分类体系参照：
1. "工作事业" (包含: 岗位工作、开会、项目进展、工作规划、办公事务等，严禁把工作归类到日常琐事！)
2. "学习提升" (包含: 日语学习、英语学习、学科定理、技能培训、读书笔记等)
3. "求医问诊" (包含: 感冒发烧病程追踪、看诊开药、体检检查、健康用药等)
4. "娱乐休闲" (包含: 影视电影、音乐、电子游戏、旅游度假、户外运动等)
5. "家庭生活" (包含: 车辆出行、汽车保养、保养滤芯、加油洗车、宠物照顾、猫粮采购、家电维修、日常采购等，车辆出行属于生活大类！)
6. "财务消费" (包含: 账单消费、投资理财、日常开支汇总等)

结构要求：
1. 【一级大类 (main_category)】：直接使用上述标准大类名称。
2. 【二级小类/主题 (sub_category)】：在大类下细分具体主题或病程 Timeline。
3. 【三级关联内容】：
   - 包含具体随手记条目 (records)
   - 衍生【预测提醒 (sub_predictive_reminders)】：针对该小类的未来预测提醒
   - 衍生【知识复习总结 (sub_knowledge_cards)】：针对该小类的学习知识卡片
   - 衍生【财务小计 (sub_financial_total)】：针对该小类的金额统计

输出格式要求：必须严格返回合法 JSON 对象，不要包含 markdown 代码块包围符以外的内容。`;

const getBase64DataOnly = (dataUrl) => {
  if (!dataUrl) return '';
  const commaIdx = dataUrl.indexOf(',');
  return commaIdx !== -1 ? dataUrl.substring(commaIdx + 1) : dataUrl;
};

const getMimeTypeFromDataUrl = (dataUrl, fallback = 'image/jpeg') => {
  if (!dataUrl) return fallback;
  const match = dataUrl.match(/^data:([^;]+);base64,/);
  return match ? match[1] : fallback;
};

export const aiService = {
  // Transcribe audio using Gemini's native multimodal capabilities
  transcribeAudio: async (audioBase64, mimeType, settings) => {
    const resolved = storageService.resolveEffectiveApiKeyAndModel();
    const { apiKey, model } = resolved;

    if (!apiKey || !apiKey.trim()) {
      throw new Error('未检测到 API Key，请先配置 Key 才能进行语音转字。');
    }

    const cleanBase64 = getBase64DataOnly(audioBase64);
    const apiModel = model.replace('gemini-3.1-flash-lite', 'gemini-1.5-flash'); // Fallback model check if needed

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      apiModel
    )}:generateContent?key=${apiKey}`;

    const body = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: mimeType || 'audio/webm',
                data: cleanBase64
              }
            },
            {
              text: '请仔细听这段录音，并将其精准转写为文本内容。只返回转写文本本身，不需要包含任何其他多余前缀、说明或标点标记（如有日语或英语，请准确输出日文假名/汉字或英文单词，避免乱码）。'
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`语音转写失败: ${errText}`);
    }

    const data = await response.json();
    return (data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
  },

  // Main batch processing method for actual user notes
  batchProcessNotes: async (notes, settings) => {
    if (!notes || notes.length === 0) {
      throw new Error('当前没有找到任何需要 AI 分析的随手记内容，请先添加记录。');
    }

    // Resolve key and model via user's key or author password
    const resolved = storageService.resolveEffectiveApiKeyAndModel();
    const { apiKey, model, isAuthorPassUsed } = resolved;

    if (!apiKey || !apiKey.trim()) {
      throw new Error(
        '未检测到有效的 API Key 或作者授权密码！请先点击顶部“Key设置”配置 API Key 或联系作者获取授权密码。'
      );
    }

    const provider = settings.provider || 'gemini';

    if (provider === 'deepseek') {
      const notesPayload = notes
        .map(
          (n, index) =>
            `[记录 #${index + 1} | ID: ${n.id} | 时间: ${n.timestamp} | 地点: ${
              n.location || '未定'
            }]\n内容: ${n.content}`
        )
        .join('\n\n');
      const promptText = `请对以下 ${notes.length} 条实际随手记进行三级目录归类分析并衍生预测总结，输出要求的 JSON。\n\n实际记录列表：\n${notesPayload}`;
      const result = await aiService.callDeepSeekAPI(apiKey, model, promptText);
      if (isAuthorPassUsed) storageService.incrementAuthorCallCount();
      return result;
    } else {
      const result = await aiService.callGeminiAPI(apiKey, model, notes);
      if (isAuthorPassUsed) storageService.incrementAuthorCallCount();
      return result;
    }
  },

  // Call Google Gemini REST API directly with Multimodal inputs (text + audio + images) and smart fallback
  callGeminiAPI: async (apiKey, modelName, notes) => {
    const primaryModel = modelName.trim();
    const candidateModels = [
      primaryModel,
      'gemini-3.1-flash-lite',
      'gemini-2.0-flash-lite',
      'gemini-2.5-flash',
      'gemini-1.5-flash'
    ].filter((v, i, a) => a.indexOf(v) === i);

    // Build the multimodal contents array
    const parts = [
      { text: SYSTEM_PROMPT },
      { text: `以下是用户录入的 ${notes.length} 条随手记。如果包含图片或音频，请自动识别转写并分析其内容，随后返回三级归类以及四大预测和经验提炼 JSON。` }
    ];

    notes.forEach((n, index) => {
      parts.push({
        text: `\n\n--- 随手记记录 #${index + 1} | ID: ${n.id} | 时间: ${n.timestamp} | 地点: ${n.location || '未定'} ---`
      });
      parts.push({
        text: `文本记录内容: ${n.content || '(无文本)'}`
      });

      if (n.imageUrl && n.imageUrl.startsWith('data:')) {
        parts.push({
          inlineData: {
            mimeType: getMimeTypeFromDataUrl(n.imageUrl, 'image/jpeg'),
            data: getBase64DataOnly(n.imageUrl)
          }
        });
        parts.push({
          text: `[说明：上方附带了一条拍照图片，请提取图片文字和内容合并分析]`
        });
      }

      if (n.audioBase64) {
        parts.push({
          inlineData: {
            mimeType: n.audioMimeType || 'audio/webm',
            data: getBase64DataOnly(n.audioBase64)
          }
        });
        parts.push({
          text: `[说明：上方附带了用户录制的语音录音，请仔细聆听并转写录音内容合并分析]`
        });
      }
    });

    let lastError = null;

    for (const modelToTry of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
          modelToTry
        )}:generateContent?key=${apiKey}`;

        const body = {
          contents: [
            {
              role: 'user',
              parts: parts
            }
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json'
          }
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (response.ok) {
          const data = await response.json();
          const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          return aiService.parseJsonResponse(rawContent);
        } else {
          const errText = await response.text();
          lastError = new Error(`Gemini API 错误 [${response.status}]: ${errText}`);
          if (response.status !== 404) {
            throw lastError;
          }
        }
      } catch (e) {
        lastError = e;
        if (e.message && !e.message.includes('404')) {
          throw e;
        }
      }
    }

    throw lastError || new Error('Gemini API 请求失败，请检查模型支持情况');
  },

  // Call DeepSeek REST API (text only)
  callDeepSeekAPI: async (apiKey, modelName, promptText) => {
    const url = 'https://api.deepseek.com/chat/completions';
    const body = {
      model: modelName || 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: promptText }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`DeepSeek API 错误 [${response.status}]: ${errText}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || '';
    return aiService.parseJsonResponse(rawContent);
  },

  // Parse JSON response safely
  parseJsonResponse: (text) => {
    try {
      let cleaned = text.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '');
      }
      return JSON.parse(cleaned);
    } catch (e) {
      console.error('Failed to parse AI JSON response:', text);
      throw new Error('AI 返回的数据解析失败，请重试');
    }
  }
};
