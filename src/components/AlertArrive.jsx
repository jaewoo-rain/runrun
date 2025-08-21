import React from 'react';

const AlertArrive = ({ onClose, onTakePhoto, spotName = "함덕해수욕장" }) => {
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
            <div style={{width: 287, height: 217, position: 'relative', overflow: 'hidden'}}>
                <div style={{width: 287, height: 217, left: 0, top: 0, position: 'absolute', background: 'white', borderRadius: 13}} />
                
                <div style={{left: 15, top: 94, position: 'absolute', textAlign: 'center', right: 15}}>
                    <span style={{color: '#303038', fontSize: 14, fontFamily: 'Pretendard', fontWeight: '500', lineHeight: 1.5, wordWrap: 'break-word'}}>
                        러너님, 주변의 아름다운 풍경을 감상하시며<br/>사진을 찍어 추억을 남겨보세요 ! <br/>
                    </span>
                    <span style={{color: 'var(--main, #FF8C42)', fontSize: 14, fontFamily: 'Pretendard', fontWeight: '500', lineHeight: 1.5, wordWrap: 'break-word'}}>
                        사진찍기
                    </span>
                    <span style={{color: '#303038', fontSize: 14, fontFamily: 'Pretendard', fontWeight: '500', lineHeight: 1.5, wordWrap: 'break-word'}}>
                        를 누르면 자동으로 기록이 중지됩니다.
                    </span>
                </div>

                <div style={{left: 34.50, top: 28, position: 'absolute', textAlign: 'center', right: 34.50}}>
                    <span style={{color: '#1E1E23', fontSize: 22, fontFamily: 'Pretendard', fontWeight: '600', wordWrap: 'break-word'}}>
                        제주의 아름다운 뷰 포인트<br/>
                    </span>
                    <span style={{color: 'var(--main, #FF8C42)', fontSize: 22, fontFamily: 'Pretendard', fontWeight: '600', wordWrap: 'break-word'}}>
                        {spotName}
                    </span>
                    <span style={{color: '#1E1E23', fontSize: 22, fontFamily: 'Pretendard', fontWeight: '600', wordWrap: 'break-word'}}>
                         에 도착!
                    </span>
                </div>

                <div style={{width: 287, height: 55, left: 0, top: 162, position: 'absolute', overflow: 'hidden'}}>
                    {/* "계속 달릴래요" button */}
                    <div 
                        onClick={onClose}
                        role="button"
                        tabIndex={0}
                        style={{position: 'absolute', left: 0, top: 0, width: '50%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#303038', fontSize: 15, fontFamily: 'Pretendard', fontWeight: '700', wordWrap: 'break-word'}}>
                        계속 달릴래요
                    </div>
                    
                    {/* "사진찍기" button */}
                    <div 
                        onClick={onTakePhoto}
                        role="button"
                        tabIndex={0}
                        style={{position: 'absolute', right: 0, top: 0, width: '50%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--main, #FF8C42)', fontSize: 15, fontFamily: 'Pretendard', fontWeight: '700', wordWrap: 'break-word'}}>
                        사진찍기
                    </div>

                    <div style={{width: 287, height: 1, left: 0, top: 0, position: 'absolute', background: '#EFEFF0'}} />
                    <div style={{width: 1, height: 54, left: '50%', top: 1, position: 'absolute', transform: 'translateX(-50%)', background: '#EFEFF0'}} />
                </div>
            </div>
        </div>
    );
};

export default AlertArrive;



