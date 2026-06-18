export interface Candidate {
  name: string;
  avatar: string;
}

const SURNAMES = [
  '林', '陳', '王', '張', '黃', '李', '蔡', '吳', '謝', '周',
  '徐', '鄭', '蘇', '高', '楊', '簡', '許', '何', '羅', '宋',
  '葉', '潘', '彭', '曾', '呂', '朱', '丁', '范', '溫', '游',
];

const GIVEN_NAMES = [
  '品潔', '冠廷', '雅婷', '哲瑋', '詩涵', '宗翰', '欣怡', '建宏', '佳穎', '柏宇',
  '曉彤', '文豪', '怡君', '志強', '俊毅', '瑞君', '明翰', '雅雯', '思妤', '俊宇',
  '宜庭', '凱翔', '佳蓉', '昱翔', '雅芳', '俊豪', '雨萱', '志豪', '婉婷', '元翔',
];

/** 產生 N 位候選人（原型用）；姓 × 名循環組合，頭像在 pravatar 70 張內循環。 */
export function generateCandidates(count: number): Candidate[] {
  const list: Candidate[] = [];
  for (let i = 0; i < count; i += 1) {
    const surname = SURNAMES[i % SURNAMES.length];
    const given = GIVEN_NAMES[(i * 7 + Math.floor(i / SURNAMES.length) * 3) % GIVEN_NAMES.length];
    list.push({
      name: `${surname}${given}`,
      avatar: `https://i.pravatar.cc/160?img=${(i % 70) + 1}`,
    });
  }
  return list;
}
