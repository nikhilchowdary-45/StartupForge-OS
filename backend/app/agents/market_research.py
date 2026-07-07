from app.agents.base import BaseAgent
from crewai import Task

class MarketResearchAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Market Research Agent",
            role="Lead Market & Competitor Analyst",
            goal="Analyze the current market space, calculate TAM/SAM/SOM, and discover direct competitors using live search data.",
            backstory="You are an expert market analyst with a background in venture capital research. You excel at digging up hidden competitors and estimating market size."
        )

    def get_analysis_task(self, startup_idea: str, context: list = None) -> Task:
        return Task(
            description=f"Conduct deep competitor analysis and TAM/SAM/SOM calculations for the startup idea: {startup_idea}.",
            expected_output="A structured market research report detailing market size (TAM, SAM, SOM estimates with logic), direct/indirect competitors, and current industry trends.",
            agent=self.to_crew_agent(),
            context=context or []
        )
