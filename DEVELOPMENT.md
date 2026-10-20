# Running and deploying SkyIndex

Plain JavaScript with no build step and no dependencies. Serve the folder and open it:

```
python -m http.server 8137
```

Then visit http://localhost:8137.

## Rebuilding the airport data

Data comes from [OurAirports](https://ourairports.com/data/) (public domain). Download `airports.csv` into `scripts/raw/`, then run:

```
node scripts/build-data.mjs
```

Nearby airports for big metros are hand-picked in `data/metros.js`. Everything else is filled in by distance.

## Deploying (Cloudflare Pages)

```
node scripts/make-dist.mjs
npx wrangler pages deploy dist --project-name skyindex
```

To make phones drop old cached files right away, bump `CACHE` in `sw.js` before deploying.
