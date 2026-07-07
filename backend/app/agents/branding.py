from app.agents.base import BaseAgent
from crewai import Task

class BrandingAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Branding Agent",
            role="Creative Director & Brand Strategist",
            goal="Formulate identity designs, suggest logo visual assets, define brand colors, suggest slogans/taglines, and find domain names.",
            backstory="You are a veteran brand designer and creative director who has worked with unicorn startups. You specialize in crafting high-impact visual identities and emotional taglines."
        )

    def get_branding_task(self, startup_idea: str, context: list = None) -> Task:
        return Task(
            description=f"Define visual branding (color palettes, visual asset suggestions) and suggest 5 domain names and slogans for: {startup_idea}.",
            expected_output="A cohesive branding strategy containing 5 domain ideas, 3 brand taglines, a primary & secondary color palette, and logo concept descriptions.",
            agent=self.to_crew_agent(),
            context=context or []
        )
