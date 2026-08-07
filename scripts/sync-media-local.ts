import { syncLocalMediaCenter } from "@/lib/media-center/sync-local";
import { findMediaDuplicates } from "@/lib/media-center/duplicates";

async function main() {
  const sync = await syncLocalMediaCenter();
  console.log("SYNC RESULT:", JSON.stringify(sync, null, 2));

  const dups = await findMediaDuplicates();
  console.log("DUPLICATE GROUPS:", dups.length);
  for (const g of dups) {
    console.log("---", g.reason, "files:", g.files.length);
    for (const f of g.files) {
      console.log(" ", f.categoryLabel, "|", f.localPath, "|", f.size, "bytes");
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
