import {html} from './components.js';
import {t} from '../../../shared/i18n.js';
import {lockedCardStatus} from '../../../shared/lockedCards.js';

export function lockedCardText(entry,context) {
  const s=lockedCardStatus(entry,context);
  if(s.waiting)return t('解锁条件已满足，等待发放');
  const parts=[];
  if(s.rounds)parts.push(t('还需{count}回合（第{round}回合解锁）',{count:s.rounds,round:s.unlockRound}));
  if(s.levels)parts.push(t('调度中心达到{level}级解锁',{level:s.unlockLevel}));
  return parts.join(' · ')||t('等待解锁');
}

/** Reusable description for a lock on a real hand card. */
export function HandLockHint({lock}) {
  if(!lock)return null;
  const text=lock.unlockRound?t('第{round}回合解锁',{round:lock.unlockRound}):t('调度中心达到{level}级解锁',{level:lock.unlockLevel});
  return html`<p class="dhint hand-lock-hint">🔒 ${text} · ${t('锁定期间可挪位置，不能上场、使用或合成')}</p>`;
}
