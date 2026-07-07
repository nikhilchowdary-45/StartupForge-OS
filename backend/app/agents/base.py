from crewai import Agent
from langchain_google_genai import ChatGoogleGenerativeAI
from app.config import settings

def get_llm():
    """Helper function to initialize the LLM using Gemini API key from settings."""
    return ChatGoogleGenerativeAI(
        model="gemini-1.5-pro",
        google_api_key=settings.GEMINI_API_KEY
    )

class BaseAgent:
    def __init__(self, name: str, role: str, goal: str, backstory: str):
        self.name = name
        self.role = role
        self.goal = goal
        self.backstory = backstory
        self.llm = get_llm()

    def to_crew_agent(self) -> Agent:
        return Agent(
            role=self.role,
            goal=self.goal,
            backstory=self.backstory,
            verbose=True,
            memory=True,
            llm=self.llm
        )
