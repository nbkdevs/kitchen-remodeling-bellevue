# Amazon Appstore listing kit: Kitchen Remodeling Cost Planner

Upload this kit by hand in the Amazon Developer Console. Do one submission and pick all 11 marketplaces (amazon.com, .co.uk, .de, .it, .fr, .es, .co.jp, .ca, .com.br, .com.mx, .com.au).

## Files
- APK: `releases/kitchen-remodeling-cost-planner-1.0.0.apk`, signed with the upload key `CN=Bellevue Kitchen Pros`.
  - SHA-256: `1dbe677c29c10e722a70f2e70d1a14ba80b807994a12d359061f1e101820d85d`
- AAB (for other stores): `releases/kitchen-remodeling-cost-planner-1.0.0.aab`
- Icons: `store-graphics/app-icon-512.png` and `store-graphics/app-icon-114.png`
- Screenshots: `store-graphics/phone-1080x1920/*.png` (5), with 800x1280 copies in `store-graphics/phone-800x1280/`
- Promo / feature graphic: `store-graphics/feature-graphic-1024x500.png`

## App details
- **Title:** Kitchen Remodeling Cost Planner
- **Package:** com.nbkdevs.kitchenremodelingcost. Version 1.0.0 (code 1). Min SDK 24, target 36.
- **Category:** Lifestyle > Home & Garden (fallback: Productivity)
- **Developer website:** https://wakitchenremodelingbellevue.com/
- **Privacy policy:** https://wakitchenremodelingbellevue.com/privacy/
- **Contact email:** nbkdevs@gmail.com
- **Content rating:** General audience. No ads, no in-app purchases, no account, no data collected.
- **Permissions:** none beyond the androidx dynamic-receiver signature permission. The app works offline.

## Short description (max 80 characters)
Split a kitchen remodel budget into line items with sales tax, reserve and permits.

## Long description (do not put URLs in this field)
Kitchen Remodeling Cost Planner turns one kitchen remodel budget into a plan you can check against contractor bids.

Enter the total you can spend. The planner takes out the permit allowance, a contingency reserve and sales tax, then splits the construction money across 12 line items:
- cabinets and shelving
- installation and labor
- appliances
- countertops and backsplash
- flooring
- lighting
- painting
- design fees
- sink and faucet
- doors and windows
- plumbing
- miscellaneous

Prefer to work forwards? Enter a construction price to get the all-in total with tax, reserve and permit.

Features
• Budget split and all-in estimate modes
• Adjustable sales tax, contingency and permit allowance (defaults: 10.3% tax, 10% reserve)
• Three Cost vs Value 2025 presets for the Pacific region: minor midrange, major midrange and major upscale
• Shares based on national remodel cost surveys, with a table showing every percentage
• Cent-exact maths: every line adds up to the total, with no rounding drift
• Works offline, with no sign-in, no ads and no tracking

Made by Bellevue Kitchen Pros, a kitchen remodeling team in Bellevue, Washington.

## Keywords
kitchen remodel, remodeling cost, budget calculator, renovation planner, cabinets, countertops, home improvement, contractor estimate, sales tax, contingency

## Testing notes for reviewers
No login needed. Open the app, enter 60000 on the Planner tab and switch to "Estimate" to see the totals. The About tab links to the developer website.
