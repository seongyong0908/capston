from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

# 스프링 부트가 보내줄 데이터 양식 (취향과 후보 장소들)
class DateRequest(BaseModel):
    tastes: list
    places: list

# 스프링 부트가 이 주소로 데이터를 쏘게 됩니다!
@app.post("/api/recommend")
async def get_recommendation(request: DateRequest):
    print("스프링 부트에서 넘어온 데이터:", request)
    
    # 지금은 테스트를 위해 완벽하게 짜여진 가짜 코스를 응답해 줍니다.
    return {
        "message": "AI 추천이 완료되었습니다!",
        "course": [
            {"step": 1, "place_name": "스타벅스 강남점", "reason": "조용한 분위기에서 첫 만남을 가지기 좋습니다."},
            {"step": 2, "place_name": "강남 불족발", "reason": "매운 음식을 선호하시는 두 분의 취향을 반영했습니다."},
            {"step": 3, "place_name": "양재천 산책로", "reason": "식사 후 소화시키며 대화하기 좋은 코스입니다."}
        ]
    }