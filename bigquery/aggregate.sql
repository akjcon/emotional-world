-- emotional-world: hourly media tone by country, last 7 days.
--
-- Source: gdelt-bq.gdeltv2.gkg_partitioned (Global Knowledge Graph 2.1)
-- Cost: scans ~7 days of GKG (~a few GB; comfortably free-tier).
--
-- V2Tone: comma-separated; the first value is mean tone (~−10..+10).
-- V2Locations: semicolon-separated records of
--   Type#FullName#CountryCode#ADM1Code#Lat#Lng#FeatureID#Offset
-- We unnest so a single article contributes to every country it mentions
-- (the standard GDELT convention for country-level aggregations).
--
-- Country codes: GDELT V2Locations uses FIPS 10-4 codes (e.g. 'UK' for
-- United Kingdom, not 'GB'). We return the raw FIPS code here and let
-- scripts/refresh-tone.mjs map FIPS → ISO 3166-1 alpha-3 in JS.
--
-- Output schema: { hour TIMESTAMP, fips STRING, tone FLOAT64, n INT64 }

WITH expanded AS (
  SELECT
    TIMESTAMP_TRUNC(
      PARSE_TIMESTAMP('%Y%m%d%H%M%S', CAST(DATE AS STRING)),
      HOUR
    ) AS hour,
    SAFE_CAST(SPLIT(V2Tone, ',')[OFFSET(0)] AS FLOAT64) AS tone,
    SPLIT(loc, '#')[SAFE_OFFSET(2)] AS fips
  FROM
    `gdelt-bq.gdeltv2.gkg_partitioned`,
    UNNEST(SPLIT(V2Locations, ';')) AS loc
  WHERE
    _PARTITIONTIME >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
    AND V2Tone IS NOT NULL
    AND V2Locations IS NOT NULL
)
SELECT
  hour,
  fips,
  AVG(tone) AS tone,
  COUNT(*) AS n
FROM expanded
WHERE fips IS NOT NULL AND LENGTH(fips) = 2
GROUP BY hour, fips
ORDER BY hour, fips;
