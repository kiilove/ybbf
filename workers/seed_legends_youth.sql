-- Legends 시드 데이터
INSERT OR REPLACE INTO legends (id, name, nameEn, nickname, profileImage, class, height, weight, club, bio, quote, mediaIds, sortOrder) VALUES
('kim-minsu', '김민수', 'KIM MINSU', 'THE KOREAN THANOS', '/cutout1.png', '클래식 피지크 +180cm', 188.0, 115.0, '팀 타노스', '한계를 부수고\n[무대] 위에서\n증명하는 자.\n그것이 [챔피언]이다.', 'It doesn''t matter where you start, it''s how you progress from there.', '[]', 0),
('lee-sangho', '이상호', 'LEE SANGHO', NULL, '/cutout2.png', '보디빌딩 -85kg', 175.0, 85.0, '용인 피트니스', '타고난 재능은\n[노력]을 이길 수 없다.\n매 순간이\n[성장]의 연속이다.', 'Focus on the process, not just the result.', '[]', 1),
('park-junho', '박준호', 'PARK JUNHO', 'THE SCULPTOR', 'https://picsum.photos/800/1200?random=7', '스포츠 모델', 182.0, 78.0, '에이펙스 짐', '아름다운 육체는\n[조각]처럼 깎고\n[다듬는] 과정의 결실이다.', 'Dedication and discipline carve the ultimate masterpiece.', '[]', 2);

-- Legend Titles
INSERT OR REPLACE INTO legend_titles (id, legendId, year, competition, result, class) VALUES
(1, 'kim-minsu', 2023, '용인시장배 보디빌딩 대회', '1위 / Overall', '클래식 피지크 +180cm'),
(2, 'kim-minsu', 2022, '미스터 경기', '1위', '클래식 피지크 +180cm'),
(3, 'lee-sangho', 2024, '용인시장배 보디빌딩 대회', '1위', '보디빌딩 -85kg'),
(4, 'lee-sangho', 2021, 'YMCA 전국보디빌딩대회', '2위', '보디빌딩 -85kg'),
(5, 'park-junho', 2025, '용인시장배 보디빌딩 대회', '1위 / Overall', '스포츠 모델 오픈');

-- Legend Gallery
INSERT OR REPLACE INTO legend_gallery (id, legendId, imageUrl) VALUES
(1, 'kim-minsu', 'https://picsum.photos/800/1000?random=1'),
(2, 'kim-minsu', 'https://picsum.photos/1000/800?random=2'),
(3, 'kim-minsu', 'https://picsum.photos/800/800?random=3'),
(4, 'kim-minsu', 'https://picsum.photos/1200/800?random=4'),
(5, 'lee-sangho', 'https://picsum.photos/800/1000?random=5'),
(6, 'lee-sangho', 'https://picsum.photos/1000/800?random=6'),
(7, 'park-junho', 'https://picsum.photos/800/1000?random=8'),
(8, 'park-junho', 'https://picsum.photos/800/800?random=9');

-- Youth Clubs
INSERT OR REPLACE INTO youth_clubs (id, name, location, coach, athleteCount, region) VALUES
('apex', '에이펙스 유스클럽', '용인시 기흥구', '김명훈', 12, '용인시'),
('iron', '아이언 바디 빌더스', '용인시 처인구', '이영호', 8, '용인시'),
('muscle', '머슬 팩토리 주니어', '용인시 수지구', '최지웅', 6, '용인시'),
('titan', '타이탄 웨이트 아카데미', '용인시 기흥구', '박성태', 5, '용인시');

-- Youth Athletes
INSERT OR REPLACE INTO youth_athletes (id, name, grade, school, clubId, class, badge, image, quote, bio) VALUES
('ya-01', '김지우', '고등부', '용인고등학교', 'apex', '피지크', 'YBBF_YOUTH', 'https://picsum.photos/400/500?random=y1', '매일이 성장이다.', '포기하지 않는 마음'),
('ya-02', '박현우', '대학부', '경희대학교', 'apex', '클래식 피지크', 'CLASS_WINNER', 'https://picsum.photos/400/500?random=y2', '무대에서 증명한다.', '묵묵히 나아가는 발걸음'),
('ya-03', '최성진', '고등부', '포곡고등학교', 'iron', '보디빌딩', 'YBBF_YOUTH', 'https://picsum.photos/400/500?random=y3', '노력은 배신하지 않는다.', '진짜 땀의 가치'),
('ya-04', '이민혁', '대학부', '용인대학교', 'iron', '스포츠 모델', 'YBBF_YOUTH', 'https://picsum.photos/400/500?random=y4', '나만의 라인을 조각한다.', '조형미의 정점'),
('ya-05', '정예준', '고등부', '서원고등학교', 'muscle', '피지크', 'ROOKIE_OF_YEAR', 'https://picsum.photos/400/500?random=y5', '지금 흘린 땀방울이 미래의 영광이다.', '루키의 뜨거운 열정');

-- Youth Athlete Achievements
INSERT OR REPLACE INTO youth_athlete_achievements (id, athleteId, achievement) VALUES
(1, 'ya-01', '2025년 용인시장배 고등부 피지크 1위'),
(2, 'ya-02', '2025년 미스터 YMCA 대학부 클래식피지크 1위'),
(3, 'ya-03', '2025년 용인시장배 고등부 보디빌딩 2위'),
(4, 'ya-04', '2025년 경기도민체육대회 학생부 3위'),
(5, 'ya-05', '2025년 용인시장배 고등부 피지크 인기상');
