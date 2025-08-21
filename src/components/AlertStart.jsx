import React from 'react';

const AlertStart = ({ onClose, onStart }) => {
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
            <div style={{ width: 288, height: 168, position: 'relative', overflow: 'hidden' }}>
                <div
                    style={{
                        width: 288,
                        height: 168,
                        left: 0,
                        top: 0,
                        position: 'absolute',
                        background: 'white',
                        borderRadius: 13,
                    }}
                />
                <div style={{ left: 64, top: 37, position: 'absolute', textAlign: 'center' }}>
            <span
                style={{
                    color: 'black',
                    fontSize: 22,
                    fontFamily: 'Pretendard',
                    fontWeight: 600,
                    wordWrap: 'break-word',
                }}
            >
              달리기를<br />
            </span>
                    <span
                        style={{
                            color: 'var(--main, #FF8C42)',
                            fontSize: 22,
                            fontFamily: 'Pretendard',
                            fontWeight: 600,
                            wordWrap: 'break-word',
                        }}
                    >
              시작
            </span>
                    <span
                        style={{
                            color: 'black',
                            fontSize: 22,
                            fontFamily: 'Pretendard',
                            fontWeight: 600,
                            wordWrap: 'break-word',
                        }}
                    >
              하시겠습니까?
            </span>
                </div>

                <div
                    style={{
                        width: 288,
                        height: 42.58,
                        left: 0,
                        top: 125.42,
                        position: 'absolute',
                        overflow: 'hidden',
                    }}
                >
                    {/* 취소 버튼 */}
                    <div
                        role="button"
                        tabIndex={0}
                        onClick={onClose}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClose?.()}
                        style={{
                            width: 82.29,
                            left: 174.61,
                            top: 11,
                            position: 'absolute',
                            textAlign: 'center',
                            color: 'var(--main, #FF8C42)',
                            fontSize: 15,
                            fontFamily: 'Pretendard',
                            fontWeight: 700,
                            wordWrap: 'break-word',
                            cursor: 'pointer',
                            userSelect: 'none',
                        }}
                    >
                        취소
                    </div>

                    {/* 시작 버튼 */}
                    <div
                        onClick={onStart}
                        role="button"
                        tabIndex={0}
                        style={{
                            width: 82.29,
                            left: 30.1,
                            top: 11,
                            position: 'absolute',
                            textAlign: 'center',
                            color: 'black',
                            fontSize: 15,
                            fontFamily: 'Pretendard',
                            fontWeight: 700,
                            wordWrap: 'break-word',
                            cursor: 'pointer',
                            userSelect: 'none',
                        }}
                    >
                        시작
                    </div>

                    <div
                        style={{ width: 288, height: 0.77, left: 0, top: 0, position: 'absolute', background: '#F0F0F2' }}
                    />
                    <div
                        style={{ width: 1, height: 41.81, left: 143, top: 0.77, position: 'absolute', background: '#F0F0F2' }}
                    />
                </div>
            </div>
        </div>
    )
};

export default AlertStart;
