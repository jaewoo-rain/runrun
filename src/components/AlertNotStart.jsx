import React from 'react';

const AlertNotStart = ({ onClose }) => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
        }}>
            <div style={{ width: 288, height: 168, position: 'relative', overflow: 'hidden', background: 'white', borderRadius: 13 }}>
                <div style={{ left: 0, right: 0, top: 37, position: 'absolute', textAlign: 'center' }}>
                    <span style={{ color: 'black', fontSize: 22, fontFamily: 'Pretendard', fontWeight: 600, wordWrap: 'break-word' }}>
                      출발점으로<br/>
                    </span>
                    <span style={{ color: 'var(--main, #FF8C42)', fontSize: 22, fontFamily: 'Pretendard', fontWeight: 600, wordWrap: 'break-word' }}>
                      이동
                    </span>
                    <span style={{ color: 'black', fontSize: 22, fontFamily: 'Pretendard', fontWeight: 600, wordWrap: 'break-word' }}>
                      해주세요.
                    </span>
                </div>
                {/*<div style={{left: 15, top: 94, position: 'absolute', textAlign: 'center', right: 15}}>*/}
                {/*    <span style={{color: '#303038', fontSize: 14, fontFamily: 'Pretendard', fontWeight: '500', lineHeight: 1.5, wordWrap: 'break-word'}}>*/}
                {/*        코스 출발지로 이동 후 다시 코스 선택하기 버튼을 눌러주세요.*/}
                {/*    </span>*/}
                {/*</div>*/}
                <div
                    onClick={onClose}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClose?.()}
                    style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: '43px',
                        borderTop: '1px solid #F0F0F2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        userSelect: 'none',
                    }}
                >
                    <div style={{ color: 'black', fontSize: 15, fontFamily: 'Pretendard', fontWeight: 700 }}>
                        확인
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AlertNotStart;
