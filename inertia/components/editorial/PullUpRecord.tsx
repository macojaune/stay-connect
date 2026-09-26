/** A geometric record stamp. The backspin is a short response to pointer interaction. */
export default function PullUpRecord() {
  return (
    <div className="sc-record-stamp" aria-hidden="true">
      <svg viewBox="0 0 200 200" fill="none" focusable="false">
        <g className="sc-record-stamp-disc">
          <circle cx="100" cy="100" r="91" fill="#231F1B" />
          {[80, 74, 68, 62, 56].map((r) => (
            <circle
              key={r}
              cx="100"
              cy="100"
              r={r}
              stroke="#F8F3E9"
              strokeOpacity=".23"
              strokeWidth="1"
            />
          ))}
          <path
            d="M38 75a67 67 0 0 1 38-37M124 162a67 67 0 0 0 38-38"
            stroke="#F8F3E9"
            strokeOpacity=".65"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="100" cy="100" r="43" fill="#F8F3E9" />
          <text
            x="100"
            y="94"
            textAnchor="middle"
            fill="#231F1B"
            fontFamily="SC Anton, sans-serif"
            fontSize="19"
          >
            PULL-UP
          </text>
          <path d="m95 107-9 6 9 6v-12Zm14 0-9 6 9 6v-12Z" fill="#FD4F00" />
          <circle cx="100" cy="100" r="2" fill="#231F1B" />
        </g>
        <path
          d="M26 42A91 91 0 0 1 165 28m0 0-2-18m2 18-18-2"
          stroke="#231F1B"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
