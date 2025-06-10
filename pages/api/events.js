import { BigQuery } from '@google-cloud/bigquery';

// Initialize BigQuery client
// Ensure your GOOGLE_APPLICATION_CREDENTIALS environment variable is set
// or that your application is running in a GCP environment with appropriate ADC.
// For local development, you might need to specify `keyFilename` or `credentials`.
// const bigquery = new BigQuery({
//   projectId: process.env.GCP_PROJECT_ID, // Or your GCP project ID
//   credentials: {
//     client_email: process.env.GCP_CLIENT_EMAIL,
//     private_key: process.env.GCP_PRIVATE_KEY ? process.env.GCP_PRIVATE_KEY.replace(/\n/g, '\n') : undefined,
//   }
// });
// Simpler initialization if GOOGLE_APPLICATION_CREDENTIALS_JSON is a JSON string:
let bigquery;
try {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    bigquery = new BigQuery({
      projectId: credentials.project_id, // Extract project_id from the JSON
      credentials
    });
  } else {
    // Fallback for environments where GOOGLE_APPLICATION_CREDENTIALS points to a file
    // or ADC is available (e.g., Cloud Run, GKE)
    bigquery = new BigQuery();
  }
} catch (error) {
  console.error("Failed to initialize BigQuery client:", error);
  // Set bigquery to a dummy object or handle this case appropriately
  // For now, we'll let it fail and the API will return an error if it's used.
}


export default async function handler(req, res) {
  if (!bigquery) {
    console.error('BigQuery client is not initialized.');
    return res.status(500).json({ error: 'BigQuery client initialization failed. Check server logs.' });
  }

  // SQL query to fetch data from GDELT
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
      SQLDATE >= DATE_SUB(CURRENT_DATE('UTC'), INTERVAL 1 DAY)
      AND Actor1Geo_Lat IS NOT NULL
      AND Actor1Geo_Long IS NOT NULL
    LIMIT 1000
  `;

  const options = {
    query: query,
    // Location must match that of the dataset(s) referenced in the query.
    // The GDELT dataset is in the US.
    location: 'US',
  };

  try {
    const [rows] = await bigquery.query(options);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error executing BigQuery query:', error);
    res.status(500).json({
      error: 'Failed to fetch data from BigQuery.',
      details: error.message, // Provide more details for debugging
    });
  }
}
