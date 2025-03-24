import * as React from "react";

export function useQueuedAttention(limit = 30) {
  const queuedAttention = React.useState(0);

  function setQueuedAttentionRestrictedByLimit() {
    if (queuedAttention[0] < limit) {
      return queuedAttention[1](queuedAttention[0] + 1);
    }
  }

  return [queuedAttention, setQueuedAttentionRestrictedByLimit];
}
