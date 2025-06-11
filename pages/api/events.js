import { BigQuery } from '@google-cloud/bigquery';

let bigquery;
try {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    bigquery = new BigQuery({
      projectId: credentials.project_id,
      credentials,
    });
  } else {
    bigquery = new BigQuery();
  }
} catch (error) {
  console.error("BigQueryクライアントの初期化に失敗しました:", error);
}

const getYesterdayAsInteger = () => {
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const year = yesterday.getUTCFullYear();
  const month = String(yesterday.getUTCMonth() + 1).padStart(2, '0');
  const day = String(yesterday.getUTCDate()).padStart(2, '0');
  return parseInt(`${year}${month}${day}`, 10);
};

export default async function handler(req, res) {
  if (!bigquery) {
    return res.status(500).json({ error: "BigQuery client not initialized.", details: "Check server logs for initialization errors." });
  }

  try {
    const yesterdayInt = getYesterdayAsInteger();
    // SQLクエリを、存在するEventRootCodeでフィルタリングするように修正
    const query = `
      SELECT
        GLOBALEVENTID,
        SQLDATE,
        ActionGeo_Lat,
        ActionGeo_Long,
        ActionGeo_Fullname,
        SOURCEURL,
        AvgTone,
        NumMentions
      FROM
        \`gdelt-bq.gdeltv2.events\`
      WHERE
        SQLDATE >= @yesterday
        AND ActionGeo_Lat IS NOT NULL
        AND ActionGeo_Long IS NOT NULL
        AND EventRootCode IN ('14', '17') -- '14'(抗議活動)や'17'(政治的反対)などの社会的なイベントに絞る
        AND NumMentions >= 10
      ORDER BY NumMentions DESC
      LIMIT 1000`;

    const options = {
      query: query,
      location: 'US',
      params: { yesterday: yesterdayInt },
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
