/**
 * Free commercial-use Unsplash photographs shown inside NEERVA BUILD.
 * They are visual illustrations, NEVER project photos, actual listed stock,
 * plan-specific renders, or evidence that any supplier is verified.
 * License: https://unsplash.com/license
 * Hosted remotely until original production renders are ready.
 */
const unsplash=(id:string)=>"https://images.unsplash.com/"+id+"?auto=format&fit=crop&q=78";
export const homeVisuals={
 hero:unsplash("photo-1600585154340-be6161a56a0c"),
 warm:unsplash("photo-1600585152915-d208bec867a1"),
 slate:unsplash("photo-1600585152220-90363fe7e115"),
 nature:unsplash("photo-1600566753190-17f0baa2a6c3"),
 interior:unsplash("photo-1600607687939-ce8a6c25118c"),
 steel:unsplash("photo-1504307651254-35680f356dfd"),
 cement:unsplash("photo-1541888946425-d81bb19240f5"),
 bricks:unsplash("photo-1595428774223-ef52624120d2"),
 pipes:unsplash("photo-1581094794329-c8112a89af12"),
 paint:unsplash("photo-1600607687920-4e2a09cf159d"),
 electrical:unsplash("photo-1621905251189-08b45d6a269e"),
} as const;
