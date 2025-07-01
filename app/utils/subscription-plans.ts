// 事前に作成されたサブスクリプションプランのIDを管理
export const SUBSCRIPTION_PLANS = {
    // コース名とプランIDのマッピング
    プレミアムスタンダード: "DV5SOJCFF7OTESOF7XOIQJER",
    コーティングプラス: "6DPPKDVGUVNMA6HJ24UIYZV2",
    スーパーシャンプーナイアガラ: "7WGDCUFSDAEWAK2LKSQNUQN4",
    セラミックコーティングタートルシェル: "OXAS2FKP6EQDFIMSFJGH5PYQ",
  }
  
  // コース名からプランIDを取得する関数
  export function getPlanIdFromCourseName(courseName: string): string {
    // コース名から金額部分を除去（「プレミアムスタンダード（980円）」→「プレミアムスタンダード」）
    const cleanCourseName = courseName.split("（")[0].trim()
  
    // 対応するプランIDを返す
    return SUBSCRIPTION_PLANS[cleanCourseName as keyof typeof SUBSCRIPTION_PLANS] || ""
  }
  
  // 店舗名からLocationIDを取得する関数
  export function getLocationIdFromStoreName(storeName: string): string {
    const locationMap: { [key: string]: string } = {
      "SPLASH'N'GO!前橋50号店": "L49BHVHTKTQPE",
      "SPLASH'N'GO!伊勢崎韮塚店": "LEFYQ66VK7C0H",
      "SPLASH'N'GO!高崎棟高店": "LDHMQX9VPW34B",
      "SPLASH'N'GO!足利緑町店": "LV19VY3VYHPBA",
      "SPLASH'N'GO!新前橋店": "LPK3Z9BHEEXX3",
    }
    return locationMap[storeName] || ""
  }
  