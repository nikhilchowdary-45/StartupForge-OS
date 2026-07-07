from crewai import Crew, Process
from app.agents.market_research import MarketResearchAgent
from app.agents.finance import FinanceAgent
from app.agents.branding import BrandingAgent
from app.agents.investor import InvestorAgent

class Orchestrator:
    def __init__(self, startup_idea: str):
        self.startup_idea = startup_idea
        self.market_research_agent = MarketResearchAgent()
        self.finance_agent = FinanceAgent()
        self.branding_agent = BrandingAgent()
        self.investor_agent = InvestorAgent()

    def run_evaluation(self):
        # 1. Initialize research task
        research_task = self.market_research_agent.get_analysis_task(self.startup_idea)
        
        # 2. Initialize finance task (depends on research task results context)
        finance_task = self.finance_agent.get_finance_task(
            self.startup_idea, 
            context=[research_task]
        )
        
        # 3. Initialize branding task
        branding_task = self.branding_agent.get_branding_task(
            self.startup_idea,
            context=[research_task]
        )
        
        # 4. Initialize investor evaluation task (needs all contexts)
        investor_task = self.investor_agent.get_investor_task(
            self.startup_idea,
            context=[research_task, finance_task, branding_task]
        )
        
        # Build multi-agent Crew execution
        crew = Crew(
            agents=[
                self.market_research_agent.to_crew_agent(),
                self.finance_agent.to_crew_agent(),
                self.branding_agent.to_crew_agent(),
                self.investor_agent.to_crew_agent()
            ],
            tasks=[research_task, finance_task, branding_task, investor_task],
            process=Process.sequential,
            verbose=2
        )
        
        result = crew.kickoff()
        return {
            "result": result,
            "tasks": {
                "market_research": research_task.output.raw_output if research_task.output else None,
                "finance": finance_task.output.raw_output if finance_task.output else None,
                "branding": branding_task.output.raw_output if branding_task.output else None,
                "investor": investor_task.output.raw_output if investor_task.output else None
            }
        }

