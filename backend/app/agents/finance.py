from app.agents.base import BaseAgent
from crewai import Task

class FinanceAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Finance Agent",
            role="Financial Modeling & Pricing Analyst",
            goal="Formulate pricing models, calculate startup run-rates, project revenues, and refine financial forecasts.",
            backstory="You are an MBA finance graduate and seasoned startup CFO. You transform vague market ideas into structured pricing strategies and 3-year revenue forecasts."
        )

    def get_finance_task(self, startup_idea: str, context: list = None) -> Task:
        return Task(
            description=f"Provide a 3-year revenue prediction, recommended subscription or unit pricing models, and key financial metric projections for: {startup_idea}.",
            expected_output="A structured financial analysis containing pricing tiers, annual revenue projections for Years 1-3, estimated cost structures, and basic break-even points.",
            agent=self.to_crew_agent(),
            context=context or []
        )
