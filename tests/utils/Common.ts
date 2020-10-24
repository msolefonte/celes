// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import regedit from 'regodit';

async function createKeyBackup(root: string, original_key: string, backup_key: string): Promise<void> {
    const realValue = await regedit.RegExportKey(root, original_key, {absenceError: false});
    await regedit.RegImportKey(root, backup_key, realValue, {absenceDelete: true});
}

async function recoverKeyBackup(root: string, original_key: string, backup_key: string): Promise<void> {
    const backupValue = await regedit.RegExportKey(root, backup_key, {absenceError: false});
    await regedit.RegImportKey(root, original_key, backupValue, {absenceDelete: true});
    await regedit.RegDeleteKeyIncludingSubkeys(root, backup_key);
}

export {createKeyBackup, recoverKeyBackup};