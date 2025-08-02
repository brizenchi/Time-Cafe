import React from "react"
import { Gift, Coffee } from "lucide-react"

interface InteractionPopoverProps {
  player: { id: string; name: string }
  x: number
  y: number
  onSendGift: () => void
  onBuyCoffee: () => void
  onClose: () => void
}

export const InteractionPopover: React.FC<InteractionPopoverProps> = ({ player, x, y, onSendGift, onBuyCoffee, onClose }) => {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        zIndex: 200,
        background: "rgba(255,255,255,0.92)",
        borderRadius: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,0.13)",
        padding: 4,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        minWidth: 0
      }}
      onClick={e => e.stopPropagation()}
      tabIndex={-1}
      onBlur={onClose}
    >
      <button
        title="Send Gift"
        aria-label="Send Gift"
        onClick={onSendGift}
        style={{
          background: "#fffbe6",
          border: "1px solid #ffe58f",
          borderRadius: 6,
          padding: 4,
          marginRight: 2,
          cursor: "pointer",
          boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
          display: "flex",
          alignItems: "center"
        }}
      >
        <Gift size={20} color="#f59e42" />
      </button>
      <button
        title="Buy Coffee"
        aria-label="Buy Coffee"
        onClick={onBuyCoffee}
        style={{
          background: "#e6f7ff",
          border: "1px solid #91d5ff",
          borderRadius: 6,
          padding: 4,
          marginLeft: 2,
          cursor: "pointer",
          boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
          display: "flex",
          alignItems: "center"
        }}
      >
        <Coffee size={20} color="#1890ff" />
      </button>
    </div>
  )
}
