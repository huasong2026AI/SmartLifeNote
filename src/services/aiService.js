// AI Batch Processing Service with Detailed Forecasts, Learning Coach, and Knowledge Archiving
import { storageService } from './storageService';

export const SYSTEM_PROMPT = `你是一个智能随手记 AI 归类、预测与深度总结分析助手。
请对用户录入的随手记进行三级目录归类，并在归类的基础上，调用 AI 对这批数据生成以下四大核心预测与总结模块：

【1. 动态周期预测与主动提醒 (dynamic_forecasts)】
根据消费、设备维护、健康检查等记录，自动推算下一次发生的预测时间、内容：
- 用品消耗预测: 如"买10kg猫粮" ➔ 结合标准猫咪消耗推算耗尽天数，自动生成提前5天的补货提醒。
- 设备/车辆保养: 记录更换滤芯或保养 ➔ 推算6-12个月后下一次维护提醒，并在提醒中附加【上次的时间、花费和店铺上下文】。
- 定期健康检修: 如"洗牙/体检" ➔ 创建6个月或1年后的复查提醒。

【2. 事件闭环与状态追踪提醒 (timeline_followups)】
对于不是一次性结束的事件（如生病、寄出退货快递、更证申请），AI 主动开启持续追踪，提示用户在第 3 天、第 10 天等关键节点进行状态确认与清理闭环。
- 生病用药追踪: 第3天提示"症状缓解了吗？"；第10天提示"是否有过期药需要清理？"
- 退货/维权进度: 寄出3天后提示"检查商家是否已完成退款流程"。
- 业务办理进度: 更换驾照后7天提示"检查是否已收到新证件"。

【3. 学科与技能指导 (learning_coach)】
针对学习（外语、错题、定理）笔记，充当动态教练：
- 艾宾浩斯抗遗忘变式复习: 日/英语记录 ➔ 生成第 3 天/第 7 天的变式造句练习（如日语“明日、映画を見に行きます” ➔ 提示“请试着用此句型翻译造句：明天去吃寿司”）。
- 举一反三变式题: 错题记录 ➔ 提炼考点（如“韦达定理”），自动现场生成 2 道同考点的新变式题供用户自测。
- 薄弱项诊断: 诊断近期错误率较高的知识模块并主动推送专项学习建议。

【4. 经验沉淀与“个人法则”归纳 (knowledge_archiving)】
多条记录围绕同一主题或时间段时，自动触发凝练：
- 病程/维修全过程档案: 生病就医多条记录 ➔ 自动归纳为一篇如《2026年7月甲流就医与康复过程档案》（含症状演变、所用药及见效时间）。
- 避坑/经验法则提取: 发现吃某药胃痛或某店体验差 ➔ 提炼为个人规则（如“下次开药避开XX药”、“洗车避开XX店”）。

请严格输出合法 JSON 对象，不要包含 markdown 代码块包围符以外的内容，格式结构必须如下：
{
  "hierarchical_categories": [
    {
      "main_category": "大类名称 (如: 工作事业 / 学习提升 / 娱乐休闲 / 求医问诊 / 家庭生活 / 财务消费)",
      "subcategories": [
        {
          "sub_category": "小类名称",
          "description": "脉络说明",
          "records": [
            {
              "note_id": "笔记ID",
              "event_time": "发生时间",
              "object": "核心对象/关键字",
              "content_summary": "精炼摘要"
            }
          ],
          "sub_financial_total": 0
        }
      ]
    }
  ],
  "dynamic_forecasts": [
    {
      "category": "大类",
      "subject": "预测对象",
      "prediction_text": "推算结论",
      "reminder_date": "预测提醒日期/时间",
      "context_details": "附带的上次时间、花费、店铺上下文"
    }
  ],
  "timeline_followups": [
    {
      "title": "追踪事件名称",
      "day_3_question": "第3天主动询问文案",
      "day_10_question": "第10天闭环整理提示",
      "current_status": "当前事件状态"
    }
  ],
  "learning_coach": {
    "ebbinghaus_variants": [
      {
        "original_record": "原句/单词",
        "review_day": "第3天 / 第7天",
        "variant_practice_prompt": "变式造句/翻译练习提示 (如：请试着用该句型翻译‘明天去吃寿司’)"
      }
    ],
    "variant_questions": [
      {
        "concept": "考点 (如: 韦达定理)",
        "question_1": "自测新题1",
        "question_2": "自测新题2"
      }
    ],
    "weakness_diagnosis": "诊断与专项学习建议"
  },
  "knowledge_archiving": {
    "full_case_archives": [
      {
        "title": "病程/事件全过程档案名称",
        "summary": "治疗/维修过程归纳总结"
      }
    ],
    "personal_rules": [
      {
        "type": "避坑 / 经验",
        "rule_content": "凝练成的避坑或经验法则"
      }
    ]
  },
  "global_financial_summary": {
    "total_expense": 0,
    "items": [
      { "item": "明细", "amount": 0, "category": "大类" }
    ]
  }
}`;

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
      const promptText = `请对以下 ${notes.length} 条实际随手记进行三级目录归类，并在归类的基础上，提取预测提醒、闭环追踪、学习教练和经验个人法则，输出要求的 JSON。\n\n实际记录列表：\n${notesPayload}`;
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
