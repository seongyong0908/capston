import json
import re
from typing import Any, List, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from google import genai
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# 본인의 API 키
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

REGION_CONFIG = {
    "홍대/연남동": {"display": "서울특별시 마포구", "keywords": ["마포구", "홍대", "연남", "합정", "상수"]},
    "강남/청담":   {"display": "서울특별시 강남구", "keywords": ["강남구", "청담", "역삼", "신사", "논현", "압구정"]},
    "성수동":     {"display": "서울특별시 성동구", "keywords": ["성동구", "성수"]},
    "잠실":       {"display": "서울특별시 송파구", "keywords": ["송파구", "잠실", "신천", "방이", "석촌"]},
    "이태원/한남": {"display": "서울특별시 용산구", "keywords": ["용산구", "이태원", "한남", "해방촌"]},
    "여의도":     {"display": "서울특별시 영등포구", "keywords": ["영등포구", "여의도"]}
}


def _matches_course_category(course_category: str, place: dict[str, Any]) -> bool:
    category = str(place.get("category", "")).strip()
    subcategory = str(place.get("subcategory", "")).strip()

    if course_category == "restaurant":
        return category in {"식당", "식당&주류"}
    if course_category == "cafe":
        return category == "카페"
    if course_category == "movie":
        return category == "문화예술" and subcategory == "영화관"
    if course_category == "exhibition":
        return category == "문화예술" and subcategory in {
            "미술관/갤러리",
            "박물관/기념관",
        }
    if course_category == "culture":
        return category == "문화예술"
    if course_category in {"sports", "activity"}:
        return category == "액티비티"
    if course_category in {"park", "walk"}:
        return category == "공원산책"
    if course_category == "shopping":
        return category == "쇼핑"
    return True


# 프론트엔드에서 넘어오는 데이터 구조에 맞게 수정
class DateRequest(BaseModel):
    region: Optional[str] = None
    date: Optional[str] = None
    startTime: Optional[str] = None
    endTime: Optional[str] = None
    peopleCount: Optional[str] = None
    courseSequence: Optional[List[str]] = Field(default=[])
    mood: Optional[List[str]] = Field(default=[])
    extraMessage: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    places: Optional[List[Any]] = Field(default=[])
    
    class Config:
        extra = "allow"


class AlternativeRequest(BaseModel):
    region: str
    category: str
    lat: float
    lng: float
    login_id: str
    roomId: Optional[str] = None
    roomType: Optional[str] = None
    mood: Optional[List[str]] = Field(default=[])
    courseSequence: Optional[List[str]] = Field(default=[])
    extraMessage: Optional[str] = None
    roomPreferences: Optional[List[dict[str, Any]]] = Field(default=[])
    currentPlace: Optional[dict[str, Any]] = None
    currentPlaces: Optional[List[dict[str, Any]]] = Field(default=[])
    candidatePlaces: List[dict[str, Any]]


@app.post("/api/recommend")
async def get_recommendation(request: DateRequest):
    
    req_data = request.model_dump()
    places = req_data.get("places", [])
    mood = req_data.get("mood", [])
    course_seq = req_data.get("courseSequence", [])
    extra_msg = req_data.get("extraMessage", "")
    region = req_data.get("region", "")
    room_preferences = req_data.get("roomPreferences", [])
    room_type = req_data.get("roomType", "")

    if not isinstance(region, str) or not region.strip():
        raise HTTPException(
            status_code=422,
            detail="선택 지역이 요청에 포함되지 않았습니다. 지역 선택 화면에서 새로 추천해 주세요."
        )

    config = REGION_CONFIG.get(region, {"display": region, "keywords": [region]})
    keywords = config["keywords"]
    display_name = config["display"]

    if region and region != "지역 미지정":
        filtered_places = [
            p for p in places 
            if any(kw in str(p.get("address", "")) or kw in str(p.get("region", "")) for kw in keywords)
        ]
        if not filtered_places:
            raise HTTPException(
                status_code=422,
                detail=f"선택한 지역({region})에서 추천할 수 있는 후보 장소를 찾지 못했습니다."
            )
        places = filtered_places

    step_candidates = []
    step_rules = []
    if course_seq:
        for step, course_category in enumerate(course_seq, start=1):
            matching_places = [
                place for place in places
                if _matches_course_category(course_category, place)
            ]
            if not matching_places:
                raise HTTPException(
                    status_code=422,
                    detail=f"{step}번째 '{course_category}' 단계에 맞는 장소가 선택 지역에 없습니다."
                )
            step_candidates.append(matching_places)
            step_rules.append({
                "step": step,
                "selected_category": course_category,
                "allowed_place_ids": [place.get("id") for place in matching_places]
            })

        allowed_ids = {
            str(place.get("id"))
            for matching_places in step_candidates
            for place in matching_places
            if place.get("id") is not None
        }
        places = [
            place for place in places
            if str(place.get("id")) in allowed_ids
        ]

    # 2. AI에게 보낼 아주 강력한 프롬프트 (JSON 강제)
    user_prompt = f"""
    당신은 전문 데이트 코스 추천 AI입니다.
    아래의 [사용자 조건]과 [후보 장소 리스트]를 바탕으로 완벽한 데이트 코스를 추천해주세요.

    [사용자 조건]
    - 선택 지역: {region}
    - 선택한 방 종류: {room_type}
    - 원하는 분위기: {mood}
    - 희망 코스 순서: {course_seq}
    - 단계별 허용 장소와 ID: {step_rules}
    - 추가 요청사항: {extra_msg}
    - 방 구성원들의 저장된 취향 및 제한사항: {room_preferences}
      모든 승인된 방 구성원의 선호 분위기, 싫어하는 활동, 식이 제한과 메모를 함께 고려하세요.
      식이 제한은 중요 조건으로 반영하되, 장소 데이터에 재료/알레르기 정보가 없으면 안전하다고 단정하지 마세요.

    [후보 장소 리스트] (※ 반드시 아래 리스트에 있는 장소들로만 코스를 짜야 합니다!)
    {places}

    [필수 명령]
    1. 후보 장소 리스트에 포함된 `subcategory`(상세 분류)와 `tags`(태그) 데이터를 적극적으로 분석하여, 사용자의 [원하는 분위기]에 가장 잘 맞는 장소를 엄선하세요.
    2. 추천 이유(reason)를 작성할 때 장소의 `tags`나 `subcategory` 특징을 자연스럽게 언급하여 설득력을 높이세요.
    3. 사용자가 요청한 [희망 코스 순서]의 영단어는 반드시 아래의 [카테고리 매칭표]를 참고하여 한글 카테고리로 변환해서 코스를 구성하세요.
       
       <카테고리 매칭표>
       - 'restaurant' -> '식당' 또는 '식당&주류' 중에서 선택
       - 'cafe' -> '카페' 중에서 선택
       - 'movie' -> '문화예술' 카테고리 중 세부 분류가 '영화관'인 장소만 선택
       - 'exhibition' -> '문화예술' 카테고리 중 세부 분류가 미술관, 전시관, 박물관/기념관인 장소만 선택
       - 'culture' -> 영화관, 전시·박물관, 공연장 등 문화예술 장소 중에서 선택
       - 'sports', 'activity' -> '액티비티' 중 스포츠·운동 관련 장소 선택
       - 'walk' -> '공원산책' 중에서 선택
       - 'shopping' -> '쇼핑' 중에서 선택

    4. 요청한 순서(1차, 2차, 3차...)의 카테고리 흐름을 100% 정확하게 지켜야 합니다.
       각 단계에는 위에 지정된 해당 단계의 allowed_place_ids에 포함된 장소만 사용하세요.
    5. 각 장소의 위도(latitude)와 경도(longitude)를 비교하여, 연속된 방문 장소끼리의 직선거리가 짧은 조합을 우선 선택하세요.
       코스 전체의 이동거리를 줄이고, 한 장소에서 다음 장소로 갈 때 지역을 크게 벗어나거나 되돌아가는 동선은 피하세요.
       이 거리는 직선거리 기준이며, 실제 도로·대중교통 이동거리와 같다고 가정하지 마세요.
    6. 답변은 절대로 줄글이나 부연 설명을 쓰지 말고, 마크다운 기호(```json)도 포함하지 마세요.
    7. 코스는 정확히 3개를 만들어야 하며, 반드시 아래 지정된 형식의 JSON 배열(Array)로만 대답하세요. (새로운 데이터 필드 포함 필수)
    8. 반드시 사용자가 선택한 '{region}' 지역 내에 있으며 위에 제공된 [후보 장소 리스트]에 존재하는 장소로만 코스를 구성하세요. 리스트에 없는 임의의 장소나 타 지역(예: 강남 등)의 장소를 지어내어 포함하면 절대 안 됩니다.
       , 출력하는 JSON의 region 값은 절대 '서울' 등으로 임의로 판단해서 적지 말고, 반드시 사용자가 선택한 '{region}' 값을 그대로 100% 똑같이 출력해라.
    9. [분위기 파괴 장소 절대 제외] 이 서비스는 연인과의 데이트, 친구들과의 놀거리, 가족 모임 등을 위한 코스 추천입니다. 따라서 리스트에 있더라도 편의점, 동네 슈퍼마켓, 대형 마트, 일상적인 생활용품점 등 모임 분위기에 전혀 어울리지 않는 장소는 무조건 제외하세요.
    10. 코스 제목은 짧고 간결하게, 반드시 공백 포함 15자 이내의 한 줄로 작성하세요.
    11. 추천하는 모든 장소는 반드시 사용자가 선택한 '{region}' 지역 내에 있어야 합니다.
    거리가 가깝더라도 한강을 건너거나 다른 행정구역(예: 성동구, 용산구, 서초구 등)에 속한 장소는 절대 추천하지 마세요. 오직 제공된 [후보 장소 리스트] 중에서 '{region}'에 해당하는 장소만 엄격하게 골라주세요
    12. 출력하는 JSON의 'place_name'은 반드시 내가 제공한 후보 리스트의 장소명과 띄어쓰기, 괄호, 지점명까지 토씨 하나 틀리지 않고 100% 똑같이 출력해라. (임의로 한자나 영어를 추가하거나, 이름을 줄이는 등 단 한 글자라도 변경하면 절대 안 된다.)
    13. 각 장소의 'id'도 후보 리스트에 있는 숫자 ID를 그대로 사용하세요. ID를 새로 만들거나 다른 장소의 ID를 쓰지 마세요.
    [
        {{
            "course_name": "코스 1: [컨셉 이름]",
            "places": [
                {{
                    "id": 장소 고유 id (숫자),
                    "step": 1, 
                    "place_name": "장소명", 
                    "category": "카테고리", 
                    "subcategory": "서브카테고리",
                    "tags": "태그",
                    "region": "지역",
                    "phone": "전화번호",
                    "reason": "추천 이유"
                }},
                {{
                    "id": 장소 고유 id (숫자),
                    "step": 2, 
                    "place_name": "장소명", 
                    "category": "카테고리", 
                    "subcategory": "서브카테고리",
                    "tags": "태그",
                    "region": "지역",
                    "phone": "전화번호",
                    "reason": "추천 이유"
                }}
            ]
        }}
    ]
    """

    valid_candidates_by_id = {
        str(place.get("id")): place
        for place in places
        if place.get("id") is not None
    }
    valid_candidates_by_name = {
        str(place.get("name")): place
        for place in places
        if place.get("name")
    }

    try:
            response = client.models.generate_content(
                model='gemini-3.6-flash',
                contents=user_prompt,
                config={"temperature": 0.8}
            )
            
            ai_text = response.text.strip()
            ai_text = re.sub(r'^```json\s*', '', ai_text, flags=re.MULTILINE)
            ai_text = re.sub(r'^```\s*', '', ai_text, flags=re.MULTILINE)
            
            course_data = json.loads(ai_text)
            if not isinstance(course_data, list):
                raise ValueError("AI 응답이 코스 배열 형식이 아닙니다.")

            for course in course_data:
                if not isinstance(course, dict):
                    continue

                validated_places = []
                for step_index, place in enumerate(course.get("places", [])):
                    if not isinstance(place, dict):
                        continue

                    candidate = valid_candidates_by_id.get(str(place.get("id")))
                    if candidate is None:
                        candidate = valid_candidates_by_name.get(str(place.get("place_name", "")))
                    if candidate is None:
                        continue

                    if course_seq:
                        if step_index >= len(course_seq) or not _matches_course_category(
                            course_seq[step_index], candidate
                        ):
                            expected = (
                                course_seq[step_index]
                                if step_index < len(course_seq)
                                else "요청하지 않은 추가 단계"
                            )
                            raise HTTPException(
                                status_code=502,
                                detail=f"AI가 {step_index + 1}번째 '{expected}' 단계에 맞지 않는 장소를 추천했습니다. 다시 추천해 주세요."
                            )

                    place["id"] = candidate["id"]
                    place["place_name"] = candidate["name"]
                    if course_seq:
                        place["step"] = step_index + 1
                    for field in (
                        "category",
                        "subcategory",
                        "tags",
                        "address",
                        "region",
                        "phone",
                    ):
                        if candidate.get(field) is not None:
                            place[field] = candidate[field]
                    place["lat"] = candidate.get("latitude")
                    place["lng"] = candidate.get("longitude")
                    validated_places.append(place)

                if course_seq and len(validated_places) != len(course_seq):
                    raise HTTPException(
                        status_code=502,
                        detail="AI가 요청한 코스 단계 수에 맞는 추천을 만들지 못했습니다. 다시 추천해 주세요."
                    )
                course["places"] = validated_places
            print("✅ AI가 완벽한 JSON으로 대답했습니다!")

            # ============== 👇 여기서부터 터미널 출력용 코드 추가 👇 ==============
            print("\n" + "="*50)
            print("🎯 [사용자 선택 조건 확인]")
            print(f"- 선택 지역: {region}")
            print(f"- 분위기: {mood}")
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
                    subcategory = p.get("subcategory", "상세분류 없음")
                    tags = p.get("tags", "태그 없음")
                    reason = p.get("reason", "")

                    print(f"  📍 {step}차: {name} ({category} - {subcategory})")
                    print(f"     🏷️ 태그: {tags}")
                    print(f"     💬 {reason}")

                print("=" * 50 + "\n")

    except HTTPException:
        raise
    except Exception as e:
        print("❌ AI 호출 또는 JSON 변환 중 에러 발생:", e)
        raise HTTPException(status_code=502, detail="AI 추천 결과를 처리하지 못했습니다.") from e

    for course in course_data:
        if isinstance(course, dict):
            for p in course.get("places", []):
                p["region"] = display_name
    
    # 4. 프론트엔드로 진짜 데이터 반환
    return {
        "message": "AI 추천이 완료되었습니다!",
        "courses": course_data
    }


@app.post("/api/recommend-alternatives")
async def recommend_alternatives(request: AlternativeRequest):
    candidates = request.candidatePlaces
    if not candidates:
        raise HTTPException(status_code=422, detail="순위를 매길 대체 장소 후보가 없습니다.")

    candidate_ids = {
        str(place.get("id"))
        for place in candidates
        if place.get("id") is not None
    }
    prompt = f"""
    당신은 데이트 코스 장소를 다시 추천하는 AI입니다.
    사용자가 현재 코스의 장소 하나를 같은 종류의 다른 장소로 바꾸려 합니다.

    [조건]
    - 방 종류: {request.roomType or ""}
    - 선택 지역: {request.region}
    - 바꿀 카테고리: {request.category}
    - 이 코스 전체의 순서: {request.courseSequence or []}
    - 분위기 조건: {request.mood or []}
    - 추가 요청: {request.extraMessage or ""}
    - 방의 모든 승인된 구성원 취향/싫어하는 활동/식이 제한: {request.roomPreferences or []}
    - 현재 코스에서 유지하는 다른 장소: {request.currentPlaces or []}
    - 바꾸려는 기존 장소: {request.currentPlace or {}}

    방 구성원들의 선호를 종합하고, 싫어하는 활동은 피하며, 태그·세부 분류·설명을 이용해
    분위기와 요청에 잘 맞는 장소를 높은 순서대로 최대 4개 고르세요.
    음식 제한은 중요 조건으로 고려하되, 제공된 데이터에 재료 정보가 없으면 안전하다고 단정하지 마세요.
    반드시 아래 후보에 실제로 있는 id만 사용하고, 후보 밖의 장소를 만들지 마세요.
    중복 없는 JSON 배열만 출력하세요. 각 항목은 {{"id": 숫자, "reason": "선정 이유"}} 형식입니다.

    [DB 후보 장소]
    {candidates}
    """

    try:
        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt,
            config={"temperature": 0.2}
        )
        if not response.text:
            raise ValueError("AI 응답이 비어 있습니다.")

        ai_text = response.text.strip()
        ai_text = re.sub(r"^```json\s*", "", ai_text, flags=re.MULTILINE)
        ai_text = re.sub(r"^```\s*", "", ai_text, flags=re.MULTILINE)
        ai_text = re.sub(r"\s*```$", "", ai_text)
        rankings = json.loads(ai_text)
        if not isinstance(rankings, list):
            raise ValueError("AI 응답이 JSON 배열 형식이 아닙니다.")

        verified = []
        seen = set()
        for item in rankings:
            if not isinstance(item, dict):
                continue
            place_id = str(item.get("id"))
            if place_id not in candidate_ids or place_id in seen:
                continue
            seen.add(place_id)
            verified.append({
                "id": item["id"],
                "reason": str(item.get("reason", ""))
            })
            if len(verified) == 4:
                break

        return verified
    except Exception as e:
        print("❌ 대체 장소 순위 생성 실패:", e)
        raise HTTPException(status_code=502, detail="대체 장소 순위를 생성하지 못했습니다.") from e