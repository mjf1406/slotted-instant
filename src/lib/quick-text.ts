import { db } from "@/lib/db";

export async function clearQuickText(settingsId: string): Promise<void> {
    await db.transact(
        db.tx.clockSettings[settingsId].update({ quickText: null })
    );
}
