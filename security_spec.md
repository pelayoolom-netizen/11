# ANTIRRATHETO Firestore Security Specification

## Data Invariants
1. `users/{userId}` contains PII (`email`). Only the verified owner (`request.auth.uid == userId`) can read, create, or update their document. Listing `users` is forbidden.
2. `perspectives/{userId}` contains zero PII. Verified authenticated users may read perspectives for matchmaking context, while only the owner (`request.auth.uid == userId`) can create, update, or delete their own perspective profile.
3. `matchmaking_queue/{userId}` may only be created or deleted by `userId`. Updates are restricted to either the owner updating their search topic/status or a verified peer claiming an active `'waiting'` entry to `'matched'` via atomic field-constrained transition (`status`, `debateId`, `matchedWithUid`, `updatedAt`).
4. `debates/{debateId}` may only be read (`get` and `list`) by users whose `request.auth.uid` is in `resource.data.participantIds`. Only one of the two participants (`hostUid` or `guestUid`) may create or update the debate. Once `status` reaches `'completed'` or `'cancelled'`, state transitions are locked (`reflectionHost` / `reflectionGuest` may only be added by the respective participant).
5. All timestamps (`createdAt`, `updatedAt`) must equal `request.time`. All strings and arrays enforce strict size bounds.

## Dirty Dozen Adversarial Payloads
1. Unauthenticated read on `/users/u1` -> `PERMISSION_DENIED`
2. Cross-user read on `/users/u2` by `u1` -> `PERMISSION_DENIED`
3. Shadow field injection (`isAdmin: true`) on `/users/u1` create -> `PERMISSION_DENIED`
4. Identity spoofing (`uid: "u2"`) inside `/users/u1` -> `PERMISSION_DENIED`
5. Client-forged `createdAt` timestamp on `/perspectives/u1` -> `PERMISSION_DENIED`
6. Oversized string (`displayName` > 80 chars) on `/perspectives/u1` -> `PERMISSION_DENIED`
7. Out-of-bounds axis value (`economicAxis: 999`) on `/perspectives/u1` -> `PERMISSION_DENIED`
8. Unbounded array (`languages` length > 5) on `/users/u1` -> `PERMISSION_DENIED`
9. List query scraping `/debates` by a non-participant `u3` -> `PERMISSION_DENIED`
10. Reopening a `'completed'` debate back to `'active'` -> `PERMISSION_DENIED`
11. Host modifying `reflectionGuest` on `/debates/d1` -> `PERMISSION_DENIED`
12. Invalid document ID (`../../../etc/passwd`) -> `PERMISSION_DENIED`
