import { BigQuery } from '@google-cloud/bigquery';

// BigQueryクライアントの初期化
let bigquery;
try {
  // 方法1: 環境変数のJSON文字列から
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    bigquery = new BigQuery({
      projectId: credentials.project_id,
      credentials,
    });
  } else {
    // 方法2: Application Default Credentials (ADC) を使用
    // GCP環境や、gcloud CLIで認証済みのローカル環境で自動的に機能します
    bigquery = new BigQuery();
  }
} catch (error) {
  console.error("BigQueryクライアントの初期化に失敗しました:", error);
}

// 昨日の日付をYYYYMMDD形式の数値で取得する関数
const getYesterdayAsInteger = () => {
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const year = yesterday.getUTCFullYear();
  const month = String(yesterday.getUTCMonth() + 1).padStart(2, '0');
  const day = String(yesterday.getUTCDate()).padStart(2, '0');
  return parseInt(`${year}${month}${day}`, 10);
};

export default async function handler(req, res) {
  // クライアントが初期化されていない場合はエラーを返す
  if (!bigquery) {
    return res.status(500).json({ error: "BigQuery client not initialized.", details: "Check server logs for initialization errors." });
  }

  try {
    const yesterdayInt = getYesterdayAsInteger();

    // SQLDATE (INTEGER) と昨日の日付 (INTEGER) を比較する正しいクエリ
    const query = `
      SELECT
        GLOBALEVENTID,
        SQLDATE,
        Actor1Geo_Lat,
        Actor1Geo_Long,
        SOURCEURL,
        AvgTone
      FROM
        \`gdelt-bq.gdeltv2.events\`
      WHERE
        SQLDATE >= @yesterday
        AND Actor1Geo_Lat IS NOT NULL
        AND Actor1Geo_Long IS NOT NULL
      LIMIT 1000`;

    const options = {
      query: query,
      location: 'US', // GDELT公開データセットはUSにあります
      params: { yesterday: yesterdayInt }, // パラメータとして数値を渡す
    };

    const [rows] = await bigquery.query(options);

    res.status(200).json(rows);
  } catch (error) {
    console.error('BigQuery Error:', error);
    res.status(500).json({
      error: 'Failed to fetch data from BigQuery.',
      details: error.message || 'An unknown error occurred.',
    });
  }
}
