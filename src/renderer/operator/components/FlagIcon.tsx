import type { ReactElement } from "react";

interface FlagIconProps {
  id: string;
  regionCode: string | null;
}

function stripeY(y: number, height: number, fill: string) {
  return <rect x="0" y={y} width="60" height={height} fill={fill} />;
}

function stripeX(x: number, width: number, fill: string) {
  return <rect x={x} y="0" width={width} height="40" fill={fill} />;
}

function centeredCircle(fill: string, radius = 9, cx = 30, cy = 20) {
  return <circle cx={cx} cy={cy} r={radius} fill={fill} />;
}

function centeredDiamond(fill: string) {
  return <path d="M30 7 47 20 30 33 13 20Z" fill={fill} />;
}

function fivePointStar(cx: number, cy: number, outer: number, fill: string) {
  const inner = outer * 0.42;
  const points = Array.from({ length: 10 }, (_, index) => {
    const radius = index % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (index * Math.PI) / 5;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    return `${x},${y}`;
  }).join(" ");

  return <polygon points={points} fill={fill} />;
}

function crescent(cx: number, cy: number, outer: number, innerOffset: number, fill: string, cut: string) {
  return (
    <>
      <circle cx={cx} cy={cy} r={outer} fill={fill} />
      <circle cx={cx + innerOffset} cy={cy} r={outer * 0.8} fill={cut} />
    </>
  );
}

function israelStar() {
  return (
    <g fill="none" stroke="#1f6fd6" strokeWidth="1.8" strokeLinejoin="round">
      <polygon points="30,11 35,20 25,20" />
      <polygon points="30,29 35,20 25,20" />
    </g>
  );
}

function southKoreaMark() {
  return (
    <>
      <path d="M30 12a8 8 0 0 1 0 16 8 8 0 0 1 0-16Z" fill="#d93843" />
      <path d="M30 28a8 8 0 0 1 0-16 4 4 0 0 0 0 8 4 4 0 0 1 0 8Z" fill="#1f5fbf" />
      <g stroke="#111827" strokeWidth="1.8">
        <path d="M10 10h8M10 13h8M10 16h8" />
        <path d="M42 10h8M42 16h8" />
        <path d="M10 24h8M10 30h8" />
        <path d="M42 24h8M42 27h8M42 30h8" />
      </g>
    </>
  );
}

function hongKongFlower() {
  return (
    <g fill="#ffffff">
      <circle cx="30" cy="20" r="2.2" />
      <ellipse cx="30" cy="12.5" rx="2.4" ry="5.2" />
      <ellipse cx="37" cy="17" rx="2.4" ry="5.2" transform="rotate(72 37 17)" />
      <ellipse cx="34.5" cy="25.2" rx="2.4" ry="5.2" transform="rotate(144 34.5 25.2)" />
      <ellipse cx="25.5" cy="25.2" rx="2.4" ry="5.2" transform="rotate(216 25.5 25.2)" />
      <ellipse cx="23" cy="17" rx="2.4" ry="5.2" transform="rotate(288 23 17)" />
    </g>
  );
}

function taiwanSun() {
  return (
    <>
      <rect x="0" y="0" width="28" height="20" fill="#0b3d91" />
      <g transform="translate(14 10)" fill="#ffffff">
        {Array.from({ length: 12 }, (_, index) => {
          const angle = (index * Math.PI) / 6;
          const x = Math.cos(angle) * 5.4;
          const y = Math.sin(angle) * 5.4;
          return <rect key={index} x={x - 0.8} y={y - 2.6} width="1.6" height="5.2" transform={`rotate(${index * 30} ${x} ${y})`} />;
        })}
        <circle cx="0" cy="0" r="4.3" />
        <circle cx="0" cy="0" r="2.4" fill="#0b3d91" />
      </g>
    </>
  );
}

function starsLine() {
  return (
    <>
      {fivePointStar(11, 8, 3.6, "#ffd34d")}
      {fivePointStar(18, 5, 1.4, "#ffd34d")}
      {fivePointStar(21, 9, 1.4, "#ffd34d")}
      {fivePointStar(21, 14, 1.4, "#ffd34d")}
      {fivePointStar(18, 18, 1.4, "#ffd34d")}
    </>
  );
}

function unionJackCanton() {
  return (
    <>
      <rect x="0" y="0" width="26" height="20" fill="#012169" />
      <path d="M0 0 26 20M26 0 0 20" stroke="#ffffff" strokeWidth="5" />
      <path d="M0 0 26 20M26 0 0 20" stroke="#c8102e" strokeWidth="2.4" />
      <path d="M13 0v20M0 10h26" stroke="#ffffff" strokeWidth="7" />
      <path d="M13 0v20M0 10h26" stroke="#c8102e" strokeWidth="4" />
    </>
  );
}

function ethiopiaEmblem() {
  return (
    <>
      <circle cx="30" cy="20" r="8" fill="#0f47af" />
      {Array.from({ length: 5 }, (_, index) => {
        const angle = -Math.PI / 2 + (index * (2 * Math.PI)) / 5;
        return (
          <line
            key={index}
            x1="30"
            y1="20"
            x2={30 + Math.cos(angle) * 6}
            y2={20 + Math.sin(angle) * 6}
            stroke="#ffde00"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        );
      })}
      {fivePointStar(30, 20, 4.4, "none")}
      <circle cx="30" cy="20" r="1.6" fill="#ffde00" />
    </>
  );
}

function kenyaShield() {
  return (
    <>
      <path d="M30 10c5 0 8 2 8 2v10c0 5-4 8-8 10-4-2-8-5-8-10V12s3-2 8-2Z" fill="#c8102e" stroke="#ffffff" strokeWidth="1.6" />
      <path d="M30 12c2.8 0 4.5 1.1 4.5 1.1v9.3c0 2.8-2.1 4.8-4.5 6.3-2.4-1.5-4.5-3.5-4.5-6.3v-9.3S27.2 12 30 12Z" fill="#111111" />
      <path d="M30 9v22M24 13l-3 15M36 13l3 15" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
    </>
  );
}

function nordicCross(background: string, outer: string, inner?: string) {
  return (
    <>
      <rect width="60" height="40" fill={background} />
      <rect x="16" y="0" width="9" height="40" fill={outer} />
      <rect x="0" y="15" width="60" height="9" fill={outer} />
      {inner ? (
        <>
          <rect x="18.5" y="0" width="4" height="40" fill={inner} />
          <rect x="0" y="17.5" width="60" height="4" fill={inner} />
        </>
      ) : null}
    </>
  );
}

export function FlagIcon(props: FlagIconProps) {
  const region = props.regionCode?.toUpperCase() ?? "";
  const clipId = `flag-clip-${props.id}`;

  let graphic: ReactElement;
  switch (region) {
    case "IT":
      graphic = <>{stripeX(0, 20, "#009246")}{stripeX(20, 20, "#ffffff")}{stripeX(40, 20, "#ce2b37")}</>;
      break;
    case "AU":
      graphic = (
        <>
          <rect width="60" height="40" fill="#012169" />
          {unionJackCanton()}
          {fivePointStar(43, 11, 4.2, "#ffffff")}
          {fivePointStar(49, 24, 3.2, "#ffffff")}
          {fivePointStar(40, 29, 3.2, "#ffffff")}
          {fivePointStar(51, 33, 3.2, "#ffffff")}
        </>
      );
      break;
    case "US":
      graphic = (
        <>
          {Array.from({ length: 7 }, (_, index) => (
            <g key={`us-stripe-${index}`}>{stripeY(index * 6, 3, "#c9333e")}</g>
          ))}
          <rect x="0" y="0" width="26" height="22" fill="#22408c" />
          {Array.from({ length: 3 }, (_, row) =>
            Array.from({ length: 4 }, (_, col) => (
              <circle key={`${row}-${col}`} cx={4 + col * 5.5} cy={4 + row * 6} r="1" fill="#ffffff" />
            ))
          )}
        </>
      );
      break;
    case "FR":
      graphic = <>{stripeX(0, 20, "#1f4aa8")}{stripeX(20, 20, "#ffffff")}{stripeX(40, 20, "#e33b32")}</>;
      break;
    case "DE":
      graphic = <>{stripeY(0, 13.34, "#111111")}{stripeY(13.34, 13.33, "#d2202f")}{stripeY(26.67, 13.33, "#f5c542")}</>;
      break;
    case "ES":
      graphic = <>{stripeY(0, 9, "#c5272f")}{stripeY(9, 22, "#f5c400")}{stripeY(31, 9, "#c5272f")}</>;
      break;
    case "MX":
      graphic = <>{stripeX(0, 20, "#006847")}{stripeX(20, 20, "#ffffff")}{stripeX(40, 20, "#ce1126")}{centeredCircle("#a67c52", 3.3)}</>;
      break;
    case "BR":
      graphic = <><rect width="60" height="40" fill="#169b45" />{centeredDiamond("#ffdf3f")}{centeredCircle("#1f4aa8", 7)}</>;
      break;
    case "NL":
      graphic = <>{stripeY(0, 13.34, "#ae1c28")}{stripeY(13.34, 13.33, "#ffffff")}{stripeY(26.67, 13.33, "#21468b")}</>;
      break;
    case "PL":
      graphic = <>{stripeY(0, 20, "#ffffff")}{stripeY(20, 20, "#dc143c")}</>;
      break;
    case "RO":
      graphic = <>{stripeX(0, 20, "#002b7f")}{stripeX(20, 20, "#fcd116")}{stripeX(40, 20, "#ce1126")}</>;
      break;
    case "RU":
      graphic = <>{stripeY(0, 13.34, "#ffffff")}{stripeY(13.34, 13.33, "#224c9a")}{stripeY(26.67, 13.33, "#d52b1e")}</>;
      break;
    case "UA":
      graphic = <>{stripeY(0, 20, "#0057b7")}{stripeY(20, 20, "#ffd700")}</>;
      break;
    case "ZA":
      graphic = (
        <>
          <rect width="60" height="20" fill="#de3831" />
          <rect y="20" width="60" height="20" fill="#002395" />
          <path d="M0 0h15l17 13h28v14H32L15 40H0l20-20Z" fill="#ffb612" />
          <path d="M0 3h14l18 14h28v6H32L14 37H0l18-17Z" fill="#007a4d" />
          <path d="M0 0v40l17-20Z" fill="#111111" />
          <path d="M0 6v28l12-14Z" fill="#ffffff" />
          <path d="M16 9 31 20 16 31" stroke="#ffffff" strokeWidth="4" fill="none" />
        </>
      );
      break;
    case "ET":
      graphic = <>{stripeY(0, 13.34, "#078930")}{stripeY(13.34, 13.33, "#fcd116")}{stripeY(26.67, 13.33, "#da121a")}{ethiopiaEmblem()}</>;
      break;
    case "KE":
      graphic = <>{stripeY(0, 11, "#111111")}{stripeY(11, 2.5, "#ffffff")}{stripeY(13.5, 13, "#bb0000")}{stripeY(26.5, 2.5, "#ffffff")}{stripeY(29, 11, "#006600")}{kenyaShield()}</>;
      break;
    case "SA":
      graphic = <><rect width="60" height="40" fill="#006c35" /><rect x="16" y="25" width="28" height="2.2" rx="1.1" fill="#ffffff" /></>;
      break;
    case "IL":
      graphic = <><rect width="60" height="40" fill="#ffffff" />{stripeY(4, 4, "#1f6fd6")}{stripeY(32, 4, "#1f6fd6")}{israelStar()}</>;
      break;
    case "IR":
      graphic = <>{stripeY(0, 13.34, "#239f40")}{stripeY(13.34, 13.33, "#ffffff")}{stripeY(26.67, 13.33, "#da0000")}</>;
      break;
    case "PK":
      graphic = <><rect width="60" height="40" fill="#01411c" />{stripeX(0, 12, "#ffffff")}{crescent(36, 18, 7, 3.3, "#ffffff", "#01411c")}{fivePointStar(42, 12, 2.5, "#ffffff")}</>;
      break;
    case "TR":
      graphic = <><rect width="60" height="40" fill="#e30a17" />{crescent(24, 20, 7, 2.7, "#ffffff", "#e30a17")}{fivePointStar(33, 20, 3, "#ffffff")}</>;
      break;
    case "AF":
      graphic = <>{stripeX(0, 20, "#111111")}{stripeX(20, 20, "#be1e2d")}{stripeX(40, 20, "#1f8a3b")}</>;
      break;
    case "AL":
      graphic = <><rect width="60" height="40" fill="#e41e20" />{centeredCircle("#111111", 5)}</>;
      break;
    case "AM":
      graphic = <>{stripeY(0, 13.34, "#d90012")}{stripeY(13.34, 13.33, "#0033a0")}{stripeY(26.67, 13.33, "#f2a800")}</>;
      break;
    case "AZ":
      graphic = <>{stripeY(0, 13.34, "#00b5e2")}{stripeY(13.34, 13.33, "#ef3340")}{stripeY(26.67, 13.33, "#509e2f")}{crescent(28, 20, 5.5, 2.2, "#ffffff", "#ef3340")}{fivePointStar(35, 20, 2.2, "#ffffff")}</>;
      break;
    case "BA":
      graphic = <><rect width="60" height="40" fill="#002f6c" /><path d="M60 0 25 40H60Z" fill="#f7d117" />{Array.from({ length: 6 }, (_, index) => <circle key={index} cx={40 + index * 3.3} cy={4 + index * 6.3} r="1.6" fill="#ffffff" />)}</>;
      break;
    case "IN":
      graphic = <>{stripeY(0, 13.34, "#ff9933")}{stripeY(13.34, 13.33, "#ffffff")}{stripeY(26.67, 13.33, "#138808")}{centeredCircle("#22408c", 4)}</>;
      break;
    case "BD":
      graphic = <><rect width="60" height="40" fill="#006a4e" />{centeredCircle("#f42a41", 8, 27, 20)}</>;
      break;
    case "BY":
      graphic = (
        <>
          <rect width="60" height="28" fill="#c8313e" />
          <rect y="28" width="60" height="12" fill="#4aa657" />
          <rect width="10" height="40" fill="#ffffff" />
          <path d="M2 5h4v4H2ZM4 9h4v4H4ZM2 13h4v4H2ZM4 17h4v4H4ZM2 21h4v4H2ZM4 25h4v4H4ZM2 29h4v4H2Z" fill="#c8313e" />
        </>
      );
      break;
    case "BG":
      graphic = <>{stripeY(0, 13.34, "#ffffff")}{stripeY(13.34, 13.33, "#00966e")}{stripeY(26.67, 13.33, "#d62612")}</>;
      break;
    case "CA":
      graphic = <>{stripeX(0, 15, "#d52b1e")}{stripeX(15, 30, "#ffffff")}{stripeX(45, 15, "#d52b1e")}{fivePointStar(30, 20, 5.2, "#d52b1e")}</>;
      break;
    case "CZ":
      graphic = <>{stripeY(0, 20, "#ffffff")}{stripeY(20, 20, "#d7141a")}<path d="M0 0 24 20 0 40Z" fill="#11457e" /></>;
      break;
    case "DK":
      graphic = <>{nordicCross("#c60c30", "#ffffff")}</>;
      break;
    case "EE":
      graphic = <>{stripeY(0, 13.34, "#4891d9")}{stripeY(13.34, 13.33, "#111111")}{stripeY(26.67, 13.33, "#ffffff")}</>;
      break;
    case "FI":
      graphic = <>{nordicCross("#ffffff", "#003580")}</>;
      break;
    case "TH":
      graphic = <>{stripeY(0, 6, "#b5002d")}{stripeY(6, 4, "#ffffff")}{stripeY(10, 20, "#2d2a8a")}{stripeY(30, 4, "#ffffff")}{stripeY(34, 6, "#b5002d")}</>;
      break;
    case "VN":
      graphic = <><rect width="60" height="40" fill="#da251d" />{fivePointStar(30, 20, 8, "#ffde00")}</>;
      break;
    case "GB":
      graphic = <><rect width="60" height="40" fill="#012169" /><path d="M0 0 60 40M60 0 0 40" stroke="#ffffff" strokeWidth="8" /><path d="M0 0 60 40M60 0 0 40" stroke="#c8102e" strokeWidth="4" /><path d="M30 0v40M0 20h60" stroke="#ffffff" strokeWidth="12" /><path d="M30 0v40M0 20h60" stroke="#c8102e" strokeWidth="7" /></>;
      break;
    case "GR":
      graphic = <><rect width="60" height="40" fill="#0d5eaf" />{Array.from({ length: 4 }, (_, index) => <rect key={index} x="0" y={4 + index * 10} width="60" height="4" fill="#ffffff" />)}<rect x="0" y="0" width="26" height="22" fill="#0d5eaf" /><rect x="10" y="0" width="6" height="22" fill="#ffffff" /><rect x="0" y="8" width="26" height="6" fill="#ffffff" /></>;
      break;
    case "HR":
      graphic = <>{stripeY(0, 13.34, "#ff0000")}{stripeY(13.34, 13.33, "#ffffff")}{stripeY(26.67, 13.33, "#171796")}</>;
      break;
    case "HU":
      graphic = <>{stripeY(0, 13.34, "#ce2939")}{stripeY(13.34, 13.33, "#ffffff")}{stripeY(26.67, 13.33, "#477050")}</>;
      break;
    case "IE":
      graphic = <>{stripeX(0, 20, "#169b62")}{stripeX(20, 20, "#ffffff")}{stripeX(40, 20, "#ff883e")}</>;
      break;
    case "IS":
      graphic = <>{nordicCross("#02529c", "#ffffff", "#dc1e35")}</>;
      break;
    case "MY":
      graphic = (
        <>
          {Array.from({ length: 7 }, (_, index) => (
            <g key={`my-stripe-${index}`}>{stripeY(index * 6, 3, "#d42f3c")}</g>
          ))}
          <rect x="0" y="0" width="28" height="22" fill="#012a87" />
          {crescent(12, 11, 6, 2.5, "#f8d24a", "#012a87")}
          {fivePointStar(20, 11, 4, "#f8d24a")}
        </>
      );
      break;
    case "ID":
      graphic = <>{stripeY(0, 20, "#ce1126")}{stripeY(20, 20, "#ffffff")}</>;
      break;
    case "KH":
      graphic = <>{stripeY(0, 9, "#032ea1")}{stripeY(9, 22, "#e00025")}{stripeY(31, 9, "#032ea1")}<rect x="22" y="14" width="16" height="10" fill="#ffffff" rx="1" /><rect x="25" y="11" width="10" height="3" fill="#ffffff" rx="1" /></>;
      break;
    case "CN":
      graphic = <><rect width="60" height="40" fill="#de2910" />{starsLine()}</>;
      break;
    case "GE":
      graphic = (
        <>
          <rect width="60" height="40" fill="#ffffff" />
          <rect x="24" y="0" width="12" height="40" fill="#e41e20" />
          <rect x="0" y="14" width="60" height="12" fill="#e41e20" />
          {[
            [11, 8],
            [41, 8],
            [11, 24],
            [41, 24]
          ].map(([x, y]) => (
            <g key={`${x}-${y}`}>
              <rect x={x + 4} y={y} width="4" height="12" fill="#e41e20" />
              <rect x={x} y={y + 4} width="12" height="4" fill="#e41e20" />
            </g>
          ))}
        </>
      );
      break;
    case "KZ":
      graphic = <><rect width="60" height="40" fill="#00afca" />{centeredCircle("#f6d660", 6)}{Array.from({ length: 8 }, (_, index) => <rect key={index} x={30 + Math.cos((index * Math.PI) / 4) * 7 - 0.8} y={20 + Math.sin((index * Math.PI) / 4) * 7 - 2} width="1.6" height="4" fill="#f6d660" transform={`rotate(${index * 45} ${30 + Math.cos((index * Math.PI) / 4) * 7} ${20 + Math.sin((index * Math.PI) / 4) * 7})`} />)}</>;
      break;
    case "LK":
      graphic = (
        <>
          <rect width="60" height="40" fill="#f7b718" />
          <rect x="3" y="3" width="10" height="34" fill="#0b8a42" />
          <rect x="13" y="3" width="10" height="34" fill="#f28c28" />
          <rect x="25" y="3" width="32" height="34" fill="#8d153a" />
          <path d="M39 12c3.5 0 6 2.6 6 6.2S42.5 29 39 29c-2.8 0-4.7-1.6-6-3.6l3-2.2c.7 1.2 1.7 2 3 2 1.8 0 3-1.5 3-3.9s-1.2-3.9-3-3.9c-1.3 0-2.3.8-3 2l-3-2.2C34.3 13.6 36.2 12 39 12Z" fill="#f7b718" />
          <rect x="43" y="15" width="7" height="2" fill="#f7b718" rx="1" />
        </>
      );
      break;
    case "LA":
      graphic = <>{stripeY(0, 10, "#ce1126")}{stripeY(10, 20, "#002868")}{stripeY(30, 10, "#ce1126")}{centeredCircle("#ffffff", 7)}</>;
      break;
    case "LT":
      graphic = <>{stripeY(0, 13.34, "#fdb913")}{stripeY(13.34, 13.33, "#006a44")}{stripeY(26.67, 13.33, "#c1272d")}</>;
      break;
    case "LV":
      graphic = <>{stripeY(0, 15, "#9e3039")}{stripeY(15, 10, "#ffffff")}{stripeY(25, 15, "#9e3039")}</>;
      break;
    case "MM":
      graphic = <>{stripeY(0, 13.34, "#fecb00")}{stripeY(13.34, 13.33, "#34b233")}{stripeY(26.67, 13.33, "#ea2839")}{fivePointStar(30, 20, 8, "#ffffff")}</>;
      break;
    case "MK":
      graphic = (
        <>
          <rect width="60" height="40" fill="#d20000" />
          <circle cx="30" cy="20" r="6" fill="#ffe600" />
          {Array.from({ length: 8 }, (_, index) => {
            const angle = (index * Math.PI) / 4;
            const x = 30 + Math.cos(angle) * 26;
            const y = 20 + Math.sin(angle) * 18;
            return <line key={index} x1="30" y1="20" x2={x} y2={y} stroke="#ffe600" strokeWidth="4" />;
          })}
        </>
      );
      break;
    case "MN":
      graphic = (
        <>
          <rect width="20" height="40" fill="#c4272f" />
          <rect x="20" width="20" height="40" fill="#015197" />
          <rect x="40" width="20" height="40" fill="#c4272f" />
          <circle cx="10" cy="8" r="3.2" fill="#f6d04d" />
          <rect x="8.6" y="12.5" width="2.8" height="12" fill="#f6d04d" rx="1.2" />
          <rect x="6.5" y="17" width="7" height="2.4" fill="#f6d04d" rx="1.2" />
          <rect x="7.4" y="27" width="5.2" height="7" fill="none" stroke="#f6d04d" strokeWidth="1.8" />
        </>
      );
      break;
    case "MT":
      graphic = <>{stripeX(0, 30, "#ffffff")}{stripeX(30, 30, "#cf142b")}<rect x="5" y="5" width="8" height="8" fill="#c7c7c7" rx="1.5" /></>;
      break;
    case "TW":
      graphic = <><rect width="60" height="40" fill="#fe0000" />{taiwanSun()}</>;
      break;
    case "NO":
      graphic = <>{nordicCross("#ba0c2f", "#ffffff", "#00205b")}</>;
      break;
    case "NZ":
      graphic = (
        <>
          <rect width="60" height="40" fill="#012169" />
          {unionJackCanton()}
          {[
            [40, 10, 3.1],
            [49, 16, 2.6],
            [43, 25, 2.8],
            [51, 30, 2.4]
          ].map(([cx, cy, outer], index) => (
            <g key={index}>
              {fivePointStar(cx, cy, outer + 0.8, "#ffffff")}
              {fivePointStar(cx, cy, outer, "#cc142b")}
            </g>
          ))}
        </>
      );
      break;
    case "NP":
      graphic = <><rect width="60" height="40" fill="#ffffff" /><path d="M14 4v32l20-10-12-8 12-6Z" fill="#dc143c" stroke="#003893" strokeWidth="2" /><circle cx="20" cy="15" r="2.2" fill="#ffffff" /><circle cx="22" cy="27" r="2.7" fill="#ffffff" /></>;
      break;
    case "PH":
      graphic = <>{stripeY(0, 20, "#0038a8")}{stripeY(20, 20, "#ce1126")}<path d="M0 0 22 20 0 40Z" fill="#ffffff" />{centeredCircle("#fcd116", 3.2, 8, 20)}</>;
      break;
    case "PT":
      graphic = <>{stripeX(0, 24, "#046a38")}{stripeX(24, 36, "#da291c")}{centeredCircle("#ffcd00", 4.2, 24, 20)}</>;
      break;
    case "HK":
      graphic = <><rect width="60" height="40" fill="#de2910" />{hongKongFlower()}</>;
      break;
    case "JP":
      graphic = <><rect width="60" height="40" fill="#ffffff" />{centeredCircle("#bc002d", 10)}</>;
      break;
    case "KR":
      graphic = <><rect width="60" height="40" fill="#ffffff" />{southKoreaMark()}</>;
      break;
    case "RS":
      graphic = <>{stripeY(0, 13.34, "#c6363c")}{stripeY(13.34, 13.33, "#0c4076")}{stripeY(26.67, 13.33, "#ffffff")}</>;
      break;
    case "SE":
      graphic = <>{nordicCross("#006aa7", "#fecc00")}</>;
      break;
    case "SI":
      graphic = <>{stripeY(0, 13.34, "#ffffff")}{stripeY(13.34, 13.33, "#0056a3")}{stripeY(26.67, 13.33, "#d50000")}</>;
      break;
    case "SO":
      graphic = <><rect width="60" height="40" fill="#418fde" />{fivePointStar(30, 20, 8, "#ffffff")}</>;
      break;
    case "SK":
      graphic = <>{stripeY(0, 13.34, "#ffffff")}{stripeY(13.34, 13.33, "#0b4ea2")}{stripeY(26.67, 13.33, "#ee1c25")}</>;
      break;
    case "UZ":
      graphic = (
        <>
          <rect width="60" height="12" fill="#1eb5e8" />
          <rect y="12" width="60" height="2" fill="#ce1126" />
          <rect y="14" width="60" height="12" fill="#ffffff" />
          <rect y="26" width="60" height="2" fill="#ce1126" />
          <rect y="28" width="60" height="12" fill="#1fa15a" />
          {crescent(12, 6, 4.6, 1.8, "#ffffff", "#1eb5e8")}
          {Array.from({ length: 3 }, (_, row) =>
            Array.from({ length: row === 0 ? 3 : 4 }, (_, column) => (
              <circle
                key={`${row}-${column}`}
                cx={22 + column * 5}
                cy={4 + row * 4}
                r="1"
                fill="#ffffff"
              />
            ))
          )}
        </>
      );
      break;
    default:
      graphic = <><rect width="60" height="40" fill="#163247" />{centeredCircle("#55d6ff", 10)}<path d="M30 8v24M18 20h24" stroke="#f4f7fb" strokeWidth="2.2" strokeLinecap="round" opacity="0.85" /></>;
      break;
  }

  return (
    <svg
      className="visitor-language-flag"
      viewBox="0 0 60 40"
      role="img"
      aria-label={region ? `Flag ${region}` : "Flag"}
    >
      <rect width="60" height="40" rx="6" fill="#ffffff" />
      <defs>
        <clipPath id={clipId}>
          <rect width="60" height="40" rx="6" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>{graphic}</g>
      <rect width="60" height="40" rx="6" fill="none" stroke="rgba(255,255,255,0.18)" />
    </svg>
  );
}
