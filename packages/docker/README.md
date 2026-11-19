# kitchen-remodeling-cost: Kitchen Remodeling Cost Planner (Docker)

A tiny, dependency-free web service that splits a kitchen remodel budget by line item and adds sales
tax, a contingency reserve and a permit allowance. It serves a JSON API and a browser calculator page.

```sh
docker run --rm -p 8080:8080 iamnazzal/kitchen-remodeling-cost
# open http://localhost:8080/  (calculator page)
curl "http://localhost:8080/api/split?total=60000&permit=1500"
curl "http://localhost:8080/api/estimate?amount=50000&tax=10.1&format=text"
curl "http://localhost:8080/api/preset/major-midrange"
```

## API

| Endpoint | What it does |
|---|---|
| `GET /api/split?total=` | Split an all-in budget (tax, reserve and permits included) into 12 line items |
| `GET /api/estimate?amount=` | Add reserve, tax and permits to a construction cost |
| `GET /api/preset/<name>` | `minor-midrange`, `major-midrange`, `major-upscale` (Cost vs Value 2025, Pacific averages) |
| `GET /api/presets` | List presets |
| `GET /healthz` | Health check |

Optional query parameters: `tax` and `contingency` (percent; defaults 10.3 and 10), `permit` (dollars),
`share_<key>=<percent>` to override a line item (for example `share_cabinets=30`), `format=text` for a plain table.

Line item shares follow HomeGuide's kitchen remodel cost breakdown (cabinets 25%, labor 15%, appliances 15%,
countertops 10% and so on). The 10.3% default is the Bellevue, WA combined sales tax rate for October to
December 2026; Washington taxes the full contract price, labor included.

Image: `node:22-alpine`, runs as the unprivileged `node` user on port 8080, makes no outbound requests.
Tags: `1.0.0`, `latest` (linux/amd64, linux/arm64).

## Links

- Kitchen remodel cost guides and line-item bids: [Kitchen Remodeling Bellevue](https://wakitchenremodelingbellevue.com/)
- Source: https://github.com/nbkdevs/kitchen-remodeling-bellevue (`packages/docker`; the maths is the `kitchen-remodeling-cost` npm library)

## License

MIT © Bellevue Kitchen Pros
