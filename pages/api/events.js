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
    const query = `
      SELECT
        t1.GLOBALEVENTID,
        t1.SQLDATE,
        t1.ActionGeo_Lat,
        t1.ActionGeo_Long,
        t1.ActionGeo_Fullname,
        t1.SOURCEURL,
        t1.AvgTone,
        t1.NumMentions
      FROM
        \`gdelt-bq.gdeltv2.events\` AS t1
      INNER JOIN
        \`gdelt-bq.gdeltv2.eventthemes\` AS t2
      ON
        t1.GLOBALEVENTID = t2.GLOBALEVENTID
      WHERE
        t1.SQLDATE >= @yesterday
        AND t1.ActionGeo_Lat IS NOT NULL
        AND t1.ActionGeo_Long IS NOT NULL
        AND t2.Theme LIKE 'SOC_%'
        AND t1.NumMentions >= 10
      GROUP BY 1, 2, 3, 4, 5, 6, 7, 8
      ORDER BY t1.NumMentions DESC
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