═══════════════════════════════════════════════════
  HHB CATALOG REBUILD — March 2026
  Deploy Instructions
═══════════════════════════════════════════════════

WHAT CHANGED:
  • catalog-data.js  — REBUILT from March Excel (9,164 products, was 7,517)
                       All codes & descriptions now match Excel exactly.
                       Added SECTION_GUIDES map (35 HHB buying guide PDFs).
  • photo_map.json   — Regenerated for all 9,164 codes.
  • catalog-guide.js — NEW file. Adds "View in HHB Buying Guide" button
                       per section, linking to official HHB PDFs with photos.

═══════════════════════════════════════════════════
  DEPLOY STEPS (Hostinger File Manager)
═══════════════════════════════════════════════════

1. BACKUP FIRST
   In File Manager, navigate to public_html/hhb-catalog/
   Download current catalog-data.js → save as catalog-data-BACKUP.js on desktop

2. UPLOAD 3 FILES to public_html/hhb-catalog/
   • catalog-data.js    (REPLACE existing)
   • photo_map.json     (REPLACE existing)
   • catalog-guide.js   (NEW file)

3. EDIT app.html — Add ONE line
   Open app.html in Hostinger File Manager editor.
   Find this at the very end of the file:

     </script>
     </body>
     </html>

   Change it to:

     </script>
     <script src="catalog-guide.js?v=20260325"></script>
     </body>
     </html>

   Save.

4. DONE — Clear browser cache and test.
   Hard-refresh: Ctrl+Shift+R

═══════════════════════════════════════════════════
  WHAT USERS SEE
═══════════════════════════════════════════════════

• Every section now shows a blue "📖 View in HHB Buying Guide" button
• Clicking it opens the official HHB PDF for that section (with photos!)
• All 9,164 product codes & descriptions match the March Excel exactly
• Existing server photos still work where available (~73% of codes)
• Products not in the March Excel have been removed

═══════════════════════════════════════════════════
  NEXT MONTH
═══════════════════════════════════════════════════

When you get the April Excel from HHB:
1. Upload it to Claude
2. Say "rebuild catalog-data.js from this new Excel"
3. Claude generates updated files
4. You replace on Hostinger — same process
