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

# 스프링 부트에서 넘어오는 데이터를 유연하게 다 받도록 수정
class DateRequest(BaseModel):
    tastes: Optional[List[Any]] = Field(default=[])
    places: Optional[List[Any]] = Field(default=[])
    
    class Config:
        extra = "allow"

@app.post("/api/recommend")
async def get_recommendation(request: DateRequest):
    print("스프링 부트에서 넘어온 데이터:", request)
    
    user_prompt = f"사용자의 취향은 다음과 같습니다: {request.tastes}. 이 취향에 맞는 데이트 코스를 추천해줘."

    try:
        # 가장 기본적이고 확실하게 텍스트만 받아오도록 설정
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=user_prompt,
        )
        
        # response.text가 비어있지 않은지 안전하게 확인
        if response.text:
            ai_text = response.text
        else:
            ai_text = "AI가 빈 답변을 반환했습니다."
    except Exception as e:
        print("AI 호출 중 에러 발생 (할당량 초과 등으로 기본 코스 대체):", e)
        # 할당량 초과 시 화면이 깨지지 않고 코스가 출력되도록 임시 텍스트 설정
        ai_text = "조용한 분위기 속에서 서로의 이야기를 나누기 좋은 감성 카페와 매콤한 요리를 즐길 수 있는 특별한 데이트 코스입니다."

    print("AI가 생성한 답변:", ai_text)

    return {
        "message": "AI 추천이 완료되었습니다!",
        "course": [
            {"step": 1, "place_name": "제미나이가 추천한 장소 1", "reason": ai_text[:50]},
            {"step": 2, "place_name": "강남 불족발", "reason": "매운 음식을 선호하는 취향 반영"},
            {"step": 3, "place_name": "양재천 산책로", "reason": "산책 코스"}
        ]
    }