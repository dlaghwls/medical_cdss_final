// /src/components/Common/NotificationBadge.js 

import React from 'react';

/**
 * 재사용 가능한 알림 배지 컴포넌트
 * @param {object} props - count: 표시할 숫자
 */
const NotificationBadge = ({ count }) => {
  // 숫자가 0이면 아무것도 표시하지 않음
  if (!count || count === 0) return null;

  const badgeStyle = {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    background: 'red',
    color: 'white',
    borderRadius: '50%',
    padding: '2px 6px',
    fontSize: '10px',
    fontWeight: 'bold',
    minWidth: '18px',
    height: '18px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    border: '2px solid white'
  };

  return (
    <span style={badgeStyle}>
      {count > 9 ? '9+' : count}
    </span>
  );
};

export default NotificationBadge;