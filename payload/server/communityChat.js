// Compatibility transport for the independent chat-bubble package. No gameplay state mutations.
const sentAt=new WeakMap();
export function communityChat(lobby,session,msg){
 const room=lobby.roomOf(session),seat=room?.seatOf(session.playerId);
 if(!room||!seat||seat.isBot||seat.left)return {error:'NOT_IN_ROOM'};
 const text=String(msg.text||'').replace(/[\u0000-\u001f\u007f]/g,' ').trim();
 if(!text||Array.from(text).length>120)return {error:'BAD_MSG'};
 const now=lobby.now();if(now-(sentAt.get(session)??-Infinity)<250)return {error:'RATE'};
 sentAt.set(session,now);
 lobby.broadcastRoom(room,{t:'community.chat',code:room.code,playerId:session.playerId,data:{text,name:seat.name}});
 return {ok:true};
}
