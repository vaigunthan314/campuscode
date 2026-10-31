"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampusMark = CampusMark;
exports.Logo = Logo;
/**
 * The original CampusCode identity: three skewed bars (black / purple / lime)
 * beside the CAMPUSCODE wordmark and HACKATHON ARENA descriptor.
 * Recovered from the live site's own markup and CSS — not redrawn.
 */
function CampusMark(_a) {
    var _b = _a.className, className = _b === void 0 ? "" : _b;
    return (<span className={"landing-logo-mark ".concat(className).trim()} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>);
}
function Logo(_a) {
    var _b = _a.className, className = _b === void 0 ? "" : _b, onClick = _a.onClick, href = _a.href;
    var content = (<>
      <CampusMark />
      <span className="landing-logo-type">
        <strong>CAMPUSCODE</strong>
        <small>HACKATHON ARENA</small>
      </span>
    </>);
    if (href) {
        return (<a className={"landing-logo ".concat(className).trim()} href={href} onClick={onClick} aria-label="CampusCode home">
        {content}
      </a>);
    }
    return (<button type="button" className={"landing-logo ".concat(className).trim()} onClick={onClick} aria-label="CampusCode home">
      {content}
    </button>);
}
