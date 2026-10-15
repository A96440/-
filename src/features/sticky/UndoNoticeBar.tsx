import type { UndoNotice } from './useUndoNotice'

export function UndoNoticeBar({ notice, onDismiss }: { notice: UndoNotice | null; onDismiss: () => void }) {
  if (!notice) return null
  return <div className="sticky-undo-notice" role="status"><span>{notice.message}</span><button onClick={async () => { await notice.undo(); onDismiss() }} type="button">撤回</button></div>
}
