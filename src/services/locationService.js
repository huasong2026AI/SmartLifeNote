// Location and auto-tagging service

export const locationService = {
  // Get current location using HTML5 Geolocation API
  getCurrentLocation: () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve('未知地点');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            // Attempt reverse geocoding via public OpenStreetMap API
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
              { headers: { 'User-Agent': 'SmartLifeNoteApp/1.0' } }
            );
            if (res.ok) {
              const data = await res.json();
              const addr = data.address || {};
              const city = addr.city || addr.town || addr.county || addr.state || '';
              const suburb = addr.suburb || addr.neighbourhood || addr.road || '';
              const locationStr = `${city} ${suburb}`.trim();
              if (locationStr) {
                resolve(locationStr);
                return;
              }
            }
          } catch (e) {
            console.warn('Reverse geocoding warning:', e);
          }
          // Fallback to coordinates
          resolve(`GPS: ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
        },
        (error) => {
          console.warn('Geolocation permission or error:', error.message);
          resolve('随手记地点');
        },
        { timeout: 5000, maximumAge: 60000 }
      );
    });
  },

  // Auto-generate preliminary tags based on content heuristic matching
  generateAutoTags: (text) => {
    if (!text) return ['随手记'];
    const tags = new Set();
    const str = text.toLowerCase();

    if (/元|块|钱|花费|购买|买|消费|支付|收据|保养费/.test(str)) tags.add('账单');
    if (/车|保养|公里|滤芯|加油|轮胎|奇瑞|4s/.test(str)) tags.add('汽车');
    if (/发烧|头晕|医院|医生|药|布洛芬|阿莫西林|体温|度|门诊/.test(str)) tags.add('健康');
    if (/背|句子|定理|方程|学习|复习|知识点|日语|英语|数学/.test(str)) tags.add('学习');
    if (/猫|狗|宠物|猫粮|罐头|渴望/.test(str)) tags.add('宠物');
    if (/吃|面|拉面|饭|餐饮|午餐|晚餐|马记永|肯德基/.test(str)) tags.add('餐饮');
    if (/电影|看|沙丘|游戏|娱乐|剧/.test(str)) tags.add('娱乐');
    if (/录音|发音|听/.test(str)) tags.add('录音');

    if (tags.size === 0) tags.add('日常');
    return Array.from(tags);
  }
};
