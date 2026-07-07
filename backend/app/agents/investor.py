from app.agents.base import BaseAgent
from crewai import Task

class InvestorAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Investor Agent",
            role="Venture Capital Principal / Angel Investor",
            goal="Analyze startups for product-market fit, investor readiness, team composition, risk profiles, and investment viability.",
            backstory="You are a veteran VC principal with years of experience sourcing deals, running due diligence, and pitching to LPs. You know exactly what VCs search for in a pitch."
        )

    def get_investor_task(self, startup_idea: str, context: list = None) -> Task:
        return Task(
            description=f"Evaluate the startup viability, assign an Investor Readiness Score (0-100), and write a VC-style investment memo for: {startup_idea}.",
            expected_output="An investment evaluation memo including a readiness score (0-100), SWOT risk assessment, recommendations to de-risk, and investment thesis.",
            agent=self.to_crew_agent(),
            context=context or []
        )
