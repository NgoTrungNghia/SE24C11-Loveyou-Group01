import React from 'react';

/**
 * Helper to check if a user object meets the criteria for blue tick verification:
 * Both email AND citizen verification (CCCD) must be verified!
 */
export const isFullyVerified = (u) => {
  if (!u) return false;
  const emailOk = Boolean(u.isEmailVerified);
  const citizenOk = Boolean(u.isCitizenVerified || u.citizenVerificationStatus === 'APPROVED');
  return emailOk && citizenOk;
};

/**
 * VerifiedBadge Component - Official blue tick badge (Facebook / TikTok / Twitter style)
 * Displayed next to user names ONLY for fully verified accounts (Both Email and CCCD).
 */
export default function VerifiedBadge({ size = 18, style = {}, tooltip = 'Tài khoản đã xác thực đầy đủ Email và Căn cước công dân' }) {
  return (
    <span
      title={tooltip}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        verticalAlign: 'middle',
        flexShrink: 0,
        marginLeft: '4px',
        cursor: 'help',
        ...style,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 1px 3px rgba(24, 119, 242, 0.5))' }}
      >
        {/* Scalloped badge background */}
        <path
          d="M10.29 2.308a2.23 2.23 0 0 1 3.42 0l.662.762a2.23 2.23 0 0 0 1.942.748l1.002-.12a2.23 2.23 0 0 1 2.418 2.418l-.12 1.002a2.23 2.23 0 0 0 .748 1.942l.762.662a2.23 2.23 0 0 1 0 3.42l-.762.662a2.23 2.23 0 0 0-.748 1.942l.12 1.002a2.23 2.23 0 0 1-2.418 2.418l-1.002-.12a2.23 2.23 0 0 0-1.942.748l-.662.762a2.23 2.23 0 0 1-3.42 0l-.662-.762a2.23 2.23 0 0 0-1.942-.748l-1.002.12a2.23 2.23 0 0 1-2.418-2.418l.12-1.002a2.23 2.23 0 0 0-.748-1.942l-.762-.662a2.23 2.23 0 0 1 0-3.42l.762-.662a2.23 2.23 0 0 0 .748-1.942l-.12-1.002a2.23 2.23 0 0 1 2.418-2.418l1.002.12a2.23 2.23 0 0 0 1.942-.748l.662-.762z"
          fill="#1877F2"
        />
        {/* White checkmark */}
        <path
          d="M9.00003 12.2L10.8 14L15.2 9.60001"
          stroke="#FFFFFF"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
