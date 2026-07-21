// AI Batch Processing Service with Standard Top-Level Taxonomies and Author Activation Support
import { storageService } from './storageService';

export const SYSTEM_PROMPT = `你是一个智能随手记 AI 归类与结构化分析助手。
用户的随手记包含乱序的碎片信息。请参照综合型门户/资讯网站的标准分类体系，将用户的记录精准归类为【三级目录】，并在各分类下衍生预测提醒、知识总结与财务小计。

标准【一级大类 (main_category)】分类体系参照：
1. "工作事业" (包含: 岗位工作、开会、项目进展、工作规划、办公事务等，严禁把工作归类到日常琐事！)
2. "学习提升" (包含: 日语学习、英语学习、学科定理、技能培训、读书笔记等)
3. "求医问诊" (包含: 感冒发烧病程追踪、看诊开药、体检检查、健康用药等)
4. "娱乐休闲" (包含: 影视电影、音乐、电子游戏、旅游度假、户外运动等)
5. "家庭生活" (包含: 车辆出行、汽车保养、保养滤芯、加油洗车、宠物照顾、猫粮采购、家电维修、日常采购等，车辆出行属于生活大类！)
6. "财务消费" (包含: 账单消费、投资理财、日常开支汇总等)

结构要求：
1. 【一级大类 (main_category)】：直接使用上述标准大类名称（不要在名称后添加"一级大类"字样！）。
2. 【二级小类/主题 (sub_category)】：在大类下细分具体主题或病程 Timeline（如: 工作事业 -> "项目开发"；家庭生活 -> "汽车保养"；学习提升 -> "日语学习"；求医问诊 -> "一次感冒发烧病程"；不要在名称后添加"二级主题"字样！）。
3. 【三级关联内容】：
   - 包含具体随手记条目 (records)
   - 衍生【预测提醒 (sub_predictive_reminders)】：针对该小类的未来预测提醒
   - 衍生【知识复习总结 (sub_knowledge_cards)】：针对该小类的学习知识卡片
   - 衍生【财务小计 (sub_financial_total)】：针对该小类的金额统计

输出格式要求：必须严格返回合法 JSON 对象，不要包含 markdown 代码块包围符以外的内容，结构如下：
{
  "hierarchical_categories": [
    {
      "main_category": "大类名称 (如: 工作事业 / 学习提升 / 娱乐休闲 / 求医问诊 / 家庭生活 / 财务消费)",
      "subcategories": [
        {
          "sub_category": "小类名称 (如: 日语学习 / 汽车保养 / 项目开会)",
          "description": "主题脉络或事件简述",
          "records": [
            {
              "note_id": "笔记ID",
              "event_time": "发生时间",
              "object": "事件/关键对象",
              "content_summary": "核心内容精炼摘要"
            }
          ],
          "sub_predictive_reminders": [
            {
              "title": "预测提醒事项",
              "date": "预测时间",
              "reason": "提醒逻辑原因"
            }
          ],
          "sub_knowledge_cards": [
            {
              "subject": "学科/领域",
              "concept": "知识点/原句",
              "key_point": "解析与复习要点"
            }
          ],
          "sub_financial_total": 0
        }
      ]
    }
  ],
  "global_financial_summary": {
    "total_expense": 0,
    "items": [
      { "item": "明细名称", "amount": 0, "category": "分类" }
    ]
  }
}`;

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

    // Build batch payload from user's actual notes
    const notesPayload = notes
      .map(
        (n, index) =>
          `[记录 #${index + 1} | ID: ${n.id} | 时间: ${n.timestamp} | 地点: ${
            n.location || '未定'
          }]\n内容: ${n.content}`
      )
      .join('\n\n');

    const promptText = `请对以下 ${notes.length} 条实际随手记，按照标准的“工作事业”、“学习提升”、“求医问诊”、“娱乐休闲”、“家庭生活（含车辆出行）”、“财务消费”大类体系进行三级目录归类分析，并在各分类下衍生预测提醒、知识总结与财务小计，输出要求的 JSON。\n\n实际记录列表：\n${notesPayload}`;

    const provider = settings.provider || 'gemini';
    let result;

    if (provider === 'deepseek') {
      result = await aiService.callDeepSeekAPI(apiKey, model, promptText);
    } else {
      result = await aiService.callGeminiAPI(apiKey, model, promptText);
    }

    // If author password was used, increment the call counter
    if (isAuthorPassUsed) {
      storageService.incrementAuthorCallCount();
    }

    return result;
  },

  // Call Google Gemini REST API directly with requested model and smart fallback
  callGeminiAPI: async (apiKey, modelName, promptText) => {
    const primaryModel = modelName.trim();
    const candidateModels = [
      primaryModel,
      'gemini-3.1-flash-lite',
      'gemini-2.0-flash-lite',
      'gemini-2.5-flash',
      'gemini-1.5-flash'
    ].filter((v, i, a) => a.indexOf(v) === i);

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
              parts: [
                { text: SYSTEM_PROMPT },
                { text: promptText }
              ]
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

  // Call DeepSeek REST API
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
