import mysql from "mysql2/promise"

// =====================
// 型定義
// =====================
export interface Customer {
  id: number
  reference_id: string
  square_customer_id?: string | null
  family_name: string
  given_name: string
  email: string
  phone: string
  course: string | null
  car_model: string
  color: string
  plate_info_1?: string | null
  plate_info_2?: string | null
  plate_info_3?: string | null
  plate_info_4?: string | null
  store_name: string | null
  store_code: string | null
  registration_date: Date
  status: string
  created_at: Date
  updated_at: Date
}

export interface UpdateCustomerData {
  inquiryType: string
  inquiryDetails: string
  storeName: string | null | undefined
  newCarModel?: string
  newCarColor?: string
  newCourseName?: string
  newEmail?: string
  status?: string // inquiries.status 用
  // 解約理由（テキスト配列のみ）
  cancellationReasons?: string[] | null
  // customers.status を更新（例: 解約申請で pending）
  customerStatus?: string
}

export interface InsertCustomerData {
  referenceId: string
  squareCustomerId?: string
  familyName: string
  givenName: string
  email: string
  phone: string
  course: string
  carModel: string
  color: string
  plateInfo1?: string | null
  plateInfo2?: string | null
  plateInfo3?: string | null
  plateInfo4?: string | null
  storeName: string
  campaignCode?: string | null
}

// =====================
// 接続設定とプール（グローバル再利用）
// =====================
console.log("=== CloudSQL詳細デバッグ開始 ===")
console.log("環境情報:", {
  NODE_ENV: process.env.NODE_ENV,
  VERCEL: process.env.VERCEL,
  VERCEL_ENV: process.env.VERCEL_ENV,
  VERCEL_URL: process.env.VERCEL_URL,
})

console.log("CloudSQL環境変数詳細チェック:", {
  // 両方の環境変数名をチェック
  CLOUDSQL_DATABASE_HOST: process.env.CLOUDSQL_DATABASE_HOST || "NOT_SET",
  CLOUDSQL_HOST: process.env.CLOUDSQL_HOST || "NOT_SET",
  CLOUDSQL_DATABASE_PORT: process.env.CLOUDSQL_DATABASE_PORT || "NOT_SET",
  CLOUDSQL_PORT: process.env.CLOUDSQL_PORT || "NOT_SET",
  CLOUDSQL_DATABASE_USER: process.env.CLOUDSQL_DATABASE_USER || "NOT_SET",
  CLOUDSQL_USER: process.env.CLOUDSQL_USER || "NOT_SET",
  CLOUDSQL_DATABASE_PASSWORD: process.env.CLOUDSQL_DATABASE_PASSWORD ? "***SET***" : "NOT_SET",
  CLOUDSQL_PASSWORD: process.env.CLOUDSQL_PASSWORD ? "***SET***" : "NOT_SET",
  CLOUDSQL_DATABASE_NAME: process.env.CLOUDSQL_DATABASE_NAME || "NOT_SET",
  CLOUDSQL_DATABASE: process.env.CLOUDSQL_DATABASE || "NOT_SET",
  CLOUDSQL_INSTANCE_CONNECTION_NAME: process.env.CLOUDSQL_INSTANCE_CONNECTION_NAME || "NOT_SET",
})

const connectionConfig = {
  host: process.env.CLOUDSQL_DATABASE_HOST || process.env.CLOUDSQL_HOST || "127.0.0.1",
  port: Number.parseInt(process.env.CLOUDSQL_DATABASE_PORT || process.env.CLOUDSQL_PORT || "3307"),
  user: process.env.CLOUDSQL_DATABASE_USER || process.env.CLOUDSQL_USER || "root",
  password: process.env.CLOUDSQL_DATABASE_PASSWORD || process.env.CLOUDSQL_PASSWORD || "",
  database: process.env.CLOUDSQL_DATABASE_NAME || process.env.CLOUDSQL_DATABASE || "customer_database",
  timezone: "+09:00",
  connectTimeout: 60_000,
}

console.log("最終接続設定:", {
  host: connectionConfig.host,
  port: connectionConfig.port,
  user: connectionConfig.user,
  database: connectionConfig.database,
  passwordSet: !!connectionConfig.password,
  passwordLength: connectionConfig.password ? connectionConfig.password.length : 0,
  timezone: connectionConfig.timezone,
  connectTimeout: connectionConfig.connectTimeout,
})

type GlobalWithMysql = typeof globalThis & {
  mysqlPool?: mysql.Pool
  schemaReady?: boolean
}

const g = globalThis as GlobalWithMysql

const basePoolOptions: mysql.PoolOptions = {
  waitForConnections: true,
  connectionLimit: 5,
  maxIdle: 2,
  idleTimeout: 60_000,
  queueLimit: 0,
  connectTimeout: connectionConfig.connectTimeout,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10_000,
}

async function createPool(): Promise<mysql.Pool> {
  console.log("=== プール作成開始 ===")

  if (g.mysqlPool) {
    console.log("既存のプールを再利用")
    return g.mysqlPool
  }

  const isVercel = process.env.VERCEL === "1"
  console.log("環境判定:", { isVercel, VERCEL_ENV: process.env.VERCEL })

  let createdPool: mysql.Pool

  try {
    if (isVercel) {
      console.log("=== Vercel環境でのCloudSQL接続設定開始 ===")

      const instanceConnectionName = process.env.CLOUDSQL_INSTANCE_CONNECTION_NAME
      if (!instanceConnectionName) {
        console.error("❌ CLOUDSQL_INSTANCE_CONNECTION_NAME が設定されていません")
        throw new Error("CLOUDSQL_INSTANCE_CONNECTION_NAME が設定されていません")
      }

      console.log("インスタンス接続名:", instanceConnectionName)

      const vercelPoolConfig = {
        host: connectionConfig.host,
        port: connectionConfig.port,
        user: connectionConfig.user,
        password: connectionConfig.password,
        database: connectionConfig.database,
        timezone: "+09:00",
        ssl: {
          rejectUnauthorized: false,
        },
        acquireTimeout: 60000,
        timeout: 60000,
        ...basePoolOptions,
      }

      console.log("Vercelプール設定:", {
        ...vercelPoolConfig,
        password: vercelPoolConfig.password ? "***SET***" : "NOT_SET",
      })

      createdPool = mysql.createPool(vercelPoolConfig)
      console.log("✅ Vercel環境でのプール作成完了")
    } else {
      console.log("=== ローカル環境での直接接続開始 ===")

      const localPoolConfig = {
        host: connectionConfig.host,
        port: connectionConfig.port,
        user: connectionConfig.user,
        password: connectionConfig.password,
        database: connectionConfig.database,
        timezone: connectionConfig.timezone,
        ...basePoolOptions,
      }

      console.log("ローカルプール設定:", {
        ...localPoolConfig,
        password: localPoolConfig.password ? "***SET***" : "NOT_SET",
      })

      createdPool = mysql.createPool(localPoolConfig)
      console.log("✅ ローカル環境でのプール作成完了")
    }

    console.log("=== プール接続テスト開始 ===")
    const testConnection = await createdPool.getConnection()
    console.log("✅ プールから接続取得成功")

    try {
      console.log("テストクエリ実行中...")
      const [result] = await testConnection.execute("SELECT 1 as test")
      console.log("✅ テストクエリ結果:", result)

      console.log("時刻クエリ実行中...")
      const [timeResult] = await testConnection.execute("SELECT NOW() as current_time")
      console.log("✅ 時刻クエリ結果:", timeResult)

      console.log("データベース名クエリ実行中...")
      const [dbResult] = await testConnection.execute("SELECT DATABASE() as current_db")
      console.log("✅ データベース名クエリ結果:", dbResult)
    } catch (testError) {
      console.error("❌ プール接続テスト失敗:", testError)
      throw testError
    } finally {
      testConnection.release()
      console.log("✅ テスト接続解放完了")
    }

    if (process.env.NODE_ENV !== "production") {
      g.mysqlPool = createdPool
      console.log("グローバルプールに保存（非本番環境）")
    }

    console.log("=== プール作成完了 ===")
    return createdPool
  } catch (error) {
    console.error("❌ プール作成エラー:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      code: (error as any)?.code,
      errno: (error as any)?.errno,
      sqlState: (error as any)?.sqlState,
      sqlMessage: (error as any)?.sqlMessage,
    })
    throw error
  }
}

let _poolPromise: Promise<mysql.Pool> | null = null

async function getPool(): Promise<mysql.Pool> {
  if (!_poolPromise) {
    _poolPromise = createPool()
  }
  return _poolPromise
}

export const pool = {
  async execute(...args: Parameters<mysql.Pool["execute"]>) {
    const poolInstance = await getPool()
    return poolInstance.execute(...args)
  },
  async getConnection() {
    const poolInstance = await getPool()
    return poolInstance.getConnection()
  },
  async query(...args: Parameters<mysql.Pool["query"]>) {
    const poolInstance = await getPool()
    return poolInstance.query(...args)
  },
  async end() {
    const poolInstance = await getPool()
    return poolInstance.end()
  },
} as mysql.Pool

// =====================
// ユーティリティ
// =====================
async function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms))
}

async function withRetry<T>(fn: () => Promise<T>, tries = 2): Promise<T> {
  try {
    return await fn()
  } catch (err: any) {
    const code = err?.code
    const fatal = err?.fatal
    if (tries > 0 && (code === "PROTOCOL_CONNECTION_LOST" || code === "ECONNRESET" || fatal)) {
      console.warn(`DB再試行: ${code || err?.message} 残りリトライ: ${tries}`)
      await sleep(200)
      return withRetry(fn, tries - 1)
    }
    throw err
  }
}

async function setSessionJst(conn: mysql.PoolConnection) {
  await conn.execute(`SET time_zone = '+09:00'`)
}

async function ensureSchemaInitialized() {
  if (g.schemaReady) return
  await updateTableStructure()
  g.schemaReady = true
}

export async function testConnection(): Promise<boolean> {
  console.log("=== 接続テスト開始 ===")

  return withRetry(async () => {
    console.log("接続取得試行中...")
    const conn = await pool.getConnection()
    console.log("✅ 接続取得成功")

    try {
      console.log("セッション設定中...")
      await setSessionJst(conn)
      console.log("✅ セッション設定完了")

      console.log("テストクエリ実行中...")
      const [result] = await conn.query("SELECT 1 as test, NOW() as current_time, DATABASE() as db_name")
      console.log("✅ テストクエリ結果:", result)

      return true
    } finally {
      conn.release()
      console.log("✅ 接続解放完了")
    }
  }).catch((e) => {
    console.error("❌ CloudSQL接続テストエラー詳細:", {
      message: e?.message,
      stack: e?.stack,
      code: e?.code,
      errno: e?.errno,
      sqlState: e?.sqlState,
      sqlMessage: e?.sqlMessage,
      fatal: e?.fatal,
    })
    return false
  })
}

// =====================
// データアクセス
// =====================
export async function getStoreCodeByName(storeName: string | null | undefined): Promise<string | null> {
  if (!storeName) {
    console.warn("店舗名が未指定のためstore_codeを取得できません")
    return null
  }
  return withRetry(async () => {
    const [rows] = await pool.execute("SELECT store_code FROM stores WHERE store_name = ?", [storeName])
    const stores = rows as { store_code: string }[]
    if (stores.length > 0) return stores[0].store_code
    console.warn("店舗が見つかりませんでした:", storeName)
    return null
  })
}

export async function updateTableStructure(): Promise<void> {
  const conn = await pool.getConnection()
  try {
    await setSessionJst(conn)
    const alterCustomers = [
      `ALTER TABLE customers ADD COLUMN course VARCHAR(100) COMMENT '洗車コース名'`,
      `ALTER TABLE customers ADD COLUMN car_model VARCHAR(100) COMMENT '車種'`,
      `ALTER TABLE customers ADD COLUMN color VARCHAR(50) COMMENT '車の色'`,
      `ALTER TABLE customers ADD COLUMN plate_info_1 VARCHAR(50) DEFAULT NULL COMMENT 'ナンバープレート情報1'`,
      `ALTER TABLE customers ADD COLUMN plate_info_2 VARCHAR(50) DEFAULT NULL COMMENT 'ナンバープレート情報2'`,
      `ALTER TABLE customers ADD COLUMN plate_info_3 VARCHAR(50) DEFAULT NULL COMMENT 'ナンバープレート情報3'`,
      `ALTER TABLE customers ADD COLUMN plate_info_4 VARCHAR(50) DEFAULT NULL COMMENT 'ナンバープレート情報4'`,
      `ALTER TABLE customers ADD COLUMN store_name VARCHAR(100) COMMENT '店舗名'`,
      `ALTER TABLE customers ADD COLUMN store_code VARCHAR(50) COMMENT '店舗コード'`,
    ]
    for (const sql of alterCustomers) {
      try {
        await conn.execute(sql)
        console.log(`✅ customers: カラム追加（もしくは既存）`)
      } catch (e: any) {
        if (e?.code === "ER_DUP_FIELDNAME") {
          // OK
        } else {
          console.error("❌ customers: カラム追加エラー", e)
        }
      }
    }
  } finally {
    conn.release()
  }
}

async function getCustomerById(conn: mysql.PoolConnection, customerId: number): Promise<Customer | null> {
  const [rows] = await conn.execute(`SELECT * FROM customers WHERE id = ?`, [customerId])
  const arr = rows as Customer[]
  return arr.length ? arr[0] : null
}

async function getCurrentInquiriesOrder(conn: mysql.PoolConnection): Promise<string[]> {
  const [rows] = await conn.execute(
    `
    SELECT COLUMN_NAME 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inquiries'
    ORDER BY ORDINAL_POSITION
    `,
  )
  const arr = rows as { COLUMN_NAME: string }[]
  return arr.map((r) => r.COLUMN_NAME)
}

async function ensureInquiriesTableStructure(conn: mysql.PoolConnection) {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `)

  const addCol = async (sqlAdd: string, colName: string) => {
    try {
      await conn.execute(sqlAdd)
      console.log(`✅ inquiries: 追加 ${colName}`)
    } catch (e: any) {
      if (e?.code === "ER_DUP_FIELDNAME") {
        // 既存
      } else {
        console.error(`❌ inquiries: 追加エラー ${colName}`, e)
      }
    }
  }

  await addCol(`ALTER TABLE inquiries ADD COLUMN inquiry_type VARCHAR(100)`, "inquiry_type")
  await addCol(`ALTER TABLE inquiries ADD COLUMN inquiry_details TEXT`, "inquiry_details")
  await addCol(`ALTER TABLE inquiries ADD COLUMN cancellation_reasons JSON`, "cancellation_reasons")
  await addCol(`ALTER TABLE inquiries ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'pending'`, "status")

  await addCol(`ALTER TABLE inquiries ADD COLUMN reference_id VARCHAR(20)`, "reference_id")
  await addCol(`ALTER TABLE inquiries ADD COLUMN square_customer_id VARCHAR(100)`, "square_customer_id")
  await addCol(`ALTER TABLE inquiries ADD COLUMN family_name VARCHAR(50)`, "family_name")
  await addCol(`ALTER TABLE inquiries ADD COLUMN given_name VARCHAR(50)`, "given_name")
  await addCol(`ALTER TABLE inquiries ADD COLUMN email VARCHAR(255)`, "email")
  await addCol(`ALTER TABLE inquiries ADD COLUMN phone VARCHAR(20)`, "phone")
  await addCol(`ALTER TABLE inquiries ADD COLUMN course VARCHAR(100)`, "course")

  await addCol(`ALTER TABLE inquiries ADD COLUMN car_model VARCHAR(100)`, "car_model")
  await addCol(`ALTER TABLE inquiries ADD COLUMN color VARCHAR(50)`, "color")
  await addCol(`ALTER TABLE inquiries ADD COLUMN plate_info_1 VARCHAR(50)`, "plate_info_1")
  await addCol(`ALTER TABLE inquiries ADD COLUMN plate_info_2 VARCHAR(50)`, "plate_info_2")
  await addCol(`ALTER TABLE inquiries ADD COLUMN plate_info_3 VARCHAR(50)`, "plate_info_3")
  await addCol(`ALTER TABLE inquiries ADD COLUMN plate_info_4 VARCHAR(50)`, "plate_info_4")

  await addCol(`ALTER TABLE inquiries ADD COLUMN store_name VARCHAR(100)`, "store_name")
  await addCol(`ALTER TABLE inquiries ADD COLUMN store_code VARCHAR(50)`, "store_code")

  await addCol(`ALTER TABLE inquiries ADD COLUMN new_car_model VARCHAR(100)`, "new_car_model")
  await addCol(`ALTER TABLE inquiries ADD COLUMN new_car_color VARCHAR(50)`, "new_car_color")

  await addCol(`ALTER TABLE inquiries ADD COLUMN new_plate_info_1 VARCHAR(50)`, "new_plate_info_1")
  await addCol(`ALTER TABLE inquiries ADD COLUMN new_plate_info_2 VARCHAR(50)`, "new_plate_info_2")
  await addCol(`ALTER TABLE inquiries ADD COLUMN new_plate_info_3 VARCHAR(50)`, "new_plate_info_3")
  await addCol(`ALTER TABLE inquiries ADD COLUMN new_plate_info_4 VARCHAR(50)`, "new_plate_info_4")

  await addCol(`ALTER TABLE inquiries ADD COLUMN new_course_name VARCHAR(100)`, "new_course_name")
  await addCol(`ALTER TABLE inquiries ADD COLUMN new_email VARCHAR(255)`, "new_email")

  try {
    await conn.execute(`ALTER TABLE inquiries MODIFY COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP`)
  } catch {}
  try {
    await conn.execute(
      `ALTER TABLE inquiries MODIFY COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
    )
  } catch {}

  const desiredOrder = [
    "id",
    "customer_id",
    "inquiry_type",
    "inquiry_details",
    "cancellation_reasons",
    "status",
    "reference_id",
    "square_customer_id",
    "family_name",
    "given_name",
    "email",
    "phone",
    "course",
    "car_model",
    "color",
    "plate_info_1",
    "plate_info_2",
    "plate_info_3",
    "plate_info_4",
    "store_name",
    "store_code",
    "new_car_model",
    "new_car_color",
    "new_plate_info_1",
    "new_plate_info_2",
    "new_plate_info_3",
    "new_plate_info_4",
    "new_course_name",
    "new_email",
    "created_at",
    "updated_at",
  ]

  const currentOrder = await getCurrentInquiriesOrder(conn)
  const isSame =
    currentOrder.length === desiredOrder.length && currentOrder.every((col, idx) => col === desiredOrder[idx])

  if (!isSame) {
    console.log("inquiries: カラムの並びを調整します...")
    const defs: Record<string, string> = {
      id: "INT NOT NULL AUTO_INCREMENT",
      customer_id: "INT",
      inquiry_type: "VARCHAR(100)",
      inquiry_details: "TEXT",
      cancellation_reasons: "JSON",
      status: "VARCHAR(50) NOT NULL DEFAULT 'pending'",
      reference_id: "VARCHAR(20)",
      square_customer_id: "VARCHAR(100)",
      family_name: "VARCHAR(50)",
      given_name: "VARCHAR(50)",
      email: "VARCHAR(255)",
      phone: "VARCHAR(20)",
      course: "VARCHAR(100)",
      car_model: "VARCHAR(100)",
      color: "VARCHAR(50)",
      plate_info_1: "VARCHAR(50)",
      plate_info_2: "VARCHAR(50)",
      plate_info_3: "VARCHAR(50)",
      plate_info_4: "VARCHAR(50)",
      store_name: "VARCHAR(100)",
      store_code: "VARCHAR(50)",
      new_car_model: "VARCHAR(100)",
      new_car_color: "VARCHAR(50)",
      new_plate_info_1: "VARCHAR(50)",
      new_plate_info_2: "VARCHAR(50)",
      new_plate_info_3: "VARCHAR(50)",
      new_plate_info_4: "VARCHAR(50)",
      new_course_name: "VARCHAR(100)",
      new_email: "VARCHAR(255)",
      created_at: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
      updated_at: "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
    }

    const parts: string[] = []
    desiredOrder.forEach((col, idx) => {
      const def = defs[col]
      if (!def) return
      if (idx === 0) {
        parts.push(`MODIFY COLUMN \`${col}\` ${def} FIRST`)
      } else {
        const prev = desiredOrder[idx - 1]
        parts.push(`MODIFY COLUMN \`${col}\` ${def} AFTER \`${prev}\``)
      }
    })

    const alterSql = `ALTER TABLE inquiries ${parts.join(", ")}`
    try {
      await conn.execute(alterSql)
      console.log("✅ inquiries: カラムの並びを更新しました")
    } catch (e) {
      console.error("❌ inquiries: 並び替えエラー", e)
    }
  } else {
    console.log("inquiries: 既に希望のカラム順です")
  }
}

export async function findCustomer(email: string, phone: string, carModel: string): Promise<Customer | null> {
  return withRetry(async () => {
    const [rows] = await pool.execute(`SELECT * FROM customers WHERE email = ? AND phone = ? AND car_model = ?`, [
      email,
      phone,
      carModel,
    ])
    const customers = rows as Customer[]
    return customers.length > 0 ? customers[0] : null
  })
}

export async function findCustomerFlexible(
  email?: string | null,
  phone?: string | null,
  carModel?: string | null,
): Promise<Customer | null> {
  return withRetry(async () => {
    if (email && phone && carModel) {
      const [rows] = await pool.execute(
        `SELECT * FROM customers WHERE email = ? AND phone = ? AND car_model = ? LIMIT 1`,
        [email, phone, carModel],
      )
      const arr = rows as Customer[]
      if (arr.length) return arr[0]
    }
    if (email && phone) {
      const [rows] = await pool.execute(
        `SELECT * FROM customers WHERE email = ? AND phone = ? ORDER BY updated_at DESC LIMIT 1`,
        [email, phone],
      )
      const arr = rows as Customer[]
      if (arr.length) return arr[0]
    }
    if (email) {
      const [rows] = await pool.execute(`SELECT * FROM customers WHERE email = ? ORDER BY updated_at DESC LIMIT 1`, [
        email,
      ])
      const arr = rows as Customer[]
      if (arr.length) return arr[0]
    }
    if (phone) {
      const [rows] = await pool.execute(`SELECT * FROM customers WHERE phone = ? ORDER BY updated_at DESC LIMIT 1`, [
        phone,
      ])
      const arr = rows as Customer[]
      if (arr.length) return arr[0]
    }
    return null
  })
}

export async function insertCustomer(data: InsertCustomerData): Promise<number> {
  await ensureSchemaInitialized()

  const storeCode = await getStoreCodeByName(data.storeName)
  if (!storeCode) {
    throw new Error(`店舗が見つかりません: ${data.storeName}`)
  }

  const conn = await pool.getConnection()
  try {
    await setSessionJst(conn)
    await conn.beginTransaction()

    const [result] = await conn.execute(
      `INSERT INTO customers (
        reference_id, square_customer_id, family_name, given_name, email, phone, 
        course, car_model, color, plate_info_1, plate_info_2, plate_info_3, plate_info_4,
        store_name, store_code, registration_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), 'active')`,
      [
        data.referenceId,
        data.squareCustomerId || null,
        data.familyName,
        data.givenName,
        data.email,
        data.phone,
        data.course,
        data.carModel,
        data.color,
        data.plateInfo1 ?? null,
        data.plateInfo2 ?? null,
        data.plateInfo3 ?? null,
        data.plateInfo4 ?? null,
        data.storeName,
        storeCode,
      ],
    )

    const insertResult = result as mysql.ResultSetHeader
    const customerId = insertResult.insertId
    await conn.commit()
    return customerId
  } catch (e) {
    await conn.rollback()
    throw e
  } finally {
    conn.release()
  }
}

export async function updateCustomer(customerId: number, data: UpdateCustomerData): Promise<void> {
  await ensureSchemaInitialized()

  const conn = await pool.getConnection()
  try {
    await setSessionJst(conn)
    await conn.beginTransaction()

    await ensureInquiriesTableStructure(conn)

    const current = await getCustomerById(conn, customerId)
    if (!current) {
      throw new Error(`顧客が見つかりません: ${customerId}`)
    }

    const resolvedStoreCode = data.storeName ? await getStoreCodeByName(data.storeName) : current.store_code

    await conn.execute(
      `INSERT INTO inquiries (
        customer_id, inquiry_type, inquiry_details, cancellation_reasons, status,
        reference_id, square_customer_id, family_name, given_name, email, phone, course,
        car_model, color, plate_info_1, plate_info_2, plate_info_3, plate_info_4,
        store_name, store_code, new_car_model, new_car_color,
        new_plate_info_1, new_plate_info_2, new_plate_info_3, new_plate_info_4,
        new_course_name, new_email
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?,?,?,?)`,
      [
        customerId,
        data.inquiryType,
        data.inquiryDetails || "",
        data.cancellationReasons && data.cancellationReasons.length > 0
          ? JSON.stringify(data.cancellationReasons)
          : null,
        data.status || "pending",
        current.reference_id,
        current.square_customer_id ?? null,
        current.family_name,
        current.given_name,
        current.email,
        current.phone,
        current.course ?? null,
        current.car_model,
        current.color,
        current.plate_info_1 ?? null,
        current.plate_info_2 ?? null,
        current.plate_info_3 ?? null,
        current.plate_info_4 ?? null,
        data.storeName ?? current.store_name ?? null,
        resolvedStoreCode ?? null,
        data.newCarModel ?? null,
        data.newCarColor ?? null,
        null, // new_plate_info_1
        null, // new_plate_info_2
        null, // new_plate_info_3
        null, // new_plate_info_4
        data.newCourseName ?? null,
        data.newEmail ?? null,
      ],
    )

    const nonStatusFields: string[] = []
    const nonStatusValues: any[] = []

    if (data.newCarModel) {
      nonStatusFields.push("car_model = ?")
      nonStatusValues.push(data.newCarModel)
    }
    if (data.newCarColor) {
      nonStatusFields.push("color = ?")
      nonStatusValues.push(data.newCarColor)
    }
    if (data.newCourseName) {
      nonStatusFields.push("course = ?")
      nonStatusValues.push(data.newCourseName)
    }
    if (data.newEmail) {
      nonStatusFields.push("email = ?")
      nonStatusValues.push(data.newEmail)
    }

    if (nonStatusFields.length > 0) {
      nonStatusFields.push("updated_at = NOW()")
      nonStatusValues.push(customerId)
      await conn.execute(`UPDATE customers SET ${nonStatusFields.join(", ")} WHERE id = ?`, nonStatusValues)
    }

    if (data.customerStatus) {
      try {
        await conn.execute(`UPDATE customers SET status = ?, updated_at = NOW() WHERE id = ?`, [
          data.customerStatus,
          customerId,
        ])
      } catch (e: any) {
        console.warn("customers.status 更新スキップ:", e?.message || e)
      }
    }

    await conn.commit()
  } catch (e) {
    await conn.rollback()
    throw e
  } finally {
    conn.release()
  }
}

export default pool
