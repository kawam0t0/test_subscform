// キャンペーンの設定
export const CAMPAIGN_CONFIG = {
  code: "SPGO418",
  store: "SPLASH'N'GO!新前橋店",
  startDate: new Date("2024-08-01"),
  endDate: new Date("2024-08-31T23:59:59"),
  eligibleCourse: "プレミアムスタンダード",
  discountMonths: 2,
}

// キャンペーンが有効かどうかをチェック
export function isCampaignValid(campaignCode: string, store: string, operation: string, course: string): boolean {
  const now = new Date()

  // 基本条件のチェック
  if (
    campaignCode.toUpperCase() !== CAMPAIGN_CONFIG.code ||
    store !== CAMPAIGN_CONFIG.store ||
    operation !== "入会" ||
    !course.includes(CAMPAIGN_CONFIG.eligibleCourse) ||
    now < CAMPAIGN_CONFIG.startDate ||
    now > CAMPAIGN_CONFIG.endDate
  ) {
    return false
  }

  return true
}

// キャンペーン適用時のコース名を取得
export function getCampaignCourseName(originalCourse: string): string {
  if (originalCourse.includes(CAMPAIGN_CONFIG.eligibleCourse)) {
    return `${CAMPAIGN_CONFIG.eligibleCourse}（キャンペーン適用：2ヶ月無料）`
  }
  return originalCourse
}

// キャンペーンの説明文を取得
export function getCampaignDescription(): string {
  return `SPLASH'N'GO!新前橋店限定キャンペーン実施中！\nキャンペーンコード「${CAMPAIGN_CONFIG.code}」入力で\nプレミアムスタンダードが2ヶ月無料！\n（期間：8/1〜8/31まで）`
}
