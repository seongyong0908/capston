import json
import re
from typing import Any, List, Optional
from fastapi import FastAPI
from pydantic import BaseModel, Field
from google import genai
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# 본인의 API 키
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# 프론트엔드에서 넘어오는 데이터 구조에 맞게 수정
class DateRequest(BaseModel):
    date: Optional[str] = None
    startTime: Optional[str] = None
    endTime: Optional[str] = None
    peopleCount: Optional[str] = None
    budget: Optional[str] = None
    courseSequence: Optional[List[str]] = Field(default=[])
    mood: Optional[List[str]] = Field(default=[])
    extraMessage: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    places: Optional[List[Any]] = Field(default=[])
    
    class Config:
        extra = "allow"

@app.post("/api/recommend")
async def get_recommendation(request: DateRequest):
    # 1. 프론트엔드에서 넘어온 데이터 안전하게 꺼내기
    req_data = request.model_dump()
    places = req_data.get("places", [])
    mood = req_data.get("mood", [])
    budget = req_data.get("budget", "")
    course_seq = req_data.get("courseSequence", [])
    extra_msg = req_data.get("extraMessage", "")
    
    # 2. AI에게 보낼 아주 강력한 프롬프트 (JSON 강제)
    user_prompt = f"""
    당신은 전문 데이트 코스 추천 AI입니다.
    아래의 [사용자 조건]과 [후보 장소 리스트]를 바탕으로 완벽한 데이트 코스를 추천해주세요.

    [사용자 조건]
    - 원하는 분위기: {mood}
    - 예산: {budget}원
    - 희망 코스 순서: {course_seq}
    - 추가 요청사항: {extra_msg}

    [후보 장소 리스트] (※ 반드시 아래 리스트에 있는 장소들로만 코스를 짜야 합니다!)
    {places}

    [필수 명령]
    답변은 절대로 줄글이나 부연 설명을 쓰지 말고, 반드시 아래와 같은 형식의 JSON 배열(Array)로만 대답하세요. 마크다운 기호(```json)도 포함하지 마세요.
    [필수 명령]
    1. 사용자가 요청한 [희망 코스 순서]의 영단어는 반드시 아래의 [카테고리 매칭표]를 참고하여 한글 카테고리로 변환해서 코스를 구성하세요.
       
       <카테고리 매칭표>
       - 'restaurant' -> '식당' 중에서 선택
       - 'cafe' -> '카페' 중에서 선택
       - 'culture', 'movie', 'exhibition' -> '문화예술' 또는 '실내액티비티' 중에서 선택
       - 'sports', 'activity' -> '스포츠레저' 또는 '실내액티비티' 중에서 선택
       - 'walk' -> '공원산책' 중에서 선택
       - 'shopping' -> '쇼핑' 중에서 선택

    2. 요청한 순서(1차, 2차, 3차...)의 카테고리 흐름을 100% 정확하게 지켜야 합니다.
    3. 답변은 절대로 줄글이나 마크다운(```json)을 쓰지 말고, 반드시 지정된 형식의 JSON 배열(Array)로만 대답하세요.
    4. 코스는 정확히 3개를 만들어야 합니다.
    5. 각 코스 안의 `places` 배열은 사용자가 요청한 [희망 코스 순서]({course_seq})의 개수와 순서에 정확히 맞춰서 1차, 2차, 3차... 단계를 구성하세요.
    (예: 순서를 3개 골랐다면 step 1, 2, 3까지 만들 것)
    [
        {{
            "course_name": "코스 1: [컨셉 이름]",
            "places": [
                {{"step": 1, "place_name": "장소명", "category": "카테고리", "reason": "추천 이유"}},
                {{"step": 2, "place_name": "장소명", "category": "카테고리", "reason": "추천 이유"}}
                // 만약 사용자가 코스를 3개 골랐다면 여기에 "step": 3 도 추가해서 만들어야 합니다.
            ]
        }},
        {{
            "course_name": "코스 2: [컨셉 이름]",
            "places": [
                {{"step": 1, "place_name": "장소명", "category": "카테고리", "reason": "추천 이유"}},
                {{"step": 2, "place_name": "장소명", "category": "카테고리", "reason": "추천 이유"}}
            ]
        }},
        {{
            "course_name": "코스 3: [컨셉 이름]",
            "places": [
                {{"step": 1, "place_name": "장소명", "category": "카테고리", "reason": "추천 이유"}},
                {{"step": 2, "place_name": "장소명", "category": "카테고리", "reason": "추천 이유"}}
            ]
        }}
    ]
    """

    try:
    #         # 작성자님이 지정하신 3.6-flash 버전 그대로 사용
    #         # temperature를 0.8로 설정하여 매번 똑같은 코스가 나오는 것을 방지 (창의력 상승)
    #         response = client.models.generate_content(
    #             model='gemini-3.6-flash',
    #             contents=user_prompt,
    #             config={"temperature": 0.8}
    #         )
            
    #         # 3. AI가 준 답변에서 불필요한 찌꺼기 제거 후 JSON 변환
    #         ai_text = response.text.strip()
    #         ai_text = re.sub(r'^```json\s*', '', ai_text, flags=re.MULTILINE)
    #         ai_text = re.sub(r'^```\s*', '', ai_text, flags=re.MULTILINE)
            
    #         course_data = json.loads(ai_text)
    #         print("✅ AI가 완벽한 JSON으로 대답했습니다!")

        print("✅ 구글 서버 과부하로 인해 임시 가짜(Mock) 데이터로 응답합니다!")
        course_data = [
            {
                "course_name": "코스 1: 낭만적인 남산 야경 데이트",
                "places": [
                    {"step": 1, "place_name": "남산서울타워", "category": "관광명소", "reason": "서울의 아름다운 야경을 한눈에 볼 수 있습니다.", "address": "서울 용산구 남산공원길 105"},
                    {"step": 2, "place_name": "명동교자 본점", "category": "식당", "reason": "따뜻하고 깊은 맛의 칼국수로 든든한 저녁을 즐기세요.", "address": "서울 중구 명동10길 29"},
                    {"step": 3, "place_name": "블루보틀 명동 카페", "category": "카페", "reason": "모던한 분위기에서 깔끔한 드립 커피로 마무리하기 좋습니다.", "address": "서울 중구 명동길 14"}
                ]
            },
            {
                "course_name": "코스 2: 힙한 홍대 문화 데이트",
                "places": [
                    {"step": 1, "place_name": "카카오프렌즈 홍대플래그십스토어", "category": "쇼핑", "reason": "귀여운 캐릭터 상품을 구경하며 즐거운 시간을 보낼 수 있습니다.", "address": "서울 마포구 양화로 162"},
                    {"step": 2, "place_name": "칸다소바 홍대점", "category": "식당", "reason": "진한 풍미의 마제소바가 일품인 곳입니다.", "address": "서울 마포구 와우산로51길 7"},
                    {"step": 3, "place_name": "테일러커피 서교점", "category": "카페", "reason": "부드러운 아인슈페너와 함께 대화를 나누기 좋은 카페입니다.", "address": "서울 마포구 와우산로33길 46"}
                ]
            },
            {
                "course_name": "코스 3: 고즈넉한 북촌 한옥 산책",
                "places": [
                    {"step": 1, "place_name": "경복궁", "category": "관광명소", "reason": "전통의 아름다움을 느끼며 여유롭게 산책하기 좋습니다.", "address": "서울 종로구 사직로 161"},
                    {"step": 2, "place_name": "황생가칼국수", "category": "식당", "reason": "미슐랭 가이드에 선정된 깔끔하고 깊은 맛의 칼국수 맛집입니다.", "address": "서울 종로구 북촌로5길 78"},
                    {"step": 3, "place_name": "어니언 안국", "category": "카페", "reason": "한옥을 개조한 독특한 분위기에서 맛있는 베이커리를 즐길 수 있습니다.", "address": "서울 종로구 계동길 5"}
                ]
            }
        ]

        # ============== 👇 여기서부터 터미널 출력용 코드 추가 👇 ==============
        print("\n" + "="*50)
        print("🎯 [사용자 선택 조건 확인]")
        print(f"- 분위기: {mood}")
        print(f"- 예산: {budget}원")
        print(f"- 코스 순서: {course_seq}")
        print(f"- 추가 요청: {extra_msg}")
        print("-" * 50)
        print("✨ [AI 추천 데이트 코스 결과] ✨")
        
        # 💡 다중 코스 구조에 맞춘 2중 반복문으로 수정
        for idx, course in enumerate(course_data, 1):
            course_name = course.get("course_name", f"코스 {idx}")
            print(f"\n✨ [{course_name}] ✨")

            places = course.get("places", [])
            for p in places:
                step = p.get("step", "?")
                name = p.get("place_name", "이름 없음")
                category = p.get("category", "분류 안됨")
                reason = p.get("reason", "")

                print(f"  📍 {step}차: {name} ({category})")
                print(f"     💬 {reason}")

            print("=" * 50 + "\n")

    except Exception as e:
        print("❌ AI 호출 또는 JSON 변환 중 에러 발생:", e)
        # 에러 발생 시 앱이 터지지 않도록 기본값 설정
        course_data = [
            {"step": 1, "place_name": "데이터 로딩 오류", "category": "오류", "reason": "AI 응답 지연"}
        ]

    # 4. 프론트엔드로 진짜 데이터 반환
    return {
        "message": "AI 추천이 완료되었습니다!",
        "courses": course_data
    }