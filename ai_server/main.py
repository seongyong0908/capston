from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

# # 스프링 부트가 보내줄 데이터 양식 (취향과 후보 장소들)
# class DateRequest(BaseModel):
#     tastes: list
#     places: list

class DateRequest(BaseModel):
    date: str = ""
    startTime: str = ""
    endTime: str = ""
    peopleCount: str = ""
    budget: str = ""
    courseSequence: list = []
    mood: list = []
    extraMessage: str = ""
    places: list

# # 스프링 부트가 이 주소로 데이터를 쏘게 됩니다!
# @app.post("/api/recommend")
# async def get_recommendation(request: DateRequest):
#     print("스프링 부트에서 넘어온 데이터:", request)
    
#     # 지금은 테스트를 위해 완벽하게 짜여진 가짜 코스를 응답해 줍니다.
#     return {
#         "message": "AI 추천이 완료되었습니다!",
#         "course": [
#             {"step": 1, "place_name": "스타벅스 강남점", "reason": "조용한 분위기에서 첫 만남을 가지기 좋습니다."},
#             {"step": 2, "place_name": "강남 불족발", "reason": "매운 음식을 선호하시는 두 분의 취향을 반영했습니다."},
#             {"step": 3, "place_name": "양재천 산책로", "reason": "식사 후 소화시키며 대화하기 좋은 코스입니다."}
#         ]
#     }

CATEGORY_MAP = {
    "cafe": "카페",
    "restaurant": "식당",
    "movie": "실내액티비티",
    "exhibition": "문화예술",
    "shopping": "쇼핑",
    "park": "공원산책",
    "sports": "스포츠레저",
    "culture": "문화예술"
}

MOOD_KEYWORDS = {
    "romantic": ["로맨틱", "분위기", "커플", "감성"],
    "casual": ["편안", "캐주얼", "가볍게"],
    "luxury": ["고급", "럭셔리", "프리미엄"],
    "active": ["활동적", "액티브", "체험"],
    "relaxed": ["여유", "휴식", "힐링"],
    "trendy": ["트렌디", "인스타", "핫플"],
    "classic": ["전통", "클래식", "역사"],
    "modern": ["모던", "세련", "현대적"],
    "cozy": ["아늑", "포근", "따뜻"]
}


def score_place_by_mood(place, moods):
    if not moods:
        return 0
    description = place.get("description", "") or ""
    score = 0
    for mood in moods:
        keywords = MOOD_KEYWORDS.get(mood, [])
        for kw in keywords:
            if kw in description:
                score += 1
    return score


@app.post("/api/recommend")
async def get_recommendation(request: DateRequest):
    print("스프링 부트에서 넘어온 데이터:", request)

    places = request.places
    sequence = request.courseSequence if request.courseSequence else []
    moods = request.mood if request.mood else []

    def build_reason(place, category_id):
        category_label = place.get("category", "이 장소")
        if moods:
            mood_names = ", ".join(moods)
            mood_part = f"{mood_names} 분위기와 어울리는 곳입니다."
        else:
            mood_part = "방문하기 좋은 곳입니다."
        budget_part = f" 예산 {request.budget}원 내에서 즐기기 좋습니다." if request.budget else ""
        return f"{category_label}로 {mood_part}{budget_part}"

    courses = []

    for course_idx in range(3):
        course_steps = []
        used_place_names = set()

        if sequence:
            for step_idx, category_id in enumerate(sequence):
                target_category = CATEGORY_MAP.get(category_id, "")

                candidates = [
                    p for p in places
                    if p.get("category", "") == target_category
                    and p.get("name", "") not in used_place_names
                ]

                if not candidates:
                    candidates = [
                        p for p in places
                        if p.get("name", "") not in used_place_names
                    ]

                if not candidates:
                    continue

                candidates.sort(key=lambda p: score_place_by_mood(p, moods), reverse=True)

                pick_index = course_idx % len(candidates)
                chosen = candidates[pick_index]
                used_place_names.add(chosen.get("name", ""))

                course_steps.append({
                    "step": step_idx + 1,
                    "place_name": chosen.get("name", "이름 없음"),
                    "reason": build_reason(chosen, category_id)
                })
        else:
            sorted_places = sorted(places, key=lambda p: score_place_by_mood(p, moods), reverse=True)
            start = course_idx * 3
            selected = sorted_places[start:start + 3]
            for idx, place in enumerate(selected):
                course_steps.append({
                    "step": idx + 1,
                    "place_name": place.get("name", "이름 없음"),
                    "reason": build_reason(place, "")
                })

        if course_steps:
            courses.append({
                "courseId": course_idx + 1,
                "date": request.date,
                "time": f"{request.startTime} ~ {request.endTime}" if request.startTime else "미정",
                "budget": request.budget if request.budget else "미정",
                "places": course_steps
            })

    return {
        "message": "AI 추천이 완료되었습니다!",
        "courses": courses
    }