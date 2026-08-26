-- site_sections 초기 시드 데이터 적재
INSERT OR REPLACE INTO site_sections (sectionId, page, title, subtitle, description, imageUrl, buttonText, buttonLink, extraData) VALUES 
('home_manifesto', 'home', 'THE IRON ROOTS, THE FUTURE LEGENDS', NULL, '정통 위에서 피어나는 <span class="text-accent font-black italic">가장 젊고 뜨거운 에너지</span>.<br class="hidden md:inline" />YBBF는 IFBB의 엄격한 규정 아래 가장 공정하고 압도적인 무대를 설계하며,<br class="hidden md:inline" />동시에 스스로 한계를 깨부수는 <span class="text-[#ffffff] font-black italic">유소년(Youth)의 폭발적인 미래</span>에 주목합니다.', NULL, NULL, NULL, '{"signaturePath": "M30 100 C 60 70, 90 120, 120 80 C 150 40, 180 130, 210 90 C 240 50, 270 140, 300 70 C 330 20, 360 110, 380 60"}'),

('home_legend_highlight', 'home', 'LEGENDS', 'HIGHLIGHT', '대회 결과, 가장 치열했던 순간들, 그리고 무대 위의 모든 커리어 통계.', 'https://picsum.photos/800/1000?random=31', '레전드 보기 →', '/legends', NULL),

('home_youth_preview', 'home', 'YBBF', 'YOUTH', '미래의 레전드를 위한 공식 유스 시스템. 용인시와 경기도를 대표할 다음 세대의 챔피언.', 'https://picsum.photos/800/1000?random=32', 'YBBF 유스 알아보기 →', '/youth', '{"badge": "NEXT GENERATION"}'),

('home_store', 'home', '오직', '최고만을 위한 기어', 'YBBF 공식 굿즈, 트레이닝 기어, 파트너 로고웨어. 무대의 영광을 일상으로 가져오세요.', NULL, '스토어 둘러보기', '/store', '{"badge": "YBBF 스토어", "images": ["https://picsum.photos/400/500?random=51", "https://picsum.photos/400/600?random=52", "https://picsum.photos/400/600?random=53", "https://picsum.photos/400/400?random=54"]}'),

('home_media_intro', 'home', 'MEDIA', NULL, '용인시 보디빌딩협회의 공식 미디어 센터입니다. 대회 하이라이트, 인터뷰, 훈련 영상 등을 가장 먼저 만나보세요.', NULL, '미디어 센터 가기 →', '/media', NULL),

('about_hero', 'about', 'THE IRON ROOTS', 'FUTURE LEGENDS', '정통 위에서 피어나는 가장 젊고 뜨거운 에너지', 'https://picsum.photos/1920/1080?random=about_hero', NULL, NULL, '{"badge": "FOUNDATION & LEGACY"}'),

('about_manifesto', 'about', 'THE LEGITIMATE LINEAGE OF', 'BODYBUILDING', '용인특례시보디빌딩협회(YBBF)는 대한체육회 산하 용인시체육회, 그리고 대한보디빌딩협회와 경기도보디빌딩협회 공식 라인을 잇는 정통성 있는 거점입니다.', NULL, NULL, NULL, '{"badge": "OUR IDENTITY", "summary": "용인특례시보디빌딩협회는 흔들리지 않는 규정과 공정함이라는 단단한 쇠사슬(Iron) 위에 서 있습니다.", "description2": "우리는 세계 보디빌딩의 절대적 기준인 IFBB(국제보디빌딩연맹)의 엄격한 룰을 완벽히 준수하며, 편파와 왜곡이 없는 가장 공정하고 압도적인 무대를 만듭니다.", "quote": "가장 엄격한 룰 위에서 가장 자유롭고 폭발적인 무대가 피어납니다."}'),

('about_youth', 'about', 'WE DO NOT LOOK BACK.', 'WE BUILD THE YOUTH', '우리의 시선은 과거의 영광이나 현재의 왕좌에만 머물지 않습니다. YBBF가 가장 가슴 뜨겁게 주목하는 곳은 바로 유소년(Youth)입니다. 올바른 웨이트 트레이닝과 신체 조화의 가치는 성인만의 전유물이 아닙니다. 청소년기부터 다져진 체력과 단단한 멘탈은 평생의 삶을 지탱하는 가장 강력한 자산이 되기 때문입니다.', 'https://picsum.photos/1000/800?random=about_youth', NULL, NULL, '{"badge": "THE FUTURE DIRECTION", "watermark": "YOUTH"}'),

('about_cta', 'about', 'THE PARADIGM', 'HAS SHIFTED.', '대한민국 보디빌딩의 새로운 패러다임, 용인특례시보디빌딩협회가 앞장서서 증명합니다.', NULL, NULL, NULL, NULL),

('legends_hero', 'legends', 'LEGENDS', NULL, '수십 년간 이어진 무대 위 땀과 영광의 기록. 용인시를 대표하는 역대 챔피언들의 명예의 전당.', 'https://picsum.photos/1920/1080?random=99', NULL, NULL, '{"badge": "SINCE 1990", "totalChampions": 47, "totalClasses": 12, "yearsLegacy": 35}'),

('media_hero', 'media', 'MEDIA', NULL, '대회의 모든 순간, 땀방울, 그리고 챔피언들의 스토리를 기록합니다.', NULL, NULL, NULL, '{"badge": "YBBF Official Hub"}'),

('youth_hero', 'youth', 'YBBF', 'YOUTH', 'NEXT GENERATION OF CHAMPIONS', 'https://picsum.photos/1920/1080?random=y_hero', NULL, NULL, '{"badge": "Official Development System"}'),

('youth_system', 'youth', 'Our System', NULL, '학교에는 보디빌딩 교과목이 없습니다. 본인이 땀 흘리는 체육관이 클럽이 되고, 그 클럽이 용인시 소속이 되며, 곧 경기도를 대표하는 선수가 되는 공식 육성 시스템입니다.', NULL, NULL, NULL, '[{"step": "01", "badge": "Step One", "title": "CLUB", "subtitle": "나의 훈련 기지", "desc": "지역 내 검증된 트레이닝 센터에서 전문적인 지도를 받으며 기본기를 단단하게 다집니다."}, {"step": "02", "badge": "The Core", "title": "YBBF", "subtitle": "나의 소속 협회", "desc": "용인시 보디빌딩협회의 공식 유스 선수로 등록되어 체계적인 관리와 공식 무대 출전 기회를 얻습니다."}, {"step": "03", "badge": "Final Goal", "title": "GYEONGGI", "subtitle": "내가 대표하는 지역", "desc": "용인시를 넘어 경기도 대표로 성장하여 더 큰 무대, 전국 단위의 치열한 경쟁에 도전합니다."}]');
