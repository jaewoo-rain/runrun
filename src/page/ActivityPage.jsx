import BottomBar from "../components/BottomBar.jsx";

const ProfileSection = () => {
    const profileContainerStyle = {
        width: 328,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: 14,
        margin: '40px auto',
    };

    const profileImageStyle = {
        width: 80,
        height: 80,
        borderRadius: '50%',
    };

    const profileNameStyle = {
        alignSelf: 'stretch',
        textAlign: 'center',
        color: '#1E1E22',
        fontSize: 24,
        fontFamily: 'Pretendard',
        fontWeight: '700',
        wordWrap: 'break-word',
    };

    return (
        <div style={profileContainerStyle}>
            <img style={profileImageStyle} src="https://placehold.co/80x80" alt="profile picture" />
            <div style={profileNameStyle}>귤밭에서 달리는 러너</div>
        </div>
    );
}

const UserStatsSection = () => {
    const statsContainerStyle = {
        width: 328,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '20px 0',
        borderTop: '1px solid #eee',
        borderBottom: '1px solid #eee',
        margin: '20px auto',
    };

    const statItemStyle = {
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    };

    const statValueStyle = {
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#1E1E22',
    };

    const statLabelStyle = {
        fontSize: '14px',
        color: '#888',
        marginTop: '4px',
    };

    const iconStyle = {
        width: 24,
        height: 24,
        marginBottom: '8px',
    };

    return (
        <div style={statsContainerStyle}>
            <div style={statItemStyle}>
                <img src="/public/km.png" alt="총 거리 아이콘" style={iconStyle} />
                <div style={statValueStyle}>123.4 km</div>
                <div style={statLabelStyle}>총 거리</div>
            </div>
            <div style={statItemStyle}>
                <img src="/public/timer.png" alt="총 시간 아이콘" style={iconStyle} />
                <div style={statValueStyle}>5h 30m</div>
                <div style={statLabelStyle}>총 시간</div>
            </div>
            <div style={statItemStyle}>
                <img src="/public/kcal.png" alt="칼로리 아이콘" style={iconStyle} />
                <div style={statValueStyle}>150 kcal</div>
                <div style={statLabelStyle}>칼로리</div>
            </div>
        </div>
    );
}

const RunningLogSection = () => {
    // Styles adapted from Figma
    const sectionContainerStyle = {
        width: 328,
        margin: '40px auto',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        gap: 20,
        display: 'flex',
    };
    const headerStyle = {
        alignSelf: 'stretch',
        justifyContent: 'space-between',
        alignItems: 'center',
        display: 'flex',
    };
    const titleStyle = {
        color: '#1E1E22',
        fontSize: 18,
        fontFamily: 'Pretendard',
        fontWeight: '600',
    };
    const viewAllStyle = {
        color: '#626264',
        fontSize: 12,
        fontFamily: 'Pretendard',
        fontWeight: '500',
        cursor: 'pointer',
    };
    const cardStyle = {
        alignSelf: 'stretch',
        background: '#FCFCFC',
        borderRadius: 8,
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        display: 'flex',
        overflow: 'hidden',
        border: '1px solid #F0F0F2',
    };
    const cardTopSectionStyle = {
        alignSelf: 'stretch',
        padding: '16px',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: 20,
        display: 'flex',
    };
    const courseInfoStyle = {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: 8,
        display: 'flex',
    };
    const courseNameStyle = {
        alignSelf: 'stretch',
        color: 'black',
        fontSize: 15,
        fontFamily: 'Pretendard',
        fontWeight: '700',
    };
    const courseDateStyle = {
        alignSelf: 'stretch',
        color: '#C4C4C6',
        fontSize: 12,
        fontFamily: 'Pretendard',
        fontWeight: '500',
    };
    const statsSectionStyle = {
        alignSelf: 'stretch',
        padding: '0 16px 16px 16px',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: 20,
        display: 'flex',
    };
    const statsContainerStyle = {
        flex: '1 1 0',
        justifyContent: 'space-between',
        alignItems: 'center',
        display: 'flex',
    };
    const statItemStyle = {
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        gap: 2,
        display: 'inline-flex',
    };
    const statValueStyle = {
        color: '#1E1E22',
        fontSize: 15,
        fontFamily: 'Pretendard',
        fontWeight: '700',
    };
    const statLabelStyle = {
        color: '#C4C4C6',
        fontSize: 11,
        fontFamily: 'Pretendard',
        fontWeight: '400',
    };
    const imageStyle = {
        alignSelf: 'stretch',
        height: 200,
        objectFit: 'cover',
        borderTop: '1px #F0F0F2 solid',
    };

    return (
        <div style={sectionContainerStyle}>
            <div style={headerStyle}>
                <div style={titleStyle}>달린 기록</div>
                <div style={viewAllStyle}>전체보기</div>
            </div>
            <div style={cardStyle}>
                <div style={cardTopSectionStyle}>
                    <div style={courseInfoStyle}>
                        <div style={courseNameStyle}>제주 아름다운 해안 코스</div>
                        <div style={courseDateStyle}>오늘 - 오전 7 : 40</div>
                    </div>
                </div>
                <div style={statsSectionStyle}>
                    <div style={statsContainerStyle}>
                        <div style={statItemStyle}>
                            <div style={statValueStyle}>3.57</div>
                            <div style={statLabelStyle}>킬로미터</div>
                        </div>
                        <div style={statItemStyle}>
                            <div style={statValueStyle}>9’01’’</div>
                            <div style={statLabelStyle}>페이스</div>
                        </div>
                        <div style={statItemStyle}>
                            <div style={statValueStyle}>31:16</div>
                            <div style={statLabelStyle}>시간</div>
                        </div>
                        <div style={statItemStyle}>
                            <div style={statValueStyle}>168</div>
                            <div style={statLabelStyle}>칼로리</div>
                        </div>
                    </div>
                </div>
                <img style={imageStyle} src="https://placehold.co/328x200" alt="running course map" />
            </div>
        </div>
    );
};

const PersonalRecordsSection = () => {
    // Dummy data for personal records
    const personalRecords = [
        {
            id: 1,
            date: '2025년 10월 17일',
            title: '최장 거리 러닝',
            distance: '10.06킬로미터',
            icon: '/public/data/image 36.png' // Corrected path for web access
        },
        {
            id: 2,
            date: '2025년 7월 17일',
            title: '1K 달성',
            distance: '1.04킬로미터',
            icon: '/public/data/image 36.png'
        },
        {
            id: 3,
            date: '2025년 5월 20일',
            title: '5K 최고 기록',
            distance: '5.00킬로미터',
            icon: '/public/data/image 36.png'
        },
        {
            id: 4,
            date: '2025년 3월 10일',
            title: '10K 최고 기록',
            distance: '10.00킬로미터',
            icon: '/public/data/image 36.png'
        },
    ];

    // Styles adapted from Figma
    const sectionContainerStyle = {
        alignSelf: 'stretch',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        gap: 20,
        display: 'flex',
        margin: '40px auto',
        width: 328,
    };
    const titleStyle = {
        color: '#1E1E22',
        fontSize: 18,
        fontFamily: 'Pretendard',
        fontWeight: '600',
        wordWrap: 'break-word',
    };
    const scrollableContainerStyle = {
        alignSelf: 'stretch',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: 18,
        display: 'flex',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        paddingBottom: '10px',
        scrollSnapType: 'x mandatory',
        scrollBehavior: 'smooth',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
    };
    const recordItemStyle = {
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: 8,
        display: 'inline-flex',
        flexShrink: 0,
        width: 130,
        scrollSnapAlign: 'center',
    };
    const imageStyle = {
        width: 50,
        height: 62,
        objectFit: 'contain',
    };
    const infoContainerStyle = {
        alignSelf: 'stretch',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: 10,
        display: 'flex',
    };
    const dateStyle = {
        justifyContent: 'center',
        display: 'flex',
        flexDirection: 'column',
        color: '#C4C4C6',
        fontSize: 12,
        fontFamily: 'Pretendard',
        fontWeight: '500',
        wordWrap: 'break-word',
    };
    const titleDistanceContainerStyle = {
        width: 130,
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: 6,
        display: 'flex',
    };
    const recordTitleStyle = {
        alignSelf: 'stretch',
        textAlign: 'center',
        justifyContent: 'center',
        display: 'flex',
        flexDirection: 'column',
        color: 'black',
        fontSize: 15,
        fontFamily: 'Pretendard',
        fontWeight: '700',
        wordWrap: 'break-word',
    };
    const recordDistanceStyle = {
        justifyContent: 'center',
        display: 'flex',
        flexDirection: 'column',
        color: '#C4C4C6',
        fontSize: 12,
        fontFamily: 'Pretendard',
        fontWeight: '500',
        wordWrap: 'break-word',
    };

    return (
        <div style={sectionContainerStyle}>
            <div style={titleStyle}>개인기록</div>
            <div style={scrollableContainerStyle}>
                {personalRecords.map(record => (
                    <div key={record.id} style={recordItemStyle}>
                        <img style={imageStyle} src={record.icon} alt={record.title} />
                        <div style={infoContainerStyle}>
                            <div style={dateStyle}>{record.date}</div>
                            <div style={titleDistanceContainerStyle}>
                                <div style={recordTitleStyle}>{record.title}</div>
                                <div style={recordDistanceStyle}>{record.distance}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}


const ActivityPage = () => {
    return (
        <div style={{
            width: 328,
            margin: '0 auto',
            backgroundColor: 'white',
            minHeight: '100vh',
            boxShadow: '0 0 10px rgba(0,0,0,0.1)',
            overflowY: 'auto',
        }}>
            {/* 1. 프로필 */}
            <ProfileSection />

            {/* 2. 사용자 스탯 */}
            <UserStatsSection />

            {/* 3. 달린기록 */}
            <RunningLogSection />

            {/* 4. 개인기록 */}
            <PersonalRecordsSection />

            <BottomBar />
        </div>
    )
}

export default ActivityPage;